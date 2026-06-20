import {
    AppShell,
    BackgroundImage,
    ActionIcon,
    Badge,
    Box,
    Button,
    Card,
    Center,
    Container,
    Group,
    Loader,
    Menu,
    Modal,
    Stack,
    Text,
    Textarea,
    Title,
    useComputedColorScheme
} from "@mantine/core"
import { useMediaQuery } from "@mantine/hooks"
import { notifications } from "@mantine/notifications"
import { Link } from "@tanstack/react-router"
import {
    IconArrowLeft,
    IconBook2,
    IconVersions,
    IconUsers
} from "@tabler/icons-react"
import posthog from "posthog-js"
import type { ReactNode } from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import ChatWindow from "~/character_sheet/components/ChatWindow"
import CoterieCharacterSummaryGrid from "~/components/CoterieCharacterSummaryGrid"
import { getEmptyCharacter } from "~/data/Character"
import { rndInt } from "~/generator/utils"
import { globals } from "~/globals"
import { useAuth } from "~/hooks/useAuth"
import { useCharacterLocalStorage } from "~/hooks/useCharacterLocalStorage"
import { useCoterie, useCoterieNotes, useSaveCoterieNotes } from "~/hooks/useCoteries"
import { useSessionChat } from "~/hooks/useSessionChat"
import club from "~/resources/backgrounds/aleksandr-popov-3InMDrsuYrk-unsplash.jpg"
import bloodGuy from "~/resources/backgrounds/marcus-bellamy-xvW725b6LQk-unsplash.jpg"
import batWoman from "~/resources/backgrounds/peter-scherbatykh-VzQWVqHOCaE-unsplash.jpg"
import alley from "~/resources/backgrounds/thomas-le-KNQEvvCGoew-unsplash.jpg"
import { RAW_GOLD, RAW_GREY, RAW_RED, rgba } from "~/theme/colors"
import Topbar from "~/topbar/Topbar"
import { type CoterieNoteVersionResponse } from "~/utils/api"

type CoteriePageProps = {
    coterieId: string
}

type SaveStatus = "idle" | "dirty" | "saving" | "saved" | "error" | "too-large"

const backgrounds = [club, bloodGuy, batWoman, alley]
const topbarHeight = 52
const noteMaxBytes = 200 * 1024
const chatDockBreakpoint = 1100

const getUtf8ByteLength = (value: string) => new TextEncoder().encode(value).length

const formatDateTime = (value: string) =>
    new Date(value).toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    })

const CoteriePage = ({ coterieId }: CoteriePageProps) => {
    const {
        isLoading: authLoading,
        isAuthenticated,
        signIn
    } = useAuth()
    const { data: coterie, isLoading: coterieLoading, error: coterieError } = useCoterie(
        isAuthenticated ? coterieId : null
    )
    const { data: notes } = useCoterieNotes(isAuthenticated ? coterieId : null)
    const saveNotesMutation = useSaveCoterieNotes()
    const [character] = useCharacterLocalStorage()
    const chatCharacter = character.name.trim() ? character : getEmptyCharacter()
    const computedColorScheme = useComputedColorScheme("dark", {
        getInitialValueInEffect: true
    })
    const isSmallScreen = useMediaQuery(
        `(max-width: ${globals.smallScreenW}px)`,
        undefined,
        { getInitialValueInEffect: false }
    )
    const shouldInlineChat = useMediaQuery(
        `(max-width: ${chatDockBreakpoint}px)`,
        undefined,
        { getInitialValueInEffect: false }
    )
    const [showAsideBar, setShowAsideBar] = useState(!isSmallScreen)
    const [backgroundIndex] = useState(rndInt(0, backgrounds.length))
    const [notesOpened, setNotesOpened] = useState(false)
    const [draftNotes, setDraftNotes] = useState("")
    const [lastSavedNotes, setLastSavedNotes] = useState("")
    const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")
    const initializedNotesIdRef = useRef<string | null>(null)
    const { connect, joinSession, sessionId, sessionType, connectionStatus } = useSessionChat()
    const noteBytes = useMemo(() => getUtf8ByteLength(draftNotes), [draftNotes])
    const versions = notes?.versions ?? []
    const currentNote = notes?.current ?? null
    const desktopChatDocked = !shouldInlineChat
    const chatInline = !desktopChatDocked

    useEffect(() => {
        setShowAsideBar(!isSmallScreen)
    }, [isSmallScreen])

    useEffect(() => {
        posthog.capture("coterie-page-view", {
            coterieId
        })
    }, [coterieId])

    useEffect(() => {
        if (!currentNote && initializedNotesIdRef.current !== "empty") {
            initializedNotesIdRef.current = "empty"
            setDraftNotes("")
            setLastSavedNotes("")
            setSaveStatus("idle")
            return
        }

        if (currentNote && initializedNotesIdRef.current !== currentNote.id) {
            initializedNotesIdRef.current = currentNote.id
            setDraftNotes(currentNote.content)
            setLastSavedNotes(currentNote.content)
            setSaveStatus("saved")
        }
    }, [currentNote])

    const joinCoterieChat = useCallback(
        (source: "desktop-dock" | "inline") => {
            if (!coterie) {
                return
            }

            const alreadyInCoterieChat =
                connectionStatus === "connected" &&
                sessionType === "coterie" &&
                sessionId === coterie.id

            if (!alreadyInCoterieChat) {
                connect()
                joinSession({
                    coterieId: coterie.id,
                    characterName: character.name.trim() || undefined
                })
            }

            posthog.capture("coterie-page-chat-joined", {
                coterieId: coterie.id,
                source,
                alreadyInCoterieChat
            })
        },
        [character.name, connect, connectionStatus, coterie, joinSession, sessionId, sessionType]
    )

    useEffect(() => {
        if (!coterie) {
            return
        }

        joinCoterieChat(desktopChatDocked ? "desktop-dock" : "inline")
    }, [coterie, desktopChatDocked, joinCoterieChat])

    const saveDraft = useCallback(
        (source: "debounce" | "close") => {
            if (!coterie || draftNotes === lastSavedNotes || saveNotesMutation.isPending) {
                return
            }

            if (noteBytes > noteMaxBytes) {
                setSaveStatus("too-large")
                posthog.capture("coterie-notes-save-blocked", {
                    coterieId: coterie.id,
                    reason: "too-large",
                    noteBytes,
                    limitBytes: noteMaxBytes,
                    source
                })
                return
            }

            setSaveStatus("saving")
            saveNotesMutation.mutate(
                {
                    coterieId: coterie.id,
                    content: draftNotes
                },
                {
                    onSuccess: (data) => {
                        setLastSavedNotes(draftNotes)
                        setSaveStatus("saved")
                        posthog.capture("coterie-notes-saved", {
                            coterieId: coterie.id,
                            noteBytes,
                            versionCount: data.versions.length,
                            createdNewVersion: data.createdNewVersion,
                            source
                        })
                    },
                    onError: (error) => {
                        setSaveStatus("error")
                        posthog.capture("coterie-notes-save-failed", {
                            coterieId: coterie.id,
                            noteBytes,
                            source
                        })
                        notifications.show({
                            title: "Notes not saved",
                            message: error instanceof Error ? error.message : "Please try again.",
                            color: "red"
                        })
                    }
                }
            )
        },
        [coterie, draftNotes, lastSavedNotes, noteBytes, saveNotesMutation]
    )

    useEffect(() => {
        if (draftNotes === lastSavedNotes) {
            return
        }

        setSaveStatus(noteBytes > noteMaxBytes ? "too-large" : "dirty")

        if (noteBytes > noteMaxBytes) {
            return
        }

        const timeout = window.setTimeout(() => saveDraft("debounce"), 900)
        return () => window.clearTimeout(timeout)
    }, [draftNotes, lastSavedNotes, noteBytes, saveDraft])

    const openNotes = () => {
        setNotesOpened(true)
        posthog.capture("coterie-notes-opened", {
            coterieId,
            hasExistingNotes: !!currentNote,
            versionCount: versions.length
        })
    }

    const closeNotes = () => {
        saveDraft("close")
        setNotesOpened(false)
    }

    const restoreVersion = (version: CoterieNoteVersionResponse) => {
        setDraftNotes(version.content)
        setSaveStatus("dirty")
        posthog.capture("coterie-notes-version-restored", {
            coterieId,
            versionId: version.id,
            versionCreatedAt: version.createdAt
        })
    }

    const showSavePill = saveStatus === "saving" || saveStatus === "saved"

    const renderShell = (content: ReactNode) => (
        <AppShell
            padding="0"
            header={{ height: topbarHeight }}
            styles={(theme) => ({
                root: { height: "100vh" },
                header: {
                    background: "rgba(8, 7, 8, 0.7)",
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                    borderBottom: `1px solid ${rgba(RAW_GOLD, 0.12)}`,
                    zIndex: 200
                },
                main: {
                    backgroundColor:
                        computedColorScheme === "dark" ? theme.colors.dark[8] : theme.colors.gray[0],
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
                        onToggle: () => setShowAsideBar((prev) => !prev)
                    }}
                />
            </AppShell.Header>
            {content}
        </AppShell>
    )

    if (authLoading) {
        return renderShell(
            <Center h="100%">
                <Loader size="lg" color="red" />
            </Center>
        )
    }

    if (!isAuthenticated) {
        return renderShell(
            <Center h="100%">
                <Card p="xl" withBorder>
                    <Stack gap="md" align="center">
                        <Text size="lg" fw={500}>
                            Sign in to view this coterie
                        </Text>
                        <Button color="red" onClick={() => signIn()}>
                            Sign in
                        </Button>
                    </Stack>
                </Card>
            </Center>
        )
    }

    if (coterieLoading) {
        return renderShell(
            <Center h="100%">
                <Loader size="lg" color="red" />
            </Center>
        )
    }

    if (coterieError || !coterie) {
        return renderShell(
            <Center h="100%">
                <Card p="xl" withBorder style={{ backgroundColor: "rgba(0, 0, 0, 0.82)" }}>
                    <Stack gap="md" align="center">
                        <Title order={3}>Coterie unavailable</Title>
                        <Text c="dimmed" ta="center">
                            This coterie does not exist, or you do not have access to it.
                        </Text>
                        <Button
                            component={Link}
                            to="/me"
                            color="red"
                            variant="light"
                            leftSection={<IconArrowLeft size={16} />}
                        >
                            Back to account
                        </Button>
                    </Stack>
                </Card>
            </Center>
        )
    }

    const memberCount = coterie.members?.length ?? 0

    return (
        <>
            {renderShell(
                <BackgroundImage
                    h="100%"
                    src={backgrounds[backgroundIndex]}
                    style={{ flex: 1, minHeight: 0, width: "100%" }}
                >
                    <Box
                        style={{
                            background:
                                "linear-gradient(180deg, rgba(4, 3, 5, 0.78) 0%, rgba(7, 5, 8, 0.94) 100%)",
                            height: "100%",
                            width: "100%",
                            boxSizing: "border-box",
                            overflow: "auto",
                            paddingTop: topbarHeight
                        }}
                    >
                        <Container size="lg" py="xl">
                            <Stack gap="xl">
                                <Group justify="space-between" align="flex-start" gap="lg">
                                    <Stack gap="xs">
                                        <Button
                                            component={Link}
                                            to="/me"
                                            color="red"
                                            variant="subtle"
                                            leftSection={<IconArrowLeft size={16} />}
                                            style={{ alignSelf: "flex-start" }}
                                        >
                                            Account
                                        </Button>
                                        <Text
                                            style={{
                                                fontFamily: "Cinzel, Georgia, serif",
                                                fontSize: "0.78rem",
                                                letterSpacing: "0.28em",
                                                textTransform: "uppercase",
                                                color: rgba(RAW_GOLD, 0.78)
                                            }}
                                        >
                                            Coterie
                                        </Text>
                                        <Title
                                            order={1}
                                            style={{
                                                fontFamily: "Crimson Text, Georgia, serif",
                                                fontSize: "clamp(2.35rem, 7vw, 4.9rem)",
                                                fontWeight: 500,
                                                lineHeight: 0.95,
                                                color: "rgba(244, 236, 232, 0.96)",
                                                textShadow: `0 18px 45px ${rgba(RAW_RED, 0.22)}`
                                            }}
                                        >
                                            {coterie.name}
                                        </Title>
                                        <Group gap="xs">
                                            <Badge
                                                color="red"
                                                variant={coterie.owned ? "filled" : "light"}
                                            >
                                                {coterie.owned ? "Owned" : "Joined"}
                                            </Badge>
                                            <Badge
                                                color="yellow"
                                                variant="outline"
                                                leftSection={<IconUsers size={12} />}
                                            >
                                                {memberCount} {memberCount === 1 ? "member" : "members"}
                                            </Badge>
                                        </Group>
                                        <Button
                                            color="yellow"
                                            variant="subtle"
                                            size="xs"
                                            leftSection={<IconBook2 size={14} />}
                                            onClick={openNotes}
                                            style={{
                                                alignSelf: "flex-start",
                                                color: rgba(RAW_GOLD, 0.74),
                                                backgroundColor: rgba(RAW_GOLD, 0.06),
                                                border: `1px solid ${rgba(RAW_GOLD, 0.16)}`
                                            }}
                                        >
                                            Private Notes
                                        </Button>
                                    </Stack>
                                </Group>

                                <Box
                                    style={{
                                        paddingRight: desktopChatDocked ? 460 : 0,
                                        transition: "padding-right 160ms ease"
                                    }}
                                >
                                    <CoterieCharacterSummaryGrid members={coterie.members ?? []} />
                                </Box>

                                {chatInline ? (
                                    <Box
                                        style={{
                                            width: "100%",
                                            minWidth: 0,
                                            position: "relative",
                                            zIndex: 1
                                        }}
                                    >
                                        <ChatWindow
                                            options={{
                                                primaryColor: "red",
                                                character: chatCharacter
                                            }}
                                            sessionLabel={coterie.name}
                                            sessionLabelSessionId={coterie.id}
                                            initiallyExpanded
                                            lockedOpen
                                            inline
                                        />
                                    </Box>
                                ) : null}
                            </Stack>
                        </Container>
                    </Box>
                </BackgroundImage>
            )}

            <Modal
                opened={notesOpened}
                onClose={closeNotes}
                size={
                    desktopChatDocked
                        ? "min(80rem, calc(100vw - 540px))"
                        : "min(80rem, calc(100vw - 2rem))"
                }
                centered
                zIndex={2200}
                title={
                    <Group justify="space-between" gap="md" style={{ width: "100%" }}>
                        <Group gap="sm">
                            <IconBook2 size={20} color={rgba(RAW_GOLD, 0.92)} />
                            <Text fw={700}>Private Notes</Text>
                            {showSavePill ? (
                                <Badge
                                    color={saveStatus === "saved" ? "green" : "yellow"}
                                    variant="light"
                                    leftSection={
                                        saveStatus === "saving" ? (
                                            <Loader color="yellow" size={10} />
                                        ) : undefined
                                    }
                                >
                                    {saveStatus === "saved" ? "Saved" : ""}
                                </Badge>
                            ) : null}
                        </Group>
                        <Menu position="bottom-end" withinPortal>
                            <Menu.Target>
                                <ActionIcon
                                    color="yellow"
                                    variant="light"
                                    aria-label="Note versions"
                                >
                                    <IconVersions size={18} />
                                </ActionIcon>
                            </Menu.Target>
                            <Menu.Dropdown>
                                <Menu.Label>Past versions</Menu.Label>
                                {versions.slice(1).length > 0 ? (
                                    versions.slice(1).map((version) => (
                                        <Menu.Item
                                            key={version.id}
                                            leftSection={<IconVersions size={14} />}
                                            onClick={() => restoreVersion(version)}
                                        >
                                            {formatDateTime(version.createdAt)}
                                        </Menu.Item>
                                    ))
                                ) : (
                                    <Menu.Item disabled>No past versions yet</Menu.Item>
                                )}
                            </Menu.Dropdown>
                        </Menu>
                    </Group>
                }
                styles={{
                    content: {
                        background: "rgba(9, 8, 10, 0.98)",
                        border: `1px solid ${rgba(RAW_GOLD, 0.22)}`,
                        marginRight: desktopChatDocked ? 460 : undefined
                    },
                    header: {
                        background: "rgba(9, 8, 10, 0.98)",
                        borderBottom: `1px solid ${rgba(RAW_GOLD, 0.14)}`
                    }
                }}
            >
                <Stack gap="sm">
                    <Textarea
                        value={draftNotes}
                        onChange={(event) => setDraftNotes(event.currentTarget.value)}
                        minRows={18}
                        maxRows={24}
                        autosize
                        placeholder="Plans, clues, debts, boons, suspicions..."
                        styles={{
                            input: {
                                background: "rgba(18, 14, 17, 0.92)",
                                borderColor:
                                    noteBytes > noteMaxBytes
                                        ? rgba(RAW_RED, 0.8)
                                        : rgba(RAW_GOLD, 0.28),
                                color: "rgba(244, 236, 232, 0.94)",
                                fontFamily: "Inter, Segoe UI, sans-serif",
                                lineHeight: 1.6,
                                fontSize: "0.95rem"
                            }
                        }}
                    />
                    <Text size="xs" c={noteBytes > noteMaxBytes ? "red" : "dimmed"}>
                        {Math.round(noteBytes / 1024)} KB / 200 KB
                    </Text>
                </Stack>
            </Modal>

            {desktopChatDocked ? (
                <ChatWindow
                    options={{
                        primaryColor: "red",
                        character: chatCharacter
                    }}
                    sessionLabel={coterie.name}
                    sessionLabelSessionId={coterie.id}
                    initiallyExpanded
                    lockedOpen
                    docked
                />
            ) : null}
        </>
    )
}

export default CoteriePage
