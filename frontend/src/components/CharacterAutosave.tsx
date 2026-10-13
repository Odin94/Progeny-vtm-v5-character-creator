import CharacterConflictModal, {
    CHARACTER_CONFLICT_EVENT,
    type CharacterConflictRequest
} from "./CharacterConflictModal"
import { preserveCharacterDraft } from "~/utils/characterDraft"
import { useEffect, useMemo, useState } from "react"
import { useAuth } from "~/hooks/useAuth"
import { isOwnedSavedCharacter, useAutosaveCharacter } from "~/hooks/useAutosaveCharacter"
import { useCharacterLocalStorage } from "~/hooks/useCharacterLocalStorage"
import { useCharacters } from "~/hooks/useCharacters"

const CharacterAutosave = () => {
    const [conflict, setConflict] = useState<CharacterConflictRequest | null>(null)
    useEffect(() => {
        const onConflict = (event: Event) =>
            setConflict((event as CustomEvent<CharacterConflictRequest>).detail)
        window.addEventListener(CHARACTER_CONFLICT_EVENT, onConflict)
        return () => window.removeEventListener(CHARACTER_CONFLICT_EVENT, onConflict)
    }, [])
    const [character, setCharacter] = useCharacterLocalStorage()
    const { isAuthenticated, isLoading: authLoading } = useAuth()
    const { data: characters, isLoading: charactersLoading } = useCharacters(
        isAuthenticated && !!character.id
    )
    const ownsCurrentCharacter = useMemo(
        () => isOwnedSavedCharacter(character.id, characters),
        [character.id, characters]
    )

    useAutosaveCharacter(
        character,
        setCharacter,
        isAuthenticated && !authLoading && !charactersLoading && ownsCurrentCharacter,
        characters?.find((candidate) => candidate.id === character.id && candidate.shared !== true)
    )

    return (
        <CharacterConflictModal
            opened={
                isAuthenticated &&
                !!conflict &&
                (!!conflict.browser || conflict.characterId === character.id)
            }
            browser={conflict?.browser ?? character}
            originalBackend={conflict?.backend}
            onClose={() => {
                conflict?.onClose?.()
                setConflict(null)
            }}
            onResolved={(resolved) => {
                if (conflict?.browser)
                    preserveCharacterDraft(character, "Before revisiting a save conflict")
                setCharacter(resolved)
                conflict?.onResolved?.(resolved)
            }}
        />
    )
}

export default CharacterAutosave
