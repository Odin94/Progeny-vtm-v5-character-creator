import { useLocalStorage } from "@mantine/hooks"
import { z } from "zod"
import { Character, characterSchema, getEmptyCharacter, schemaVersion } from "~/data/Character"
import { applyCharacterCompatibilityPatches } from "~/data/Character"
import { useBrokenCharacter } from "./useBrokenCharacter"

export const useCharacterLocalStorage = () => {
    const { setBrokenCharacter } = useBrokenCharacter()

    const [character, setCharacterInternal] = useLocalStorage<Character>({
        key: "character",
        defaultValue: getEmptyCharacter(),
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
                        const errorMessage = patchError instanceof Error ? patchError.message : String(patchError)
                        const zodError = patchError instanceof z.ZodError ? JSON.stringify(patchError.issues, null, 2) : errorMessage
                        setBrokenCharacter(originalValue, zodError)
                        return getEmptyCharacter()
                    }
                }
            } catch (parseError) {
                const errorMessage = parseError instanceof Error ? parseError.message : String(parseError)
                setBrokenCharacter(originalValue, errorMessage)
                return getEmptyCharacter()
            }
        },
        serialize: (value) => {
            return JSON.stringify(value)
        },
    })

    const setCharacter = (character: Character) => {
        const characterWithVersion = { ...character, version: schemaVersion }
        setCharacterInternal(characterWithVersion)
    }

    return [character, setCharacter] as const
}
