import {
    Accordion,
    AppShell,
    BackgroundImage,
    Badge,
    Box,
    Button,
    Card,
    Center,
    Container,
    Divider,
    Grid,
    Group,
    Loader,
    Modal,
    Paper,
    Select,
    Stack,
    Text,
    TextInput,
    useComputedColorScheme,
    useMantineTheme,
} from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { IconArrowRight, IconDownload, IconInfoCircle, IconTrash, IconUsers } from "@tabler/icons-react"
import { useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { Buffer } from "buffer"
import { useEffect, useState } from "react"
import { z } from "zod"
import FocusBorderWrapper from "~/character_sheet/components/FocusBorderWrapper"
import { loadCharacterFromJson } from "~/components/LoadModal"
import { attributesKeySchema } from "~/data/Attributes"
import { characterSchema, Character as CharacterType, getEmptyCharacter } from "~/data/Character"
import { clans } from "~/data/Clans"
import type { DisciplineName } from "~/data/NameSchemas"
import { skillsKeySchema } from "~/data/Skills"
import { downloadCharacterSheet } from "~/generator/pdfCreator"
import { downloadJson, getUploadFile, rndInt, upcase, updateHealthAndWillpowerAndBloodPotencyAndHumanity } from "~/generator/utils"
import { globals } from "~/globals"
import { useAuth } from "~/hooks/useAuth"
import { useCharacterLocalStorage } from "~/hooks/useCharacterLocalStorage"
import { useCharacters, useCreateCharacter, useDeleteCharacter, useUpdateCharacter } from "~/hooks/useCharacters"
import {
    useAddCharacterToCoterie,
    useCoteries,
    useCreateCoterie,
    useDeleteCoterie,
    useRemoveCharacterFromCoterie,
    useUpdateCoterie,
} from "~/hooks/useCoteries"
import { useCharacterShares, useUnshareCharacter } from "~/hooks/useShares"
import club from "~/resources/backgrounds/aleksandr-popov-3InMDrsuYrk-unsplash.jpg"
import brokenDoor from "~/resources/backgrounds/amber-kipp-VcPo_DvKjQE-unsplash.jpg"
import city from "~/resources/backgrounds/dominik-hofbauer-IculuMoubkQ-unsplash.jpg"
import bloodGuy from "~/resources/backgrounds/marcus-bellamy-xvW725b6LQk-unsplash.jpg"
import batWoman from "~/resources/backgrounds/peter-scherbatykh-VzQWVqHOCaE-unsplash.jpg"
import alley from "~/resources/backgrounds/thomas-le-KNQEvvCGoew-unsplash.jpg"
import Topbar from "~/topbar/Topbar"
import { api } from "~/utils/api"
import CharactersSection from "./sections/CharactersSection"
import CoteriesSection from "./sections/CoteriesSection"
import UserProfileSection from "./sections/UserProfileSection"

const backgrounds = [club, brokenDoor, city, bloodGuy, batWoman, alley]

type ShareCharacterModalContentProps = {
    characterToShare: { id: string; name: string } | null
    shareNickname: string
    setShareNickname: (value: string) => void
    isSharing: boolean
    redColorValue: string
    handleConfirmShare: () => void
    onClose: () => void
}

const ShareCharacterModalContent = ({
    characterToShare,
    shareNickname,
    setShareNickname,
    isSharing,
    redColorValue,
    handleConfirmShare,
    onClose,
}: ShareCharacterModalContentProps) => {
    const { data: shares, isLoading: isLoadingShares } = useCharacterShares(characterToShare?.id || null)

    const sharedWithNicknames =
        shares
            ?.map((share: unknown) => {
                const s = share as { sharedWith: { nickname: string | null } }
                return s.sharedWith?.nickname
            })
            .filter((nickname: string | null | undefined): nickname is string => !!nickname) || []

    return (
        <Stack gap="md">
            <Text>
                Share <strong>{characterToShare?.name}</strong> with another user.
            </Text>
            <Text c="dimmed" size="sm">
                This is a read-only share. The other user can view your character, and they can store and edit their own copy of it.
            </Text>
            <Text c="dimmed" size="sm">
                They can see updates you have made to your character by clicking "Load".
            </Text>
            <FocusBorderWrapper colorValue={redColorValue}>
                <TextInput
                    label="User Nickname"
                    placeholder="Enter the user's nickname"
                    value={shareNickname}
                    onChange={(e) => setShareNickname(e.target.value)}
                    disabled={isSharing}
                />
            </FocusBorderWrapper>
            {isLoadingShares ? (
                <Text c="dimmed" size="sm">
                    Loading...
                </Text>
            ) : sharedWithNicknames.length > 0 ? (
                <Stack gap="xs">
                    <Text fw={500} size="sm">
                        Currently shared with:
                    </Text>
                    <Group gap="xs">
                        {sharedWithNicknames.map((nickname: string) => (
                            <Badge key={nickname} color="red" variant="light">
                                {nickname}
                            </Badge>
                        ))}
                    </Group>
                </Stack>
            ) : null}
            <Group justify="flex-end" gap="xs">
                <Button variant="subtle" color="red" onClick={onClose} disabled={isSharing}>
                    Cancel
                </Button>
                <Button color="red" onClick={handleConfirmShare} loading={isSharing} disabled={!shareNickname.trim()}>
                    Share
                </Button>
            </Group>
        </Stack>
    )
}

type Character = {
    id: string
    name: string
    shared?: boolean
    data?: unknown
}

type Coterie = {
    id: string
    name: string
    owned?: boolean
    members?: Array<{ characterId: string; character?: Character }>
}

const MePage = () => {
    const { user, loading: authLoading, isAuthenticated, updateProfile, isUpdatingProfile, signOut } = useAuth()
    const { data: characters } = useCharacters()
    const { data: coteries } = useCoteries()
    const [character, setCharacter] = useCharacterLocalStorage()
    const computedColorScheme = useComputedColorScheme("dark", { getInitialValueInEffect: true })
    const [showAsideBar, setShowAsideBar] = useState(!globals.isSmallScreen)
    const [backgroundIndex] = useState(rndInt(0, backgrounds.length))
    const theme = useMantineTheme()
    const redColorValue = theme.colors.red[6]
    const queryClient = useQueryClient()

    // Character CRUD
    const createCharacterMutation = useCreateCharacter()
    const updateCharacterMutation = useUpdateCharacter()
    const deleteCharacterMutation = useDeleteCharacter()

    // Coterie CRUD
    const createCoterieMutation = useCreateCoterie()
    const updateCoterieMutation = useUpdateCoterie()
    const deleteCoterieMutation = useDeleteCoterie()
    const addCharacterToCoterieMutation = useAddCharacterToCoterie()
    const removeCharacterFromCoterieMutation = useRemoveCharacterFromCoterie()

    // Shares
    const unshareCharacterMutation = useUnshareCharacter()

    // Modals
    const [createCharacterModalOpened, setCreateCharacterModalOpened] = useState(false)
    const [createCoterieModalOpened, setCreateCoterieModalOpened] = useState(false)
    const [editCoterieModalOpened, setEditCoterieModalOpened] = useState(false)
    const [addCharacterToCoterieModalOpened, setAddCharacterToCoterieModalOpened] = useState(false)
    const [deleteCharacterModalOpened, setDeleteCharacterModalOpened] = useState(false)
    const [deleteCoterieModalOpened, setDeleteCoterieModalOpened] = useState(false)
    const [loadCharacterWarningModalOpened, setLoadCharacterWarningModalOpened] = useState(false)
    const [loadJsonModalOpened, setLoadJsonModalOpened] = useState(false)
    const [loadedFile, setLoadedFile] = useState<File | null>(null)
    const [loadingCharacterId, setLoadingCharacterId] = useState<string | null>(null)
    const [versionConflictModalOpened, setVersionConflictModalOpened] = useState(false)
    const [versionConflictInfo, setVersionConflictInfo] = useState<{ beVersion: number; feVersion: number } | null>(null)
    const [characterToDelete, setCharacterToDelete] = useState<{ id: string; name: string } | null>(null)
    const [coterieToDelete, setCoterieToDelete] = useState<{ id: string; name: string } | null>(null)
    const [characterToLoad, setCharacterToLoad] = useState<{ id: string; name: string; data: CharacterType } | null>(null)
    const [newCharacterName, setNewCharacterName] = useState("")
    const [shareCharacterModalOpened, setShareCharacterModalOpened] = useState(false)
    const [characterToShare, setCharacterToShare] = useState<{ id: string; name: string } | null>(null)
    const [shareNickname, setShareNickname] = useState("")
    const [isSharing, setIsSharing] = useState(false)
    const [newCoterieName, setNewCoterieName] = useState("")
    const [editingCoterie, setEditingCoterie] = useState<Coterie | null>(null)
    const [selectedCoterieForAdd, setSelectedCoterieForAdd] = useState<Coterie | null>(null)
    const [selectedCharacterForCoterie, setSelectedCharacterForCoterie] = useState<string>("")
    const [summaryModalOpened, setSummaryModalOpened] = useState(false)
    const [characterForSummary, setCharacterForSummary] = useState<Character | null>(null)
    const [coterieSummaryModalOpened, setCoterieSummaryModalOpened] = useState(false)
    const [coterieForSummary, setCoterieForSummary] = useState<Coterie | null>(null)

    // Nickname editing
    const [isEditingNickname, setIsEditingNickname] = useState(false)
    const [nicknameValue, setNicknameValue] = useState("")

    useEffect(() => {
        if (user?.nickname !== undefined) {
            setNicknameValue(user.nickname || "")
        }
    }, [user?.nickname])

    const handleSaveNickname = () => {
        updateProfile(
            { nickname: nicknameValue.trim() || null },
            {
                onSuccess: () => {
                    setIsEditingNickname(false)
                    notifications.show({
                        title: "Success",
                        message: "Nickname updated",
                        color: "green",
                    })
                },
                onError: (error) => {
                    const errorMessage =
                        error instanceof Error ? error.message : typeof error === "string" ? error : "Failed to update nickname"
                    notifications.show({
                        title: "Error",
                        message: errorMessage,
                        color: "red",
                    })
                },
            }
        )
    }

    const handleCancelNickname = () => {
        setNicknameValue(user?.nickname || "")
        setIsEditingNickname(false)
    }

    useEffect(() => {
        setShowAsideBar(!globals.isSmallScreen)
    }, [globals.isSmallScreen])

    const handleCreateEmptyCharacter = () => {
        if (!newCharacterName.trim()) {
            notifications.show({
                title: "Error",
                message: "Character name is required",
                color: "red",
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
            },
            {
                onSuccess: () => {
                    notifications.show({
                        title: "Success",
                        message: `Character "${emptyChar.name}" created`,
                        color: "green",
                    })
                    setCreateCharacterModalOpened(false)
                    setNewCharacterName("")
                },
                onError: (error) => {
                    notifications.show({
                        title: "Error",
                        message: error instanceof Error ? error.message : "Failed to create character",
                        color: "red",
                    })
                },
            }
        )
    }

    const handleSaveCurrentCharacter = async () => {
        if (!character.name.trim()) {
            notifications.show({
                title: "Error",
                message: "Character must have a name",
                color: "red",
            })
            return
        }

        // Find character by ID if available
        const targetCharacter = character.id ? userCharacters.find((c) => c.id === character.id) : null

        if (targetCharacter && !targetCharacter.shared) {
            // Fetch current character from backend to check version
            try {
                const beCharacter = await api.getCharacter(targetCharacter.id)
                const beChar = beCharacter as { characterVersion?: number; data?: { characterVersion?: number } }
                const beVersion = beChar.characterVersion ?? beChar.data?.characterVersion ?? 0
                const feVersion = (character as CharacterType & { characterVersion?: number }).characterVersion ?? 0

                if (beVersion > feVersion) {
                    // Show version conflict modal
                    setVersionConflictInfo({ beVersion, feVersion })
                    setVersionConflictModalOpened(true)
                    return
                }
            } catch (error) {
                // If fetch fails, continue with save (character might not exist or network error)
                console.warn("Failed to fetch character for version check:", error)
            }

            // Update existing character
            updateCharacterMutation.mutate(
                {
                    id: targetCharacter.id,
                    data: {
                        name: character.name,
                        data: character,
                        version: character.version,
                    },
                },
                {
                    onSuccess: (savedCharacter) => {
                        // Update character in memory with the ID and characterVersion from backend
                        const saved = savedCharacter as {
                            id: string
                            name: string
                            data: unknown
                            version?: number
                            characterVersion?: number
                        }
                        const savedData = saved.data as { characterVersion?: number } | undefined
                        setCharacter({
                            ...character,
                            id: saved.id,
                            characterVersion: saved.characterVersion ?? savedData?.characterVersion ?? 0,
                        } as CharacterType & { characterVersion: number })
                        notifications.show({
                            title: "Success",
                            message: `Character "${character.name}" saved`,
                            color: "green",
                        })
                    },
                    onError: (error) => {
                        notifications.show({
                            title: "Error",
                            message: error instanceof Error ? error.message : "Failed to save character",
                            color: "red",
                        })
                    },
                }
            )
        } else {
            // Create new character
            createCharacterMutation.mutate(
                {
                    name: character.name,
                    data: character,
                    version: character.version,
                },
                {
                    onSuccess: (savedCharacter) => {
                        // Update character in memory with the ID and characterVersion from backend
                        const saved = savedCharacter as {
                            id: string
                            name: string
                            data: unknown
                            version?: number
                            characterVersion?: number
                        }
                        const savedData = saved.data as { characterVersion?: number } | undefined
                        setCharacter({
                            ...character,
                            id: saved.id,
                            characterVersion: saved.characterVersion ?? savedData?.characterVersion ?? 0,
                        } as CharacterType & { characterVersion: number })
                        notifications.show({
                            title: "Success",
                            message: `Character "${character.name}" saved`,
                            color: "green",
                        })
                    },
                    onError: (error) => {
                        notifications.show({
                            title: "Error",
                            message: error instanceof Error ? error.message : "Failed to save character",
                            color: "red",
                        })
                    },
                }
            )
        }
    }

    const handleConfirmOverwriteVersion = () => {
        if (!versionConflictInfo) return

        // If characterToLoad is set, we're in a loading scenario
        if (characterToLoad) {
            // Load the character (overwriting current with older version)
            setCharacter({
                ...characterToLoad.data,
                id: characterToLoad.id,
            } as CharacterType & { id: string })
            setVersionConflictModalOpened(false)
            setVersionConflictInfo(null)
            setCharacterToLoad(null)
            notifications.show({
                title: "Success",
                message: `Loaded "${characterToLoad.name}"`,
                color: "green",
            })
            return
        }

        // Otherwise, we're in a saving scenario
        if (!character.id) return

        const targetCharacter = userCharacters.find((c) => c.id === character.id)
        if (!targetCharacter || targetCharacter.shared) return

        // Proceed with save (overwrite)
        updateCharacterMutation.mutate(
            {
                id: targetCharacter.id,
                data: {
                    name: character.name,
                    data: character,
                    version: character.version,
                },
            },
            {
                onSuccess: (savedCharacter) => {
                    // Update character in memory with the ID and characterVersion from backend
                    const saved = savedCharacter as {
                        id: string
                        name: string
                        data: unknown
                        version?: number
                        characterVersion?: number
                    }
                    const savedData = saved.data as { characterVersion?: number } | undefined
                    setCharacter({
                        ...character,
                        id: saved.id,
                        characterVersion: saved.characterVersion ?? savedData?.characterVersion ?? 0,
                    } as CharacterType & { characterVersion: number })
                    setVersionConflictModalOpened(false)
                    setVersionConflictInfo(null)
                    notifications.show({
                        title: "Success",
                        message: `Character "${character.name}" saved`,
                        color: "green",
                    })
                },
                onError: (error) => {
                    notifications.show({
                        title: "Error",
                        message: error instanceof Error ? error.message : "Failed to save character",
                        color: "red",
                    })
                },
            }
        )
    }

    const isSavingCharacter = createCharacterMutation.isPending || updateCharacterMutation.isPending
    const isLoadingCharacter = loadingCharacterId !== null
    const isAnyOperationInFlight = isSavingCharacter || isLoadingCharacter

    const handleDeleteCharacter = (characterId: string, characterName: string) => {
        setCharacterToDelete({ id: characterId, name: characterName })
        setDeleteCharacterModalOpened(true)
    }

    const handleLoadCharacter = async (char: Character) => {
        const charData = char.data as CharacterType | undefined
        if (!charData) return

        // Set loading state for this character
        setLoadingCharacterId(char.id)

        // Check if current character exists in backend
        const currentCharacterExists = character.id && userCharacters.find((c) => c.id === character.id)

        if (currentCharacterExists) {
            // Check version conflict before loading
            try {
                const beCharacter = await api.getCharacter(char.id)
                const beChar = beCharacter as { characterVersion?: number; data?: { characterVersion?: number } }
                const beVersion = beChar.characterVersion ?? beChar.data?.characterVersion ?? 0
                const feVersion = (character as CharacterType & { characterVersion?: number }).characterVersion ?? 0

                if (beVersion < feVersion) {
                    // Backend version is older - warn user they're about to load an older version
                    setLoadingCharacterId(null)
                    setVersionConflictInfo({ beVersion, feVersion })
                    setCharacterToLoad({ id: char.id, name: char.name, data: charData })
                    setVersionConflictModalOpened(true)
                    return
                }
            } catch (error) {
                // If fetch fails, continue with load (character might not exist or network error)
                console.warn("Failed to fetch character for version check:", error)
            }

            // Directly load the character without saving first
            setCharacter({
                ...charData,
                id: char.id,
            } as CharacterType & { id: string })
            setLoadingCharacterId(null)
            notifications.show({
                title: "Success",
                message: `Loaded "${char.name}"`,
                color: "green",
            })
        } else {
            // Show warning modal if current character doesn't exist in backend
            // Clear loading state when opening modal - buttons should be enabled until user confirms
            setLoadingCharacterId(null)
            setCharacterToLoad({ id: char.id, name: char.name, data: charData })
            setLoadCharacterWarningModalOpened(true)
        }
    }

    const handleConfirmLoadCharacter = () => {
        if (!characterToLoad) return

        setLoadingCharacterId(characterToLoad.id)
        setCharacter({
            ...characterToLoad.data,
            id: characterToLoad.id,
        } as CharacterType & { id: string })
        setLoadingCharacterId(null)
        notifications.show({
            title: "Success",
            message: `Loaded "${characterToLoad.name}"`,
            color: "green",
        })
        setLoadCharacterWarningModalOpened(false)
        setCharacterToLoad(null)
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
        console.log("handleConfirmLoadJson", loadedFile)
        if (!loadedFile) {
            notifications.show({
                title: "Error",
                message: "No file selected",
                color: "red",
            })
            return
        }
        try {
            const fileData = await getUploadFile(loadedFile)
            if (!fileData || typeof fileData !== "string") {
                throw new Error("Failed to read file")
            }
            const base64 = fileData.split(",")[1]
            if (!base64) {
                throw new Error("Invalid file format")
            }

            // Use atob for browser compatibility instead of Buffer
            let json: string
            try {
                json = atob(base64)
            } catch (decodeError) {
                // Fallback to Buffer if atob fails
                json = Buffer.from(base64, "base64").toString()
            }

            const loadedCharacter = await loadCharacterFromJson(json)
            console.log("Loaded character from JSON:", loadedCharacter)

            // Set id to empty string since this is a new character from JSON
            const characterToSet = { ...loadedCharacter, id: "" }

            setCharacter(characterToSet)
            console.log("Character set in state")

            setLoadJsonModalOpened(false)
            setLoadedFile(null)

            notifications.show({
                title: "Character loaded",
                message: `Successfully loaded ${loadedCharacter.name}`,
                color: "green",
                autoClose: 3000,
            })
            console.log("Notification shown")
        } catch (e) {
            console.error("Error loading JSON:", e)
            if (e instanceof z.ZodError) {
                notifications.show({
                    title: "JSON content error loading character",
                    message: z.prettifyError(e),
                    color: "red",
                    autoClose: false,
                })
            } else {
                const errorMessage = e instanceof Error ? e.message : String(e)
                notifications.show({
                    title: "Error loading character",
                    message: errorMessage,
                    color: "red",
                    autoClose: false,
                })
            }
            // Don't close modal on error so user can try again
        }
    }

    const handleSaveJson = (char: Character) => {
        const charData = char.data as CharacterType | undefined
        if (!charData) return

        updateHealthAndWillpowerAndBloodPotencyAndHumanity(charData)
        downloadJson(charData).catch((e) => {
            console.error(e)
            notifications.show({
                title: "Error",
                message: "Failed to download JSON",
                color: "red",
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

        downloadCharacterSheet(charData).catch((e) => {
            console.error(e)
            notifications.show({
                title: "Error",
                message: "Failed to download PDF",
                color: "red",
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
                userId: user.id,
            },
            {
                onSuccess: () => {
                    notifications.show({
                        title: "Success",
                        message: "Character unshared",
                        color: "green",
                    })
                },
                onError: (error: unknown) => {
                    notifications.show({
                        title: "Error",
                        message: error instanceof Error ? error.message : "Failed to unshare character",
                        color: "red",
                    })
                },
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
                color: "red",
            })
            return
        }

        setIsSharing(true)
        try {
            await api.shareCharacter(characterToShare.id, {
                sharedWithUserNickname: shareNickname.trim(),
            })
            queryClient.invalidateQueries({ queryKey: ["shares", characterToShare.id] })
            notifications.show({
                title: "Success",
                message: `Character shared with ${shareNickname}`,
                color: "green",
            })
            setShareNickname("")
        } catch (error) {
            notifications.show({
                title: "Error",
                message: error instanceof Error ? error.message : "Failed to share character",
                color: "red",
            })
        } finally {
            setIsSharing(false)
        }
    }

    const handleSaveCurrentAndLoad = () => {
        if (!characterToLoad) return

        // Save current character first
        if (!character.name.trim()) {
            notifications.show({
                title: "Error",
                message: "Character must have a name",
                color: "red",
            })
            return
        }

        // Create new character (since it doesn't exist in backend)
        createCharacterMutation.mutate(
            {
                name: character.name,
                data: character,
                version: character.version,
            },
            {
                onSuccess: (savedCharacter) => {
                    // Update character in memory with the ID from backend
                    const saved = savedCharacter as { id: string; name: string; data: unknown; version?: number }
                    setCharacter({
                        ...character,
                        id: saved.id,
                    })
                    notifications.show({
                        title: "Success",
                        message: `Character "${character.name}" saved`,
                        color: "green",
                    })
                    // Then load the new character
                    setCharacter({
                        ...characterToLoad.data,
                        id: characterToLoad.id,
                    } as CharacterType & { id: string })
                    notifications.show({
                        title: "Success",
                        message: `Loaded "${characterToLoad.name}"`,
                        color: "green",
                    })
                    setLoadCharacterWarningModalOpened(false)
                    setCharacterToLoad(null)
                },
                onError: (error) => {
                    notifications.show({
                        title: "Error",
                        message: error instanceof Error ? error.message : "Failed to save character",
                        color: "red",
                    })
                },
            }
        )
    }

    const handleConfirmDeleteCharacter = () => {
        if (!characterToDelete) return

        deleteCharacterMutation.mutate(characterToDelete.id, {
            onSuccess: () => {
                notifications.show({
                    title: "Success",
                    message: `Character "${characterToDelete.name}" deleted`,
                    color: "green",
                })
                setDeleteCharacterModalOpened(false)
                setCharacterToDelete(null)
            },
            onError: (error) => {
                notifications.show({
                    title: "Error",
                    message: error instanceof Error ? error.message : "Failed to delete character",
                    color: "red",
                })
            },
        })
    }

    const handleCreateCoterie = () => {
        if (!newCoterieName.trim()) {
            notifications.show({
                title: "Error",
                message: "Coterie name is required",
                color: "red",
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
                        color: "green",
                    })
                    setCreateCoterieModalOpened(false)
                    setNewCoterieName("")
                },
                onError: (error) => {
                    notifications.show({
                        title: "Error",
                        message: error instanceof Error ? error.message : "Failed to create coterie",
                        color: "red",
                    })
                },
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
                data: { name: newCoterieName.trim() },
            },
            {
                onSuccess: () => {
                    notifications.show({
                        title: "Success",
                        message: `Coterie updated`,
                        color: "green",
                    })
                    setEditCoterieModalOpened(false)
                    setEditingCoterie(null)
                    setNewCoterieName("")
                },
                onError: (error) => {
                    notifications.show({
                        title: "Error",
                        message: error instanceof Error ? error.message : "Failed to update coterie",
                        color: "red",
                    })
                },
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
                    color: "green",
                })
                setDeleteCoterieModalOpened(false)
                setCoterieToDelete(null)
            },
            onError: (error) => {
                notifications.show({
                    title: "Error",
                    message: error instanceof Error ? error.message : "Failed to delete coterie",
                    color: "red",
                })
            },
        })
    }

    const handleAddCharacterToCoterie = (coterie: Coterie) => {
        setSelectedCoterieForAdd(coterie)
        setAddCharacterToCoterieModalOpened(true)
    }

    const handleConfirmAddCharacterToCoterie = () => {
        if (!selectedCoterieForAdd || !selectedCharacterForCoterie) {
            return
        }

        addCharacterToCoterieMutation.mutate(
            {
                coterieId: selectedCoterieForAdd.id,
                characterId: selectedCharacterForCoterie,
            },
            {
                onSuccess: () => {
                    notifications.show({
                        title: "Success",
                        message: "Character added to coterie",
                        color: "green",
                    })
                    setAddCharacterToCoterieModalOpened(false)
                    setSelectedCoterieForAdd(null)
                    setSelectedCharacterForCoterie("")
                },
                onError: (error) => {
                    notifications.show({
                        title: "Error",
                        message: error instanceof Error ? error.message : "Failed to add character to coterie",
                        color: "red",
                    })
                },
            }
        )
    }

    const handleRemoveCharacterFromCoterie = (coterieId: string, characterId: string) => {
        removeCharacterFromCoterieMutation.mutate(
            { coterieId, characterId },
            {
                onSuccess: () => {
                    notifications.show({
                        title: "Success",
                        message: "Character removed from coterie",
                        color: "green",
                    })
                },
                onError: (error) => {
                    notifications.show({
                        title: "Error",
                        message: error instanceof Error ? error.message : "Failed to remove character from coterie",
                        color: "red",
                    })
                },
            }
        )
    }

    // Show loading state while checking auth
    if (authLoading) {
        return (
            <AppShell
                padding="0"
                styles={(theme) => ({
                    root: { height: "100vh" },
                    main: {
                        backgroundColor: computedColorScheme === "dark" ? theme.colors.dark[8] : theme.colors.gray[0],
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden",
                    },
                })}
            >
                <AppShell.Header p="xs" h={75}>
                    <Topbar setShowAsideBar={setShowAsideBar} showAsideBar={showAsideBar} />
                </AppShell.Header>
                <Center h="100%">
                    <Loader size="lg" color="red" />
                </Center>
            </AppShell>
        )
    }

    // Only show "not authenticated" if we've finished loading and still no user
    if (!authLoading && !isAuthenticated) {
        return (
            <AppShell
                padding="0"
                styles={(theme) => ({
                    root: { height: "100vh" },
                    main: {
                        backgroundColor: computedColorScheme === "dark" ? theme.colors.dark[8] : theme.colors.gray[0],
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden",
                    },
                })}
            >
                <AppShell.Header p="xs" h={75}>
                    <Topbar setShowAsideBar={setShowAsideBar} showAsideBar={showAsideBar} />
                </AppShell.Header>
                <Center h="100%">
                    <Card p="xl" withBorder>
                        <Stack gap="md" align="center">
                            <Text size="lg" fw={500}>
                                Please log in to view your profile
                            </Text>
                            <Button component={Link} to="/" color="red" leftSection={<IconArrowRight size={18} />}>
                                Go to Home
                            </Button>
                        </Stack>
                    </Card>
                </Center>
            </AppShell>
        )
    }

    const userCharacters = (characters as Character[]) || []
    const userCoteries = (coteries as Coterie[]) || []
    const ownedCharacters = userCharacters.filter((c) => !c.shared)

    // Find the currently loaded character in the list by ID
    const currentlyLoadedCharacter = character.id ? userCharacters.find((c) => c.id === character.id) : null
    const canSaveToExisting = currentlyLoadedCharacter && !currentlyLoadedCharacter.shared
    const showSaveCurrentButton = !canSaveToExisting && !!character.name.trim()

    return (
        <>
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
                <AppShell.Header p="xs" h={75}>
                    <Topbar setShowAsideBar={setShowAsideBar} showAsideBar={showAsideBar} />
                </AppShell.Header>
                <BackgroundImage h={"100%"} src={backgrounds[backgroundIndex]} style={{ flex: 1, minHeight: 0 }}>
                    <div
                        style={{
                            backgroundColor: "rgba(0, 0, 0, 0.7)",
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            overflow: "auto",
                            paddingTop: "75px",
                        }}
                    >
                        <Container size="lg" py="xl" style={{ width: "100%", flex: 1 }}>
                            <Group gap="md" mb="xl" justify="space-between">
                                <Group gap="md">
                                    <Button
                                        component={Link}
                                        to="/"
                                        color="red"
                                        variant="outline"
                                        leftSection={<IconArrowRight size={18} />}
                                    >
                                        Generator
                                    </Button>
                                    <Button
                                        component={Link}
                                        to="/sheet"
                                        color="red"
                                        variant="outline"
                                        leftSection={<IconArrowRight size={18} />}
                                    >
                                        Character Sheet
                                    </Button>
                                </Group>
                                <Button onClick={signOut} color="red" variant="outline">
                                    Sign Out
                                </Button>
                            </Group>
                            <Stack gap="xl">
                                <UserProfileSection
                                    user={user}
                                    isEditingNickname={isEditingNickname}
                                    nicknameValue={nicknameValue}
                                    setNicknameValue={setNicknameValue}
                                    setIsEditingNickname={setIsEditingNickname}
                                    isUpdatingProfile={isUpdatingProfile}
                                    redColorValue={redColorValue}
                                    handleSaveNickname={handleSaveNickname}
                                    handleCancelNickname={handleCancelNickname}
                                />

                                <CharactersSection
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

                                <CoteriesSection
                                    userCoteries={userCoteries}
                                    setCreateCoterieModalOpened={setCreateCoterieModalOpened}
                                    handleAddCharacterToCoterie={handleAddCharacterToCoterie}
                                    handleEditCoterie={handleEditCoterie}
                                    handleDeleteCoterie={handleDeleteCoterie}
                                    handleRemoveCharacterFromCoterie={handleRemoveCharacterFromCoterie}
                                    setCoterieForSummary={setCoterieForSummary}
                                    setCoterieSummaryModalOpened={setCoterieSummaryModalOpened}
                                />
                            </Stack>
                        </Container>
                    </div>
                </BackgroundImage>
            </AppShell>

            {/* Create Character Modal */}
            <Modal
                opened={createCharacterModalOpened}
                onClose={() => {
                    setCreateCharacterModalOpened(false)
                    setNewCharacterName("")
                }}
                title="Create Empty Character"
                centered
            >
                <Stack gap="md">
                    <FocusBorderWrapper colorValue={redColorValue}>
                        <TextInput
                            label="Character Name"
                            placeholder="Enter character name"
                            value={newCharacterName}
                            onChange={(e) => setNewCharacterName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    handleCreateEmptyCharacter()
                                }
                            }}
                        />
                    </FocusBorderWrapper>
                    <Group justify="flex-end">
                        <Button
                            variant="subtle"
                            color="red"
                            onClick={() => {
                                setCreateCharacterModalOpened(false)
                                setNewCharacterName("")
                            }}
                        >
                            Cancel
                        </Button>
                        <Button color="red" onClick={handleCreateEmptyCharacter}>
                            Create
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            {/* Create Coterie Modal */}
            <Modal
                opened={createCoterieModalOpened}
                onClose={() => {
                    setCreateCoterieModalOpened(false)
                    setNewCoterieName("")
                }}
                title="Create Coterie"
                centered
            >
                <Stack gap="md">
                    <FocusBorderWrapper colorValue={redColorValue}>
                        <TextInput
                            label="Coterie Name"
                            placeholder="Enter coterie name"
                            value={newCoterieName}
                            onChange={(e) => setNewCoterieName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    handleCreateCoterie()
                                }
                            }}
                        />
                    </FocusBorderWrapper>
                    <Group justify="flex-end">
                        <Button
                            variant="subtle"
                            color="red"
                            onClick={() => {
                                setCreateCoterieModalOpened(false)
                                setNewCoterieName("")
                            }}
                        >
                            Cancel
                        </Button>
                        <Button color="red" onClick={handleCreateCoterie}>
                            Create
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            {/* Edit Coterie Modal */}
            <Modal
                opened={editCoterieModalOpened}
                onClose={() => {
                    setEditCoterieModalOpened(false)
                    setEditingCoterie(null)
                    setNewCoterieName("")
                }}
                title="Edit Coterie"
                centered
            >
                <Stack gap="md">
                    <FocusBorderWrapper colorValue={redColorValue}>
                        <TextInput
                            label="Coterie Name"
                            placeholder="Enter coterie name"
                            value={newCoterieName}
                            onChange={(e) => setNewCoterieName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    handleUpdateCoterie()
                                }
                            }}
                        />
                    </FocusBorderWrapper>
                    <Group justify="flex-end">
                        <Button
                            variant="subtle"
                            color="red"
                            onClick={() => {
                                setEditCoterieModalOpened(false)
                                setEditingCoterie(null)
                                setNewCoterieName("")
                            }}
                        >
                            Cancel
                        </Button>
                        <Button color="red" onClick={handleUpdateCoterie}>
                            Save
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            {/* Add Character to Coterie Modal */}
            <Modal
                opened={addCharacterToCoterieModalOpened}
                onClose={() => {
                    setAddCharacterToCoterieModalOpened(false)
                    setSelectedCoterieForAdd(null)
                    setSelectedCharacterForCoterie("")
                }}
                title={`Add Character to ${selectedCoterieForAdd?.name || "Coterie"}`}
                centered
            >
                <Stack gap="md">
                    <Select
                        label="Character"
                        placeholder="Select a character"
                        data={ownedCharacters
                            .filter((char) => {
                                // Filter out characters already in this coterie
                                if (!selectedCoterieForAdd?.members) return true
                                return !selectedCoterieForAdd.members.some((m) => m.characterId === char.id)
                            })
                            .map((char) => ({ value: char.id, label: char.name }))}
                        value={selectedCharacterForCoterie}
                        onChange={(value) => setSelectedCharacterForCoterie(value || "")}
                    />
                    <Group justify="flex-end">
                        <Button
                            variant="subtle"
                            color="red"
                            onClick={() => {
                                setAddCharacterToCoterieModalOpened(false)
                                setSelectedCoterieForAdd(null)
                                setSelectedCharacterForCoterie("")
                            }}
                        >
                            Cancel
                        </Button>
                        <Button color="red" onClick={handleConfirmAddCharacterToCoterie} disabled={!selectedCharacterForCoterie}>
                            Add
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            <Modal
                opened={deleteCharacterModalOpened}
                onClose={() => {
                    setDeleteCharacterModalOpened(false)
                    setCharacterToDelete(null)
                }}
                title="Delete Character"
                centered
            >
                <Stack gap="md">
                    <Text>
                        Are you sure you want to delete <strong>{characterToDelete?.name}</strong>? This action cannot be undone.
                    </Text>
                    <Group justify="flex-end" gap="xs">
                        <Button
                            variant="subtle"
                            color="red"
                            onClick={() => {
                                setDeleteCharacterModalOpened(false)
                                setCharacterToDelete(null)
                            }}
                        >
                            Cancel
                        </Button>
                        <Button color="red" onClick={handleConfirmDeleteCharacter}>
                            Delete
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            <Modal
                opened={deleteCoterieModalOpened}
                onClose={() => {
                    setDeleteCoterieModalOpened(false)
                    setCoterieToDelete(null)
                }}
                title="Delete Coterie"
                centered
            >
                <Stack gap="md">
                    <Text>
                        Are you sure you want to delete <strong>{coterieToDelete?.name}</strong>? This action cannot be undone.
                    </Text>
                    <Group justify="flex-end" gap="xs">
                        <Button
                            variant="subtle"
                            color="red"
                            onClick={() => {
                                setDeleteCoterieModalOpened(false)
                                setCoterieToDelete(null)
                            }}
                        >
                            Cancel
                        </Button>
                        <Button color="red" onClick={handleConfirmDeleteCoterie}>
                            Delete
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            <Modal
                opened={loadCharacterWarningModalOpened}
                onClose={() => {
                    setLoadCharacterWarningModalOpened(false)
                    setCharacterToLoad(null)
                    setLoadingCharacterId(null)
                }}
                title="Warning: Unsaved Character"
                centered
            >
                <Stack gap="md">
                    <Text>
                        Loading <strong>{characterToLoad?.name}</strong> will overwrite your current unsaved character{" "}
                        <strong>{character.name || "Untitled"}</strong>. Your current character has not been saved to the backend.
                    </Text>
                    <Text c="dimmed" size="sm">
                        You can save your current character first, or load the new character anyway (which will discard your current
                        changes).
                    </Text>
                    <Group justify="flex-end" gap="xs">
                        <Button
                            variant="subtle"
                            color="red"
                            onClick={() => {
                                setLoadCharacterWarningModalOpened(false)
                                setCharacterToLoad(null)
                                setLoadingCharacterId(null)
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            color="red"
                            variant="light"
                            leftSection={<IconDownload size={16} />}
                            onClick={handleSaveCurrentAndLoad}
                            disabled={isAnyOperationInFlight}
                            loading={isSavingCharacter}
                        >
                            Save Current Character
                        </Button>
                        <Button
                            color="red"
                            onClick={handleConfirmLoadCharacter}
                            disabled={isAnyOperationInFlight}
                            loading={isLoadingCharacter}
                        >
                            Load Anyway
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            <Modal
                opened={shareCharacterModalOpened}
                onClose={() => {
                    setShareCharacterModalOpened(false)
                    setCharacterToShare(null)
                    setShareNickname("")
                }}
                title="Share Character"
                centered
            >
                <ShareCharacterModalContent
                    characterToShare={characterToShare}
                    shareNickname={shareNickname}
                    setShareNickname={setShareNickname}
                    isSharing={isSharing}
                    redColorValue={redColorValue}
                    handleConfirmShare={handleConfirmShare}
                    onClose={() => {
                        setShareCharacterModalOpened(false)
                        setCharacterToShare(null)
                        setShareNickname("")
                    }}
                />
            </Modal>

            <Modal opened={loadJsonModalOpened} onClose={() => setLoadJsonModalOpened(false)} title="" centered withCloseButton={false}>
                <Stack>
                    <Text fz="xl" ta="center">
                        Overwrite current character and load from selected file?
                    </Text>
                    <Divider my="sm" />
                    <Group justify="space-between">
                        <Button
                            color="yellow"
                            variant="subtle"
                            leftSection={<IconTrash size={16} />}
                            onClick={() => {
                                setLoadJsonModalOpened(false)
                                setLoadedFile(null)
                            }}
                        >
                            Cancel
                        </Button>
                        <Button color="red" onClick={handleConfirmLoadJson}>
                            Load/Overwrite character
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            <Modal
                opened={versionConflictModalOpened}
                onClose={() => {
                    setVersionConflictModalOpened(false)
                    setVersionConflictInfo(null)
                    setCharacterToLoad(null)
                }}
                title="Version Conflict"
                centered
            >
                <Stack gap="md">
                    <Text>
                        {characterToLoad
                            ? `Character version in database (${versionConflictInfo?.beVersion ?? 0}) is lower than in browser (${versionConflictInfo?.feVersion ?? 0}) - loading will overwrite your current changes with an older version.`
                            : `Character version in database (${versionConflictInfo?.beVersion ?? 0}) is higher than in browser (${versionConflictInfo?.feVersion ?? 0}) - saving might overwrite changes you made on another device.`}
                    </Text>
                    <Group justify="flex-end" gap="xs">
                        <Button
                            variant="subtle"
                            color="red"
                            onClick={() => {
                                setVersionConflictModalOpened(false)
                                setVersionConflictInfo(null)
                                setCharacterToLoad(null)
                            }}
                        >
                            Cancel
                        </Button>
                        <Button color="red" onClick={handleConfirmOverwriteVersion}>
                            {characterToLoad ? "Load older version" : "Overwrite DB version"}
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            {/* Coterie Summary Modal */}
            <Modal
                opened={coterieSummaryModalOpened}
                onClose={() => {
                    setCoterieSummaryModalOpened(false)
                    setCoterieForSummary(null)
                }}
                title={
                    <Group gap="xs">
                        <IconUsers size={20} />
                        <Text fw={600} size="lg">
                            Coterie Summary: {coterieForSummary?.name || ""}
                        </Text>
                    </Group>
                }
                centered
                size="xl"
            >
                {coterieForSummary && coterieForSummary.members && coterieForSummary.members.length > 0 ? (
                    <CoterieSummaryContent members={coterieForSummary.members} theme={theme} />
                ) : (
                    <Text c="dimmed">No members in this coterie.</Text>
                )}
            </Modal>

            <Modal
                opened={summaryModalOpened}
                onClose={() => {
                    setSummaryModalOpened(false)
                    setCharacterForSummary(null)
                }}
                title={
                    <Group gap="xs">
                        <IconInfoCircle size={20} />
                        <Text fw={600} size="lg">
                            Character Summary
                        </Text>
                    </Group>
                }
                centered
                size="xl"
            >
                {characterForSummary?.data ? (
                    <CharacterSummaryContent
                        character={characterForSummary.data as CharacterType}
                        characterName={characterForSummary.name}
                        theme={theme}
                    />
                ) : null}
            </Modal>
        </>
    )
}

type CoterieSummaryContentProps = {
    members: Array<{ characterId: string; character?: Character }>
    theme: ReturnType<typeof useMantineTheme>
}

// TODOdin: Move modals and their contents from MePage into their own components under sections/
const CoterieSummaryContent = ({ members, theme }: CoterieSummaryContentProps) => {
    const getDisciplineCategory = (disciplineName: DisciplineName): "physical" | "social" | "mental" => {
        const physicalDisciplines: DisciplineName[] = ["celerity", "potence", "fortitude", "protean"]
        const socialDisciplines: DisciplineName[] = ["presence", "dominate", "obfuscate", "animalism"]
        const mentalDisciplines: DisciplineName[] = ["auspex", "blood sorcery", "oblivion", "thin-blood alchemy"]

        if (physicalDisciplines.includes(disciplineName)) return "physical"
        if (socialDisciplines.includes(disciplineName)) return "social"
        if (mentalDisciplines.includes(disciplineName)) return "mental"
        return "physical"
    }

    const calculateCharacterStrength = (
        character: CharacterType
    ): {
        physical: number
        social: number
        mental: number
        dominant: "physical" | "social" | "mental"
    } => {
        const physicalAttributes = ["strength", "dexterity", "stamina"] as const
        const socialAttributes = ["charisma", "manipulation", "composure"] as const
        const mentalAttributes = ["intelligence", "wits", "resolve"] as const

        const physicalSkills = ["athletics", "brawl", "craft", "drive", "firearms", "melee", "larceny", "stealth", "survival"] as const
        const socialSkills = [
            "animal ken",
            "etiquette",
            "insight",
            "intimidation",
            "leadership",
            "performance",
            "persuasion",
            "streetwise",
            "subterfuge",
        ] as const
        const mentalSkills = [
            "academics",
            "awareness",
            "finance",
            "investigation",
            "medicine",
            "occult",
            "politics",
            "science",
            "technology",
        ] as const

        let physicalScore = 0
        let socialScore = 0
        let mentalScore = 0

        console.log({ character })
        console.log(character.attributes)

        // TODOdin: Why does this explode with `Cannot read properties of undefined (reading 'strength')`?
        physicalAttributes.forEach((attr) => {
            const key = attributesKeySchema.parse(attr)
            physicalScore += character.attributes[key] ?? 0
        })

        socialAttributes.forEach((attr) => {
            const key = attributesKeySchema.parse(attr)
            socialScore += character.attributes[key] ?? 0
        })

        mentalAttributes.forEach((attr) => {
            const key = attributesKeySchema.parse(attr)
            mentalScore += character.attributes[key] ?? 0
        })

        physicalSkills.forEach((skill) => {
            const key = skillsKeySchema.parse(skill)
            physicalScore += character.skills[key] ?? 0
        })

        socialSkills.forEach((skill) => {
            const key = skillsKeySchema.parse(skill)
            socialScore += character.skills[key] ?? 0
        })

        mentalSkills.forEach((skill) => {
            const key = skillsKeySchema.parse(skill)
            mentalScore += character.skills[key] ?? 0
        })

        character.disciplines.forEach((power) => {
            const category = getDisciplineCategory(power.discipline)
            const level = power.level
            if (category === "physical") physicalScore += level * 2
            if (category === "social") socialScore += level * 2
            if (category === "mental") mentalScore += level * 2
        })

        const dominant =
            physicalScore > socialScore && physicalScore > mentalScore ? "physical" : socialScore > mentalScore ? "social" : "mental"

        return { physical: physicalScore, social: socialScore, mental: mentalScore, dominant }
    }

    const getBackgroundColor = (dominant: "physical" | "social" | "mental"): string => {
        const opacity = 0.15
        if (dominant === "physical") {
            return `rgba(220, 38, 38, ${opacity})`
        } else if (dominant === "social") {
            return `rgba(147, 51, 234, ${opacity})`
        } else {
            return `rgba(59, 130, 246, ${opacity})`
        }
    }

    const getBorderColor = (dominant: "physical" | "social" | "mental"): string => {
        if (dominant === "physical") {
            return theme.colors.red[6]
        } else if (dominant === "social") {
            return theme.colors.grape[6]
        } else {
            return theme.colors.blue[6]
        }
    }

    return (
        <Grid>
            {/* TODOdin: Fix typing on member.character - looks like member.character.data is a json string */}
            {members
                .filter((m) => m.character?.data)
                .map((member) => {
                    const character = characterSchema.parse(JSON.parse(member.character?.data as string))
                    const strength = calculateCharacterStrength(character)
                    const clan = character.clan ? clans[character.clan] : null
                    const backgroundColor = getBackgroundColor(strength.dominant)
                    const borderColor = getBorderColor(strength.dominant)

                    return (
                        <Grid.Col key={member.characterId} span={{ base: 12, md: 6, lg: 4 }}>
                            <Paper
                                p="md"
                                withBorder
                                radius="md"
                                style={{
                                    backgroundColor,
                                    borderColor,
                                    borderWidth: 2,
                                }}
                            >
                                <Stack gap="sm">
                                    <Group gap="sm" justify="space-between">
                                        <Group gap="sm">
                                            {clan?.logo ? (
                                                <Box
                                                    style={{
                                                        width: "40px",
                                                        height: "40px",
                                                        backgroundColor: borderColor,
                                                        maskImage: `url(${clan.logo})`,
                                                        maskSize: "contain",
                                                        maskRepeat: "no-repeat",
                                                        maskPosition: "center",
                                                        WebkitMaskImage: `url(${clan.logo})`,
                                                        WebkitMaskSize: "contain",
                                                        WebkitMaskRepeat: "no-repeat",
                                                        WebkitMaskPosition: "center",
                                                    }}
                                                />
                                            ) : null}
                                            <Stack gap={2}>
                                                <Text fw={600} size="lg">
                                                    {character.name}
                                                </Text>
                                                {character.player ? (
                                                    <Text size="sm" c="dimmed">
                                                        {character.player}
                                                    </Text>
                                                ) : null}
                                            </Stack>
                                        </Group>
                                    </Group>
                                </Stack>
                            </Paper>
                        </Grid.Col>
                    )
                })}
        </Grid>
    )
}

type CharacterSummaryContentProps = {
    character: CharacterType
    characterName: string
    theme: ReturnType<typeof useMantineTheme>
}

const CharacterSummaryContent = ({ character, characterName, theme }: CharacterSummaryContentProps) => {
    const redColorValue = theme.colors.red[6]

    const physicalAttributes = ["strength", "dexterity", "stamina"] as const
    const socialAttributes = ["charisma", "manipulation", "composure"] as const
    const mentalAttributes = ["intelligence", "wits", "resolve"] as const

    const physicalSkills = ["athletics", "brawl", "craft", "drive", "firearms", "melee", "larceny", "stealth", "survival"] as const
    const socialSkills = [
        "animal ken",
        "etiquette",
        "insight",
        "intimidation",
        "leadership",
        "performance",
        "persuasion",
        "streetwise",
        "subterfuge",
    ] as const
    const mentalSkills = [
        "academics",
        "awareness",
        "finance",
        "investigation",
        "medicine",
        "occult",
        "politics",
        "science",
        "technology",
    ] as const

    const renderPips = (level: number, minLevel: number = 0) => {
        return "●".repeat(level) + "○".repeat(5 - level)
    }

    const disciplineGroups = character.disciplines.reduce(
        (acc, power) => {
            if (!acc[power.discipline]) {
                acc[power.discipline] = []
            }
            acc[power.discipline].push(power)
            return acc
        },
        {} as Record<DisciplineName, typeof character.disciplines>
    )

    const clan = character.clan ? clans[character.clan] : null

    return (
        <Accordion variant="separated" radius="md" chevronPosition="left">
            <Accordion.Item value="identity">
                <Accordion.Control>
                    <Group gap="sm" align="center">
                        {clan?.logo ? (
                            <Box
                                style={{
                                    width: "32px",
                                    height: "32px",
                                    backgroundColor: redColorValue,
                                    maskImage: `url(${clan.logo})`,
                                    maskSize: "contain",
                                    maskRepeat: "no-repeat",
                                    maskPosition: "center",
                                    WebkitMaskImage: `url(${clan.logo})`,
                                    WebkitMaskSize: "contain",
                                    WebkitMaskRepeat: "no-repeat",
                                    WebkitMaskPosition: "center",
                                }}
                            />
                        ) : null}
                        <Text fw={600} size="lg" c={redColorValue}>
                            {characterName || "Unnamed Character"}
                        </Text>
                    </Group>
                </Accordion.Control>
                <Accordion.Panel>
                    <Stack gap="md">
                        <Grid>
                            <Grid.Col span={{ base: 12, md: 4 }}>
                                <Stack gap="xs">
                                    <Group justify="space-between">
                                        <Text fw={500} size="sm" c="dimmed">
                                            Clan
                                        </Text>
                                        <Text fw={500}>{clan?.name || character.clan || "—"}</Text>
                                    </Group>
                                    <Group justify="space-between">
                                        <Text fw={500} size="sm" c="dimmed">
                                            Predator Type
                                        </Text>
                                        <Text>{character.predatorType.name || "—"}</Text>
                                    </Group>
                                </Stack>
                            </Grid.Col>
                            <Grid.Col span={{ base: 12, md: 4 }}>
                                <Stack gap="xs">
                                    <Group justify="space-between">
                                        <Text fw={500} size="sm" c="dimmed">
                                            Ambition
                                        </Text>
                                        <Text>{character.ambition || "—"}</Text>
                                    </Group>
                                    <Group justify="space-between">
                                        <Text fw={500} size="sm" c="dimmed">
                                            Desire
                                        </Text>
                                        <Text>{character.desire || "—"}</Text>
                                    </Group>
                                    {character.player ? (
                                        <Group justify="space-between">
                                            <Text fw={500} size="sm" c="dimmed">
                                                Player
                                            </Text>
                                            <Text>{character.player}</Text>
                                        </Group>
                                    ) : null}
                                </Stack>
                            </Grid.Col>
                            <Grid.Col span={{ base: 12, md: 4 }}>
                                <Stack gap="xs">
                                    {character.generation ? (
                                        <Group justify="space-between">
                                            <Text fw={500} size="sm" c="dimmed">
                                                Generation
                                            </Text>
                                            <Text>{character.generation}</Text>
                                        </Group>
                                    ) : null}
                                    {character.sire ? (
                                        <Group justify="space-between">
                                            <Text fw={500} size="sm" c="dimmed">
                                                Sire
                                            </Text>
                                            <Text>{character.sire}</Text>
                                        </Group>
                                    ) : null}
                                </Stack>
                            </Grid.Col>
                        </Grid>
                        {character.description ? (
                            <Paper p="md" withBorder radius="md" style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}>
                                <Text fw={500} size="sm" mb="xs" c="dimmed">
                                    Description
                                </Text>
                                <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                                    {character.description}
                                </Text>
                            </Paper>
                        ) : null}
                    </Stack>
                </Accordion.Panel>
            </Accordion.Item>

            <Accordion.Item value="attributes">
                <Accordion.Control>
                    <Text fw={600} size="lg">
                        Attributes
                    </Text>
                </Accordion.Control>
                <Accordion.Panel>
                    <Grid>
                        <Grid.Col span={{ base: 12, md: 4 }}>
                            <Text fw={500} size="sm" c="dimmed" mb="sm">
                                PHYSICAL
                            </Text>
                            <Stack gap="xs">
                                {physicalAttributes.map((attr) => {
                                    const key = attributesKeySchema.parse(attr)
                                    return (
                                        <Group key={attr} justify="space-between">
                                            <Text style={{ fontFamily: "Courier New" }}>{upcase(attr)}</Text>
                                            <Text style={{ fontFamily: "Courier New" }} c={redColorValue}>
                                                {renderPips(character.attributes[key], 1)}
                                            </Text>
                                        </Group>
                                    )
                                })}
                            </Stack>
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 4 }}>
                            <Text fw={500} size="sm" c="dimmed" mb="sm">
                                SOCIAL
                            </Text>
                            <Stack gap="xs">
                                {socialAttributes.map((attr) => {
                                    const key = attributesKeySchema.parse(attr)
                                    return (
                                        <Group key={attr} justify="space-between">
                                            <Text style={{ fontFamily: "Courier New" }}>{upcase(attr)}</Text>
                                            <Text style={{ fontFamily: "Courier New" }} c={redColorValue}>
                                                {renderPips(character.attributes[key], 1)}
                                            </Text>
                                        </Group>
                                    )
                                })}
                            </Stack>
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 4 }}>
                            <Text fw={500} size="sm" c="dimmed" mb="sm">
                                MENTAL
                            </Text>
                            <Stack gap="xs">
                                {mentalAttributes.map((attr) => {
                                    const key = attributesKeySchema.parse(attr)
                                    return (
                                        <Group key={attr} justify="space-between">
                                            <Text style={{ fontFamily: "Courier New" }}>{upcase(attr)}</Text>
                                            <Text style={{ fontFamily: "Courier New" }} c={redColorValue}>
                                                {renderPips(character.attributes[key], 1)}
                                            </Text>
                                        </Group>
                                    )
                                })}
                            </Stack>
                        </Grid.Col>
                    </Grid>
                </Accordion.Panel>
            </Accordion.Item>

            <Accordion.Item value="skills">
                <Accordion.Control>
                    <Text fw={600} size="lg">
                        Skills
                    </Text>
                </Accordion.Control>
                <Accordion.Panel>
                    <Grid>
                        <Grid.Col span={{ base: 12, md: 4 }}>
                            <Text fw={500} size="sm" c="dimmed" mb="sm">
                                PHYSICAL
                            </Text>
                            <Stack gap="xs">
                                {physicalSkills.map((skill) => {
                                    const key = skillsKeySchema.parse(skill)
                                    const level = character.skills[key]
                                    if (level === 0) return null
                                    const specialties = character.skillSpecialties.filter((s) => s.skill === skill)
                                    return (
                                        <div key={skill}>
                                            <Group justify="space-between">
                                                <Text style={{ fontFamily: "Courier New" }}>{upcase(skill)}</Text>
                                                <Text style={{ fontFamily: "Courier New" }} c={redColorValue}>
                                                    {renderPips(level)}
                                                </Text>
                                            </Group>
                                            {specialties.length > 0 ? (
                                                <Text size="xs" c="dimmed" ml="md">
                                                    Specialties: {specialties.map((s) => s.name).join(", ")}
                                                </Text>
                                            ) : null}
                                        </div>
                                    )
                                })}
                            </Stack>
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 4 }}>
                            <Text fw={500} size="sm" c="dimmed" mb="sm">
                                SOCIAL
                            </Text>
                            <Stack gap="xs">
                                {socialSkills.map((skill) => {
                                    const key = skillsKeySchema.parse(skill)
                                    const level = character.skills[key]
                                    if (level === 0) return null
                                    const specialties = character.skillSpecialties.filter((s) => s.skill === skill)
                                    return (
                                        <div key={skill}>
                                            <Group justify="space-between">
                                                <Text style={{ fontFamily: "Courier New" }}>{upcase(skill)}</Text>
                                                <Text style={{ fontFamily: "Courier New" }} c={redColorValue}>
                                                    {renderPips(level)}
                                                </Text>
                                            </Group>
                                            {specialties.length > 0 ? (
                                                <Text size="xs" c="dimmed" ml="md">
                                                    Specialties: {specialties.map((s) => s.name).join(", ")}
                                                </Text>
                                            ) : null}
                                        </div>
                                    )
                                })}
                            </Stack>
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 4 }}>
                            <Text fw={500} size="sm" c="dimmed" mb="sm">
                                MENTAL
                            </Text>
                            <Stack gap="xs">
                                {mentalSkills.map((skill) => {
                                    const key = skillsKeySchema.parse(skill)
                                    const level = character.skills[key]
                                    if (level === 0) return null
                                    const specialties = character.skillSpecialties.filter((s) => s.skill === skill)
                                    return (
                                        <div key={skill}>
                                            <Group justify="space-between">
                                                <Text style={{ fontFamily: "Courier New" }}>{upcase(skill)}</Text>
                                                <Text style={{ fontFamily: "Courier New" }} c={redColorValue}>
                                                    {renderPips(level)}
                                                </Text>
                                            </Group>
                                            {specialties.length > 0 ? (
                                                <Text size="xs" c="dimmed" ml="md">
                                                    Specialties: {specialties.map((s) => s.name).join(", ")}
                                                </Text>
                                            ) : null}
                                        </div>
                                    )
                                })}
                            </Stack>
                        </Grid.Col>
                    </Grid>
                </Accordion.Panel>
            </Accordion.Item>

            <Accordion.Item value="disciplines">
                <Accordion.Control>
                    <Text fw={600} size="lg">
                        Disciplines & Powers
                    </Text>
                </Accordion.Control>
                <Accordion.Panel>
                    <Stack gap="md">
                        {Object.entries(disciplineGroups).map(([disciplineName, powers]) => {
                            const sortedPowers = [...powers].sort((a, b) => a.level - b.level)
                            return (
                                <Paper key={disciplineName} p="md" withBorder radius="md">
                                    <Group gap="xs" mb="sm">
                                        <Text fw={600} size="md">
                                            {upcase(disciplineName)}
                                        </Text>
                                        <Badge size="sm" color="red" variant="light">
                                            Level {Math.max(...sortedPowers.map((p) => p.level))}
                                        </Badge>
                                    </Group>
                                    <Stack gap="xs">
                                        {sortedPowers.map((power) => (
                                            <div key={power.name}>
                                                <Group justify="space-between" mb={2}>
                                                    <Text fw={500} size="sm">
                                                        {power.name}
                                                    </Text>
                                                    <Badge size="xs" color="red" variant="outline">
                                                        Level {power.level}
                                                    </Badge>
                                                </Group>
                                                <Text size="xs" c="dimmed" ml="md">
                                                    {power.summary}
                                                </Text>
                                            </div>
                                        ))}
                                    </Stack>
                                </Paper>
                            )
                        })}
                        {character.rituals.length > 0 ? (
                            <Paper p="md" withBorder radius="md">
                                <Text fw={600} size="md" mb="sm">
                                    Rituals
                                </Text>
                                <Stack gap="xs">
                                    {character.rituals.map((ritual) => (
                                        <div key={ritual.name}>
                                            <Group justify="space-between" mb={2}>
                                                <Text fw={500} size="sm">
                                                    {ritual.name}
                                                </Text>
                                                <Badge size="xs" color="red" variant="outline">
                                                    Level {ritual.level}
                                                </Badge>
                                            </Group>
                                            <Text size="xs" c="dimmed" ml="md">
                                                {ritual.summary}
                                            </Text>
                                        </div>
                                    ))}
                                </Stack>
                            </Paper>
                        ) : null}
                    </Stack>
                </Accordion.Panel>
            </Accordion.Item>

            <Accordion.Item value="merits-flaws">
                <Accordion.Control>
                    <Text fw={600} size="lg">
                        Merits & Flaws
                    </Text>
                </Accordion.Control>
                <Accordion.Panel>
                    <Grid>
                        <Grid.Col span={{ base: 12, md: 6 }}>
                            <Text fw={500} size="sm" c="dimmed" mb="sm">
                                MERITS
                            </Text>
                            <Stack gap="xs">
                                {character.merits.length > 0 ? (
                                    character.merits.map((merit, idx) => (
                                        <Paper key={idx} p="xs" withBorder radius="sm">
                                            <Group justify="space-between" mb={2}>
                                                <Text fw={500} size="sm">
                                                    {merit.name}
                                                </Text>
                                                <Badge size="xs" color="green" variant="light">
                                                    {merit.level}
                                                </Badge>
                                            </Group>
                                            <Text size="xs" c="dimmed">
                                                {merit.summary}
                                            </Text>
                                        </Paper>
                                    ))
                                ) : (
                                    <Text size="sm" c="dimmed" fs="italic">
                                        No merits
                                    </Text>
                                )}
                            </Stack>
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 6 }}>
                            <Text fw={500} size="sm" c="dimmed" mb="sm">
                                FLAWS
                            </Text>
                            <Stack gap="xs">
                                {character.flaws.length > 0 ? (
                                    character.flaws.map((flaw, idx) => (
                                        <Paper key={idx} p="xs" withBorder radius="sm">
                                            <Group justify="space-between" mb={2}>
                                                <Text fw={500} size="sm">
                                                    {flaw.name}
                                                </Text>
                                                <Badge size="xs" color="red" variant="light">
                                                    {flaw.level}
                                                </Badge>
                                            </Group>
                                            <Text size="xs" c="dimmed">
                                                {flaw.summary}
                                            </Text>
                                        </Paper>
                                    ))
                                ) : (
                                    <Text size="sm" c="dimmed" fs="italic">
                                        No flaws
                                    </Text>
                                )}
                            </Stack>
                        </Grid.Col>
                    </Grid>
                </Accordion.Panel>
            </Accordion.Item>
        </Accordion>
    )
}

export default MePage
