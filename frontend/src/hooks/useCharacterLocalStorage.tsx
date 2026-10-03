import { useLocalStorage } from "@mantine/hooks"
import { useCallback, useRef, useState } from "react"
import { Character, getEmptyCharacter, schemaVersion } from "~/data/Character"
import { rememberCharacterDraft, retainCharacterDraftIdentity } from "~/utils/characterDraft"
import { characterIntake } from "~/modules/characterIntake"

export type SetCharacter = (character: Character | ((character: Character) => Character)) => void

// Mantine reads storage while evaluating its useState argument on every render.
// Reuse the latest validated snapshot across subscribers instead of reparsing and
// migrating an unchanged character. External changes still go through validation.
let cachedSerializedCharacter: string | undefined
let cachedCharacter: Character | undefined

const resetCachedCharacter = () => {
    cachedSerializedCharacter = undefined
    cachedCharacter = getEmptyCharacter()
    return cachedCharacter
}

export const useCharacterLocalStorage = () => {
    const [emptyCharacter] = useState(getEmptyCharacter)
    const [character, setCharacterInternal] = useLocalStorage<Character>({
        key: "character",
        defaultValue: emptyCharacter,
        getInitialValueInEffect: false,
        deserialize: (value) => {
            if (!value) {
                return resetCachedCharacter()
            }

            const originalValue = typeof value === "string" ? value : JSON.stringify(value)
            if (originalValue === cachedSerializedCharacter && cachedCharacter)
                return cachedCharacter
            const result = characterIntake.read(value, "local-storage")
            if (!result.success) return resetCachedCharacter()
            cachedSerializedCharacter = originalValue
            cachedCharacter = result.character
            rememberCharacterDraft(result.character)
            return result.character
        },
        serialize: (value) => {
            const serialized = JSON.stringify(value)
            cachedSerializedCharacter = serialized
            cachedCharacter = value
            rememberCharacterDraft(value)
            return serialized
        }
    })
    const latestCharacterRef = useRef(character)
    latestCharacterRef.current = character

    const setCharacter = useCallback<SetCharacter>(
        (characterOrUpdater) => {
            const updatedCharacter =
                typeof characterOrUpdater === "function"
                    ? // Another mounted consumer or storage event can update the snapshot
                      // before React renders this hook again. Merge into that freshest value.
                      characterOrUpdater(cachedCharacter ?? latestCharacterRef.current)
                    : characterOrUpdater
            const characterWithVersion = { ...updatedCharacter, version: schemaVersion }

            if (typeof characterOrUpdater === "function") {
                retainCharacterDraftIdentity(
                    cachedCharacter ?? latestCharacterRef.current,
                    characterWithVersion
                )
            }

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
