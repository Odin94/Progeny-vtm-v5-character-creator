import { createFileRoute } from "@tanstack/react-router"
import { useEffect } from "react"
import CharacterSheet from "~/character_sheet/CharacterSheet"
import { useCharacterLocalStorage } from "~/hooks/useCharacterLocalStorage"
import posthog from "posthog-js"
import { getEmptyCharacter } from "~/data/Character"

export const Route = createFileRoute("/sheet")({
    component: Sheet,
})

function Sheet() {
    const [character, setCharacter] = useCharacterLocalStorage()

    useEffect(() => {
        try {
            const emptyChar = getEmptyCharacter()
            const isEmpty =
                character.name === emptyChar.name &&
                character.clan === emptyChar.clan &&
                character.sire === emptyChar.sire &&
                character.disciplines.length === 0 &&
                character.merits.length === 0 &&
                character.flaws.length === 0

            if (isEmpty) {
                posthog.capture("sheet-page-visit-empty", {
                    page: "/sheet",
                })
            } else {
                posthog.capture("sheet-page-visit-non-empty", {
                    page: "/sheet",
                })
            }
        } catch (error) {
            console.warn("PostHog sheet page visit tracking failed:", error)
        }
    }, [character])

    return <CharacterSheet character={character} setCharacter={setCharacter} />
}
