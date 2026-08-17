import { AppShell, Button, Center, Stack, Text } from "@mantine/core"
import { createFileRoute } from "@tanstack/react-router"
import { Suspense, useEffect, useRef } from "react"
import { RAW_GOLD, rgba } from "~/theme/colors"
import ErrorBoundary from "~/components/ErrorBoundary"
import RenderProfiler from "~/components/RenderProfiler"
import { lazyWithRetry } from "~/utils/lazyWithRetry"
import { useCharacterLocalStorage } from "~/hooks/useCharacterLocalStorage"
import posthog from "posthog-js"
import { getEmptyCharacter } from "~/data/Character"
import Topbar from "~/topbar/Topbar"

const CharacterSheet = lazyWithRetry(
    () => import("~/character_sheet/CharacterSheet"),
    "character-sheet"
)

function SheetLoadError() {
    return (
        <Center h="80vh" p="md">
            <Stack align="center" gap="sm">
                <Text ta="center" c="dimmed">
                    The character sheet could not load. Check your connection.
                </Text>
                <Button variant="outline" color="grape" onClick={() => window.location.reload()}>
                    Tap to retry
                </Button>
            </Stack>
        </Center>
    )
}

export const Route = createFileRoute("/sheet")({
    component: Sheet
})

function Sheet() {
    const [character, setCharacter] = useCharacterLocalStorage()
    const initialCharacterWasEmpty = useRef(
        (() => {
            const emptyChar = getEmptyCharacter()
            return (
                character.name === emptyChar.name &&
                character.clan === emptyChar.clan &&
                character.sire === emptyChar.sire &&
                character.disciplines.length === 0 &&
                character.merits.length === 0 &&
                character.flaws.length === 0
            )
        })()
    ).current

    useEffect(() => {
        try {
            if (initialCharacterWasEmpty) {
                posthog.capture("sheet-page-visit-empty", {
                    page: "/sheet"
                })
            } else {
                posthog.capture("sheet-page-visit-non-empty", {
                    page: "/sheet"
                })
            }
        } catch (error) {
            console.warn("PostHog sheet page visit tracking failed:", error)
        }
    }, [initialCharacterWasEmpty])

    return (
        <AppShell
            padding="0"
            header={{ height: 52 }}
            styles={{
                root: {
                    minHeight: "100vh"
                },
                header: {
                    background: "rgba(8, 7, 8, 0.7)",
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                    borderBottom: `1px solid ${rgba(RAW_GOLD, 0.12)}`,
                    zIndex: 200
                },
                main: {
                    height: "100%"
                }
            }}
        >
            <AppShell.Header>
                <RenderProfiler id="SheetTopbar">
                    <Topbar />
                </RenderProfiler>
            </AppShell.Header>
            <RenderProfiler id="CharacterSheet">
                <ErrorBoundary fallback={<SheetLoadError />}>
                    <Suspense fallback={null}>
                        <CharacterSheet character={character} setCharacter={setCharacter} />
                    </Suspense>
                </ErrorBoundary>
            </RenderProfiler>
        </AppShell>
    )
}
