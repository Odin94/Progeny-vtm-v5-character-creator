import {
    Alert,
    Badge,
    Button,
    Group,
    Modal,
    Popover,
    Skeleton,
    Stack,
    Text,
    Textarea,
    TextInput
} from "@mantine/core"
import { useMediaQuery, useReducedMotion } from "@mantine/hooks"
import { notifications } from "@mantine/notifications"
import { Link, useNavigate } from "@tanstack/react-router"
import {
    IconAlertTriangle,
    IconArrowLeft,
    IconCheck,
    IconCopy,
    IconHistory,
    IconId,
    IconLink,
    IconLogin,
    IconMessages,
    IconNotebook,
    IconRefresh,
    IconUserMinus,
    IconUsersGroup,
    IconVersions
} from "@tabler/icons-react"
import posthog from "posthog-js"
import type { MouseEvent, ReactNode } from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import ChatWindow from "~/character_sheet/components/ChatWindow"
import ConfirmActionModal from "~/components/ConfirmActionModal"
import CoterieCharacterSummaryGrid, {
    clanColorStyle,
    coterieMemberElementId,
    getClanColor,
    getMemberPlayerName,
    parseCoterieMembers
} from "~/components/CoterieCharacterSummaryGrid"
import NameTag from "~/components/NameTag"
import {
    DeleteIconButton,
    EmptyState,
    IconButton,
    PageHeader,
    PageShell,
    Panel,
    SectionHeader,
    SkeletonLines,
    useContextMenu,
    type ContextMenuEntry
} from "~/components/ui"
import { type Character, getEmptyCharacter } from "~/data/Character"
import { clans } from "~/data/Clans"
import { rndInt } from "~/generator/utils"
import { useAuth } from "~/hooks/useAuth"
import { useCharacterLocalStorage } from "~/hooks/useCharacterLocalStorage"
import {
    useCoterie,
    useCoterieMembership,
    useCoterieNotes,
    useCoterieVitals,
    useCreateCoterieInvite,
    useDeleteCoterie,
    useRemoveCharacterFromCoterie,
    useRemoveCoteriePlayer,
    useRestoreCoterieNoteVersion,
    useSaveCoterieNotes
} from "~/hooks/useCoteries"
import { useSessionChat } from "~/hooks/useSessionChat"
import club from "~/resources/backgrounds/aleksandr-popov-3InMDrsuYrk-unsplash.jpg"
import bloodGuy from "~/resources/backgrounds/marcus-bellamy-xvW725b6LQk-unsplash.jpg"
import batWoman from "~/resources/backgrounds/peter-scherbatykh-VzQWVqHOCaE-unsplash.jpg"
import alley from "~/resources/backgrounds/thomas-le-KNQEvvCGoew-unsplash.jpg"
import {
    type CoterieMemberResponse,
    type CoterieNoteVersionResponse,
    type CoteriePlayerResponse
} from "~/utils/api"
import { isCharacterVitals } from "~/utils/characterVitals"
import type { CharacterVitals } from "~/utils/characterVitals"
import { formatPrivateNoteWordCount } from "~/utils/privateNotes"
import {
    COTERIE_VISIT_THRESHOLD,
    feedbackSurveyEvents,
    feedbackSurveyStorageKeys,
    getFeedbackSurveyCount,
    getFeedbackSurveyStorageKey,
    incrementFeedbackSurveyCount,
    triggerFeedbackSurveyEligibilityOnce
} from "~/utils/feedbackSurveys"
import classes from "./CoteriePage.module.css"

type CoteriePageProps = {
    coterieId: string
}

type SaveStatus = "idle" | "dirty" | "saving" | "saved" | "error" | "too-large"

type PendingRemoval =
    | { kind: "character"; characterId: string; characterName: string }
    | { kind: "player"; membershipId: string; nickname: string | null }

const backgrounds = [club, bloodGuy, batWoman, alley]
const noteMaxBytes = 200 * 1024
const chatDockBreakpoint = 1100
const notesModalZIndex = 2200
const notesHistoryModalZIndex = notesModalZIndex + 1
const highlightDurationMs = 1600

const getUtf8ByteLength = (value: string) => new TextEncoder().encode(value).length

const formatDateTime = (value: string) =>
    new Date(value).toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    })

const formatDate = (value: string) =>
    new Date(value).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })

const pluralize = (count: number, singular: string, plural = `${singular}s`) =>
    `${count} ${count === 1 ? singular : plural}`

const errorMessage = (error: unknown, fallback: string) =>
    error instanceof Error && error.message ? error.message : fallback

const copyText = async (value: string) => {
    try {
        await navigator.clipboard.writeText(value)
        return true
    } catch {
        return false
    }
}

const saveStateLabel: Partial<Record<SaveStatus, string>> = {
    dirty: "Unsaved changes",
    saving: "Saving…",
    saved: "Saved",
    error: "Not saved",
    "too-large": "Too large to save"
}

/* ---------------------------------------------------------------------------------- */

const RosterChip = ({
    member,
    character,
    hunger,
    onSelect,
    onContextMenu
}: {
    member: CoterieMemberResponse
    character: Character
    hunger: number
    onSelect: () => void
    onContextMenu: (event: MouseEvent<HTMLElement>) => void
}) => {
    const clan = character.clan ? clans[character.clan] : null

    return (
        <button
            type="button"
            className={classes.rosterChip}
            style={clanColorStyle(getClanColor(character))}
            onClick={onSelect}
            onContextMenu={onContextMenu}
            aria-label={`Show ${character.name}'s dossier`}
        >
            <span className={classes.chipSigil} aria-hidden="true">
                {clan?.logo ? (
                    <span
                        className={classes.chipSigilMark}
                        style={{
                            maskImage: `url(${clan.logo})`,
                            WebkitMaskImage: `url(${clan.logo})`
                        }}
                    />
                ) : (
                    <span className={classes.chipInitial}>
                        {character.name.trim().charAt(0) || "?"}
                    </span>
                )}
            </span>
            <span className={classes.chipText}>
                <span className={classes.chipName}>{character.name}</span>
                <span className={classes.chipMeta}>
                    {[clan?.name || null, getMemberPlayerName(member, character)]
                        .filter(Boolean)
                        .join(" · ")}
                </span>
            </span>
            <span className={classes.chipHunger} title={`Hunger ${hunger}`} aria-hidden="true">
                {Array.from({ length: 5 }, (_, index) => (
                    <span
                        key={index}
                        className={classes.chipHungerPip}
                        data-filled={index < hunger || undefined}
                    />
                ))}
            </span>
        </button>
    )
}

const LiveStatus = ({ state, onRetry }: { state: "live" | "error"; onRetry: () => void }) =>
    state === "live" ? (
        <span className={classes.liveStatus} data-state="live">
            <span className={classes.liveDot} aria-hidden="true" />
            Live
        </span>
    ) : (
        <Group gap="xs" wrap="nowrap">
            <span className={classes.liveStatus} data-state="error">
                <span className={classes.liveDot} aria-hidden="true" />
                Vitals offline
            </span>
            <IconButton
                size="sm"
                label="Retry loading vitals"
                icon={<IconRefresh size={14} />}
                onClick={onRetry}
            />
        </Group>
    )

const CoterieSkeleton = () => (
    <>
        <div className={classes.top} aria-busy="true" aria-label="Loading coterie">
            <Skeleton height={28} width={96} radius="md" />
            <Stack gap={10}>
                <Skeleton height={11} width={90} radius="sm" />
                <Skeleton height={32} width="min(420px, 80%)" radius="sm" />
                <Skeleton height={12} width={160} radius="sm" />
            </Stack>
        </div>
        <div className={classes.block}>
            <Skeleton height={16} width={120} radius="sm" />
            <div className={classes.roster}>
                {Array.from({ length: 3 }, (_, index) => (
                    <Skeleton key={index} height={56} radius="md" />
                ))}
            </div>
        </div>
        <div className={classes.block}>
            <Skeleton height={16} width={140} radius="sm" />
            {Array.from({ length: 2 }, (_, index) => (
                <Panel key={index} p="lg" className={classes.skeletonDossier} aria-hidden="true">
                    <Stack gap="lg">
                        <Group gap="md" wrap="nowrap">
                            <Skeleton height={48} width={48} radius="md" />
                            <Stack gap={8} style={{ flex: 1 }}>
                                <Skeleton height={16} width="40%" radius="sm" />
                                <Skeleton height={10} width="25%" radius="sm" />
                            </Stack>
                        </Group>
                        <Skeleton height={112} radius="md" />
                        <SkeletonLines lines={4} />
                        <SkeletonLines lines={3} />
                    </Stack>
                </Panel>
            ))}
        </div>
    </>
)

/* ---------------------------------------------------------------------------------- */

const CoteriePage = ({ coterieId }: CoteriePageProps) => {
    const navigate = useNavigate()
    const reduceMotion = useReducedMotion()
    const { user, isLoading: authLoading, isAuthenticated, signIn, isSigningIn } = useAuth()
    const {
        data: coterie,
        isLoading: coterieLoading,
        error: coterieError,
        refetch: refetchCoterie,
        isRefetching: coterieRefetching
    } = useCoterie(isAuthenticated ? coterieId : null)
    const vitalsQuery = useCoterieVitals(isAuthenticated)
    const coterieVitals = vitalsQuery.data
    const vitalsByCharacterId = useMemo(() => {
        const vitalsMap: Record<string, CharacterVitals> = {}

        ;(coterieVitals || []).forEach((vitals) => {
            if (vitals.coterieId === coterieId && isCharacterVitals(vitals)) {
                vitalsMap[vitals.characterId] = vitals
            }
        })

        return vitalsMap
    }, [coterieId, coterieVitals])
    const notesQuery = useCoterieNotes(isAuthenticated ? coterieId : null)
    const notes = notesQuery.data
    const saveNotesMutation = useSaveCoterieNotes()
    const [character] = useCharacterLocalStorage()
    const chatCharacter = character.name.trim() ? character : getEmptyCharacter()
    const shouldInlineChat = useMediaQuery(`(max-width: ${chatDockBreakpoint}px)`, undefined, {
        getInitialValueInEffect: false
    })
    const [backgroundIndex] = useState(rndInt(0, backgrounds.length))
    const [notesOpened, setNotesOpened] = useState(false)
    const [historyOpened, setHistoryOpened] = useState(false)
    const [draftNotes, setDraftNotes] = useState("")
    const [lastSavedNotes, setLastSavedNotes] = useState("")
    const [selectedHistoryVersion, setSelectedHistoryVersion] =
        useState<CoterieNoteVersionResponse | null>(null)
    const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")
    const initializedNotesIdRef = useRef<string | null>(null)
    const feedbackVisitCoterieIdRef = useRef<string | null>(null)
    const { connect, joinSession, sessionId, sessionType, connectionStatus } = useSessionChat(
        (state) => ({
            connect: state.connect,
            joinSession: state.joinSession,
            sessionId: state.sessionId,
            sessionType: state.sessionType,
            connectionStatus: state.connectionStatus
        })
    )
    const noteBytes = useMemo(() => getUtf8ByteLength(draftNotes), [draftNotes])
    const versions = notes?.versions ?? []
    const currentNote = notes?.current ?? null
    const isViewingHistory = !!selectedHistoryVersion
    const displayedNotes = selectedHistoryVersion?.content ?? draftNotes
    const restoreNotesMutation = useRestoreCoterieNoteVersion()
    const desktopChatDocked = !shouldInlineChat
    const chatInline = !desktopChatDocked

    // Management (owner / own characters)
    const contextMenu = useContextMenu()
    const membership = useCoterieMembership(isAuthenticated ? coterieId : null)
    const createInviteMutation = useCreateCoterieInvite()
    const removeCharacterMutation = useRemoveCharacterFromCoterie()
    const removePlayerMutation = useRemoveCoteriePlayer()
    const deleteCoterieMutation = useDeleteCoterie()
    const [inviteOpened, setInviteOpened] = useState(false)
    const [inviteExpiresAt, setInviteExpiresAt] = useState<string | null>(null)
    const [pendingRemoval, setPendingRemoval] = useState<PendingRemoval | null>(null)
    const [deleteOpened, setDeleteOpened] = useState(false)
    const [highlightedCharacterId, setHighlightedCharacterId] = useState<string | null>(null)
    const highlightTimeoutRef = useRef<number | undefined>(undefined)

    useEffect(() => () => window.clearTimeout(highlightTimeoutRef.current), [])

    useEffect(() => {
        posthog.capture("coterie-page-view", {
            coterieId
        })
    }, [coterieId])

    useEffect(() => {
        if (!coterie || !user) {
            return
        }

        const visitCountKey = getFeedbackSurveyStorageKey(
            feedbackSurveyStorageKeys.coterieVisitCount,
            user.id
        )
        const eligibilityMarkerKey = getFeedbackSurveyStorageKey(
            feedbackSurveyStorageKeys.coterieEligibilitySent,
            user.id
        )

        if (feedbackVisitCoterieIdRef.current !== coterie.id) {
            feedbackVisitCoterieIdRef.current = coterie.id
            incrementFeedbackSurveyCount(localStorage, visitCountKey)
        }

        const coterieVisitCount = getFeedbackSurveyCount(localStorage, visitCountKey)
        if (coterieVisitCount < COTERIE_VISIT_THRESHOLD || coterie.playerCount < 2) {
            return
        }

        triggerFeedbackSurveyEligibilityOnce(localStorage, eligibilityMarkerKey, () =>
            posthog.capture(feedbackSurveyEvents.coterieEligible, {
                coterie_id: coterie.id,
                coterie_player_count: coterie.playerCount,
                coterie_page_visit_count: coterieVisitCount
            })
        )
    }, [coterie, user])

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

    // Join the coterie chat once per coterie. Reconnection after a dropped
    // socket is owned by the chat store, which retries with exponential backoff
    // (capped) and re-sends the stored join on reconnect. We must NOT re-join on
    // every connection-status change: doing so bypasses that backoff and, when a
    // join never completes, spins into a retry storm that also re-fires the
    // join-attempt and coterie-page-chat-joined analytics events on every pass.
    const joinedCoterieIdRef = useRef<string | null>(null)

    useEffect(() => {
        if (!coterie || joinedCoterieIdRef.current === coterie.id) {
            return
        }
        joinedCoterieIdRef.current = coterie.id

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
            source: desktopChatDocked ? "desktop-dock" : "inline",
            alreadyInCoterieChat
        })
    }, [
        coterie,
        connectionStatus,
        sessionType,
        sessionId,
        connect,
        joinSession,
        character.name,
        desktopChatDocked
    ])

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
        setSelectedHistoryVersion(null)
        setNotesOpened(true)
        posthog.capture("coterie-notes-opened", {
            coterieId,
            hasExistingNotes: !!currentNote,
            versionCount: versions.length
        })
    }

    const closeNotes = () => {
        saveDraft("close")
        setSelectedHistoryVersion(null)
        setHistoryOpened(false)
        setNotesOpened(false)
    }

    const previewVersion = (version: CoterieNoteVersionResponse) => {
        setSelectedHistoryVersion(version)
        setHistoryOpened(false)
        posthog.capture("coterie-notes-version-previewed", {
            coterieId,
            versionId: version.id,
            versionCreatedAt: version.createdAt
        })
    }

    const restoreVersion = () => {
        if (!coterie || !selectedHistoryVersion) {
            return
        }

        setSaveStatus("saving")
        restoreNotesMutation.mutate(
            {
                coterieId: coterie.id,
                versionId: selectedHistoryVersion.id
            },
            {
                onSuccess: (data) => {
                    const restoredContent = data.current?.content ?? selectedHistoryVersion.content
                    initializedNotesIdRef.current = data.current?.id ?? null
                    setSelectedHistoryVersion(null)
                    setDraftNotes(restoredContent)
                    setLastSavedNotes(restoredContent)
                    setSaveStatus("saved")
                    posthog.capture("coterie-notes-version-restored", {
                        coterieId: coterie.id,
                        versionId: selectedHistoryVersion.id,
                        newVersionId: data.current?.id,
                        versionCount: data.versions.length
                    })
                },
                onError: (error) => {
                    setSaveStatus("error")
                    notifications.show({
                        title: "Version not restored",
                        message: error instanceof Error ? error.message : "Please try again.",
                        color: "red"
                    })
                }
            }
        )
    }

    /* ---- Roster & management ------------------------------------------------------ */

    const parsedMembers = useMemo(
        () => parseCoterieMembers(coterie?.members ?? []),
        [coterie?.members]
    )
    const isOwner = !!coterie?.owned
    const canManageInvites = isOwner && coterie?.canManageInvites !== false
    const canManagePlayers = isOwner && coterie?.canManagePlayers !== false
    const players = isOwner ? (coterie?.players ?? []) : []

    const canRemoveMember = useCallback(
        (member: CoterieMemberResponse) => isOwner || member.character?.ownedByCurrentUser === true,
        [isOwner]
    )

    const showDossier = useCallback(
        (characterId: string) => {
            document.getElementById(coterieMemberElementId(characterId))?.scrollIntoView({
                behavior: reduceMotion ? "auto" : "smooth",
                block: "start"
            })
            setHighlightedCharacterId(characterId)
            window.clearTimeout(highlightTimeoutRef.current)
            highlightTimeoutRef.current = window.setTimeout(
                () => setHighlightedCharacterId(null),
                highlightDurationMs
            )
        },
        [reduceMotion]
    )

    const requestRemoveCharacter = useCallback(
        (member: CoterieMemberResponse, memberCharacter: Character) =>
            setPendingRemoval({
                kind: "character",
                characterId: member.characterId,
                characterName: memberCharacter.name || member.character?.name || "this character"
            }),
        []
    )

    const copyCharacterName = useCallback(async (name: string) => {
        const copied = await copyText(name)
        notifications.show({
            title: copied ? "Copied" : "Copy failed",
            message: copied ? `“${name}” copied to clipboard` : "Your browser blocked the copy.",
            color: copied ? "green" : "yellow"
        })
    }, [])

    const memberMenuEntries = useCallback(
        (
            member: CoterieMemberResponse,
            memberCharacter: Character,
            { includeShow }: { includeShow: boolean }
        ): ContextMenuEntry[] => {
            const entries: ContextMenuEntry[] = [
                { type: "label", key: "label", label: memberCharacter.name }
            ]
            if (includeShow) {
                entries.push({
                    key: "show",
                    label: "Show dossier",
                    icon: <IconId size={14} />,
                    onClick: () => showDossier(member.characterId)
                })
            }
            entries.push({
                key: "copy",
                label: "Copy name",
                icon: <IconCopy size={14} />,
                onClick: () => void copyCharacterName(memberCharacter.name)
            })
            if (canRemoveMember(member)) {
                entries.push(
                    { type: "divider", key: "divider" },
                    {
                        key: "remove",
                        label: "Remove from coterie…",
                        color: "red",
                        icon: <IconUserMinus size={14} />,
                        onClick: () => requestRemoveCharacter(member, memberCharacter)
                    }
                )
            }
            return entries
        },
        [canRemoveMember, copyCharacterName, requestRemoveCharacter, showDossier]
    )

    const openContextMenu = contextMenu.open
    const onDossierContextMenu = useCallback(
        (
            event: MouseEvent<HTMLElement>,
            member: CoterieMemberResponse,
            memberCharacter: Character
        ) =>
            openContextMenu(
                event,
                memberMenuEntries(member, memberCharacter, { includeShow: false })
            ),
        [memberMenuEntries, openContextMenu]
    )

    const renderMemberActions = useCallback(
        (member: CoterieMemberResponse, memberCharacter: Character) =>
            canRemoveMember(member) ? (
                <IconButton
                    size="md"
                    label="Remove from coterie"
                    icon={<IconUserMinus size={16} stroke={1.7} />}
                    onClick={() => requestRemoveCharacter(member, memberCharacter)}
                />
            ) : null,
        [canRemoveMember, requestRemoveCharacter]
    )

    const createInvite = () => {
        if (!coterie) return
        if (inviteOpened) {
            setInviteOpened(false)
            return
        }
        createInviteMutation.mutate(coterie.id, {
            onSuccess: async (invite) => {
                if (!invite.token) {
                    notifications.show({
                        title: "Invite created",
                        message: "The invite was created, but no link was returned.",
                        color: "yellow"
                    })
                    return
                }
                setInviteExpiresAt(invite.expiresAt ?? null)
                setInviteOpened(true)
                const url = membership.snapshot().inviteUrls.get(coterie.id)
                if (url && (await copyText(url))) {
                    notifications.show({
                        title: "Invite link copied",
                        message: "Share it with the player you want to invite.",
                        color: "green"
                    })
                }
            },
            onError: (error) => {
                notifications.show({
                    title: "Could not create invite",
                    message: errorMessage(error, "Failed to create invite"),
                    color: "red"
                })
            }
        })
    }

    const copyInvite = async () => {
        if (!membership.generatedInviteUrl) return
        const copied = await copyText(membership.generatedInviteUrl)
        notifications.show({
            title: copied ? "Copied" : "Copy failed",
            message: copied
                ? "Invite link copied to clipboard"
                : "The invite link is still visible in the field.",
            color: copied ? "green" : "yellow"
        })
    }

    const confirmRemoval = () => {
        if (!coterie || !pendingRemoval) return
        const target = pendingRemoval

        if (target.kind === "character") {
            removeCharacterMutation.mutate(
                { coterieId: coterie.id, characterId: target.characterId },
                {
                    onSuccess: () => {
                        notifications.show({
                            title: "Character removed",
                            message: `${target.characterName} removed from ${coterie.name}`,
                            color: "green"
                        })
                        setPendingRemoval(null)
                    },
                    onError: (error) => {
                        notifications.show({
                            title: "Error",
                            message: errorMessage(error, "Failed to remove character from coterie"),
                            color: "red"
                        })
                    }
                }
            )
            return
        }

        removePlayerMutation.mutate(
            { coterieId: coterie.id, membershipId: target.membershipId },
            {
                onSuccess: () => {
                    notifications.show({
                        title: "Player removed",
                        message: `${target.nickname || "Player"} was removed from ${coterie.name}.`,
                        color: "green"
                    })
                    setPendingRemoval(null)
                },
                onError: (error) => {
                    notifications.show({
                        title: "Error",
                        message: errorMessage(error, "Failed to remove player"),
                        color: "red"
                    })
                }
            }
        )
    }

    const confirmDeleteCoterie = () => {
        if (!coterie) return
        const name = coterie.name
        deleteCoterieMutation.mutate(coterie.id, {
            onSuccess: () => {
                notifications.show({
                    title: "Success",
                    message: `Coterie "${name}" deleted`,
                    color: "green"
                })
                setDeleteOpened(false)
                void navigate({ to: "/me", search: { tab: "coteries" } })
            },
            onError: (error) => {
                notifications.show({
                    title: "Error",
                    message: errorMessage(error, "Failed to delete coterie"),
                    color: "red"
                })
            }
        })
    }

    const playerMenuEntries = (player: CoteriePlayerResponse): ContextMenuEntry[] =>
        player.membershipId && !player.isOwner && canManagePlayers
            ? [
                  { type: "label", key: "label", label: player.nickname || "Player" },
                  {
                      key: "remove",
                      label: "Remove player…",
                      color: "red",
                      icon: <IconUserMinus size={14} />,
                      onClick: () =>
                          setPendingRemoval({
                              kind: "player",
                              membershipId: player.membershipId!,
                              nickname: player.nickname
                          })
                  }
              ]
            : []

    /* ---- Render ------------------------------------------------------------------- */

    const renderPage = (content: ReactNode) => (
        <PageShell size={false}>
            <div
                className={classes.backdrop}
                style={{ backgroundImage: `url(${backgrounds[backgroundIndex]})` }}
                aria-hidden="true"
            />
            <div
                className={classes.page}
                data-chat-docked={(desktopChatDocked && !!coterie) || undefined}
            >
                {content}
            </div>
        </PageShell>
    )

    if (authLoading || (isAuthenticated && coterieLoading)) {
        return renderPage(<CoterieSkeleton />)
    }

    if (!isAuthenticated) {
        return renderPage(
            <Panel tone="glass" p={0} maw={520} w="100%" mx="auto" mt="xl">
                <EmptyState
                    icon={<IconUsersGroup size={26} stroke={1.5} />}
                    title="Sign in to view this coterie"
                    actions={
                        <Button
                            onClick={signIn}
                            loading={isSigningIn}
                            leftSection={<IconLogin size={16} />}
                        >
                            {isSigningIn ? "Signing in…" : "Sign in"}
                        </Button>
                    }
                />
            </Panel>
        )
    }

    if (coterieError || !coterie) {
        return renderPage(
            <Panel tone="glass" p={0} maw={560} w="100%" mx="auto" mt="xl">
                <EmptyState
                    icon={<IconAlertTriangle size={26} stroke={1.5} />}
                    title="Coterie unavailable"
                    description="This coterie does not exist, or you do not have access to it."
                    actions={
                        <>
                            <Button
                                component={Link}
                                to="/me"
                                variant="default"
                                leftSection={<IconArrowLeft size={16} />}
                            >
                                Back to account
                            </Button>
                            <Button
                                variant="subtle"
                                color="gray"
                                leftSection={<IconRefresh size={16} />}
                                loading={coterieRefetching}
                                onClick={() => void refetchCoterie()}
                            >
                                Retry
                            </Button>
                        </>
                    }
                />
            </Panel>
        )
    }

    const memberCount = coterie.members?.length ?? 0
    const hasRoster = parsedMembers.length > 0
    const showPlayers = isOwner && players.length > 0
    const vitalsState: "live" | "error" = vitalsQuery.isError ? "error" : "live"

    const inviteButton = canManageInvites ? (
        <Popover
            opened={inviteOpened}
            onChange={setInviteOpened}
            position="bottom-end"
            width={340}
            withArrow
            trapFocus
        >
            <Popover.Target>
                <Button
                    leftSection={<IconLink size={16} />}
                    loading={createInviteMutation.isPending}
                    onClick={createInvite}
                >
                    Invite player
                </Button>
            </Popover.Target>
            <Popover.Dropdown>
                <div className={classes.invite}>
                    <Text size="sm" fw={600}>
                        Invite link
                    </Text>
                    <div className={classes.inviteRow}>
                        <TextInput
                            data-autofocus
                            readOnly
                            value={membership.generatedInviteUrl}
                            onFocus={(event) => event.currentTarget.select()}
                            aria-label="Invite link"
                            style={{ flex: 1 }}
                        />
                        <IconButton
                            variant="default"
                            size="input-sm"
                            label="Copy invite link"
                            icon={<IconCopy size={16} />}
                            onClick={() => void copyInvite()}
                        />
                    </div>
                    <Text size="xs" c="dimmed">
                        Anyone with this link can join
                        {inviteExpiresAt ? ` until ${formatDate(inviteExpiresAt)}` : ""}.
                    </Text>
                </div>
            </Popover.Dropdown>
        </Popover>
    ) : null

    return (
        <>
            {renderPage(
                <>
                    <div className={classes.top}>
                        <Button
                            component={Link}
                            to="/me"
                            variant="subtle"
                            color="gray"
                            size="xs"
                            leftSection={<IconArrowLeft size={14} />}
                            className={classes.back}
                        >
                            Account
                        </Button>
                        <PageHeader
                            eyebrow={isOwner ? "Your coterie" : "Coterie"}
                            title={coterie.name}
                            description={`${pluralize(memberCount, "character")} · ${pluralize(
                                coterie.playerCount,
                                "player"
                            )}`}
                            actions={
                                <div className={classes.headerActions}>
                                    <Button
                                        variant="default"
                                        leftSection={<IconNotebook size={16} />}
                                        onClick={openNotes}
                                    >
                                        Private notes
                                    </Button>
                                    {inviteButton}
                                    {isOwner ? (
                                        <DeleteIconButton
                                            label="Delete coterie"
                                            onClick={() => setDeleteOpened(true)}
                                        />
                                    ) : null}
                                </div>
                            }
                        />
                    </div>

                    {hasRoster || showPlayers ? (
                        <section className={classes.overview}>
                            <div
                                className={classes.overviewGrid}
                                data-with-players={showPlayers || undefined}
                            >
                                {hasRoster ? (
                                    <div className={classes.block}>
                                        <SectionHeader
                                            title="Roster"
                                            actions={
                                                <LiveStatus
                                                    state={vitalsState}
                                                    onRetry={() => void vitalsQuery.refetch()}
                                                />
                                            }
                                        />
                                        <div className={classes.roster}>
                                            {parsedMembers.map(
                                                ({ member, character: memberCharacter }) => (
                                                    <RosterChip
                                                        key={member.characterId}
                                                        member={member}
                                                        character={memberCharacter}
                                                        hunger={Math.max(
                                                            0,
                                                            Math.min(
                                                                5,
                                                                (
                                                                    vitalsByCharacterId[
                                                                        member.characterId
                                                                    ] ?? memberCharacter.ephemeral
                                                                )?.hunger ?? 0
                                                            )
                                                        )}
                                                        onSelect={() =>
                                                            showDossier(member.characterId)
                                                        }
                                                        onContextMenu={(event) =>
                                                            contextMenu.open(
                                                                event,
                                                                memberMenuEntries(
                                                                    member,
                                                                    memberCharacter,
                                                                    { includeShow: true }
                                                                )
                                                            )
                                                        }
                                                    />
                                                )
                                            )}
                                        </div>
                                    </div>
                                ) : null}

                                {showPlayers ? (
                                    <div className={classes.block}>
                                        <SectionHeader title="Players" order={3} />
                                        <Panel tone="inset" p={0}>
                                            <div className={classes.players}>
                                                {players.map((player) => {
                                                    const removable =
                                                        canManagePlayers &&
                                                        !player.isOwner &&
                                                        !!player.membershipId
                                                    return (
                                                        <div
                                                            key={player.membershipId ?? "owner"}
                                                            className={classes.playerRow}
                                                            onContextMenu={(event) =>
                                                                contextMenu.open(
                                                                    event,
                                                                    playerMenuEntries(player)
                                                                )
                                                            }
                                                        >
                                                            {player.showNameTag &&
                                                            player.nickname ? (
                                                                <span
                                                                    className={classes.playerName}
                                                                >
                                                                    <NameTag
                                                                        name={player.nickname}
                                                                        size="xs"
                                                                    />
                                                                </span>
                                                            ) : (
                                                                <span
                                                                    className={classes.playerName}
                                                                    data-placeholder={
                                                                        !player.nickname ||
                                                                        undefined
                                                                    }
                                                                >
                                                                    {player.nickname ||
                                                                        "No nickname set"}
                                                                </span>
                                                            )}
                                                            {player.isOwner ? (
                                                                <Badge
                                                                    size="xs"
                                                                    color="gold"
                                                                    variant="light"
                                                                >
                                                                    Owner
                                                                </Badge>
                                                            ) : null}
                                                            {removable ? (
                                                                <IconButton
                                                                    size="sm"
                                                                    label={`Remove ${player.nickname || "player"}`}
                                                                    icon={
                                                                        <IconUserMinus
                                                                            size={14}
                                                                            stroke={1.7}
                                                                        />
                                                                    }
                                                                    onClick={() =>
                                                                        setPendingRemoval({
                                                                            kind: "player",
                                                                            membershipId:
                                                                                player.membershipId!,
                                                                            nickname:
                                                                                player.nickname
                                                                        })
                                                                    }
                                                                />
                                                            ) : null}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </Panel>
                                    </div>
                                ) : null}
                            </div>
                        </section>
                    ) : null}

                    <section className={classes.block}>
                        <SectionHeader title="Dossiers" />
                        <CoterieCharacterSummaryGrid
                            members={coterie.members ?? []}
                            vitalsByCharacterId={vitalsByCharacterId}
                            onMemberContextMenu={onDossierContextMenu}
                            renderMemberActions={renderMemberActions}
                            highlightedCharacterId={highlightedCharacterId}
                            emptyState={
                                <Panel p={0}>
                                    <EmptyState
                                        icon={<IconUsersGroup size={26} stroke={1.5} />}
                                        title="No characters in this coterie yet"
                                        description="Add characters from your account page."
                                        actions={
                                            <Button component={Link} to="/me" variant="default">
                                                Go to account
                                            </Button>
                                        }
                                    />
                                </Panel>
                            }
                        />
                    </section>

                    {chatInline ? (
                        <section className={classes.block}>
                            <SectionHeader
                                title={
                                    <Group gap={8} component="span" wrap="nowrap">
                                        Coterie chat
                                        <IconMessages size={16} stroke={1.6} />
                                    </Group>
                                }
                            />
                            <div className={classes.chatInline}>
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
                            </div>
                        </section>
                    ) : null}
                </>
            )}

            {contextMenu.menu}

            <Modal
                opened={notesOpened}
                onClose={closeNotes}
                size={
                    desktopChatDocked
                        ? "min(80rem, calc(100vw - 540px))"
                        : "min(80rem, calc(100vw - 2rem))"
                }
                centered
                zIndex={notesModalZIndex}
                classNames={{
                    content: desktopChatDocked ? classes.notesModalDocked : undefined
                }}
                styles={{ title: { flex: 1, minWidth: 0 } }}
                title={
                    <span className={classes.notesTitle}>
                        <span className={classes.notesTitleText}>
                            <IconNotebook size={20} stroke={1.6} />
                            <span className={classes.notesTitleLabel}>Private notes</span>
                        </span>
                        <IconButton
                            label="Version history"
                            icon={<IconHistory size={18} stroke={1.6} />}
                            onClick={() => setHistoryOpened(true)}
                            disabledReason={
                                notesQuery.isError ? "Notes could not be loaded" : undefined
                            }
                        />
                    </span>
                }
            >
                <Stack gap="sm">
                    {notesQuery.isError ? (
                        <Alert
                            color="red"
                            icon={<IconAlertTriangle size={16} />}
                            title="Could not load your notes"
                        >
                            <Group justify="space-between" gap="sm">
                                <Text size="sm">
                                    {errorMessage(notesQuery.error, "Please try again.")}
                                </Text>
                                <Button
                                    size="xs"
                                    variant="light"
                                    color="red"
                                    leftSection={<IconRefresh size={14} />}
                                    loading={notesQuery.isFetching}
                                    onClick={() => void notesQuery.refetch()}
                                >
                                    Retry
                                </Button>
                            </Group>
                        </Alert>
                    ) : null}
                    {selectedHistoryVersion ? (
                        <div className={classes.historyBanner}>
                            <Group gap={8} wrap="nowrap">
                                <IconVersions size={16} />
                                Viewing {formatDateTime(selectedHistoryVersion.createdAt)}
                            </Group>
                            <Button
                                size="xs"
                                color="gray"
                                variant="subtle"
                                onClick={() => setSelectedHistoryVersion(null)}
                            >
                                Back to latest
                            </Button>
                        </div>
                    ) : null}
                    {notesQuery.isLoading ? (
                        <Skeleton height={420} radius="md" />
                    ) : (
                        <Textarea
                            data-autofocus
                            value={displayedNotes}
                            onChange={(event) => {
                                if (!isViewingHistory) {
                                    setDraftNotes(event.currentTarget.value)
                                }
                            }}
                            readOnly={isViewingHistory || notesQuery.isError}
                            minRows={18}
                            maxRows={24}
                            autosize
                            placeholder="Plans, clues, debts, boons, suspicions..."
                            error={noteBytes > noteMaxBytes}
                            aria-label="Private notes"
                            classNames={{ input: classes.notesInput }}
                        />
                    )}
                    <div className={classes.notesFooter}>
                        {selectedHistoryVersion ? (
                            <>
                                <Text size="xs" c="dimmed">
                                    Historical versions are read-only.
                                </Text>
                                <Button
                                    size="xs"
                                    color="gold"
                                    variant="light"
                                    leftSection={<IconVersions size={14} />}
                                    loading={restoreNotesMutation.isPending}
                                    onClick={restoreVersion}
                                >
                                    Restore this version
                                </Button>
                            </>
                        ) : (
                            <>
                                <span
                                    className={classes.notesMeter}
                                    data-over={noteBytes > noteMaxBytes || undefined}
                                >
                                    {Math.round(noteBytes / 1024)} KB / 200 KB
                                </span>
                                <Group gap="xs" wrap="nowrap">
                                    {saveStateLabel[saveStatus] ? (
                                        <span
                                            className={classes.saveState}
                                            data-state={saveStatus}
                                            role="status"
                                        >
                                            {saveStatus === "saved" ? (
                                                <IconCheck size={14} />
                                            ) : saveStatus === "error" ||
                                              saveStatus === "too-large" ? (
                                                <IconAlertTriangle size={14} />
                                            ) : null}
                                            {saveStateLabel[saveStatus]}
                                        </span>
                                    ) : null}
                                    {saveStatus === "error" ? (
                                        <Button
                                            size="compact-xs"
                                            variant="light"
                                            color="red"
                                            leftSection={<IconRefresh size={12} />}
                                            loading={saveNotesMutation.isPending}
                                            onClick={() => saveDraft("debounce")}
                                        >
                                            Retry
                                        </Button>
                                    ) : null}
                                </Group>
                            </>
                        )}
                    </div>
                </Stack>
            </Modal>

            <Modal
                opened={historyOpened}
                onClose={() => setHistoryOpened(false)}
                title="Version history"
                centered
                size="sm"
                zIndex={notesHistoryModalZIndex}
            >
                {versions.slice(1).length > 0 ? (
                    <div className={classes.versionList}>
                        {versions.slice(1).map((version) => (
                            <button
                                key={version.id}
                                type="button"
                                className={classes.versionButton}
                                onClick={() => previewVersion(version)}
                            >
                                <IconVersions size={16} stroke={1.6} />
                                {formatDateTime(version.createdAt)}
                                <span className={classes.versionMeta}>
                                    {formatPrivateNoteWordCount(version.content)}
                                </span>
                            </button>
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        compact
                        icon={<IconHistory size={22} stroke={1.5} />}
                        title="No past versions yet"
                    />
                )}
            </Modal>

            <ConfirmActionModal
                opened={!!pendingRemoval}
                onClose={() => setPendingRemoval(null)}
                onConfirm={confirmRemoval}
                title={pendingRemoval?.kind === "player" ? "Remove player?" : "Remove character?"}
                body={
                    pendingRemoval?.kind === "player" ? (
                        <>
                            Remove <strong>{pendingRemoval.nickname || "this player"}</strong> from{" "}
                            <strong>{coterie.name}</strong>? Their characters will also be removed
                            from the coterie.
                        </>
                    ) : (
                        <>
                            Remove <strong>{pendingRemoval?.characterName}</strong> from{" "}
                            <strong>{coterie.name}</strong>? The character itself is kept.
                        </>
                    )
                }
                confirmLabel="Remove"
                loading={removeCharacterMutation.isPending || removePlayerMutation.isPending}
                zIndex={notesModalZIndex}
            />

            <ConfirmActionModal
                opened={deleteOpened}
                onClose={() => setDeleteOpened(false)}
                onConfirm={confirmDeleteCoterie}
                title="Delete coterie?"
                body={
                    <>
                        <strong>{coterie.name}</strong> will be deleted for everyone in it. This
                        can&apos;t be undone.
                    </>
                }
                confirmLabel="Delete"
                loading={deleteCoterieMutation.isPending}
                zIndex={notesModalZIndex}
            />

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
