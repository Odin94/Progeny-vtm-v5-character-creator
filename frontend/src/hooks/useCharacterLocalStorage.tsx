import { useLocalStorage } from "@mantine/hooks"
import { useCallback, useRef } from "react"
import { z } from "zod"
import { Character, characterSchema, getEmptyCharacter, schemaVersion } from "~/data/Character"
import { applyCharacterCompatibilityPatches } from "~/data/Character"
import { recordBrokenCharacter } from "./useBrokenCharacter"

export type SetCharacter = (character: Character | ((character: Character) => Character)) => void

export const useCharacterLocalStorage = () => {
    const [character, setCharacterInternal] = useLocalStorage<Character>({
        key: "character",
        defaultValue: getEmptyCharacter(),
        getInitialValueInEffect: false,
        deserialize: (value) => {
            if (!value) {
                return getEmptyCharacter()
            }

            const originalValue = typeof value === "string" ? value : JSON.stringify(value)

            try {
                const parsed = typeof value === "string" ? JSON.parse(value) : value
                const validated = characterSchema.safeParse(parsed)
                if (validated.success) {
                    return validated.data
                } else {
                    try {
                        applyCharacterCompatibilityPatches(parsed)
                        const patched = characterSchema.parse(parsed)
                        return patched
                    } catch (patchError) {
                        const errorMessage =
                            patchError instanceof Error ? patchError.message : String(patchError)
                        const zodError =
                            patchError instanceof z.ZodError
                                ? JSON.stringify(patchError.issues, null, 2)
                                : errorMessage
                        recordBrokenCharacter(originalValue, zodError)
                        return getEmptyCharacter()
                    }
                }
            } catch (parseError) {
                const errorMessage =
                    parseError instanceof Error ? parseError.message : String(parseError)
                recordBrokenCharacter(originalValue, errorMessage)
                return getEmptyCharacter()
            }
        },
        serialize: (value) => {
            return JSON.stringify(value)
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
