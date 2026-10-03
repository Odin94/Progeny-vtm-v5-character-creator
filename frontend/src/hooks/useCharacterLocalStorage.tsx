import { useLocalStorage } from "@mantine/hooks"
import { useCallback, useRef } from "react"
import { Character, getEmptyCharacter, schemaVersion } from "~/data/Character"
import { characterIntake } from "~/modules/characterIntake"

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

            const result = characterIntake.read(value, "local-storage")
            return result.success ? result.character : getEmptyCharacter()
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
            characterIntake.persist(characterWithVersion)
            latestCharacterRef.current = characterWithVersion
            setCharacterInternal(characterWithVersion)
        },
        [setCharacterInternal]
    )

    return [character, setCharacter] as const
}
