import { useLocalStorage } from "@mantine/hooks"
import { useCallback, useRef, useState } from "react"
import { z } from "zod"
import { Character, characterSchema, getEmptyCharacter, schemaVersion } from "~/data/Character"
import { applyCharacterCompatibilityPatches } from "~/data/Character"
import { reportCharacterValidationError } from "~/utils/characterRecoveryAnalytics"
import { recordBrokenCharacter } from "./useBrokenCharacter"

export type SetCharacter = (character: Character | ((character: Character) => Character)) => void

// Mantine reads storage while evaluating its useState argument on every render.
// Reuse the latest validated snapshot across subscribers instead of reparsing and
// migrating an unchanged character. External changes still go through validation.
let cachedSerializedCharacter: string | undefined
let cachedCharacter: Character | undefined

export const useCharacterLocalStorage = () => {
    const [emptyCharacter] = useState(getEmptyCharacter)
    const [character, setCharacterInternal] = useLocalStorage<Character>({
        key: "character",
        defaultValue: emptyCharacter,
        getInitialValueInEffect: false,
        deserialize: (value) => {
            if (!value) {
                return getEmptyCharacter()
            }

            const originalValue = typeof value === "string" ? value : JSON.stringify(value)
            if (originalValue === cachedSerializedCharacter && cachedCharacter) {
                return cachedCharacter
            }

            try {
                const parsed = typeof value === "string" ? JSON.parse(value) : value
                try {
                    // Migrate every loaded character, including ones that still happen to satisfy
                    // the current schema through Zod defaults. This keeps the stored version and
                    // newly introduced character-owned fields in sync.
                    applyCharacterCompatibilityPatches(parsed)
                    const validatedCharacter = characterSchema.parse(parsed)
                    cachedSerializedCharacter = originalValue
                    cachedCharacter = validatedCharacter
                    return validatedCharacter
                } catch (patchError) {
                    const errorMessage =
                        patchError instanceof Error ? patchError.message : String(patchError)
                    const zodError =
                        patchError instanceof z.ZodError
                            ? JSON.stringify(patchError.issues, null, 2)
                            : errorMessage
                    reportCharacterValidationError(
                        patchError,
                        "local-storage",
                        patchError instanceof z.ZodError ? "schema" : "compatibility",
                        parsed
                    )
                    recordBrokenCharacter(originalValue, zodError)
                    return getEmptyCharacter()
                }
            } catch (parseError) {
                const errorMessage =
                    parseError instanceof Error ? parseError.message : String(parseError)
                reportCharacterValidationError(parseError, "local-storage", "json")
                recordBrokenCharacter(originalValue, errorMessage)
                return getEmptyCharacter()
            }
        },
        serialize: (value) => {
            const serialized = JSON.stringify(value)
            cachedSerializedCharacter = serialized
            cachedCharacter = value
            return serialized
        }
    })
    const latestCharacterRef = useRef(character)
    latestCharacterRef.current = character

    const setCharacter = useCallback<SetCharacter>(
        (characterOrUpdater) => {
            const updatedCharacter =
                typeof characterOrUpdater === "function"
                    ? characterOrUpdater(latestCharacterRef.current)
                    : characterOrUpdater
            const characterWithVersion = { ...updatedCharacter, version: schemaVersion }

            // Calculate updater results outside Mantine's state updater. React can invoke state
            // updaters more than once in Strict Mode, while Mantine writes storage from inside
            // that updater, causing duplicate storage events and duplicate sheet commits.
            latestCharacterRef.current = characterWithVersion
            setCharacterInternal(characterWithVersion)
        },
        [setCharacterInternal]
    )

    return [character, setCharacter] as const
}
