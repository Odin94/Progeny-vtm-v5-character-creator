import { AppShell } from "@mantine/core"
import { createFileRoute } from "@tanstack/react-router"
import { useEffect } from "react"
import CharacterSheet from "~/character_sheet/CharacterSheet"
import { useCharacterLocalStorage } from "~/hooks/useCharacterLocalStorage"
import posthog from "posthog-js"
import { getEmptyCharacter } from "~/data/Character"
import Topbar from "~/topbar/Topbar"

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

    return (
        <AppShell
            padding="0"
            header={{ height: 52 }}
            styles={{
                root: {
                    minHeight: "100vh",
                },
                header: {
                    background: "rgba(8, 7, 8, 0.7)",
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                    borderBottom: "1px solid rgba(201, 172, 102, 0.12)",
                    zIndex: 200,
                },
                main: {
                    height: "100%",
                },
            }}
        >
            <AppShell.Header>
                <Topbar />
            </AppShell.Header>
            <CharacterSheet character={character} setCharacter={setCharacter} />
        </AppShell>
    )
}
