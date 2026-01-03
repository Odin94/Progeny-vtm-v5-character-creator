import { useRef, useCallback, useEffect, useMemo } from "react"
import { Character } from "~/data/Character"

type UseDebouncedUncontrolledStringFieldOptions = {
    character: Character
    setCharacter: (character: Character) => void
    field: keyof Character
    delay?: number
}

type UseDebouncedUncontrolledNumberFieldOptions = {
    character: Character
    setCharacter: (character: Character) => void
    field: keyof Character | string
    delay?: number
    getValue?: (character: Character) => number
    updateFn?: (character: Character, value: number) => Character
}

// TODOdin: Replace this debounce solution with Zustand + selectors to get smooth performance
export const useDebouncedUncontrolledStringField = ({
    character,
    setCharacter,
    field,
    delay = 150,
}: UseDebouncedUncontrolledStringFieldOptions) => {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)
    const characterRef = useRef<Character | null>(null)
    const keyRef = useRef(0)
    const pendingValueRef = useRef<string | null>(null)

    useEffect(() => {
        const currentValue = character[field] ?? ""
        if (characterRef.current === null) {
            characterRef.current = character
            keyRef.current += 1
        } else {
            const prevValue = characterRef.current[field] ?? ""
            if (currentValue !== prevValue) {
                if (pendingValueRef.current !== null && currentValue === pendingValueRef.current) {
                    pendingValueRef.current = null
                } else {
                    keyRef.current += 1
                }
            }
            characterRef.current = character
        }
    }, [character, field])

    const handleChange = useCallback(
        (value: string) => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }

            pendingValueRef.current = value

            timeoutRef.current = setTimeout(() => {
                const currentCharacter = characterRef.current ?? character
                setCharacter({
                    ...currentCharacter,
                    [field]: value,
                })
                timeoutRef.current = null
            }, delay)
        },
        [setCharacter, field, delay, character]
    )

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [])

    const rawValue = character[field]
    const defaultValue = rawValue !== undefined && rawValue !== null ? String(rawValue) : ""

    return {
        defaultValue,
        onChange: handleChange,
        key: `${field}-${keyRef.current}`,
    }
}

export const useDebouncedUncontrolledNumberField = ({
    character,
    setCharacter,
    field,
    delay = 150,
    getValue,
    updateFn,
}: UseDebouncedUncontrolledNumberFieldOptions) => {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)
    const characterRef = useRef<Character | null>(null)
    const keyRef = useRef(0)
    const pendingValueRef = useRef<number | null>(null)

    const getValueFn = useMemo(() => getValue || ((char: Character) => char[field as keyof Character] as number), [getValue, field])

    useEffect(() => {
        const currentValue = getValueFn(character)
        if (characterRef.current === null) {
            characterRef.current = character
            keyRef.current += 1
        } else {
            const prevValue = getValueFn(characterRef.current)
            if (currentValue !== prevValue) {
                if (pendingValueRef.current !== null && currentValue === pendingValueRef.current) {
                    pendingValueRef.current = null
                } else {
                    keyRef.current += 1
                }
            }
            characterRef.current = character
        }
    }, [character, getValueFn])

    const handleChange = useCallback(
        (value: string | number) => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }

            const numValue = typeof value === "string" ? parseInt(value, 10) : value
            const transformedValue = Math.max(0, isNaN(numValue) ? 0 : numValue)

            pendingValueRef.current = transformedValue

            timeoutRef.current = setTimeout(() => {
                const currentCharacter = characterRef.current ?? character
                if (updateFn) {
                    setCharacter(updateFn(currentCharacter, transformedValue))
                } else {
                    setCharacter({
                        ...currentCharacter,
                        [field as keyof Character]: transformedValue,
                    })
                }
                timeoutRef.current = null
            }, delay)
        },
        [setCharacter, field, delay, updateFn, character]
    )

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [])

    const rawValue = getValueFn(character)
    const numValue = typeof rawValue === "number" ? rawValue : parseInt(String(rawValue ?? ""), 10)
    const defaultValue = isNaN(numValue) ? 0 : numValue

    return {
        defaultValue,
        onChange: handleChange,
        key: `${field}-${keyRef.current}`,
    }
}
