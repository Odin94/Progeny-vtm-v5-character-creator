import { useRef, useCallback, useEffect, useMemo, useState } from "react"
import { Character } from "~/data/Character"
import type { SetCharacter } from "~/hooks/useCharacterLocalStorage"

type UseDebouncedUncontrolledStringFieldOptions = {
    character: Character
    setCharacter: SetCharacter
    field: keyof Character
    delay?: number
}

type UseDebouncedUncontrolledNumberFieldOptions = {
    character: Character
    setCharacter: SetCharacter
    field: keyof Character | string
    delay?: number
    getValue?: (character: Character) => number
    updateFn?: (character: Character, value: number) => Character
}

// These fields are controlled: `value` is driven by local state so the input never
// remounts. Writes to the shared character are still debounced to keep typing smooth
// and avoid re-rendering the whole sheet on every keystroke. External changes to the
// field (e.g. bumping an attribute, switching sheet mode) sync back into local state
// without remounting, so the value no longer flashes its placeholder for a frame.
// TODOdin: Consider moving these fields to Zustand + selectors for even smoother perf.
export const useDebouncedUncontrolledStringField = ({
    character,
    setCharacter,
    field,
    delay = 150
}: UseDebouncedUncontrolledStringFieldOptions) => {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)
    const isPendingRef = useRef(false)

    const rawValue = character[field]
    const externalValue = rawValue !== undefined && rawValue !== null ? String(rawValue) : ""

    const [value, setValue] = useState(externalValue)

    // Sync external changes into local state, but never clobber an in-progress edit
    // whose debounced write hasn't landed yet.
    useEffect(() => {
        if (isPendingRef.current) return
        setValue(externalValue)
    }, [externalValue])

    const handleChange = useCallback(
        (nextValue: string) => {
            setValue(nextValue)
            isPendingRef.current = true

            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }

            timeoutRef.current = setTimeout(() => {
                isPendingRef.current = false
                // Use the functional updater so the write merges into the freshest
                // character rather than a possibly-stale closure/ref. This keeps the
                // debounced edit safe even when this field's component is memoized and
                // has not re-rendered since another field changed elsewhere.
                setCharacter((currentCharacter) => ({
                    ...currentCharacter,
                    [field]: nextValue
                }))
                timeoutRef.current = null
            }, delay)
        },
        [setCharacter, field, delay]
    )

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [])

    return {
        value,
        onChange: handleChange
    }
}

export const useDebouncedUncontrolledNumberField = ({
    character,
    setCharacter,
    field,
    delay = 150,
    getValue,
    updateFn
}: UseDebouncedUncontrolledNumberFieldOptions) => {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)
    const isPendingRef = useRef(false)

    const getValueFn = useMemo(
        () => getValue || ((char: Character) => char[field as keyof Character] as number),
        [getValue, field]
    )

    const rawValue = getValueFn(character)
    const numValue = typeof rawValue === "number" ? rawValue : parseInt(String(rawValue ?? ""), 10)
    const externalValue = isNaN(numValue) ? 0 : numValue

    const [value, setValue] = useState(externalValue)

    // Sync external changes into local state, but never clobber an in-progress edit
    // whose debounced write hasn't landed yet.
    useEffect(() => {
        if (isPendingRef.current) return
        setValue(externalValue)
    }, [externalValue])

    const handleChange = useCallback(
        (nextValue: string | number) => {
            const parsed = typeof nextValue === "string" ? parseInt(nextValue, 10) : nextValue
            const transformedValue = Math.max(0, isNaN(parsed) ? 0 : parsed)

            setValue(transformedValue)
            isPendingRef.current = true

            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }

            timeoutRef.current = setTimeout(() => {
                isPendingRef.current = false
                // Use the functional updater so the write merges into the freshest
                // character rather than a possibly-stale closure/ref. This keeps the
                // debounced edit safe even when this field's component is memoized and
                // has not re-rendered since another field changed elsewhere.
                if (updateFn) {
                    setCharacter((currentCharacter) => updateFn(currentCharacter, transformedValue))
                } else {
                    setCharacter((currentCharacter) => ({
                        ...currentCharacter,
                        [field as keyof Character]: transformedValue
                    }))
                }
                timeoutRef.current = null
            }, delay)
        },
        [setCharacter, field, delay, updateFn]
    )

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [])

    return {
        value,
        onChange: handleChange
    }
}
