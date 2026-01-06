import { AppShell, BackgroundImage, Container, Loader, Text, useComputedColorScheme } from "@mantine/core"
import { useLocalStorage, useMediaQuery } from "@mantine/hooks"
import { useEffect, useRef, useState } from "react"
import "./App.css"
import Generator from "./generator/Generator"
import AsideBar from "./sidebar/AsideBar"
import Sidebar from "./sidebar/Sidebar"
import Topbar from "./topbar/Topbar"
import CharacterSheet from "./character_sheet/CharacterSheet"
import BrokenSaveModal from "./components/BrokenSaveModal"
import MePage from "./pages/MePage"

import { useViewportSize } from "@mantine/hooks"
import { rndInt } from "./generator/utils"
import { globals } from "./globals"
import club from "./resources/backgrounds/aleksandr-popov-3InMDrsuYrk-unsplash.jpg"
import brokenDoor from "./resources/backgrounds/amber-kipp-VcPo_DvKjQE-unsplash.jpg"
import city from "./resources/backgrounds/dominik-hofbauer-IculuMoubkQ-unsplash.jpg"
import bloodGuy from "./resources/backgrounds/marcus-bellamy-xvW725b6LQk-unsplash.jpg"
import batWoman from "./resources/backgrounds/peter-scherbatykh-VzQWVqHOCaE-unsplash.jpg"
import alley from "./resources/backgrounds/thomas-le-KNQEvvCGoew-unsplash.jpg"
import { useCharacterLocalStorage } from "./hooks/useCharacterLocalStorage"
import posthog from "posthog-js"
import { getEmptyCharacter } from "./data/Character"
import { useAuth } from "./hooks/useAuth"
import { isBackendDisabled } from "./utils/backend"

const backgrounds = [club, brokenDoor, city, bloodGuy, batWoman, alley]

function App() {
    const [pathname, setPathname] = useState(window.location.pathname)
    const { handleCallback, isHandlingCallback, isAuthenticated, user } = useAuth()
    const callbackProcessedRef = useRef<string | null>(null)

    useEffect(() => {
        // Skip auth callback handling if backend is disabled
        if (isBackendDisabled()) {
            return
        }

        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get("code")
        const state = urlParams.get("state")

        // Prevent processing the same code twice (React StrictMode double-invocation)
        if (code && !isHandlingCallback && callbackProcessedRef.current !== code) {
            // Mark this code as being processed
            callbackProcessedRef.current = code

            // Update pathname to show loading state
            if (window.location.pathname === "/auth/callback") {
                setPathname("/auth/callback")
            }

            // Clean up URL immediately to prevent re-processing on re-render
            // But keep the pathname as /auth/callback so the useEffect can detect it
            window.history.replaceState({}, "", "/auth/callback")

            // We received the callback, call the backend via React Query
            // The redirect will be handled by the useEffect that watches for authentication
            handleCallback(
                { code, state: state || undefined },
                {
                    onError: (error) => {
                        console.error("Auth callback error:", error)
                        // Clean up URL even on error
                        window.history.replaceState({}, "", "/")
                        setPathname("/")
                        // Reset the ref so user can try again
                        callbackProcessedRef.current = null
                    },
                }
            )
        }
    }, [handleCallback, isHandlingCallback])

    useEffect(() => {
        const handleLocationChange = () => {
            setPathname(window.location.pathname)
        }
        window.addEventListener("popstate", handleLocationChange)
        return () => window.removeEventListener("popstate", handleLocationChange)
    }, [])

    useEffect(() => {
        // Redirect to /me once authenticated after callback
        if (pathname === "/auth/callback" && isAuthenticated && user && !isHandlingCallback) {
            console.log("Redirecting to /me after successful authentication", { isAuthenticated, user: user?.id })
            window.location.href = "/me"
        }
    }, [pathname, isAuthenticated, user, isHandlingCallback])

    const { height: viewportHeight, width: viewportWidth } = useViewportSize()
    globals.viewportHeightPx = viewportHeight
    globals.viewportWidthPx = viewportWidth
    globals.isPhoneScreen = useMediaQuery(`(max-width: ${globals.phoneScreenW}px)`)
    globals.isSmallScreen = useMediaQuery(`(max-width: ${globals.smallScreenW}px)`)
    const computedColorScheme = useComputedColorScheme("dark", { getInitialValueInEffect: true })

    useEffect(() => {
        globals.largeFontSize = globals.isPhoneScreen ? "21px" : "30px"
        globals.smallFontSize = globals.isPhoneScreen ? "16px" : "25px"
        globals.smallerFontSize = globals.isPhoneScreen ? "14px" : "20px"
    }, [globals.isPhoneScreen, globals.isSmallScreen])

    const [character, setCharacter] = useCharacterLocalStorage()
    const [selectedStep, setSelectedStep] = useLocalStorage({ key: "selectedStep", defaultValue: 0 })
    const [backgroundIndex] = useState(rndInt(0, backgrounds.length))

    const [showAsideBar, setShowAsideBar] = useState(!globals.isSmallScreen)
    useEffect(() => {
        setShowAsideBar(!globals.isSmallScreen)
    }, [globals.isSmallScreen])

    useEffect(() => {
        if (pathname === "/sheet") {
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
        }
    }, [pathname, character])

    if (pathname === "/sheet") {
        return (
            <>
                <CharacterSheet character={character} setCharacter={setCharacter} />
                <BrokenSaveModal />
            </>
        )
    }

    if (pathname === "/me") {
        // Redirect to home if backend is disabled
        if (isBackendDisabled()) {
            window.location.href = "/"
            return null
        }
        return (
            <>
                <MePage />
                <BrokenSaveModal />
            </>
        )
    }

    if (pathname === "/auth/callback") {
        return (
            <>
                <BrokenSaveModal />
                <Container
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "100vh",
                        gap: "1rem",
                    }}
                >
                    <Loader size="lg" color="red" />
                    <Text size="lg">Completing sign in...</Text>
                </Container>
            </>
        )
    }

    return (
        <>
            <BrokenSaveModal />
            <AppShell
                padding="0"
                styles={(theme) => ({
                    root: {
                        height: "100vh",
                    },
                    main: {
                        backgroundColor: computedColorScheme === "dark" ? theme.colors.dark[8] : theme.colors.gray[0],
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden",
                    },
                })}
            >
                {!globals.isSmallScreen && (
                    <AppShell.Navbar p="xs" w={{ base: 250, xl: 300 }}>
                        <Sidebar character={character} />
                    </AppShell.Navbar>
                )}
                <AppShell.Header p="xs" h={75}>
                    <Topbar setShowAsideBar={setShowAsideBar} showAsideBar={showAsideBar} />
                </AppShell.Header>
                {showAsideBar && (
                    <AppShell.Aside
                        p="md"
                        w={{ xs: 200 }}
                        style={{ display: "flex", flexDirection: "column" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <AsideBar selectedStep={selectedStep} setSelectedStep={setSelectedStep} character={character} />
                    </AppShell.Aside>
                )}
                <BackgroundImage
                    h={"100%"}
                    src={backgrounds[backgroundIndex]}
                    style={{ flex: 1, minHeight: 0 }}
                    onClick={() => {
                        if (globals.isSmallScreen && showAsideBar) {
                            setShowAsideBar(false)
                        }
                    }}
                >
                    <div style={{ backgroundColor: "rgba(0, 0, 0, 0.7)", height: "100%", display: "flex", flexDirection: "column" }}>
                        <Container h={"100%"} style={{ width: "100%", display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
                            <Generator
                                character={character}
                                setCharacter={setCharacter}
                                selectedStep={selectedStep}
                                setSelectedStep={setSelectedStep}
                            />
                        </Container>
                    </div>
                </BackgroundImage>
            </AppShell>
        </>
    )
}

export default App
