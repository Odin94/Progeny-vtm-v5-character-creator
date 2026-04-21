import { AppShell, BackgroundImage, useComputedColorScheme } from "@mantine/core"
import { useLocalStorage, useMediaQuery, useViewportSize } from "@mantine/hooks"
import { notifications } from "@mantine/notifications"
import { useLocation, useNavigate } from "@tanstack/react-router"
import React, { useEffect, useState } from "react"
import LoadModal from "~/components/LoadModal"
import { characterSchema, type Character as CharacterType } from "~/data/Character"
import Generator from "~/generator/Generator"
import { defaultGeneratorStepId, normalizeGeneratorStepId, type GeneratorStepId } from "~/generator/steps"
import { rndInt } from "~/generator/utils"
import { globals } from "~/globals"
import { useCharacterLocalStorage } from "~/hooks/useCharacterLocalStorage"
import club from "~/resources/backgrounds/aleksandr-popov-3InMDrsuYrk-unsplash.jpg"
import brokenDoor from "~/resources/backgrounds/amber-kipp-VcPo_DvKjQE-unsplash.jpg"
import city from "~/resources/backgrounds/dominik-hofbauer-IculuMoubkQ-unsplash.jpg"
import bloodGuy from "~/resources/backgrounds/marcus-bellamy-xvW725b6LQk-unsplash.jpg"
import batWoman from "~/resources/backgrounds/peter-scherbatykh-VzQWVqHOCaE-unsplash.jpg"
import alley from "~/resources/backgrounds/thomas-le-KNQEvvCGoew-unsplash.jpg"
import AsideBar from "~/sidebar/AsideBar"
import Sidebar from "~/sidebar/Sidebar"
import Topbar from "~/topbar/Topbar"
import { api } from "~/utils/api"

const backgrounds = [club, brokenDoor, city, bloodGuy, batWoman, alley]

export default function CreatorPage() {
    const navigate = useNavigate()
    const location = useLocation()
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
    const [storedSelectedStep, setStoredSelectedStep] = useLocalStorage<GeneratorStepId>({
        key: "selectedGeneratorStep",
        defaultValue: defaultGeneratorStepId,
    })
    const [loadModalOpened, setLoadModalOpened] = useState(false)
    const [loadedFile, setLoadedFile] = useState<File | null>(null)
    const [backgroundIndex] = useState(rndInt(0, backgrounds.length))

    const routeHash = location.hash.replace(/^#/, "")
    const fallbackStep = normalizeGeneratorStepId(storedSelectedStep, character)
    const selectedStep = normalizeGeneratorStepId(routeHash || fallbackStep, character)

    const setSelectedStep = (step: GeneratorStepId, options?: { replace?: boolean }) => {
        if (storedSelectedStep !== step) {
            setStoredSelectedStep(step)
        }

        const nextHash = `#${step}`
        if (location.hash === nextHash) {
            return
        }

        navigate({
            to: "/create",
            hash: step,
            replace: options?.replace ?? false,
        })
    }

    const [showAsideBar, setShowAsideBar] = useState(!globals.isSmallScreen)
    useEffect(() => {
        setShowAsideBar(!globals.isSmallScreen)
    }, [globals.isSmallScreen])

    const openLoadModal = (file: File | null) => {
        if (!file) {
            return
        }

        setLoadedFile(file)
        setLoadModalOpened(true)
    }

    const closeLoadModal = () => {
        setLoadModalOpened(false)
        setLoadedFile(null)
    }

    const loadSavedCharacter = async (characterId: string) => {
        const response = await api.getCharacter(characterId)
        const loadedCharacter = characterSchema.parse((response as { data: unknown }).data)

        setCharacter({
            ...loadedCharacter,
            id: characterId,
        } as CharacterType & { id: string })
        setSelectedStep("final")

        notifications.show({
            title: "Character loaded",
            message: `Loaded "${loadedCharacter.name}"`,
            color: "green",
            autoClose: 3000,
        })
    }

    useEffect(() => {
        if (storedSelectedStep !== selectedStep) {
            setStoredSelectedStep(selectedStep)
        }
    }, [selectedStep, setStoredSelectedStep, storedSelectedStep])

    useEffect(() => {
      // TODOdin: This fixes that we get linked back here right after linking to /me by clicking account button
      // Find a cleaner fix for this
        if (location.pathname !== "/create") return

        const normalizedHash = routeHash ? normalizeGeneratorStepId(routeHash, character) : fallbackStep

        if (normalizedHash !== selectedStep || location.hash !== `#${selectedStep}`) {
            setSelectedStep(normalizedHash, { replace: true })
        }
    }, [character, fallbackStep, location.hash, location.pathname, routeHash, selectedStep])

    return (
        <>
            <LoadModal
                loadModalOpened={loadModalOpened}
                closeLoadModal={closeLoadModal}
                setCharacter={setCharacter}
                loadedFile={loadedFile}
                setSelectedStep={setSelectedStep}
            />
            <AppShell
                padding="0"
                header={{ height: 52 }}
                styles={(theme) => ({
                    root: {
                        height: "100vh",
                    },
                    header: {
                        background: "rgba(8, 7, 8, 0.7)",
                        backdropFilter: "blur(10px)",
                        WebkitBackdropFilter: "blur(10px)",
                        borderBottom: "1px solid rgba(201, 172, 102, 0.12)",
                        zIndex: 200,
                    },
                    navbar: {
                        top: 52,
                        height: "calc(100vh - 52px)",
                        background: "rgba(8, 7, 8, 0.72)",
                        backdropFilter: "blur(10px)",
                        WebkitBackdropFilter: "blur(10px)",
                        borderRight: "1px solid rgba(201, 172, 102, 0.12)",
                    },
                    aside: {
                        top: 52,
                        height: "calc(100vh - 52px)",
                        background: "rgba(8, 7, 8, 0.72)",
                        backdropFilter: "blur(10px)",
                        WebkitBackdropFilter: "blur(10px)",
                        borderLeft: "1px solid rgba(201, 172, 102, 0.12)",
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
                <AppShell.Header>
                    <Topbar asideBar={{ show: showAsideBar, onToggle: () => setShowAsideBar(!showAsideBar) }} />
                </AppShell.Header>
                {!globals.isSmallScreen && (
                    <AppShell.Navbar p="xs" w={{ base: 250, xl: 300 }}>
                        <Sidebar character={character} onLoadFromFile={openLoadModal} onLoadSavedCharacter={loadSavedCharacter} />
                    </AppShell.Navbar>
                )}
                {showAsideBar && (
                    <AppShell.Aside
                        p="md"
                        w={{ xs: 200 }}
                        style={{ display: "flex", flexDirection: "column" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <AsideBar
                            selectedStep={selectedStep}
                            setSelectedStep={setSelectedStep}
                            character={character}
                        />
                    </AppShell.Aside>
                )}
                <BackgroundImage
                    h="100%"
                    src={backgrounds[backgroundIndex]}
                    style={{ flex: 1, minHeight: 0 }}
                    onClick={() => {
                        if (globals.isSmallScreen && showAsideBar) {
                            setShowAsideBar(false)
                        }
                    }}
                >
                    <div style={{ backgroundColor: "rgba(0, 0, 0, 0.7)", height: "100%", display: "flex", flexDirection: "column" }}>
                        <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", flex: 1, minHeight: 0, "--aside-offset": showAsideBar ? "200px" : "0px", "--navbar-offset": globals.isSmallScreen ? "0px" : "250px" } as React.CSSProperties}>
                            <Generator
                                character={character}
                                setCharacter={setCharacter}
                                selectedStep={selectedStep}
                                setSelectedStep={setSelectedStep}
                            />
                        </div>
                    </div>
                </BackgroundImage>
            </AppShell>
        </>
    )
}
