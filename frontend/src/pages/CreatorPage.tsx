import { AppShell, BackgroundImage, useComputedColorScheme } from "@mantine/core"
import { RAW_GOLD, rgba } from "~/theme/colors"
import { useLocalStorage, useMediaQuery, useViewportSize } from "@mantine/hooks"
import { notifications } from "@mantine/notifications"
import { useQueryClient } from "@tanstack/react-query"
import { useLocation, useNavigate } from "@tanstack/react-router"
import React, { useCallback, useEffect, useState, useSyncExternalStore } from "react"
import LoadModal from "~/components/LoadModal"
import NameCharacterBeforeSwitchModal from "~/components/NameCharacterBeforeSwitchModal"
import RenderProfiler from "~/components/RenderProfiler"
import SharedCharacterCreatorModal from "~/components/SharedCharacterCreatorModal"
import { getEmptyCharacter, type Character as CharacterType } from "~/data/Character"
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
import { characterHttp } from "~/utils/http/characters"
import { parseCharacterData } from "~/utils/characterData"
import { characterPersistence, isOwnedSavedCharacter } from "~/modules/characterPersistence"

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
    // Firefox mobile's browser chrome can cover the bottom of a 100vh layout. Dynamic viewport
    // units follow the currently visible viewport, keeping the generator's action buttons usable.
    const creatorViewportHeight = globals.isPhoneScreen ? "100dvh" : "100vh"
    const creatorContentHeight = globals.isPhoneScreen
        ? "calc(100dvh - 52px)"
        : "calc(100vh - 52px)"

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
    const [characterSessionKey, setCharacterSessionKey] = useState(0)
    const userCharacters = (
        (characters as Array<{ id: string; name: string; shared?: boolean }>) || []
    ).filter((candidate) => !candidate.shared)
    const activeCharacterIsShared = !!(
        character.id &&
        (characters as Array<{ id: string; shared?: boolean }> | undefined)?.some(
            (candidate) => candidate.id === character.id && candidate.shared
        )
    )
    const resetGeneratorSession = () => setCharacterSessionKey((key) => key + 1)

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

    const loadSavedCharacter = async (
        characterId: string,
        isCurrent = persistence.replacementGuard()
    ) => {
        await characterPersistence(queryClient).settle(character.id)
        if (!isCurrent()) return
        const response = await characterHttp.get(characterId)
        if (!isCurrent()) return
        const loadedCharacter = parseCharacterData((response as { data: unknown }).data)
        if (!loadedCharacter) throw new Error("Unable to load character data")

        persistence.startDraft()
        setCharacter({
            ...loadedCharacter,
            id: characterId
        } as CharacterType & { id: string })
        resetGeneratorSession()
        setSelectedStep("final")

        notifications.show({
            title: "Character loaded",
            message: `Loaded "${loadedCharacter.name}"`,
            color: "green",
            autoClose: 3000
        })
    }

    const persistence = characterPersistence(queryClient)
    const updateGeneratorCharacter = useCallback<typeof setCharacter>(
        (next) => {
            if (!persistence.transitionSnapshot()) setCharacter(next)
        },
        [persistence, setCharacter]
    )
    const isTransitioningCharacter = useSyncExternalStore(
        persistence.subscribeTransitions,
        persistence.transitionSnapshot,
        persistence.transitionSnapshot
    )
    const switchDecision = (targetId?: string) =>
        persistence.decision(character, characters, targetId)
    const saveCurrentCharacter = async (
        draft = character,
        isCurrent = persistence.replacementGuard()
    ) => {
        if (switchDecision() === "continue") return
        const saved = await persistence.save(draft, {
            owned: isOwnedSavedCharacter(draft.id, characters),
            beforeSwitch: true,
            ownershipLoaded: characters !== undefined
        })
        if (!isCurrent()) return
        setCharacter((current) =>
            current.id === draft.id
                ? {
                      ...current,
                      id: saved.id,
                      characterVersion: saved.characterVersion
                  }
                : current
        )
    }

    const completePendingSwitchAction = async (
        action: PendingSwitchAction,
        isCurrent = persistence.replacementGuard()
    ) => {
        if (!action || !isCurrent()) {
            return
        }

        if (action.type === "load") {
            await loadSavedCharacter(action.characterId, isCurrent)
            return
        }

        persistence.startDraft()
        setCharacter(getEmptyCharacter())
        resetGeneratorSession()
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

    const handleLoadSavedCharacter = (characterId: string) =>
        persistence
            .transition(async (isCurrent) => {
                if (characterId !== character.id) {
                    if (switchDecision() === "name") {
                        openNameBeforeSwitchModal({ type: "load", characterId })
                        return
                    }

                    try {
                        await saveCurrentCharacter(character, isCurrent)
                    } catch (error) {
                        const notifiedError =
                            error instanceof Error
                                ? error
                                : new Error("Failed to save current character")
                        notifications.show({
                            title: "Error saving character",
                            message: notifiedError.message,
                            color: "red"
                        })
                        ;(notifiedError as Error & { alreadyNotified?: boolean }).alreadyNotified =
                            true
                        throw notifiedError
                    }
                }

                if (isCurrent()) await loadSavedCharacter(characterId, isCurrent)
            })
            .then(() => undefined)

    const handleCreateCharacter = () =>
        persistence
            .transition(async (isCurrent) => {
                if (switchDecision() === "name") {
                    openNameBeforeSwitchModal({ type: "create" })
                    return
                }

                try {
                    await saveCurrentCharacter(character, isCurrent)
                } catch (error) {
                    const notifiedError =
                        error instanceof Error
                            ? error
                            : new Error("Failed to save current character")
                    notifications.show({
                        title: "Error saving character",
                        message: notifiedError.message,
                        color: "red"
                    })
                    ;(notifiedError as Error & { alreadyNotified?: boolean }).alreadyNotified = true
                    throw notifiedError
                }

                await completePendingSwitchAction({ type: "create" }, isCurrent)
            })
            .then(() => undefined)

    const handleCreateNewFromSharedCharacter = () => {
        persistence.startDraft()
        setCharacter(getEmptyCharacter())
        resetGeneratorSession()
        setSelectedStep(defaultGeneratorStepId)
    }

    const handleSaveAndContinueSwitch = () =>
        persistence.transition(async (isCurrent) => {
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
                await saveCurrentCharacter({ ...character, name: switchNameValue }, isCurrent)
                if (!isCurrent()) return

                const action = pendingSwitchAction
                closeNameBeforeSwitchModal()
                await completePendingSwitchAction(action, isCurrent)
            } catch (error) {
                notifications.show({
                    title: "Error saving character",
                    message:
                        error instanceof Error ? error.message : "Failed to save current character",
                    color: "red"
                })
                setIsSavingBeforeSwitch(false)
            }
        })

    const handleDeleteAndContinueSwitch = () =>
        persistence.transition(async (isCurrent) => {
            const action = pendingSwitchAction
            await persistence.settle(character.id)
            if (!isCurrent()) return
            closeNameBeforeSwitchModal()
            persistence.startDraft()
            setCharacter(getEmptyCharacter())
            resetGeneratorSession()
            await completePendingSwitchAction(action)
        })

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
                setCharacter={(imported) => setCharacter(persistence.replaceDraft(imported))}
                loadedFile={loadedFile}
                setSelectedStep={setSelectedStep}
                onCharacterReplaced={resetGeneratorSession}
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
            <SharedCharacterCreatorModal
                opened={activeCharacterIsShared}
                characterName={character.name}
                playerName={character.player}
                onGoToSheet={() => navigate({ to: "/sheet" })}
                onCreateNewCharacter={handleCreateNewFromSharedCharacter}
            />
            <AppShell
                padding="0"
                header={{ height: 52 }}
                styles={(theme) => ({
                    root: {
                        height: creatorViewportHeight
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
                        height: creatorContentHeight,
                        background: "rgba(8, 7, 8, 0.72)",
                        backdropFilter: "blur(10px)",
                        WebkitBackdropFilter: "blur(10px)",
                        borderRight: `1px solid ${rgba(RAW_GOLD, 0.12)}`
                    },
                    aside: {
                        top: 52,
                        height: creatorContentHeight,
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
                    <RenderProfiler id="CreatorTopbar">
                        <Topbar
                            asideBar={{
                                show: showAsideBar,
                                onToggle: () => setShowAsideBar(!showAsideBar)
                            }}
                        />
                    </RenderProfiler>
                </AppShell.Header>
                {!globals.isSmallScreen && (
                    <AppShell.Navbar p="xs" w={{ base: 250, xl: 300 }}>
                        <RenderProfiler id="CreatorSidebar">
                            <Sidebar
                                character={character}
                                onLoadFromFile={openLoadModal}
                                onLoadSavedCharacter={handleLoadSavedCharacter}
                                onCreateCharacter={handleCreateCharacter}
                            />
                        </RenderProfiler>
                    </AppShell.Navbar>
                )}
                {showAsideBar && (
                    <AppShell.Aside
                        p="md"
                        w={{ xs: 200 }}
                        style={{ display: "flex", flexDirection: "column" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <RenderProfiler id="CreatorAsideBar">
                            <AsideBar
                                selectedStep={selectedStep}
                                setSelectedStep={setSelectedStep}
                                character={character}
                            />
                        </RenderProfiler>
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
                            inert={isTransitioningCharacter}
                            style={
                                {
                                    width: "100%",
                                    height: "100%",
                                    display: "flex",
                                    flexDirection: "column",
                                    flex: 1,
                                    minHeight: 0,
                                    "--aside-offset": showAsideBar ? "200px" : "0px",
                                    "--navbar-offset": globals.isSmallScreen
                                        ? "0px"
                                        : viewportWidth >= 1408
                                          ? "300px"
                                          : "250px"
                                } as React.CSSProperties
                            }
                        >
                            <RenderProfiler id="Generator">
                                <Generator
                                    key={characterSessionKey}
                                    character={character}
                                    setCharacter={updateGeneratorCharacter}
                                    selectedStep={selectedStep}
                                    setSelectedStep={setSelectedStep}
                                />
                            </RenderProfiler>
                        </div>
                    </div>
                </BackgroundImage>
            </AppShell>
        </>
    )
}
