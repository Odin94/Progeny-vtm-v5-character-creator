import { useRef, useCallback, useEffect, useMemo, useState } from "react"
import type { Character } from "~/data/Character"
import {
    getCharacterDraftIdentity,
    getLatestCharacterDraft,
    getCharacterDraftBeforeReplacement,
    preserveCharacterDraft
} from "~/utils/characterDraft"
import type { SetCharacter } from "~/hooks/useCharacterLocalStorage"

type StringFieldOptions = {
    character: Character
    setCharacter: SetCharacter
    field: keyof Character
    delay?: number
}
type NumberFieldOptions = {
    character: Character
    setCharacter: SetCharacter
    field: keyof Character | string
    delay?: number
    getValue?: (character: Character) => number
    updateFn?: (character: Character, value: number) => Character
}

// Keep input state local, but bind every buffered edit to its source document.
// A cloud replacement can supersede an edit before it reaches shared storage;
// preserve that pending draft before accepting the new external value.
const useDebouncedField = <T extends string | number>(
    character: Character,
    setCharacter: SetCharacter,
    externalValue: T,
    apply: (character: Character, value: T) => Character,
    delay: number
) => {
    const identity = getCharacterDraftIdentity(character)
    const snapshot = useMemo(() => ({ current: character, externalValue }), [identity])
    if (snapshot.externalValue === externalValue) snapshot.current = character
    const activeIdentityRef = useRef(identity)
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const pendingRef = useRef<{ value: T; character: Character } | null>(null)
    const lastCommittedRef = useRef<T | undefined>(undefined)
    const [value, setValue] = useState(externalValue)
    const clearTimeoutRef = () => {
        if (timeoutRef.current !== null) clearTimeout(timeoutRef.current)
        timeoutRef.current = null
    }
    const recoverPending = (sourceIdentity: string) => {
        const pending = pendingRef.current
        if (pending) {
            const fallback =
                snapshot.current.characterVersion === pending.character.characterVersion
                    ? snapshot.current
                    : pending.character
            const source = getCharacterDraftBeforeReplacement(sourceIdentity, fallback)
            preserveCharacterDraft(apply(source, pending.value), "Interrupted field edit")
        }
    }

    useEffect(() => {
        // Identity wins over acknowledgement: an equal value in B never
        // acknowledges a write that was scheduled or committed against A.
        if (activeIdentityRef.current !== identity) {
            clearTimeoutRef()
            pendingRef.current = null
            lastCommittedRef.current = undefined
            activeIdentityRef.current = identity
            snapshot.current = character
            snapshot.externalValue = externalValue
            setValue(externalValue)
            return
        }
        const pending = pendingRef.current
        if (lastCommittedRef.current === externalValue) {
            lastCommittedRef.current = undefined
            if (pending?.value === externalValue) pendingRef.current = null
            snapshot.current = character
            snapshot.externalValue = externalValue
            return
        }
        if (pending) {
            recoverPending(identity)
            clearTimeoutRef()
            pendingRef.current = null
        }
        lastCommittedRef.current = undefined
        snapshot.current = character
        snapshot.externalValue = externalValue
        setValue(externalValue)
    }, [externalValue, identity])

    const onChange = useCallback(
        (nextValue: T) => {
            setValue(nextValue)
            pendingRef.current = {
                value: nextValue,
                character: getLatestCharacterDraft(identity, snapshot.current)
            }
            clearTimeoutRef()
            timeoutRef.current = setTimeout(() => {
                const pending = pendingRef.current
                if (!pending) return
                lastCommittedRef.current = nextValue
                setCharacter((current) => {
                    if (getCharacterDraftIdentity(current) !== identity) {
                        recoverPending(identity)
                        return current
                    }
                    return apply(current, nextValue)
                })
                timeoutRef.current = null
            }, delay)
        },
        [identity, setCharacter, apply, delay]
    )

    useEffect(
        () => () => {
            // Cleanup happens before the replacement effect resets the shared refs.
            if (timeoutRef.current !== null) {
                recoverPending(identity)
                clearTimeoutRef()
            }
        },
        [identity]
    )

    return { value, onChange }
}

export const useDebouncedUncontrolledStringField = ({
    character,
    setCharacter,
    field,
    delay = 150
}: StringFieldOptions) => {
    const rawValue = character[field]
    const externalValue = rawValue === null || rawValue === undefined ? "" : String(rawValue)
    const apply = useCallback(
        (current: Character, value: string) => ({ ...current, [field]: value }),
        [field]
    )
    return useDebouncedField(character, setCharacter, externalValue, apply, delay)
}

export const useDebouncedUncontrolledNumberField = ({
    character,
    setCharacter,
    field,
    delay = 150,
    getValue,
    updateFn
}: NumberFieldOptions) => {
    const rawValue = getValue ? getValue(character) : character[field as keyof Character]
    const parsed = typeof rawValue === "number" ? rawValue : parseInt(String(rawValue ?? ""), 10)
    const externalValue = Number.isNaN(parsed) ? 0 : parsed
    const apply = useCallback(
        (current: Character, value: number) =>
            updateFn ? updateFn(current, value) : { ...current, [field]: value },
        [field, updateFn]
    )
    const result = useDebouncedField(character, setCharacter, externalValue, apply, delay)
    const onChange = useCallback(
        (nextValue: string | number) => {
            const parsed = typeof nextValue === "string" ? parseInt(nextValue, 10) : nextValue
            result.onChange(Math.max(0, Number.isNaN(parsed) ? 0 : parsed))
        },
        [result.onChange]
    )
    return { value: result.value, onChange }
}
