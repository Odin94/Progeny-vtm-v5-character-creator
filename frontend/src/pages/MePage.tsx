import { CHARACTER_CONFLICT_EVENT } from "~/components/CharacterConflictModal"
import { reportCharacterOperationFailure } from "~/utils/characterOperationAnalytics"
import { CharacterOperationError } from "~/utils/characterOperationError"
import { Button, Modal, Select, Stack, Tabs, Text } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import {
    IconArrowLeft,
    IconBook2,
    IconDroplet,
    IconFlask,
    IconKey,
    IconLogout,
    IconMessageCircle,
    IconUser,
    IconUsersGroup
} from "@tabler/icons-react"
import { useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"
import { z } from "zod"
import ChatWindow from "~/character_sheet/components/ChatWindow"
import ConfirmActionModal from "~/components/ConfirmActionModal"
import NameCharacterBeforeSwitchModal from "~/components/NameCharacterBeforeSwitchModal"
import SaveCharacterCopyModal, {
    type CharacterCopySource
} from "~/components/SaveCharacterCopyModal"
import SupportConversationButton from "~/components/SupportConversationButton"
import { loadCharacterFromFile } from "~/components/LoadModal"
import { EmptyState, PageHeader, Panel } from "~/components/ui"
import { RouteFallback } from "~/components/ui/RouteFallback"
import { Character as CharacterType, getEmptyCharacter } from "~/data/Character"
import { downloadJson, updateHealthAndWillpowerAndBloodPotencyAndHumanity } from "~/generator/utils"
import { useAuth } from "~/hooks/useAuth"
import { useCharacterLocalStorage } from "~/hooks/useCharacterLocalStorage"
import {
    isCharacterNotFound,
    recheckDeletedCharacterDraft
} from "~/components/DeletedCharacterDraftModal"
import {
    useCharacters,
    useCreateCharacter,
    useDeleteCharacter,
    useUpdateCharacter
} from "~/hooks/useCharacters"
import {
    useAcceptCoterieInvite,
    useAddCharacterToCoterie,
    useCoteries,
    useCoterieInvites,
    useCoterieMembership,
    useCoterieVitals,
    useCreateCoterie,
    useCreateCoterieInvite,
    useDeleteCoterie,
    useRemoveCharacterFromCoterie,
    useRemoveCoteriePlayer,
    useRevokeCoterieInvite,
    useUpdateCoterie
} from "~/hooks/useCoteries"
import { parseCharacterData } from "~/utils/characterData"
import { useUnshareCharacter } from "~/hooks/useShares"
import { useSessionChat } from "~/hooks/useSessionChat"
import {
    api,
    type CoterieInviteResponse,
    type CoteriePlayerResponse,
    type CoterieResponse
} from "~/utils/api"
import { characterHttp } from "~/utils/http/characters"
import type { CharacterApiResponse } from "~/utils/characterApi"
import { transitionCharacter } from "~/modules/characterTransition"
import { characterPersistence, isOwnedSavedCharacter } from "~/modules/characterPersistence"
import CharactersSection from "./sections/CharactersSection"
import CoteriesSection from "./sections/CoteriesSection"
import UserProfileSection from "./sections/UserProfileSection"
import { CharacterSummaryContent } from "./me/CharacterSummaryContent"
import { CoterieInvitesModal } from "./me/CoterieInvitesModal"
import { CoterieSummaryContent } from "./me/CoterieSummaryContent"
import { MeShell } from "./me/MeShell"
import { ModalFooter } from "./me/ModalFooter"
import { NameModal } from "./me/NameModal"
import { ShareCharacterModal } from "./me/ShareCharacterModal"
import { DEFAULT_ME_TAB, ME_TABS, parseMeTab, type MeTab } from "./me/meTabs"
import classes from "./me/me.module.css"
import { isCharacterVitals } from "~/utils/characterVitals"
import type { CharacterVitals } from "~/utils/characterVitals"
import { trackCharacterSwitchBlockedUnnamed, trackFeatureGuideOpened } from "~/utils/analytics"

const TAB_META: Record<MeTab, { label: string; icon: typeof IconDroplet }> = {
    characters: { label: "Characters", icon: IconDroplet },
    coteries: { label: "Coteries", icon: IconUsersGroup },
    profile: { label: "Profile", icon: IconUser }
}

type Character = {
    id: string
    name: string
    shared?: boolean
    ownedByCurrentUser?: boolean
    data?: unknown
}

type CoteriePlayer = CoteriePlayerResponse
type Coterie = CoterieResponse
type CoterieInvite = CoterieInviteResponse

const getLimitedLabel = (value: string | null | undefined, fallback: string, maxLength: number) => {
    const label = value?.trim() || fallback
    return label.length > maxLength ? `${label.slice(0, maxLength - 3).trimEnd()}...` : label
}

const getCharacterFirstNameLabel = (name: string | null | undefined) => {
    const firstName = name?.trim().split(/\s+/)[0]
    return getLimitedLabel(firstName, "Character", 24)
}

const getRemovedFromCoterieMessage = (
    characterName: string | null | undefined,
    coterieName: string | null | undefined
) => {
    const characterLabel = getCharacterFirstNameLabel(characterName)
    const coterieLabel = getLimitedLabel(coterieName, "selected coterie", 48)

    return `${characterLabel} removed from coterie ${coterieLabel}`
}

const parseStoredCharacter = (data: unknown): CharacterType => {
    const character = parseCharacterData(data)
    if (!character) throw new Error("Unable to load character data")
    return character
}

// TODOdin: Refactorings:
// * Turn mostly-samey confirm modals into one modal with some configs, in it's own file
// * Adapt our current use(sometanStackQueryThing) hooks to expose their state
// * Remove mutation onSuccess callbacks (deprecated) and use state managed inside of useMutation instead of doing it on your own
// * Clean up all the useStates we have in here, most of them can probably be managed with just query state
// * Move a bunch of the stuff we're currently passing into sections into the section components

type MePageProps = {
    /** Active sub-view. The route passes the `tab` search param; tests render without one. */
    tab?: MeTab
    onTabChange?: (tab: MeTab) => void
}

const MePage = ({ tab, onTabChange }: MePageProps = {}) => {
    const [localTab, setLocalTab] = useState<MeTab>(tab ?? DEFAULT_ME_TAB)
    const activeTab = onTabChange ? (tab ?? DEFAULT_ME_TAB) : localTab
    const changeTab = (next: MeTab) => (onTabChange ? onTabChange(next) : setLocalTab(next))
    const changeTabRef = useRef(changeTab)
    useEffect(() => {
        changeTabRef.current = changeTab
    })
    const {
        user,
        isLoading: authLoading,
        isAuthenticated,
        updateProfile,
        isUpdatingProfile,
        signIn,
        isSigningIn,
        signOut
    } = useAuth()
    const {
        data: characters,
        isPending: charactersLoading,
        isError: charactersLoadError,
        refetch: reloadCharacters
    } = useCharacters(isAuthenticated)
    const {
        data: coteries,
        isPending: coteriesPending,
        isError: coteriesLoadError,
        refetch: reloadCoteries
    } = useCoteries(isAuthenticated)
    const coteriesLoading = !!coteriesPending && !coteries
    const { data: coterieVitals } = useCoterieVitals(isAuthenticated)
    const vitalsByCharacterId = useMemo(() => {
        const vitalsMap: Record<string, CharacterVitals> = {}

        ;(coterieVitals || []).forEach((vitals) => {
            if (isCharacterVitals(vitals)) {
                vitalsMap[vitals.characterId] = vitals
            }
        })

        return vitalsMap
    }, [coterieVitals])
    const queryClient = useQueryClient()
    const [character, setCharacter, clearCharacter] = useCharacterLocalStorage()
    const persistence = characterPersistence(queryClient)
    const isTransitioningCharacter = useSyncExternalStore(
        persistence.subscribeTransitions,
        persistence.transitionSnapshot,
        persistence.transitionSnapshot
    )
    const { connect: connectChat, joinSession: joinChatSession } = useSessionChat((state) => ({
        connect: state.connect,
        joinSession: state.joinSession
    }))

    // Character CRUD
    // TODOdin: Load character after creation; but don't use onSuccess, but instead use query state (onSuccess is deprecated)
    const createCharacterMutation = useCreateCharacter()
    const updateCharacterMutation = useUpdateCharacter()
    const deleteCharacterMutation = useDeleteCharacter()

    // Coterie CRUD
    const createCoterieMutation = useCreateCoterie()
    const updateCoterieMutation = useUpdateCoterie()
    const deleteCoterieMutation = useDeleteCoterie()
    const addCharacterToCoterieMutation = useAddCharacterToCoterie()
    const removeCharacterFromCoterieMutation = useRemoveCharacterFromCoterie()
    const createCoterieInviteMutation = useCreateCoterieInvite()
    const revokeCoterieInviteMutation = useRevokeCoterieInvite()
    const acceptCoterieInviteMutation = useAcceptCoterieInvite()
    const removeCoteriePlayerMutation = useRemoveCoteriePlayer()

    // Shares
    const unshareCharacterMutation = useUnshareCharacter()

    // Modals
    const [copySource, setCopySource] = useState<CharacterCopySource | null>(null)
    const [createCharacterModalOpened, setCreateCharacterModalOpened] = useState(false)
    const [createCoterieModalOpened, setCreateCoterieModalOpened] = useState(false)
    const [editCoterieModalOpened, setEditCoterieModalOpened] = useState(false)
    const [addCharacterToCoterieModalOpened, setAddCharacterToCoterieModalOpened] = useState(false)
    const [coterieInvitesModalOpened, setCoterieInvitesModalOpened] = useState(false)
    const [removeCharacterFromCoterieModalOpened, setRemoveCharacterFromCoterieModalOpened] =
        useState(false)
    const [removeCoteriePlayerModalOpened, setRemoveCoteriePlayerModalOpened] = useState(false)
    const [revokeInviteModalOpened, setRevokeInviteModalOpened] = useState(false)
    const [deleteCharacterModalOpened, setDeleteCharacterModalOpened] = useState(false)
    const [deleteCoterieModalOpened, setDeleteCoterieModalOpened] = useState(false)
    const [loadSameCharacterWarningModalOpened, setLoadSameCharacterWarningModalOpened] =
        useState(false)
    const [loadJsonModalOpened, setLoadJsonModalOpened] = useState(false)
    const [loadedFile, setLoadedFile] = useState<File | null>(null)
    const [loadingCharacterId, setLoadingCharacterId] = useState<string | null>(null)
    const [versionConflictModalOpened, setVersionConflictModalOpened] = useState(false)
    const [characterToDelete, setCharacterToDelete] = useState<{
        id: string
        name: string
    } | null>(null)
    const [coterieToDelete, setCoterieToDelete] = useState<{
        id: string
        name: string
    } | null>(null)
    const [characterToLoad, setCharacterToLoad] = useState<{
        id: string
        name: string
        data: CharacterType
    } | null>(null)
    // Set when saving before a switch hit a version conflict: overwriting continues the switch.
    const [switchConflictTarget, setSwitchConflictTarget] = useState<{
        id: string
        name: string
        data: CharacterType
    } | null>(null)
    const [pendingSwitchTarget, setPendingSwitchTarget] = useState<{
        id: string
        name: string
        data: CharacterType
    } | null>(null)
    const [switchNameValue, setSwitchNameValue] = useState("")
    const [isSavingBeforeSwitch, setIsSavingBeforeSwitch] = useState(false)
    const [newCharacterName, setNewCharacterName] = useState("")
    const [shareCharacterModalOpened, setShareCharacterModalOpened] = useState(false)
    const [characterToShare, setCharacterToShare] = useState<{
        id: string
        name: string
    } | null>(null)
    const [shareNickname, setShareNickname] = useState("")
    const [isSharing, setIsSharing] = useState(false)
    const [newCoterieName, setNewCoterieName] = useState("")
    const [editingCoterie, setEditingCoterie] = useState<Coterie | null>(null)
    const [selectedCoterieForAdd, setSelectedCoterieForAdd] = useState<Coterie | null>(null)
    const [selectedCharacterForCoterie, setSelectedCharacterForCoterie] = useState<string>("")
    const [coterieForInvites, setCoterieForInvites] = useState<Coterie | null>(null)
    const membership = useCoterieMembership(coterieForInvites?.id || null)
    const generatedInviteUrl = membership.generatedInviteUrl
    const setGeneratedInviteUrl = (_empty: string) => {
        if (coterieForInvites) membership.forgetInvite(coterieForInvites.id)
    }
    const [inviteToRevoke, setInviteToRevoke] = useState<CoterieInvite | null>(null)
    const [characterToRemoveFromCoterie, setCharacterToRemoveFromCoterie] = useState<{
        coterieId: string
        characterId: string
        characterName?: string | null
        coterieName?: string | null
    } | null>(null)
    const [playerToRemoveFromCoterie, setPlayerToRemoveFromCoterie] = useState<{
        coterie: Coterie
        player: CoteriePlayer
    } | null>(null)
    const [summaryModalOpened, setSummaryModalOpened] = useState(false)
    const [characterForSummary, setCharacterForSummary] = useState<Character | null>(null)
    const [coterieSummaryModalOpened, setCoterieSummaryModalOpened] = useState(false)
    const [coterieForSummary, setCoterieForSummary] = useState<Coterie | null>(null)
    const [chatOpenSignal, setChatOpenSignal] = useState(0)
    const [activeChatCoterieName, setActiveChatCoterieName] = useState<string | null>(null)
    const [activeChatCoterieId, setActiveChatCoterieId] = useState<string | null>(null)
    const { data: coterieInvites } = useCoterieInvites(
        coterieInvitesModalOpened ? coterieForInvites?.id || null : null
    )

    // Nickname editing
    const [isEditingNickname, setIsEditingNickname] = useState(false)

    useEffect(() => {
        const inviteToken = new URLSearchParams(window.location.search).get("coterieInvite")

        if (!inviteToken || authLoading) {
            return
        }

        if (!isAuthenticated) {
            signIn()
            return
        }

        if (!membership.claimInvite(inviteToken)) return

        acceptCoterieInviteMutation.mutate(inviteToken, {
            onSuccess: () => {
                // The account page is tabbed now; show the coterie that was just joined.
                changeTabRef.current("coteries")
                notifications.show({
                    title: "Coterie joined",
                    message: "You can now add your characters to this coterie.",
                    color: "green"
                })
            },
            onError: (error) => {
                notifications.show({
                    title: "Invite not accepted",
                    message:
                        error instanceof Error
                            ? error.message
                            : "This invite link is invalid or expired.",
                    color: "red"
                })
            }
        })
    }, [acceptCoterieInviteMutation, authLoading, isAuthenticated, signIn])

    const handleSaveNickname = (nicknameValue: string) => {
        updateProfile(
            { nickname: nicknameValue.trim() || null },
            {
                onSuccess: () => {
                    setIsEditingNickname(false)
                    notifications.show({
                        title: "Success",
                        message: "Nickname updated",
                        color: "green"
                    })
                },
                onError: (error) => {
                    const errorMessage =
                        error instanceof Error
                            ? error.message
                            : typeof error === "string"
                              ? error
                              : "Failed to update nickname"
                    notifications.show({
                        title: "Error",
                        message: errorMessage,
                        color: "red"
                    })
                }
            }
        )
    }

    const handleCancelNickname = () => {
        setIsEditingNickname(false)
    }

    const handleNameTagToggle = (nameTagVisible: boolean) => {
        updateProfile(
            { nameTagVisible },
            {
                onSuccess: () => {
                    notifications.show({
                        title: nameTagVisible ? "Name tag enabled" : "Name tag hidden",
                        message: nameTagVisible
                            ? "Other players will see your highlighted name tag."
                            : "Your name will use the standard display.",
                        color: nameTagVisible ? "grape" : "gray"
                    })
                },
                onError: (error) => {
                    notifications.show({
                        title: "Could not update name tag",
                        message: error instanceof Error ? error.message : "Please try again.",
                        color: "red"
                    })
                }
            }
        )
    }

    const requireLoadedCharacters = () => {
        if (characters === undefined || charactersLoadError) {
            reportCharacterOperationFailure("save", undefined, { reason: "characters_unavailable" })
            notifications.show({
                title: "Characters unavailable",
                message:
                    "Reload your saved characters before saving. Your current draft is still in this browser.",
                color: "red"
            })
            return false
        }
        return true
    }

    const handleCreateEmptyCharacter = () => {
        if (!requireLoadedCharacters()) return
        if (!newCharacterName.trim()) {
            reportCharacterOperationFailure("create", undefined, { reason: "name_required" })
            notifications.show({
                title: "Error",
                message: "Character name is required",
                color: "red"
            })
            return
        }

        const emptyChar = getEmptyCharacter()
        emptyChar.name = newCharacterName.trim()

        createCharacterMutation.mutate(
            {
                name: emptyChar.name,
                data: emptyChar,
                version: emptyChar.version,
                newDocument: true
            },
            {
                onSuccess: () => {
                    notifications.show({
                        title: "Success",
                        message: `Character "${emptyChar.name}" created`,
                        color: "green"
                    })
                    setCreateCharacterModalOpened(false)
                    setNewCharacterName("")
                },
                onError: (error) => {
                    reportCharacterOperationFailure("create", error, { characterId: character.id })
                    notifications.show({
                        title: "Error",
                        message:
                            error instanceof Error ? error.message : "Failed to create character",
                        color: "red"
                    })
                }
            }
        )
    }

    const handleSaveCurrentCharacter = async () => {
        const isCurrent = persistence.replacementGuard()
        let source = characters?.find((candidate) => candidate.id === character.id)
        if (character.id && !source) {
            try {
                const saved = await characterHttp.get(character.id)
                source = { ...saved, shared: saved.canEdit !== true }
            } catch (error) {
                reportCharacterOperationFailure("save", error, {
                    severity: "warning",
                    characterId: character.id
                })
                // Keep the local draft available for an explicitly confirmed copy.
            }
        }
        if (!isCurrent()) return
        if (character.id && (!source || source.shared)) {
            setCopySource({
                character: structuredClone(character),
                ownerId: source?.ownerId,
                sharedBy: source?.sharedBy,
                classification: source?.shared ? "shared" : "unknown",
                viewerId: user?.id
            })
            return
        }
        if (!source && !requireLoadedCharacters()) return
        if (!character.name.trim()) {
            reportCharacterOperationFailure("save", undefined, { reason: "name_required" })
            notifications.show({
                title: "Error",
                message: "Character must have a name",
                color: "red"
            })
            return
        }

        // Find character by ID if available
        const targetCharacter = source

        if (targetCharacter && !targetCharacter.shared) {
            // Fetch current character from backend to check version
            try {
                const response = await characterHttp.get(targetCharacter.id)
                if (!isCurrent()) return
                const beCharacter = parseStoredCharacter((response as any).data)
                const feVersion = character.characterVersion ?? 0

                if (beCharacter.characterVersion > feVersion) {
                    reportCharacterOperationFailure("save", undefined, {
                        severity: "warning",
                        reason: "version_conflict",
                        resolution: "modal",
                        characterId: character.id
                    })
                    // Show version conflict modal
                    setVersionConflictModalOpened(true)
                    return
                }
            } catch (error) {
                // If fetch fails, continue with save (character might not exist or network error)
                console.warn("Failed to fetch character for version check:", error)
            }

            if (!isCurrent()) return
            // Update existing character
            updateCharacterMutation.mutate(
                {
                    id: targetCharacter.id,
                    data: {
                        name: character.name,
                        data: character,
                        characterVersion: character.characterVersion ?? 0,
                        version: character.version
                    }
                },
                {
                    onSuccess: (savedCharacter) => {
                        if (!isCurrent()) return
                        // Update character in memory with the ID and characterVersion from backend
                        const saved = savedCharacter as {
                            id: string
                            name: string
                            data: unknown
                            version?: number
                            characterVersion?: number
                        }
                        const savedData = saved.data as { characterVersion?: number } | undefined
                        setCharacter((current) =>
                            isCurrent() && current.id === character.id
                                ? {
                                      ...current,
                                      id: saved.id,
                                      characterVersion:
                                          saved.characterVersion ?? savedData?.characterVersion ?? 0
                                  }
                                : current
                        )
                        notifications.show({
                            title: "Success",
                            message: `Character "${character.name}" saved`,
                            color: "green"
                        })
                    },
                    onError: (error) => {
                        const canResolveConflict =
                            isCurrent() && (error as { status?: number })?.status === 409
                        reportCharacterOperationFailure("save", error, {
                            characterId: character.id,
                            ...(canResolveConflict ? { resolution: "modal" as const } : {})
                        })
                        if (canResolveConflict) {
                            setVersionConflictModalOpened(true)
                            return
                        }
                        notifications.show({
                            title: "Error",
                            message:
                                error instanceof Error ? error.message : "Failed to save character",
                            color: "red"
                        })
                    }
                }
            )
        } else {
            // Create new character
            createCharacterMutation.mutate(
                {
                    name: character.name,
                    data: character,
                    version: character.version
                },
                {
                    onSuccess: (savedCharacter) => {
                        if (!isCurrent()) return
                        // Update character in memory with the ID and characterVersion from backend
                        const saved = savedCharacter as {
                            id: string
                            name: string
                            data: unknown
                            version?: number
                            characterVersion?: number
                        }
                        const savedData = saved.data as { characterVersion?: number } | undefined
                        setCharacter((current) =>
                            isCurrent() && current.id === character.id
                                ? {
                                      ...current,
                                      id: saved.id,
                                      characterVersion:
                                          saved.characterVersion ?? savedData?.characterVersion ?? 0
                                  }
                                : current
                        )
                        notifications.show({
                            title: "Success",
                            message: `Character "${character.name}" saved`,
                            color: "green"
                        })
                    },
                    onError: (error) => {
                        reportCharacterOperationFailure("save", error, {
                            characterId: character.id
                        })
                        notifications.show({
                            title: "Error",
                            message:
                                error instanceof Error ? error.message : "Failed to save character",
                            color: "red"
                        })
                    }
                }
            )
        }
    }

    useEffect(() => {
        if (!versionConflictModalOpened) return
        window.dispatchEvent(
            new CustomEvent(CHARACTER_CONFLICT_EVENT, {
                detail: {
                    characterId: character.id,
                    onClose: () => {
                        setVersionConflictModalOpened(false)
                        setCharacterToLoad(null)
                        setSwitchConflictTarget(null)
                    },
                    onResolved: (resolved: CharacterType) => {
                        setCharacter(resolved)
                        if (switchConflictTarget)
                            void transitionCharacter(queryClient, (isCurrentLoad) =>
                                performLoadCharacter(switchConflictTarget, isCurrentLoad)
                            )
                    }
                }
            })
        )
    }, [versionConflictModalOpened, character.id, switchConflictTarget, queryClient])

    const isSavingCharacter = createCharacterMutation.isPending || updateCharacterMutation.isPending
    const isLoadingCharacter = loadingCharacterId !== null
    const isAnyOperationInFlight =
        isSavingCharacter || isLoadingCharacter || isTransitioningCharacter

    const handleDeleteCharacter = (characterId: string, characterName: string) => {
        setCharacterToDelete({ id: characterId, name: characterName })
        setDeleteCharacterModalOpened(true)
    }

    const performLoadCharacter = async (
        char: {
            id: string
            name: string
            data: CharacterType
        },
        isCurrent = persistence.replacementGuard()
    ) => {
        setLoadingCharacterId(char.id)
        await characterPersistence(queryClient).settle(character.id)
        if (!isCurrent()) {
            setLoadingCharacterId(null)
            return
        }

        try {
            const response = await characterHttp.get(char.id)
            if (!isCurrent()) return

            // Global autosave reads the list cache. Publish the same fresh record
            // before replacing the draft so it cannot reconcile against stale data.
            // Single-record GET omits sharing metadata supplied by the list endpoint.
            const cached = queryClient
                .getQueryData<CharacterApiResponse[]>(["characters"])
                ?.find((entry) => entry.id === response.id)
            const loaded = {
                ...cached,
                ...response,
                shared: response.shared ?? response.canEdit === false
            }
            queryClient.setQueryData<CharacterApiResponse[]>(["characters"], (previous) =>
                previous?.map((entry) => (entry.id === response.id ? loaded : entry))
            )
            queryClient.setQueryData(["characters", response.id], loaded)

            // The list is a snapshot. Install the freshly validated cloud record,
            // including its authoritative revision, rather than that cached snapshot.
            characterPersistence(queryClient).startDraft()
            setCharacter({
                ...response.data,
                id: response.id,
                name: response.name,
                characterVersion: response.characterVersion
            })
            notifications.show({
                title: "Success",
                message: `Loaded "${response.name}"`,
                color: "green"
            })
        } catch (error) {
            if (!isCurrent()) return
            reportCharacterOperationFailure("load", error, { characterId: char.id })
            notifications.show({
                title: "Unable to load character",
                message: `Couldn't load "${char.name}". Your current character is still open. Please try again.`,
                color: "red"
            })
        } finally {
            setLoadingCharacterId(null)
        }
    }

    const handleLoadCharacter = (char: Character) =>
        transitionCharacter(queryClient, async (isCurrent) => {
            const charData = char.data as CharacterType | undefined
            if (!charData) return
            const switchDecision = characterPersistence(queryClient).decision(
                character,
                charactersLoadError ? undefined : characters,
                char.id
            )

            // Check if we're loading the same character as the current one
            const isSameCharacter = char.id === character.id && char.id

            // If loading the same character, check for unsaved changes
            if (isSameCharacter) {
                try {
                    // Fetch current character from backend to compare
                    const response = await characterHttp.get(char.id)
                    if (!isCurrent()) return
                    const beCharacter = parseStoredCharacter((response as any).data)

                    // Compare current character with backend version to detect unsaved changes
                    // Simple comparison: check if characterVersion matches and do a basic equality check
                    const feVersion = character.characterVersion ?? 0
                    const beVersion = beCharacter.characterVersion ?? 0

                    // If versions differ or if we can't easily compare, assume there might be changes
                    // We'll show the warning to be safe
                    const hasUnsavedChanges =
                        feVersion !== beVersion ||
                        JSON.stringify(character) !== JSON.stringify(beCharacter)

                    if (hasUnsavedChanges) {
                        // Show warning modal for unsaved changes
                        setCharacterToLoad({ id: char.id, name: char.name, data: charData })
                        setLoadSameCharacterWarningModalOpened(true)
                        return
                    }
                } catch (error) {
                    // If fetch fails, assume there might be changes and show warning
                    console.warn("Failed to fetch character for unsaved changes check:", error)
                    setCharacterToLoad({ id: char.id, name: char.name, data: charData })
                    setLoadSameCharacterWarningModalOpened(true)
                    return
                }
            }

            const currentCharacter = character.id
                ? userCharacters.find((candidate) => candidate.id === character.id)
                : undefined

            // Shared characters are read-only, so switching away from one must discard its local
            // state rather than trying to save it. Owned and unsaved characters are saved first.
            if (switchDecision !== "continue") {
                // An unnamed draft with changes cannot be saved. Open a recoverable prompt so the
                // user can name it or discard it, instead of blocking the load.
                if (switchDecision === "name") {
                    trackCharacterSwitchBlockedUnnamed()
                    setSwitchNameValue(character.name)
                    setPendingSwitchTarget({ id: char.id, name: char.name, data: charData })
                    return
                }

                try {
                    await saveCharacterBeforeSwitch(character, currentCharacter, isCurrent)
                } catch (error) {
                    if (
                        error instanceof CharacterOperationError &&
                        error.reason === "version_conflict" &&
                        error.versions
                    ) {
                        const { local, remote } = error.versions
                        reportCharacterOperationFailure("save-before-load", error, {
                            severity: "warning",
                            characterId: character.id,
                            resolution: "modal",
                            localVersion: local,
                            remoteVersion: remote
                        })
                        setSwitchConflictTarget({ id: char.id, name: char.name, data: charData })
                        setVersionConflictModalOpened(true)
                        return
                    }
                    reportCharacterOperationFailure("save-before-load", error, {
                        severity: isCharacterNotFound(error) ? "warning" : undefined,
                        characterId: character.id
                    })
                    console.warn("Failed to save current character before loading:", error)
                    // The saved character is gone, so let the deleted-draft dialog take over.
                    if (isCharacterNotFound(error)) {
                        void recheckDeletedCharacterDraft(queryClient)
                        return
                    }
                    const reason = error instanceof Error ? error.message : "Unknown save error"
                    notifications.show({
                        title: "Unable to load character",
                        message: `Couldn't load "${char.name}" because saving the current character failed: ${reason}`,
                        color: "red"
                    })
                    return
                }
            }

            // Load the character (using helper function)
            await performLoadCharacter(
                {
                    id: char.id,
                    name: char.name,
                    data: charData
                },
                isCurrent
            )
        })
    const saveCharacterBeforeSwitch = async (
        characterToSave: CharacterType,
        _currentCharacter?: Character,
        isCurrent = persistence.replacementGuard()
    ) => {
        const saved = await characterPersistence(queryClient).save(characterToSave, {
            owned: isOwnedSavedCharacter(characterToSave.id, characters),
            ownershipLoaded: characters !== undefined && !charactersLoadError,
            beforeSwitch: true
        })
        if (!isCurrent()) return
        setCharacter((current) =>
            current.id === characterToSave.id
                ? {
                      ...current,
                      id: saved.id,
                      name: current.name === character.name ? characterToSave.name : current.name,
                      characterVersion: saved.characterVersion
                  }
                : current
        )
    }

    const closePendingSwitch = () => {
        setPendingSwitchTarget(null)
        setSwitchNameValue("")
        setIsSavingBeforeSwitch(false)
    }

    const handleSaveAndContinueSwitch = () =>
        transitionCharacter(queryClient, async (isCurrent) => {
            if (!pendingSwitchTarget) return

            if (!switchNameValue.trim()) {
                reportCharacterOperationFailure("save-before-load", undefined, {
                    reason: "name_required"
                })
                notifications.show({
                    title: "Name required",
                    message: "Enter a character name before saving and switching.",
                    color: "red"
                })
                return
            }

            setIsSavingBeforeSwitch(true)

            try {
                const namedCharacter = { ...character, name: switchNameValue.trim() }
                const currentCharacter = character.id
                    ? userCharacters.find((candidate) => candidate.id === character.id)
                    : undefined
                await saveCharacterBeforeSwitch(namedCharacter, currentCharacter, isCurrent)
                if (!isCurrent()) return

                const target = pendingSwitchTarget
                closePendingSwitch()
                await performLoadCharacter(target, isCurrent)
            } catch (error) {
                reportCharacterOperationFailure("save-before-load", error, {
                    characterId: character.id
                })
                const reason = error instanceof Error ? error.message : "Unknown save error"
                notifications.show({
                    title: "Error saving character",
                    message: reason,
                    color: "red"
                })
                setIsSavingBeforeSwitch(false)
            }
        })

    const handleDiscardAndContinueSwitch = () =>
        transitionCharacter(queryClient, async (isCurrent) => {
            if (!pendingSwitchTarget) return

            const target = pendingSwitchTarget
            await characterPersistence(queryClient).settle(character.id)
            if (!isCurrent()) return
            closePendingSwitch()
            await performLoadCharacter(target, isCurrent)
        })

    const handleConfirmLoadSameCharacter = () => {
        if (!characterToLoad) return

        const target = characterToLoad
        void transitionCharacter(queryClient, async (isCurrent) => {
            setLoadSameCharacterWarningModalOpened(false)
            setCharacterToLoad(null)
            await performLoadCharacter(target, isCurrent)
        })
    }

    const handleLoadFromFile = async (file: File | null) => {
        console.log("handleLoadFromFile called with:", file)
        if (!file) {
            console.log("No file provided")
            return
        }
        console.log("Setting loadedFile and opening modal")
        setLoadedFile(file)
        setLoadJsonModalOpened(true)
    }

    const handleConfirmLoadJson = async () => {
        const isCurrent = persistence.replacementGuard()
        if (!requireLoadedCharacters()) return
        console.log("handleConfirmLoadJson", loadedFile)
        if (!loadedFile) {
            reportCharacterOperationFailure("import", undefined, { reason: "file_required" })
            notifications.show({
                title: "Error",
                message: "No file selected",
                color: "red"
            })
            return
        }

        // Save current character first if it exists in the database
        if (character.id && character.name.trim()) {
            const currentCharacterExists = userCharacters.find((c) => c.id === character.id)
            if (currentCharacterExists && !currentCharacterExists.shared) {
                try {
                    // Check version before saving
                    const response = await characterHttp.get(character.id)
                    if (!isCurrent()) return
                    const beCharacter = parseStoredCharacter((response as any).data)
                    const feVersion = character.characterVersion ?? 0

                    if (beCharacter.characterVersion > feVersion) {
                        reportCharacterOperationFailure("save-before-import", undefined, {
                            severity: "warning",
                            reason: "version_conflict",
                            characterId: character.id
                        })
                        // Version conflict - warn but continue with JSON load
                        notifications.show({
                            title: "Version Conflict",
                            message: `Current character "${character.name}" has a newer version in database. Saving skipped. You can manually save after loading if needed.`,
                            color: "yellow",
                            autoClose: 5000
                        })
                        // Continue with JSON load without saving
                    } else {
                        // Save current character
                        await new Promise<void>((resolve, reject) => {
                            updateCharacterMutation.mutate(
                                {
                                    id: character.id,
                                    data: {
                                        name: character.name,
                                        data: character,
                                        characterVersion: character.characterVersion ?? 0,
                                        version: character.version
                                    }
                                },
                                {
                                    onSuccess: (savedCharacter) => {
                                        const saved = savedCharacter as {
                                            id: string
                                            name: string
                                            data: unknown
                                            version?: number
                                            characterVersion?: number
                                        }
                                        const savedData = saved.data as
                                            | { characterVersion?: number }
                                            | undefined
                                        setCharacter((current) =>
                                            isCurrent() && current.id === character.id
                                                ? {
                                                      ...current,
                                                      id: saved.id,
                                                      characterVersion:
                                                          saved.characterVersion ??
                                                          savedData?.characterVersion ??
                                                          0
                                                  }
                                                : current
                                        )
                                        resolve()
                                    },
                                    onError: (error) => {
                                        reject(error)
                                    }
                                }
                            )
                        })
                    }
                } catch (error) {
                    reportCharacterOperationFailure("save-before-import", error, {
                        severity: "warning",
                        characterId: character.id
                    })
                    console.warn("Failed to save current character before loading JSON:", error)
                    notifications.show({
                        title: "Warning",
                        message: "Failed to save current character. Loading JSON character anyway.",
                        color: "yellow"
                    })
                }
            }
        }

        try {
            if (!isCurrent()) return
            const loadedCharacter = await loadCharacterFromFile(loadedFile)
            if (!isCurrent()) return
            console.log("Loaded character from JSON:", loadedCharacter)

            // Set id to empty string since this is a new character from JSON
            const characterToSet = persistence.replaceDraft(loadedCharacter)

            setCharacter(characterToSet)
            console.log("Character set in state")

            setLoadJsonModalOpened(false)
            setLoadedFile(null)

            notifications.show({
                title: "Character loaded",
                message: `Successfully loaded ${loadedCharacter.name}`,
                color: "green",
                autoClose: 3000
            })
            console.log("Notification shown")
        } catch (e) {
            reportCharacterOperationFailure("import", e)
            console.error("Error loading JSON:", e)
            if (e instanceof z.ZodError) {
                notifications.show({
                    title: "JSON content error loading character",
                    message: z.prettifyError(e),
                    color: "red",
                    autoClose: false
                })
            } else {
                const errorMessage = e instanceof Error ? e.message : String(e)
                notifications.show({
                    title: "Error loading character",
                    message: errorMessage,
                    color: "red",
                    autoClose: false
                })
            }
            // Don't close modal on error so user can try again
        }
    }

    const handleSaveJson = (char: Character) => {
        const charData = char.data as CharacterType | undefined
        if (!charData) return

        updateHealthAndWillpowerAndBloodPotencyAndHumanity(charData)
        downloadJson(charData, undefined, "account").catch((e) => {
            console.error(e)
            notifications.show({
                title: "Error",
                message: "Failed to download JSON",
                color: "red"
            })
        })
    }

    const handleShowSummary = (char: Character) => {
        setCharacterForSummary(char)
        setSummaryModalOpened(true)
    }

    const handleDownloadPdf = (char: Character) => {
        const charData = char.data as CharacterType | undefined
        if (!charData) return

        import("~/generator/pdfCreator")
            .then(({ downloadCharacterSheet }) => downloadCharacterSheet(charData, "account"))
            .catch((e) => {
                console.error(e)
                notifications.show({
                    title: "Error",
                    message: "Failed to download PDF",
                    color: "red"
                })
            })
    }

    const handleUnshareCharacter = (char: Character) => {
        if (!user?.id) return

        // For shared characters, use the current user's ID to unshare
        // The backend will check if the user is either the owner or the person shared with
        unshareCharacterMutation.mutate(
            {
                characterId: char.id,
                userId: user.id
            },
            {
                onSuccess: () => {
                    notifications.show({
                        title: "Success",
                        message: "Character unshared",
                        color: "green"
                    })
                },
                onError: (error: unknown) => {
                    notifications.show({
                        title: "Error",
                        message:
                            error instanceof Error ? error.message : "Failed to unshare character",
                        color: "red"
                    })
                }
            }
        )
    }

    const handleShareCharacter = (char: Character) => {
        setCharacterToShare({ id: char.id, name: char.name })
        setShareNickname("")
        setShareCharacterModalOpened(true)
    }

    const handleConfirmShare = async () => {
        if (!characterToShare || !shareNickname.trim()) {
            notifications.show({
                title: "Error",
                message: "Please enter a nickname",
                color: "red"
            })
            return
        }

        setIsSharing(true)
        try {
            await api.shareCharacter(characterToShare.id, {
                sharedWithUserNickname: shareNickname.trim()
            })
            queryClient.invalidateQueries({
                queryKey: ["shares", characterToShare.id]
            })
            notifications.show({
                title: "Success",
                message: `Character shared with ${shareNickname}`,
                color: "green"
            })
            setShareNickname("")
        } catch (error) {
            notifications.show({
                title: "Error",
                message: error instanceof Error ? error.message : "Failed to share character",
                color: "red"
            })
        } finally {
            setIsSharing(false)
        }
    }

    const handleConfirmDeleteCharacter = () => {
        if (!characterToDelete) return
        const deletedId = characterToDelete.id
        const deletionSession = characterPersistence(queryClient)

        deleteCharacterMutation.mutate(deletedId, {
            onSuccess: () => {
                if (!deletionSession.isCurrentSession()) return
                try {
                    if (clearCharacter((current) => current.id === deletedId))
                        deletionSession.startDraft()
                } catch {
                    void recheckDeletedCharacterDraft(queryClient)
                }
                notifications.show({
                    title: "Success",
                    message: `Character "${characterToDelete.name}" deleted`,
                    color: "green"
                })
                setDeleteCharacterModalOpened(false)
                setCharacterToDelete(null)
            },
            onError: (error) => {
                notifications.show({
                    title: "Error",
                    message: error instanceof Error ? error.message : "Failed to delete character",
                    color: "red"
                })
            }
        })
    }

    const handleCreateCoterie = () => {
        if (!newCoterieName.trim()) {
            notifications.show({
                title: "Error",
                message: "Coterie name is required",
                color: "red"
            })
            return
        }

        createCoterieMutation.mutate(
            { name: newCoterieName.trim() },
            {
                onSuccess: () => {
                    notifications.show({
                        title: "Success",
                        message: `Coterie "${newCoterieName}" created`,
                        color: "green"
                    })
                    setCreateCoterieModalOpened(false)
                    setNewCoterieName("")
                },
                onError: (error) => {
                    notifications.show({
                        title: "Error",
                        message:
                            error instanceof Error ? error.message : "Failed to create coterie",
                        color: "red"
                    })
                }
            }
        )
    }

    const handleEditCoterie = (coterie: Coterie) => {
        setEditingCoterie(coterie)
        setNewCoterieName(coterie.name)
        setEditCoterieModalOpened(true)
    }

    const handleUpdateCoterie = () => {
        if (!editingCoterie || !newCoterieName.trim()) {
            return
        }

        updateCoterieMutation.mutate(
            {
                id: editingCoterie.id,
                data: { name: newCoterieName.trim() }
            },
            {
                onSuccess: () => {
                    notifications.show({
                        title: "Success",
                        message: `Coterie updated`,
                        color: "green"
                    })
                    setEditCoterieModalOpened(false)
                    setEditingCoterie(null)
                    setNewCoterieName("")
                },
                onError: (error) => {
                    notifications.show({
                        title: "Error",
                        message:
                            error instanceof Error ? error.message : "Failed to update coterie",
                        color: "red"
                    })
                }
            }
        )
    }

    const handleDeleteCoterie = (coterieId: string, coterieName: string) => {
        setCoterieToDelete({ id: coterieId, name: coterieName })
        setDeleteCoterieModalOpened(true)
    }

    const handleConfirmDeleteCoterie = () => {
        if (!coterieToDelete) return

        deleteCoterieMutation.mutate(coterieToDelete.id, {
            onSuccess: () => {
                notifications.show({
                    title: "Success",
                    message: `Coterie "${coterieToDelete.name}" deleted`,
                    color: "green"
                })
                setDeleteCoterieModalOpened(false)
                setCoterieToDelete(null)
            },
            onError: (error) => {
                notifications.show({
                    title: "Error",
                    message: error instanceof Error ? error.message : "Failed to delete coterie",
                    color: "red"
                })
            }
        })
    }

    const handleAddCharacterToCoterie = (coterie: Coterie) => {
        setSelectedCoterieForAdd(coterie)
        setAddCharacterToCoterieModalOpened(true)
    }

    const handleManageCoterieInvites = (coterie: Coterie) => {
        setCoterieForInvites(coterie)
        setGeneratedInviteUrl("")
        setCoterieInvitesModalOpened(true)
    }

    const handleJoinCoterieChat = (coterie: Coterie) => {
        const characterName = character.name.trim() || undefined

        setActiveChatCoterieName(coterie.name)
        setActiveChatCoterieId(coterie.id)
        setChatOpenSignal((value) => value + 1)
        connectChat()
        joinChatSession({ coterieId: coterie.id, characterName })
    }

    const handleConfirmAddCharacterToCoterie = () => {
        if (!selectedCoterieForAdd || !selectedCharacterForCoterie) {
            return
        }

        addCharacterToCoterieMutation.mutate(
            {
                coterieId: selectedCoterieForAdd.id,
                characterId: selectedCharacterForCoterie
            },
            {
                onSuccess: () => {
                    notifications.show({
                        title: "Success",
                        message: "Character added to coterie",
                        color: "green"
                    })
                    setAddCharacterToCoterieModalOpened(false)
                    setSelectedCoterieForAdd(null)
                    setSelectedCharacterForCoterie("")
                },
                onError: (error) => {
                    notifications.show({
                        title: "Error",
                        message:
                            error instanceof Error
                                ? error.message
                                : "Failed to add character to coterie",
                        color: "red"
                    })
                }
            }
        )
    }

    const handleRemoveCharacterFromCoterie = (
        coterieId: string,
        characterId: string,
        details?: {
            characterName?: string | null
            coterieName?: string | null
        }
    ) => {
        setCharacterToRemoveFromCoterie({
            coterieId,
            characterId,
            characterName: details?.characterName,
            coterieName: details?.coterieName
        })
        setRemoveCharacterFromCoterieModalOpened(true)
    }

    const handleConfirmRemoveCharacterFromCoterie = () => {
        if (!characterToRemoveFromCoterie) return

        removeCharacterFromCoterieMutation.mutate(
            {
                coterieId: characterToRemoveFromCoterie.coterieId,
                characterId: characterToRemoveFromCoterie.characterId
            },
            {
                onSuccess: () => {
                    notifications.show({
                        title: "Success",
                        message: getRemovedFromCoterieMessage(
                            characterToRemoveFromCoterie.characterName,
                            characterToRemoveFromCoterie.coterieName
                        ),
                        color: "green"
                    })
                    setRemoveCharacterFromCoterieModalOpened(false)
                    setCharacterToRemoveFromCoterie(null)
                },
                onError: (error) => {
                    notifications.show({
                        title: "Error",
                        message:
                            error instanceof Error
                                ? error.message
                                : "Failed to remove character from coterie",
                        color: "red"
                    })
                }
            }
        )
    }

    const handleGenerateCoterieInvite = () => {
        if (!coterieForInvites) return

        createCoterieInviteMutation.mutate(coterieForInvites.id, {
            onSuccess: (createdInvite) => {
                if (!createdInvite.token) {
                    notifications.show({
                        title: "Invite created",
                        message: "The invite was created, but no link was returned.",
                        color: "yellow"
                    })
                    return
                }

                notifications.show({
                    title: "Invite link created",
                    message: "Share this link with the player you want to invite.",
                    color: "green"
                })
            },
            onError: (error) => {
                notifications.show({
                    title: "Error",
                    message: error instanceof Error ? error.message : "Failed to create invite",
                    color: "red"
                })
            }
        })
    }

    const handleCopyGeneratedInvite = () => {
        if (!generatedInviteUrl) return

        navigator.clipboard
            .writeText(generatedInviteUrl)
            .then(() => {
                notifications.show({
                    title: "Copied",
                    message: "Invite link copied to clipboard",
                    color: "green"
                })
            })
            .catch(() => {
                notifications.show({
                    title: "Copy failed",
                    message: "The invite link is still visible in the field.",
                    color: "yellow"
                })
            })
    }

    const handleHideGeneratedInvite = () => {
        setGeneratedInviteUrl("")
    }

    const handleRequestRevokeInvite = (invite: CoterieInvite) => {
        setInviteToRevoke(invite)
        setRevokeInviteModalOpened(true)
    }

    const handleConfirmRevokeInvite = () => {
        if (!coterieForInvites || !inviteToRevoke) return

        revokeCoterieInviteMutation.mutate(
            { coterieId: coterieForInvites.id, inviteId: inviteToRevoke.id },
            {
                onSuccess: () => {
                    notifications.show({
                        title: "Invite revoked",
                        message: "This invite link can no longer be used.",
                        color: "green"
                    })
                    setRevokeInviteModalOpened(false)
                    setInviteToRevoke(null)
                },
                onError: (error) => {
                    notifications.show({
                        title: "Error",
                        message: error instanceof Error ? error.message : "Failed to revoke invite",
                        color: "red"
                    })
                }
            }
        )
    }

    const handleRemoveCoteriePlayer = (coterie: Coterie, player: CoteriePlayer) => {
        setPlayerToRemoveFromCoterie({ coterie, player })
        setRemoveCoteriePlayerModalOpened(true)
    }

    const handleConfirmRemoveCoteriePlayer = () => {
        const target = playerToRemoveFromCoterie

        if (!target?.player.membershipId) return

        removeCoteriePlayerMutation.mutate(
            {
                coterieId: target.coterie.id,
                membershipId: target.player.membershipId
            },
            {
                onSuccess: () => {
                    notifications.show({
                        title: "Player removed",
                        message: `${target.player.nickname || "Player"} was removed from ${target.coterie.name}.`,
                        color: "green"
                    })
                    setRemoveCoteriePlayerModalOpened(false)
                    setPlayerToRemoveFromCoterie(null)
                },
                onError: (error) => {
                    notifications.show({
                        title: "Error",
                        message: error instanceof Error ? error.message : "Failed to remove player",
                        color: "red"
                    })
                }
            }
        )
    }

    // Show loading state while checking auth
    if (authLoading) {
        return (
            <MeShell>
                <RouteFallback />
            </MeShell>
        )
    }

    // Only show "not authenticated" if we've finished loading and still no user
    if (!authLoading && !isAuthenticated) {
        return (
            <MeShell>
                <Panel tone="ornate" grain maw={560} mx="auto" mt="xl" p="lg">
                    <EmptyState
                        icon={<IconKey size={26} stroke={1.5} />}
                        title="Please log in to view your profile"
                        description="Your saved characters, coteries and profile live behind this door."
                        actions={
                            <>
                                <Button onClick={signIn} loading={isSigningIn}>
                                    {isSigningIn ? "Signing in…" : "Sign in"}
                                </Button>
                                <Button
                                    component={Link}
                                    to="/"
                                    variant="subtle"
                                    color="gray"
                                    leftSection={<IconArrowLeft size={16} />}
                                >
                                    Go to Home
                                </Button>
                            </>
                        }
                    />
                </Panel>
            </MeShell>
        )
    }

    const userCharacters = (characters as Character[]) || []
    const userCoteries = coteries || []
    const ownedCharacters = userCharacters.filter((c) => !c.shared)
    const currentCoterieForSummary = coterieForSummary
        ? (userCoteries.find((coterie) => coterie.id === coterieForSummary.id) ?? coterieForSummary)
        : null

    // Find the currently loaded character in the list by ID
    const currentlyLoadedCharacter = character.id
        ? userCharacters.find((c) => c.id === character.id)
        : null
    const canSaveToExisting = currentlyLoadedCharacter && !currentlyLoadedCharacter.shared
    const showSaveCurrentButton = !canSaveToExisting && !!character.name.trim()

    const displayName =
        user?.nickname?.trim() || [user?.firstName, user?.lastName].filter(Boolean).join(" ")
    const tabCounts: Partial<Record<MeTab, number | undefined>> = {
        characters: characters ? userCharacters.length : undefined,
        coteries: coteries ? userCoteries.length : undefined
    }

    const closeCreateCharacterModal = () => {
        setCreateCharacterModalOpened(false)
        setNewCharacterName("")
    }
    const closeCreateCoterieModal = () => {
        setCreateCoterieModalOpened(false)
        setNewCoterieName("")
    }
    const closeEditCoterieModal = () => {
        setEditCoterieModalOpened(false)
        setEditingCoterie(null)
        setNewCoterieName("")
    }
    const closeAddCharacterToCoterieModal = () => {
        setAddCharacterToCoterieModalOpened(false)
        setSelectedCoterieForAdd(null)
        setSelectedCharacterForCoterie("")
    }
    const closeLoadSameCharacterWarning = () => {
        setLoadSameCharacterWarningModalOpened(false)
        setCharacterToLoad(null)
        setLoadingCharacterId(null)
    }
    const closeShareCharacterModal = () => {
        setShareCharacterModalOpened(false)
        setCharacterToShare(null)
        setShareNickname("")
    }
    const addableCharacters = ownedCharacters
        .filter((char) => {
            // Filter out characters already in this coterie
            if (!selectedCoterieForAdd?.members) return true
            return !selectedCoterieForAdd.members.some((m) => m.characterId === char.id)
        })
        .map((char) => ({ value: char.id, label: char.name }))

    return (
        <>
            <MeShell>
                <PageHeader
                    className={classes.header}
                    eyebrow="Account"
                    title={displayName || "Your Haven"}
                    icon={
                        <span className={classes.monogram} aria-hidden="true">
                            <span>{(displayName || "P").charAt(0).toUpperCase()}</span>
                        </span>
                    }
                    actions={
                        <div className={classes.headerActions}>
                            <Button
                                component={Link}
                                to="/features"
                                variant="default"
                                leftSection={<IconBook2 size={16} />}
                                onClick={() => trackFeatureGuideOpened("account-page")}
                            >
                                Feature guide
                            </Button>
                            <Button
                                component={Link}
                                to="/homebrew"
                                variant="default"
                                leftSection={<IconFlask size={16} />}
                            >
                                Homebrew
                            </Button>
                            <SupportConversationButton
                                source="account-page"
                                variant="default"
                                leftSection={<IconMessageCircle size={16} />}
                            >
                                Feedback & Support
                            </SupportConversationButton>
                            <Button
                                onClick={signOut}
                                variant="subtle"
                                color="gray"
                                leftSection={<IconLogout size={16} />}
                            >
                                Sign Out
                            </Button>
                        </div>
                    }
                />

                <Tabs
                    value={activeTab}
                    onChange={(value) => {
                        const next = parseMeTab(value)
                        if (next) changeTab(next)
                    }}
                    keepMounted={false}
                    activateTabWithKeyboard
                >
                    <div className={classes.tabsBar}>
                        <Tabs.List className={classes.tabsList}>
                            {ME_TABS.map((tab) => {
                                const Icon = TAB_META[tab].icon
                                const count = tabCounts[tab]
                                return (
                                    <Tabs.Tab
                                        key={tab}
                                        value={tab}
                                        className={classes.tab}
                                        leftSection={<Icon size={16} stroke={1.6} />}
                                    >
                                        {TAB_META[tab].label}
                                        {count !== undefined ? (
                                            <span className={classes.tabCount}>{count}</span>
                                        ) : null}
                                    </Tabs.Tab>
                                )
                            })}
                        </Tabs.List>
                    </div>

                    <Tabs.Panel value="characters" className={classes.panel}>
                        <CharactersSection
                            isLoading={charactersLoading}
                            hasLoadError={charactersLoadError}
                            onRetry={() => void reloadCharacters()}
                            userCharacters={userCharacters}
                            character={character}
                            showSaveCurrentButton={showSaveCurrentButton}
                            isSavingCharacter={isSavingCharacter}
                            isAnyOperationInFlight={isAnyOperationInFlight}
                            loadingCharacterId={loadingCharacterId}
                            setCreateCharacterModalOpened={setCreateCharacterModalOpened}
                            handleSaveCurrentCharacter={handleSaveCurrentCharacter}
                            handleLoadFromFile={handleLoadFromFile}
                            handleLoadCharacter={handleLoadCharacter}
                            handleShareCharacter={handleShareCharacter}
                            handleShowSummary={handleShowSummary}
                            handleSaveJson={handleSaveJson}
                            handleDownloadPdf={handleDownloadPdf}
                            handleDeleteCharacter={handleDeleteCharacter}
                            handleUnshareCharacter={handleUnshareCharacter}
                        />
                    </Tabs.Panel>

                    <Tabs.Panel value="coteries" className={classes.panel}>
                        <CoteriesSection
                            userCoteries={userCoteries}
                            isLoading={coteriesLoading}
                            hasLoadError={coteriesLoadError && !coteries}
                            onRetry={() => void reloadCoteries?.()}
                            setCreateCoterieModalOpened={setCreateCoterieModalOpened}
                            handleAddCharacterToCoterie={handleAddCharacterToCoterie}
                            handleEditCoterie={handleEditCoterie}
                            handleDeleteCoterie={handleDeleteCoterie}
                            handleManageCoterieInvites={handleManageCoterieInvites}
                            handleJoinCoterieChat={handleJoinCoterieChat}
                            handleRemoveCoteriePlayer={handleRemoveCoteriePlayer}
                            handleShowCharacterSummary={handleShowSummary}
                            handleRemoveCharacterFromCoterie={handleRemoveCharacterFromCoterie}
                            setCoterieForSummary={setCoterieForSummary}
                            setCoterieSummaryModalOpened={setCoterieSummaryModalOpened}
                            vitalsByCharacterId={vitalsByCharacterId}
                        />
                    </Tabs.Panel>

                    <Tabs.Panel value="profile" className={classes.panel}>
                        <UserProfileSection
                            user={user}
                            isEditingNickname={isEditingNickname}
                            setIsEditingNickname={setIsEditingNickname}
                            isUpdatingProfile={isUpdatingProfile}
                            handleSaveNickname={handleSaveNickname}
                            handleCancelNickname={handleCancelNickname}
                            handleNameTagToggle={handleNameTagToggle}
                        />
                    </Tabs.Panel>
                </Tabs>
            </MeShell>

            <SaveCharacterCopyModal
                source={copySource}
                onClose={() => setCopySource(null)}
                setCharacter={setCharacter}
            />

            <NameModal
                opened={createCharacterModalOpened}
                onClose={closeCreateCharacterModal}
                title="Create Empty Character"
                label="Character Name"
                placeholder="Enter character name"
                value={newCharacterName}
                onChange={setNewCharacterName}
                onSubmit={handleCreateEmptyCharacter}
                submitLabel="Create"
                loading={createCharacterMutation.isPending}
            />

            <NameModal
                opened={createCoterieModalOpened}
                onClose={closeCreateCoterieModal}
                title="Create Coterie"
                label="Coterie Name"
                placeholder="Enter coterie name"
                value={newCoterieName}
                onChange={setNewCoterieName}
                onSubmit={handleCreateCoterie}
                submitLabel="Create"
                loading={createCoterieMutation.isPending}
            />

            <NameModal
                opened={editCoterieModalOpened}
                onClose={closeEditCoterieModal}
                title="Edit Coterie"
                label="Coterie Name"
                placeholder="Enter coterie name"
                value={newCoterieName}
                onChange={setNewCoterieName}
                onSubmit={handleUpdateCoterie}
                submitLabel="Save"
                loading={updateCoterieMutation.isPending}
            />

            <Modal
                opened={addCharacterToCoterieModalOpened}
                onClose={closeAddCharacterToCoterieModal}
                title={`Add Character to ${selectedCoterieForAdd?.name || "Coterie"}`}
                centered
            >
                <Stack gap="md">
                    <Select
                        data-autofocus
                        label="Character"
                        placeholder={
                            addableCharacters.length ? "Select a character" : "No characters to add"
                        }
                        data={addableCharacters}
                        value={selectedCharacterForCoterie}
                        onChange={(value) => setSelectedCharacterForCoterie(value || "")}
                        searchable={addableCharacters.length > 8}
                        nothingFoundMessage="No matching character"
                    />
                    <ModalFooter
                        onCancel={closeAddCharacterToCoterieModal}
                        onConfirm={handleConfirmAddCharacterToCoterie}
                        confirmLabel="Add"
                        loading={addCharacterToCoterieMutation.isPending}
                        disabledReason={
                            selectedCharacterForCoterie ? undefined : "Pick a character first"
                        }
                    />
                </Stack>
            </Modal>

            <CoterieInvitesModal
                opened={coterieInvitesModalOpened}
                onClose={() => {
                    setCoterieInvitesModalOpened(false)
                    setCoterieForInvites(null)
                    setGeneratedInviteUrl("")
                }}
                coterieName={coterieForInvites?.name}
                invites={coterieInvites}
                generatedInviteUrl={generatedInviteUrl}
                isGenerating={createCoterieInviteMutation.isPending}
                onGenerate={handleGenerateCoterieInvite}
                onCopy={handleCopyGeneratedInvite}
                onHide={handleHideGeneratedInvite}
                onRevoke={handleRequestRevokeInvite}
            />

            <ConfirmActionModal
                opened={removeCharacterFromCoterieModalOpened}
                onClose={() => {
                    setRemoveCharacterFromCoterieModalOpened(false)
                    setCharacterToRemoveFromCoterie(null)
                }}
                onConfirm={handleConfirmRemoveCharacterFromCoterie}
                title="Remove Character"
                body={
                    <>
                        Remove{" "}
                        <strong>
                            {characterToRemoveFromCoterie?.characterName || "this character"}
                        </strong>{" "}
                        from{" "}
                        <strong>
                            {characterToRemoveFromCoterie?.coterieName || "this coterie"}
                        </strong>
                        ?
                    </>
                }
                confirmLabel="Remove"
                loading={removeCharacterFromCoterieMutation.isPending}
            />

            <ConfirmActionModal
                opened={removeCoteriePlayerModalOpened}
                onClose={() => {
                    setRemoveCoteriePlayerModalOpened(false)
                    setPlayerToRemoveFromCoterie(null)
                }}
                onConfirm={handleConfirmRemoveCoteriePlayer}
                title="Remove Player"
                body={
                    <>
                        Remove{" "}
                        <strong>
                            {playerToRemoveFromCoterie?.player.nickname || "this player"}
                        </strong>{" "}
                        from <strong>{playerToRemoveFromCoterie?.coterie.name}</strong>? Their
                        characters will also be removed from the coterie.
                    </>
                }
                confirmLabel="Remove"
                loading={removeCoteriePlayerMutation.isPending}
            />

            <ConfirmActionModal
                opened={revokeInviteModalOpened}
                onClose={() => {
                    setRevokeInviteModalOpened(false)
                    setInviteToRevoke(null)
                }}
                onConfirm={handleConfirmRevokeInvite}
                title="Revoke Invite"
                body="This invite link will stop working immediately. Existing coterie members will remain."
                confirmLabel="Revoke"
                loading={revokeCoterieInviteMutation.isPending}
            />

            <ConfirmActionModal
                opened={deleteCharacterModalOpened}
                onClose={() => {
                    setDeleteCharacterModalOpened(false)
                    setCharacterToDelete(null)
                }}
                onConfirm={handleConfirmDeleteCharacter}
                title="Delete Character"
                body={
                    <>
                        Are you sure you want to delete <strong>{characterToDelete?.name}</strong>?
                        This action cannot be undone.
                    </>
                }
                confirmLabel="Delete"
                loading={deleteCharacterMutation.isPending}
            />

            <ConfirmActionModal
                opened={deleteCoterieModalOpened}
                onClose={() => {
                    setDeleteCoterieModalOpened(false)
                    setCoterieToDelete(null)
                }}
                onConfirm={handleConfirmDeleteCoterie}
                title="Delete Coterie"
                body={
                    <>
                        Are you sure you want to delete <strong>{coterieToDelete?.name}</strong>?
                        This action cannot be undone.
                    </>
                }
                confirmLabel="Delete"
                loading={deleteCoterieMutation.isPending}
            />

            <ConfirmActionModal
                opened={loadSameCharacterWarningModalOpened}
                onClose={closeLoadSameCharacterWarning}
                onConfirm={handleConfirmLoadSameCharacter}
                title="Warning: Unsaved Changes"
                body={
                    <>
                        You have unsaved changes to{" "}
                        <strong>{characterToLoad?.name || character.name}</strong>. Loading this
                        character will discard your current unsaved changes.
                    </>
                }
                confirmLabel="Load Anyway"
                disabled={isAnyOperationInFlight}
                loading={isLoadingCharacter}
            >
                <Text c="dimmed" size="sm" ta="center">
                    You can save your current changes first, or load the character anyway (which
                    will discard your unsaved changes).
                </Text>
            </ConfirmActionModal>

            <ShareCharacterModal
                opened={shareCharacterModalOpened}
                characterToShare={characterToShare}
                shareNickname={shareNickname}
                setShareNickname={setShareNickname}
                isSharing={isSharing}
                handleConfirmShare={handleConfirmShare}
                onClose={closeShareCharacterModal}
            />

            <ConfirmActionModal
                opened={loadJsonModalOpened}
                onClose={() => {
                    setLoadJsonModalOpened(false)
                    setLoadedFile(null)
                }}
                onConfirm={handleConfirmLoadJson}
                title="Load Character?"
                body="This will overwrite the current character with the selected file. This action cannot be undone."
                confirmLabel="Load"
            />

            <NameCharacterBeforeSwitchModal
                opened={pendingSwitchTarget !== null}
                pendingActionLabel="switch characters"
                nameValue={switchNameValue}
                setNameValue={setSwitchNameValue}
                onClose={closePendingSwitch}
                onSaveAndContinue={handleSaveAndContinueSwitch}
                onDiscardAndContinue={handleDiscardAndContinueSwitch}
                isSaving={isSavingBeforeSwitch}
            />

            {/* Coterie Summary Modal */}
            <Modal
                opened={coterieSummaryModalOpened}
                onClose={() => {
                    setCoterieSummaryModalOpened(false)
                    setCoterieForSummary(null)
                }}
                title={`Coterie Summary: ${currentCoterieForSummary?.name || ""}`}
                centered
                size="xl"
            >
                {currentCoterieForSummary &&
                currentCoterieForSummary.members &&
                currentCoterieForSummary.members.length > 0 ? (
                    <CoterieSummaryContent
                        members={currentCoterieForSummary.members}
                        vitalsByCharacterId={vitalsByCharacterId}
                    />
                ) : (
                    <Text c="dimmed" ta="center">
                        No members in this coterie.
                    </Text>
                )}
            </Modal>

            <Modal
                opened={summaryModalOpened}
                onClose={() => {
                    setSummaryModalOpened(false)
                    setCharacterForSummary(null)
                }}
                title="Character Summary"
                centered
                size="xl"
            >
                {characterForSummary?.data ? (
                    <CharacterSummaryContent
                        character={characterForSummary.data as CharacterType}
                        characterName={characterForSummary.name}
                    />
                ) : null}
            </Modal>
            <ChatWindow
                options={{
                    primaryColor: "red",
                    character
                }}
                openSignal={chatOpenSignal}
                sessionLabel={activeChatCoterieName}
                sessionLabelSessionId={activeChatCoterieId}
            />
        </>
    )
}

export default MePage
