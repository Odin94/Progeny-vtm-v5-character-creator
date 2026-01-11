import {
    ActionIcon,
    Badge,
    Button,
    Card,
    FileButton,
    Group,
    Menu,
    Paper,
    Stack,
    Text,
    Title,
} from "@mantine/core"
import {
    IconDots,
    IconDownload,
    IconDroplet,
    IconFileTypePdf,
    IconFileUpload,
    IconInfoCircle,
    IconPlus,
    IconShare,
    IconTrash,
    IconUpload,
} from "@tabler/icons-react"
import { Character as CharacterType } from "~/data/Character"

type Character = {
    id: string
    name: string
    shared?: boolean
    data?: unknown
}

type CharactersSectionProps = {
    userCharacters: Character[]
    character: CharacterType & { id?: string }
    showSaveCurrentButton: boolean
    isSavingCharacter: boolean
    isAnyOperationInFlight: boolean
    loadingCharacterId: string | null
    setCreateCharacterModalOpened: (opened: boolean) => void
    handleSaveCurrentCharacter: () => void
    handleLoadFromFile: (file: File | null) => void
    handleLoadCharacter: (char: Character) => void
    handleShareCharacter: (char: Character) => void
    handleShowSummary: (char: Character) => void
    handleSaveJson: (char: Character) => void
    handleDownloadPdf: (char: Character) => void
    handleDeleteCharacter: (characterId: string, characterName: string) => void
    handleUnshareCharacter: (char: Character) => void
}

const CharactersSection = ({
    userCharacters,
    character,
    showSaveCurrentButton,
    isSavingCharacter,
    isAnyOperationInFlight,
    loadingCharacterId,
    setCreateCharacterModalOpened,
    handleSaveCurrentCharacter,
    handleLoadFromFile,
    handleLoadCharacter,
    handleShareCharacter,
    handleShowSummary,
    handleSaveJson,
    handleDownloadPdf,
    handleDeleteCharacter,
    handleUnshareCharacter,
}: CharactersSectionProps) => {
    return (
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
                    {showSaveCurrentButton ? (
                        <Button
                            leftSection={<IconDownload size={16} />}
                            color="red"
                            variant="light"
                            onClick={handleSaveCurrentCharacter}
                            disabled={!character.name.trim() || isSavingCharacter}
                            loading={isSavingCharacter}
                        >
                            Save Current Character
                        </Button>
                    ) : null}
                    <Menu keepMounted>
                        <Menu.Target>
                            <ActionIcon color="red" variant="light" size="lg">
                                <IconDots size={18} />
                            </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                            <FileButton
                                onChange={async (payload: File | null) => {
                                    if (!payload) return
                                    handleLoadFromFile(payload)
                                }}
                                accept="application/json"
                            >
                                {(props) => (
                                    <Menu.Item leftSection={<IconFileUpload size={16} />} {...props}>
                                        Load JSON
                                    </Menu.Item>
                                )}
                            </FileButton>
                        </Menu.Dropdown>
                    </Menu>
                </Group>
            </Group>
            {userCharacters.length === 0 ? (
                <Text c="dimmed">No characters yet. Create one in the generator!</Text>
            ) : (
                <Stack gap="sm">
                    {userCharacters.map((char) => {
                        const isSelected = character.id === char.id
                        const charData = char.data as CharacterType | undefined
                        const playerName = charData?.player
                        return (
                            <Paper
                                key={char.id}
                                p="md"
                                withBorder
                                style={{
                                    backgroundColor: isSelected ? "rgba(139, 0, 0, 0.15)" : "rgba(0, 0, 0, 0.4)",
                                }}
                            >
                                <Group justify="space-between">
                                    <Group gap="sm">
                                        <Text fw={500}>
                                            {char.name}
                                            {playerName ? ` | ${playerName}` : ""}
                                        </Text>
                                        {isSelected ? (
                                            <Badge size="sm" color="red" variant="filled">
                                                Active
                                            </Badge>
                                        ) : null}
                                        {char.shared ? (
                                            <Badge size="sm" color="red" variant="light">
                                                Shared
                                            </Badge>
                                        ) : null}
                                    </Group>
                                    <Group gap="xs">
                                        {!char.shared ? (
                                            <>
                                                {isSelected ? (
                                                    <Button
                                                        size="sm"
                                                        color="red"
                                                        variant="light"
                                                        leftSection={<IconDownload size={14} />}
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleSaveCurrentCharacter()
                                                        }}
                                                        disabled={!character.name.trim() || isAnyOperationInFlight}
                                                        loading={isSavingCharacter}
                                                    >
                                                        Save
                                                    </Button>
                                                ) : null}
                                                <Button
                                                    size="sm"
                                                    color="red"
                                                    variant="light"
                                                    leftSection={<IconUpload size={14} />}
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleLoadCharacter(char)
                                                    }}
                                                    disabled={isAnyOperationInFlight}
                                                    loading={loadingCharacterId === char.id}
                                                >
                                                    Load
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    color="red"
                                                    variant="light"
                                                    leftSection={<IconShare size={14} />}
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleShareCharacter(char)
                                                    }}
                                                >
                                                    Share
                                                </Button>
                                                <Menu>
                                                    <Menu.Target>
                                                        <ActionIcon
                                                            color="red"
                                                            variant="light"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <IconDots size={16} />
                                                        </ActionIcon>
                                                    </Menu.Target>
                                                    <Menu.Dropdown>
                                                        <Menu.Item
                                                            leftSection={<IconInfoCircle size={14} />}
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleShowSummary(char)
                                                            }}
                                                        >
                                                            Summary
                                                        </Menu.Item>
                                                        <Menu.Divider />
                                                        <Menu.Item
                                                            leftSection={<IconDownload size={14} />}
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleSaveJson(char)
                                                            }}
                                                        >
                                                            Save JSON
                                                        </Menu.Item>
                                                        <Menu.Item
                                                            leftSection={<IconFileTypePdf size={14} />}
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleDownloadPdf(char)
                                                            }}
                                                        >
                                                            Download PDF
                                                        </Menu.Item>
                                                        <Menu.Divider />
                                                        <Menu.Item
                                                            leftSection={<IconTrash size={14} />}
                                                            color="red"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleDeleteCharacter(char.id, char.name)
                                                            }}
                                                        >
                                                            Delete
                                                        </Menu.Item>
                                                    </Menu.Dropdown>
                                                </Menu>
                                            </>
                                        ) : (
                                            <>
                                                <Button
                                                    size="sm"
                                                    color="red"
                                                    variant="light"
                                                    leftSection={<IconUpload size={14} />}
                                                    onClick={() => {
                                                        handleLoadCharacter(char)
                                                    }}
                                                    disabled={isAnyOperationInFlight}
                                                    loading={loadingCharacterId === char.id}
                                                >
                                                    View
                                                </Button>
                                                <Menu>
                                                    <Menu.Target>
                                                        <ActionIcon
                                                            color="red"
                                                            variant="light"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <IconDots size={16} />
                                                        </ActionIcon>
                                                    </Menu.Target>
                                                    <Menu.Dropdown>
                                                        <Menu.Item
                                                            leftSection={<IconInfoCircle size={14} />}
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleShowSummary(char)
                                                            }}
                                                        >
                                                            Summary
                                                        </Menu.Item>
                                                        <Menu.Divider />
                                                        <Menu.Item
                                                            leftSection={<IconDownload size={14} />}
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleSaveJson(char)
                                                            }}
                                                        >
                                                            Save JSON
                                                        </Menu.Item>
                                                        <Menu.Item
                                                            leftSection={<IconFileTypePdf size={14} />}
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleDownloadPdf(char)
                                                            }}
                                                        >
                                                            Download PDF
                                                        </Menu.Item>
                                                        <Menu.Divider />
                                                        <Menu.Item
                                                            leftSection={<IconShare size={14} />}
                                                            color="red"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleUnshareCharacter(char)
                                                            }}
                                                        >
                                                            Unshare
                                                        </Menu.Item>
                                                    </Menu.Dropdown>
                                                </Menu>
                                            </>
                                        )}
                                    </Group>
                                </Group>
                            </Paper>
                        )
                    })}
                </Stack>
            )}
        </Card>
    )
}

export default CharactersSection
