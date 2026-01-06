import {
    ActionIcon,
    AppShell,
    BackgroundImage,
    Badge,
    Button,
    Card,
    Center,
    Container,
    Divider,
    Group,
    Loader,
    Menu,
    Modal,
    Paper,
    Select,
    Stack,
    Text,
    TextInput,
    Title,
    useComputedColorScheme,
} from "@mantine/core"
import { notifications } from "@mantine/notifications"
import {
    IconArrowRight,
    IconDots,
    IconDownload,
    IconDroplet,
    IconEdit,
    IconPlus,
    IconTrash,
    IconUpload,
    IconUser,
    IconUsers,
} from "@tabler/icons-react"
import { useEffect, useState } from "react"
import { Character as CharacterType, getEmptyCharacter } from "~/data/Character"
import { rndInt } from "~/generator/utils"
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
import club from "~/resources/backgrounds/aleksandr-popov-3InMDrsuYrk-unsplash.jpg"
import brokenDoor from "~/resources/backgrounds/amber-kipp-VcPo_DvKjQE-unsplash.jpg"
import city from "~/resources/backgrounds/dominik-hofbauer-IculuMoubkQ-unsplash.jpg"
import bloodGuy from "~/resources/backgrounds/marcus-bellamy-xvW725b6LQk-unsplash.jpg"
import batWoman from "~/resources/backgrounds/peter-scherbatykh-VzQWVqHOCaE-unsplash.jpg"
import alley from "~/resources/backgrounds/thomas-le-KNQEvvCGoew-unsplash.jpg"
import Topbar from "~/topbar/Topbar"

const backgrounds = [club, brokenDoor, city, bloodGuy, batWoman, alley]

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
    const { user, loading: authLoading, isAuthenticated, updateProfile, isUpdatingProfile } = useAuth()
    const { data: characters } = useCharacters()
    const { data: coteries } = useCoteries()
    const [character, setCharacter] = useCharacterLocalStorage()
    const computedColorScheme = useComputedColorScheme("dark", { getInitialValueInEffect: true })
    const [showAsideBar, setShowAsideBar] = useState(!globals.isSmallScreen)
    const [backgroundIndex] = useState(rndInt(0, backgrounds.length))

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

    // Modals
    const [createCharacterModalOpened, setCreateCharacterModalOpened] = useState(false)
    const [createCoterieModalOpened, setCreateCoterieModalOpened] = useState(false)
    const [editCoterieModalOpened, setEditCoterieModalOpened] = useState(false)
    const [addCharacterToCoterieModalOpened, setAddCharacterToCoterieModalOpened] = useState(false)
    const [newCharacterName, setNewCharacterName] = useState("")
    const [newCoterieName, setNewCoterieName] = useState("")
    const [editingCoterie, setEditingCoterie] = useState<Coterie | null>(null)
    const [selectedCoterieForAdd, setSelectedCoterieForAdd] = useState<Coterie | null>(null)
    const [selectedCharacterForCoterie, setSelectedCharacterForCoterie] = useState<string>("")

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

    const handleSaveCurrentCharacter = () => {
        if (!character.name.trim()) {
            notifications.show({
                title: "Error",
                message: "Character must have a name",
                color: "red",
            })
            return
        }

        // Check if character already exists
        const existingCharacter = userCharacters.find((c) => c.name === character.name && !c.shared)

        if (existingCharacter) {
            // Update existing character
            updateCharacterMutation.mutate(
                {
                    id: existingCharacter.id,
                    data: {
                        name: character.name,
                        data: character,
                        version: character.version,
                    },
                },
                {
                    onSuccess: () => {
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
                    onSuccess: () => {
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

    const handleDeleteCharacter = (characterId: string, characterName: string) => {
        if (confirm(`Are you sure you want to delete "${characterName}"?`)) {
            deleteCharacterMutation.mutate(characterId, {
                onSuccess: () => {
                    notifications.show({
                        title: "Success",
                        message: `Character "${characterName}" deleted`,
                        color: "green",
                    })
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
        if (confirm(`Are you sure you want to delete "${coterieName}"?`)) {
            deleteCoterieMutation.mutate(coterieId, {
                onSuccess: () => {
                    notifications.show({
                        title: "Success",
                        message: `Coterie "${coterieName}" deleted`,
                        color: "green",
                    })
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
                    <Loader size="lg" />
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
                            <Button component="a" href="/" color="red" leftSection={<IconArrowRight size={18} />}>
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
                            <Group gap="md" mb="xl" justify="flex-start">
                                <Button component="a" href="/" color="red" variant="outline" leftSection={<IconArrowRight size={18} />}>
                                    Generator
                                </Button>
                                <Button
                                    component="a"
                                    href="/sheet"
                                    color="red"
                                    variant="outline"
                                    leftSection={<IconArrowRight size={18} />}
                                >
                                    Character Sheet
                                </Button>
                            </Group>
                            <Stack gap="xl">
                                <Card p="xl" withBorder style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}>
                                    <Group gap="md" mb="md">
                                        <IconUser size={32} />
                                        <Title order={2}>User Profile</Title>
                                    </Group>
                                    <Stack gap="sm">
                                        <Group gap="xs">
                                            <Text fw={500}>Email:</Text>
                                            <Text>{user?.email}</Text>
                                        </Group>
                                        {user?.firstName || user?.lastName ? (
                                            <Group gap="xs">
                                                <Text fw={500}>Name:</Text>
                                                <Text>{[user?.firstName, user?.lastName].filter(Boolean).join(" ")}</Text>
                                            </Group>
                                        ) : null}
                                        <Group gap="xs" align="flex-start">
                                            <Text fw={500} style={{ minWidth: "80px" }}>
                                                Nickname:
                                            </Text>
                                            {isEditingNickname ? (
                                                <Stack gap="xs" style={{ flex: 1 }}>
                                                    <TextInput
                                                        value={nicknameValue}
                                                        onChange={(e) => setNicknameValue(e.target.value)}
                                                        placeholder="Enter nickname"
                                                        maxLength={255}
                                                        disabled={isUpdatingProfile}
                                                    />
                                                    <Group gap="xs">
                                                        <Button
                                                            size="xs"
                                                            color="red"
                                                            onClick={handleSaveNickname}
                                                            loading={isUpdatingProfile}
                                                        >
                                                            Save
                                                        </Button>
                                                        <Button
                                                            size="xs"
                                                            variant="subtle"
                                                            onClick={handleCancelNickname}
                                                            disabled={isUpdatingProfile}
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </Group>
                                                </Stack>
                                            ) : (
                                                <Group gap="xs" style={{ flex: 1 }}>
                                                    <Text>{user?.nickname || <Text c="dimmed">No nickname set</Text>}</Text>
                                                    <ActionIcon
                                                        color="red"
                                                        size="sm"
                                                        variant="subtle"
                                                        onClick={() => setIsEditingNickname(true)}
                                                    >
                                                        <IconEdit size={16} />
                                                    </ActionIcon>
                                                </Group>
                                            )}
                                        </Group>
                                    </Stack>
                                </Card>

                                <Card p="xl" withBorder style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}>
                                    <Group gap="md" mb="md" justify="space-between">
                                        <Group gap="md">
                                            <IconDroplet size={32} />
                                            <Title order={2}>Characters</Title>
                                            <Badge size="lg" variant="light" color="red">
                                                {userCharacters.length}
                                            </Badge>
                                        </Group>
                                        <Group gap="xs">
                                            <Button
                                                leftSection={<IconPlus size={16} />}
                                                color="red"
                                                onClick={() => setCreateCharacterModalOpened(true)}
                                            >
                                                Create Empty
                                            </Button>
                                            <Button
                                                leftSection={<IconDownload size={16} />}
                                                color="red"
                                                variant="light"
                                                onClick={handleSaveCurrentCharacter}
                                                disabled={!character.name.trim()}
                                            >
                                                Save Current
                                            </Button>
                                        </Group>
                                    </Group>
                                    {userCharacters.length === 0 ? (
                                        <Text c="dimmed">No characters yet. Create one in the generator!</Text>
                                    ) : (
                                        <Stack gap="sm">
                                            {userCharacters.map((char) => (
                                                <Paper key={char.id} p="md" withBorder style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}>
                                                    <Group justify="space-between">
                                                        <Group gap="sm">
                                                            <Text fw={500}>{char.name}</Text>
                                                            {char.shared ? (
                                                                <Badge size="sm" color="red" variant="light">
                                                                    Shared
                                                                </Badge>
                                                            ) : null}
                                                        </Group>
                                                        <Group gap="xs">
                                                            {!char.shared ? (
                                                                <>
                                                                    <Button
                                                                        size="sm"
                                                                        color="red"
                                                                        variant="light"
                                                                        leftSection={<IconUpload size={14} />}
                                                                        onClick={() => {
                                                                            // Load character into localStorage
                                                                            const charData = char.data as CharacterType
                                                                            if (charData) {
                                                                                setCharacter(charData)
                                                                                notifications.show({
                                                                                    title: "Success",
                                                                                    message: `Loaded "${char.name}"`,
                                                                                    color: "green",
                                                                                })
                                                                                window.location.href = "/sheet"
                                                                            }
                                                                        }}
                                                                    >
                                                                        Load
                                                                    </Button>
                                                                    <Menu>
                                                                        <Menu.Target>
                                                                            <ActionIcon color="red" variant="light">
                                                                                <IconDots size={16} />
                                                                            </ActionIcon>
                                                                        </Menu.Target>
                                                                        <Menu.Dropdown>
                                                                            <Menu.Item
                                                                                leftSection={<IconTrash size={14} />}
                                                                                color="red"
                                                                                onClick={() => handleDeleteCharacter(char.id, char.name)}
                                                                            >
                                                                                Delete
                                                                            </Menu.Item>
                                                                        </Menu.Dropdown>
                                                                    </Menu>
                                                                </>
                                                            ) : (
                                                                <Button
                                                                    size="sm"
                                                                    color="red"
                                                                    variant="light"
                                                                    leftSection={<IconUpload size={14} />}
                                                                    onClick={() => {
                                                                        const charData = char.data as CharacterType
                                                                        if (charData) {
                                                                            setCharacter(charData)
                                                                            notifications.show({
                                                                                title: "Success",
                                                                                message: `Loaded "${char.name}"`,
                                                                                color: "green",
                                                                            })
                                                                            window.location.href = "/sheet"
                                                                        }
                                                                    }}
                                                                >
                                                                    View
                                                                </Button>
                                                            )}
                                                        </Group>
                                                    </Group>
                                                </Paper>
                                            ))}
                                        </Stack>
                                    )}
                                </Card>

                                <Card p="xl" withBorder style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}>
                                    <Group gap="md" mb="md" justify="space-between">
                                        <Group gap="md">
                                            <IconUsers size={32} />
                                            <Title order={2}>Coteries</Title>
                                            <Badge size="lg" variant="light" color="red">
                                                {userCoteries.length}
                                            </Badge>
                                        </Group>
                                        <Button
                                            leftSection={<IconPlus size={16} />}
                                            color="red"
                                            onClick={() => setCreateCoterieModalOpened(true)}
                                        >
                                            Create Coterie
                                        </Button>
                                    </Group>
                                    {userCoteries.length === 0 ? (
                                        <Text c="dimmed">No coteries yet. Create one to organize your characters!</Text>
                                    ) : (
                                        <Stack gap="md">
                                            {userCoteries.map((coterie) => (
                                                <Paper key={coterie.id} p="md" withBorder style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}>
                                                    <Stack gap="sm">
                                                        <Group justify="space-between">
                                                            <Group gap="sm">
                                                                <Text fw={500}>{coterie.name}</Text>
                                                                {coterie.owned ? (
                                                                    <Badge size="sm" color="red" variant="light">
                                                                        Owned
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge size="sm" color="red" variant="light">
                                                                        Shared
                                                                    </Badge>
                                                                )}
                                                            </Group>
                                                            {coterie.owned ? (
                                                                <Group gap="xs">
                                                                    <Button
                                                                        size="xs"
                                                                        color="red"
                                                                        variant="light"
                                                                        leftSection={<IconPlus size={14} />}
                                                                        onClick={() => handleAddCharacterToCoterie(coterie)}
                                                                    >
                                                                        Add Character
                                                                    </Button>
                                                                    <Menu>
                                                                        <Menu.Target>
                                                                            <ActionIcon color="red" variant="light">
                                                                                <IconDots size={16} />
                                                                            </ActionIcon>
                                                                        </Menu.Target>
                                                                        <Menu.Dropdown>
                                                                            <Menu.Item
                                                                                leftSection={<IconEdit size={14} />}
                                                                                onClick={() => handleEditCoterie(coterie)}
                                                                            >
                                                                                Edit
                                                                            </Menu.Item>
                                                                            <Menu.Item
                                                                                leftSection={<IconTrash size={14} />}
                                                                                color="red"
                                                                                onClick={() =>
                                                                                    handleDeleteCoterie(coterie.id, coterie.name)
                                                                                }
                                                                            >
                                                                                Delete
                                                                            </Menu.Item>
                                                                        </Menu.Dropdown>
                                                                    </Menu>
                                                                </Group>
                                                            ) : null}
                                                        </Group>
                                                        {coterie.members && coterie.members.length > 0 ? (
                                                            <>
                                                                <Divider />
                                                                <Text size="sm" fw={500} mb="xs">
                                                                    Members ({coterie.members.length}):
                                                                </Text>
                                                                <Stack gap="xs">
                                                                    {coterie.members.map((member) =>
                                                                        member.character ? (
                                                                            <Group
                                                                                key={member.characterId}
                                                                                gap="sm"
                                                                                pl="md"
                                                                                justify="space-between"
                                                                            >
                                                                                <Group gap="sm">
                                                                                    <Text size="sm">• {member.character.name}</Text>
                                                                                    {member.character.shared ? (
                                                                                        <Badge size="xs" color="red" variant="light">
                                                                                            Shared
                                                                                        </Badge>
                                                                                    ) : null}
                                                                                </Group>
                                                                                {coterie.owned ? (
                                                                                    <ActionIcon
                                                                                        color="red"
                                                                                        variant="light"
                                                                                        size="sm"
                                                                                        onClick={() =>
                                                                                            handleRemoveCharacterFromCoterie(
                                                                                                coterie.id,
                                                                                                member.characterId
                                                                                            )
                                                                                        }
                                                                                    >
                                                                                        <IconTrash size={14} />
                                                                                    </ActionIcon>
                                                                                ) : null}
                                                                            </Group>
                                                                        ) : null
                                                                    )}
                                                                </Stack>
                                                            </>
                                                        ) : (
                                                            <Text size="sm" c="dimmed">
                                                                No members yet
                                                            </Text>
                                                        )}
                                                    </Stack>
                                                </Paper>
                                            ))}
                                        </Stack>
                                    )}
                                </Card>
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
        </>
    )
}

export default MePage
