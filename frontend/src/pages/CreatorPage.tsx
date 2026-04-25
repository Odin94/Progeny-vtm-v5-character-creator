import { AppShell, BackgroundImage, useComputedColorScheme } from "@mantine/core"
import { RAW_GOLD, rgba } from "~/theme/colors"
import { useLocalStorage, useMediaQuery, useViewportSize } from "@mantine/hooks"
import { notifications } from "@mantine/notifications"
import { useQueryClient } from "@tanstack/react-query"
import { useLocation, useNavigate } from "@tanstack/react-router"
import React, { useEffect, useState } from "react"
import LoadModal from "~/components/LoadModal"
import NameCharacterBeforeSwitchModal from "~/components/NameCharacterBeforeSwitchModal"
import {
    characterSchema,
    getEmptyCharacter,
    type Character as CharacterType
} from "~/data/Character"
import Generator from "~/generator/Generator"
import {
    defaultGeneratorStepId,
    normalizeGeneratorStepId,
    type GeneratorStepId
} from "~/generator/steps"
import { rndInt } from "~/generator/utils"
import { globals } from "~/globals"
import { useAuth } from "~/hooks/useAuth"
import { useCharacterLocalStorage } from "~/hooks/useCharacterLocalStorage"
import { useCharacters } from "~/hooks/useCharacters"
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
type PendingSwitchAction = { type: "load"; characterId: string } | { type: "create" } | null

export default function CreatorPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const queryClient = useQueryClient()
    const { isAuthenticated } = useAuth()
    const { data: characters } = useCharacters(isAuthenticated)
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
        defaultValue: defaultGeneratorStepId
    })
    const [loadModalOpened, setLoadModalOpened] = useState(false)
    const [loadedFile, setLoadedFile] = useState<File | null>(null)
    const [backgroundIndex] = useState(rndInt(0, backgrounds.length))
    const [pendingSwitchAction, setPendingSwitchAction] = useState<PendingSwitchAction>(null)
    const [switchNameValue, setSwitchNameValue] = useState("")
    const [isSavingBeforeSwitch, setIsSavingBeforeSwitch] = useState(false)
    const userCharacters = (
        (characters as Array<{ id: string; name: string; shared?: boolean }>) || []
    ).filter((candidate) => !candidate.shared)
    const emptyCharacter = getEmptyCharacter()

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
            replace: options?.replace ?? false
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
            id: characterId
        } as CharacterType & { id: string })
        setSelectedStep("final")

        notifications.show({
            title: "Character loaded",
            message: `Loaded "${loadedCharacter.name}"`,
            color: "green",
            autoClose: 3000
        })
    }

    const saveCurrentCharacter = async () => {
        const isEmptyCharacter = isCurrentCharacterEmpty()

        if (isEmptyCharacter) {
            return
        }

        if (!character.name.trim()) {
            throw new Error("Please give the current character a name before switching.")
        }

        const targetCharacter = character.id
            ? userCharacters.find((candidate) => candidate.id === character.id)
            : null
        const payload = {
            name: character.name,
            data: character,
            version: character.version
        }

        const savedCharacter = targetCharacter
            ? await api.updateCharacter(targetCharacter.id, payload)
            : await api.createCharacter(payload)

        const saved = savedCharacter as {
            id: string
            data?: { characterVersion?: number }
            characterVersion?: number
        }

        setCharacter({
            ...character,
            id: saved.id,
            characterVersion:
                saved.characterVersion ??
                saved.data?.characterVersion ??
                character.characterVersion ??
                0
        } as CharacterType & { id: string; characterVersion: number })

        await queryClient.invalidateQueries({ queryKey: ["characters"] })
    }

    const isCurrentCharacterEmpty = () =>
        JSON.stringify({
            ...character,
            id: "",
            name: "",
            version: emptyCharacter.version,
            characterVersion: emptyCharacter.characterVersion
        }) === JSON.stringify(emptyCharacter)

    const completePendingSwitchAction = async (action: PendingSwitchAction) => {
        if (!action) {
            return
        }

        if (action.type === "load") {
            await loadSavedCharacter(action.characterId)
            return
        }

        setCharacter(getEmptyCharacter())
        setSelectedStep("clan")
    }

    const openNameBeforeSwitchModal = (action: PendingSwitchAction) => {
        setSwitchNameValue(character.name)
        setPendingSwitchAction(action)
    }

    const closeNameBeforeSwitchModal = () => {
        setPendingSwitchAction(null)
        setSwitchNameValue("")
        setIsSavingBeforeSwitch(false)
    }

    const handleLoadSavedCharacter = async (characterId: string) => {
        if (characterId !== character.id) {
            if (!character.name.trim() && !isCurrentCharacterEmpty()) {
                openNameBeforeSwitchModal({ type: "load", characterId })
                return
            }

            try {
                await saveCurrentCharacter()
            } catch (error) {
                const notifiedError =
                    error instanceof Error ? error : new Error("Failed to save current character")
                notifications.show({
                    title: "Error saving character",
                    message: notifiedError.message,
                    color: "red"
                })
                ;(notifiedError as Error & { alreadyNotified?: boolean }).alreadyNotified = true
                throw notifiedError
            }
        }

        await loadSavedCharacter(characterId)
    }

    const handleCreateCharacter = async () => {
        if (!character.name.trim() && !isCurrentCharacterEmpty()) {
            openNameBeforeSwitchModal({ type: "create" })
            return
        }

        try {
            await saveCurrentCharacter()
        } catch (error) {
            const notifiedError =
                error instanceof Error ? error : new Error("Failed to save current character")
            notifications.show({
                title: "Error saving character",
                message: notifiedError.message,
                color: "red"
            })
            ;(notifiedError as Error & { alreadyNotified?: boolean }).alreadyNotified = true
            throw notifiedError
        }

        await completePendingSwitchAction({ type: "create" })
    }

    const handleSaveAndContinueSwitch = async () => {
        if (!switchNameValue.trim()) {
            notifications.show({
                title: "Name required",
                message: "Enter a character name before saving and switching.",
                color: "red"
            })
            return
        }

        setIsSavingBeforeSwitch(true)

        try {
            setCharacter({ ...character, name: switchNameValue })
            const characterToSave = { ...character, name: switchNameValue }
            const targetCharacter = characterToSave.id
                ? userCharacters.find((candidate) => candidate.id === characterToSave.id)
                : null
            const payload = {
                name: characterToSave.name,
                data: characterToSave,
                version: characterToSave.version
            }
            const savedCharacter = targetCharacter
                ? await api.updateCharacter(targetCharacter.id, payload)
                : await api.createCharacter(payload)
            const saved = savedCharacter as {
                id: string
                data?: { characterVersion?: number }
                characterVersion?: number
            }

            setCharacter({
                ...characterToSave,
                id: saved.id,
                characterVersion:
                    saved.characterVersion ??
                    saved.data?.characterVersion ??
                    characterToSave.characterVersion ??
                    0
            } as CharacterType & { id: string; characterVersion: number })
            await queryClient.invalidateQueries({ queryKey: ["characters"] })

            const action = pendingSwitchAction
            closeNameBeforeSwitchModal()
            await completePendingSwitchAction(action)
        } catch (error) {
            notifications.show({
                title: "Error saving character",
                message:
                    error instanceof Error ? error.message : "Failed to save current character",
                color: "red"
            })
            setIsSavingBeforeSwitch(false)
        }
    }

    const handleDeleteAndContinueSwitch = async () => {
        const action = pendingSwitchAction
        closeNameBeforeSwitchModal()
        setCharacter(getEmptyCharacter())
        await completePendingSwitchAction(action)
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

        const normalizedHash = routeHash
            ? normalizeGeneratorStepId(routeHash, character)
            : fallbackStep

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
            <NameCharacterBeforeSwitchModal
                opened={pendingSwitchAction !== null}
                pendingActionLabel={
                    pendingSwitchAction?.type === "load"
                        ? "switch characters"
                        : "create a new character"
                }
                nameValue={switchNameValue}
                setNameValue={setSwitchNameValue}
                onClose={closeNameBeforeSwitchModal}
                onSaveAndContinue={handleSaveAndContinueSwitch}
                onDiscardAndContinue={handleDeleteAndContinueSwitch}
                isSaving={isSavingBeforeSwitch}
            />
            <AppShell
                padding="0"
                header={{ height: 52 }}
                styles={(theme) => ({
                    root: {
                        height: "100vh"
                    },
                    header: {
                        background: "rgba(8, 7, 8, 0.7)",
                        backdropFilter: "blur(10px)",
                        WebkitBackdropFilter: "blur(10px)",
                        borderBottom: `1px solid ${rgba(RAW_GOLD, 0.12)}`,
                        zIndex: 200
                    },
                    navbar: {
                        top: 52,
                        height: "calc(100vh - 52px)",
                        background: "rgba(8, 7, 8, 0.72)",
                        backdropFilter: "blur(10px)",
                        WebkitBackdropFilter: "blur(10px)",
                        borderRight: `1px solid ${rgba(RAW_GOLD, 0.12)}`
                    },
                    aside: {
                        top: 52,
                        height: "calc(100vh - 52px)",
                        background: "rgba(8, 7, 8, 0.72)",
                        backdropFilter: "blur(10px)",
                        WebkitBackdropFilter: "blur(10px)",
                        borderLeft: `1px solid ${rgba(RAW_GOLD, 0.12)}`
                    },
                    main: {
                        backgroundColor:
                            computedColorScheme === "dark"
                                ? theme.colors.dark[8]
                                : theme.colors.gray[0],
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden"
                    }
                })}
            >
                <AppShell.Header>
                    <Topbar
                        asideBar={{
                            show: showAsideBar,
                            onToggle: () => setShowAsideBar(!showAsideBar)
                        }}
                    />
                </AppShell.Header>
                {!globals.isSmallScreen && (
                    <AppShell.Navbar p="xs" w={{ base: 250, xl: 300 }}>
                        <Sidebar
                            character={character}
                            onLoadFromFile={openLoadModal}
                            onLoadSavedCharacter={handleLoadSavedCharacter}
                            onCreateCharacter={handleCreateCharacter}
                        />
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
                    <div
                        style={{
                            backgroundColor: "rgba(0, 0, 0, 0.7)",
                            height: "100%",
                            display: "flex",
                            flexDirection: "column"
                        }}
                    >
                        <div
                            style={
                                {
                                    width: "100%",
                                    height: "100%",
                                    display: "flex",
                                    flexDirection: "column",
                                    flex: 1,
                                    minHeight: 0,
                                    "--aside-offset": showAsideBar ? "200px" : "0px",
                                    "--navbar-offset": globals.isSmallScreen ? "0px" : "250px"
                                } as React.CSSProperties
                            }
                        >
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
