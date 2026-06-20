import {
    ActionIcon,
    Badge,
    Button,
    Card,
    Divider,
    Group,
    Menu,
    Paper,
    Stack,
    Text,
    Title
} from "@mantine/core"
import {
    IconDots,
    IconEdit,
    IconInfoCircle,
    IconLink,
    IconPlus,
    IconTrash,
    IconUserMinus,
    IconUsers
} from "@tabler/icons-react"
import { parseCharacterData } from "~/utils/characterData"
import type { CoterieCharacter, CoteriePlayerResponse, CoterieResponse } from "~/utils/api"

type Character = CoterieCharacter
type CoteriePlayer = CoteriePlayerResponse
type Coterie = CoterieResponse

type CoteriesSectionProps = {
    userCoteries: Coterie[]
    setCreateCoterieModalOpened: (opened: boolean) => void
    handleAddCharacterToCoterie: (coterie: Coterie) => void
    handleEditCoterie: (coterie: Coterie) => void
    handleDeleteCoterie: (coterieId: string, coterieName: string) => void
    handleManageCoterieInvites: (coterie: Coterie) => void
    handleRemoveCoteriePlayer: (coterie: Coterie, player: CoteriePlayer) => void
    handleShowCharacterSummary: (character: Character) => void
    handleRemoveCharacterFromCoterie: (
        coterieId: string,
        characterId: string,
        details?: {
            characterName?: string | null
            coterieName?: string | null
        }
    ) => void
    setCoterieForSummary: (coterie: Coterie) => void
    setCoterieSummaryModalOpened: (opened: boolean) => void
}

const CoteriesSection = ({
    userCoteries,
    setCreateCoterieModalOpened,
    handleAddCharacterToCoterie,
    handleEditCoterie,
    handleDeleteCoterie,
    handleManageCoterieInvites,
    handleRemoveCoteriePlayer,
    handleShowCharacterSummary,
    handleRemoveCharacterFromCoterie,
    setCoterieForSummary,
    setCoterieSummaryModalOpened
}: CoteriesSectionProps) => {
    return (
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
                        <Paper
                            key={coterie.id}
                            p="md"
                            withBorder
                            style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
                        >
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
                                                Joined
                                            </Badge>
                                        )}
                                    </Group>
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
                                                    leftSection={<IconInfoCircle size={14} />}
                                                    onClick={() => {
                                                        setCoterieForSummary(coterie)
                                                        setCoterieSummaryModalOpened(true)
                                                    }}
                                                >
                                                    Summary
                                                </Menu.Item>
                                                {coterie.owned ? (
                                                    <>
                                                        <Menu.Item
                                                            leftSection={<IconLink size={14} />}
                                                            onClick={() =>
                                                                handleManageCoterieInvites(coterie)
                                                            }
                                                        >
                                                            Invites
                                                        </Menu.Item>
                                                        <Menu.Item
                                                            leftSection={<IconEdit size={14} />}
                                                            onClick={() =>
                                                                handleEditCoterie(coterie)
                                                            }
                                                        >
                                                            Edit
                                                        </Menu.Item>
                                                        <Menu.Item
                                                            leftSection={<IconTrash size={14} />}
                                                            color="red"
                                                            onClick={() =>
                                                                handleDeleteCoterie(
                                                                    coterie.id,
                                                                    coterie.name
                                                                )
                                                            }
                                                        >
                                                            Delete
                                                        </Menu.Item>
                                                    </>
                                                ) : null}
                                            </Menu.Dropdown>
                                        </Menu>
                                    </Group>
                                </Group>
                                {coterie.owned && coterie.players && coterie.players.length > 0 ? (
                                    <>
                                        <Divider />
                                        <Text size="sm" fw={500}>
                                            Players ({coterie.players.length}):
                                        </Text>
                                        <Stack gap="xs">
                                            {coterie.players.map((player) => (
                                                <Group
                                                    key={player.membershipId ?? "owner"}
                                                    gap="sm"
                                                    pl="md"
                                                    justify="space-between"
                                                >
                                                    <Group gap="sm">
                                                        <Text size="sm">
                                                            {player.nickname || "No nickname set"}
                                                        </Text>
                                                        {player.isOwner ? (
                                                            <Badge
                                                                size="xs"
                                                                color="red"
                                                                variant="light"
                                                            >
                                                                Owner
                                                            </Badge>
                                                        ) : null}
                                                    </Group>
                                                    {!player.isOwner && player.membershipId ? (
                                                        <ActionIcon
                                                            color="red"
                                                            variant="light"
                                                            size="sm"
                                                            onClick={() =>
                                                                handleRemoveCoteriePlayer(
                                                                    coterie,
                                                                    player
                                                                )
                                                            }
                                                        >
                                                            <IconUserMinus size={14} />
                                                        </ActionIcon>
                                                    ) : null}
                                                </Group>
                                            ))}
                                        </Stack>
                                    </>
                                ) : null}
                                {coterie.members && coterie.members.length > 0 ? (
                                    <>
                                        <Divider />
                                        <Text size="sm" fw={500} mb="xs">
                                            Members ({coterie.members.length}):
                                        </Text>
                                        <Stack gap="xs">
                                            {coterie.members.map((member) => {
                                                const memberCharData = parseCharacterData(
                                                    member.character?.data
                                                )
                                                const memberPlayerName = memberCharData?.player
                                                return member.character ? (
                                                    <Group
                                                        key={member.characterId}
                                                        gap="sm"
                                                        pl="md"
                                                        justify="space-between"
                                                    >
                                                        <Group gap="sm">
                                                            <Text size="sm">
                                                                • {member.character.name}
                                                                {memberPlayerName
                                                                    ? ` | ${memberPlayerName}`
                                                                    : ""}
                                                            </Text>
                                                            {member.character.shared ? (
                                                                <Badge
                                                                    size="xs"
                                                                    color="red"
                                                                    variant="light"
                                                                >
                                                                    Shared
                                                                </Badge>
                                                            ) : null}
                                                        </Group>
                                                        <Group gap="xs">
                                                            <ActionIcon
                                                                color="red"
                                                                variant="light"
                                                                size="sm"
                                                                onClick={() =>
                                                                    handleShowCharacterSummary(
                                                                        member.character!
                                                                    )
                                                                }
                                                            >
                                                                <IconInfoCircle size={14} />
                                                            </ActionIcon>
                                                            {coterie.owned ||
                                                            member.character.ownedByCurrentUser ? (
                                                                <ActionIcon
                                                                    color="red"
                                                                    variant="light"
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        handleRemoveCharacterFromCoterie(
                                                                            coterie.id,
                                                                            member.characterId,
                                                                            {
                                                                                characterName:
                                                                                    member
                                                                                        .character
                                                                                        ?.name,
                                                                                coterieName:
                                                                                    coterie.name
                                                                            }
                                                                        )
                                                                    }
                                                                >
                                                                    <IconTrash size={14} />
                                                                </ActionIcon>
                                                            ) : null}
                                                        </Group>
                                                    </Group>
                                                ) : null
                                            })}
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
    )
}

export default CoteriesSection
