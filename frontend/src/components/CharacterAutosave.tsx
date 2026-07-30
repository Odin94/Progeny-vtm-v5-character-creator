import { useMemo } from "react"
import { useAuth } from "~/hooks/useAuth"
import { isOwnedSavedCharacter, useAutosaveCharacter } from "~/hooks/useAutosaveCharacter"
import { useCharacterLocalStorage } from "~/hooks/useCharacterLocalStorage"
import { useCharacters } from "~/hooks/useCharacters"

const CharacterAutosave = () => {
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
        isAuthenticated && !authLoading && !charactersLoading && ownsCurrentCharacter
    )

    return null
}

export default CharacterAutosave
