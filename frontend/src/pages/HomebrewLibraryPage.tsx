import {
    ActionIcon,
    Alert,
    AppShell,
    Badge,
    Button,
    Checkbox,
    Container,
    Group,
    Loader,
    Modal,
    Paper,
    ScrollArea,
    Select,
    Stack,
    Table,
    Text,
    TextInput,
    Title
} from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { IconArrowLeft, IconBooks, IconDropletFilled, IconSend } from "@tabler/icons-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { useState } from "react"
import AppTopbar from "~/components/AppTopbar"
import ConfirmActionModal from "~/components/ConfirmActionModal"
import { homebrewItemKinds, homebrewKindLabel } from "~/data/Homebrew"
import { useAuth } from "~/hooks/useAuth"
import { useHomebrewCollections } from "~/hooks/useHomebrew"
import { api } from "~/utils/api"

const BloodRating = ({ value }: { value: number }) => (
    <Group gap={2} wrap="nowrap" aria-label={`${value.toFixed(1)} out of 5 blood rating`}>
        {[1, 2, 3, 4, 5].map((rating) => (
            <ActionIcon
                key={rating}
                variant="transparent"
                color={rating <= Math.round(value) ? "red" : "gray"}
                size="sm"
                disabled
            >
                <IconDropletFilled size={15} />
            </ActionIcon>
        ))}
    </Group>
)

const formatRequestOpenedDate = (createdAt: string) =>
    new Date(createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric"
    })

const HomebrewLibraryPage = () => {
    const client = useQueryClient()
    const { user, isAuthenticated, signIn } = useAuth()
    const hasSuperadminPrivileges =
        (user?.actorIsSuperadmin ?? false) && !user?.impersonation.active
    const { data: collections = [] } = useHomebrewCollections(isAuthenticated)
    const [query, setQuery] = useState("")
    const [kind, setKind] = useState<string | null>(null)
    const [sort, setSort] = useState<"top" | "trending" | "newest" | "copied">("top")
    const [publishOpened, setPublishOpened] = useState(false)
    const [publishCollectionId, setPublishCollectionId] = useState<string | null>(null)
    const [acknowledged, setAcknowledged] = useState(false)
    const [withdrawRequestId, setWithdrawRequestId] = useState<string | null>(null)

    const libraryQuery = useQuery({
        queryKey: ["homebrew", "library", query, kind, sort],
        queryFn: () => api.getHomebrewLibrary({ query, type: kind ?? undefined, sort })
    })
    const requestsQuery = useQuery({
        queryKey: ["homebrew", "publish-requests"],
        queryFn: api.getHomebrewPublishRequests,
        enabled: isAuthenticated
    })
    const refreshLibrary = () => client.invalidateQueries({ queryKey: ["homebrew", "library"] })
    const publishMutation = useMutation({
        mutationFn: (collectionId: string) => api.requestHomebrewPublication(collectionId),
        onSuccess: () => {
            setPublishOpened(false)
            setAcknowledged(false)
            setPublishCollectionId(null)
            client.invalidateQueries({ queryKey: ["homebrew", "publish-requests"] })
            refreshLibrary()
            notifications.show({
                title: "Snapshot submitted",
                message: hasSuperadminPrivileges
                    ? "The collection was published immediately."
                    : "A superadmin will review this version.",
                color: "grape"
            })
        }
    })
    const withdrawMutation = useMutation({
        mutationFn: api.withdrawHomebrewPublishRequest,
        onSuccess: () => client.invalidateQueries({ queryKey: ["homebrew", "publish-requests"] })
    })

    return (
        <AppShell header={{ height: 52 }} padding={0}>
            <AppShell.Header>
                <AppTopbar />
            </AppShell.Header>
            <AppShell.Main bg="#100d12" mih="100vh">
                <Container size="xl" py={84}>
                    <Stack gap="xl">
                        <Group justify="space-between" align="flex-start">
                            <div>
                                <Group gap="sm">
                                    <IconBooks size={34} />
                                    <Title>Homebrew Community Library</Title>
                                </Group>
                                <Text c="dimmed" mt="xs">
                                    Discover community-built rules, ranked by reputation and proven
                                    ratings.
                                </Text>
                            </div>
                            <Group>
                                <Button
                                    component={Link}
                                    to="/homebrew"
                                    variant="subtle"
                                    leftSection={<IconArrowLeft size={16} />}
                                >
                                    My Homebrew
                                </Button>
                                <Button
                                    color="grape"
                                    leftSection={<IconSend size={16} />}
                                    onClick={() =>
                                        isAuthenticated ? setPublishOpened(true) : signIn()
                                    }
                                >
                                    Request to publish
                                </Button>
                            </Group>
                        </Group>

                        <Paper withBorder p="md" bg="rgba(0,0,0,.4)">
                            <Group grow align="flex-end">
                                <TextInput
                                    label="Search"
                                    placeholder="Collection, author, or tag"
                                    value={query}
                                    onChange={(event) => setQuery(event.currentTarget.value)}
                                />
                                <Select
                                    label="Contains"
                                    clearable
                                    value={kind}
                                    data={homebrewItemKinds.map((itemKind) => ({
                                        value: itemKind,
                                        label: homebrewKindLabel(itemKind)
                                    }))}
                                    onChange={setKind}
                                />
                                <Select
                                    label="Sort by"
                                    value={sort}
                                    data={[
                                        { value: "top", label: "Top rated" },
                                        { value: "trending", label: "Trending" },
                                        { value: "newest", label: "Newest" },
                                        { value: "copied", label: "Most copied" }
                                    ]}
                                    onChange={(value) => setSort(value as typeof sort)}
                                />
                            </Group>
                        </Paper>

                        {libraryQuery.isLoading ? (
                            <Loader color="grape" />
                        ) : libraryQuery.data?.length ? (
                            <ScrollArea>
                                <Table striped highlightOnHover verticalSpacing="md" miw={900}>
                                    <Table.Thead>
                                        <Table.Tr>
                                            <Table.Th>Collection</Table.Th>
                                            <Table.Th>Author</Table.Th>
                                            <Table.Th>Contents</Table.Th>
                                            <Table.Th>Rating</Table.Th>
                                            <Table.Th>Community</Table.Th>
                                            <Table.Th />
                                        </Table.Tr>
                                    </Table.Thead>
                                    <Table.Tbody>
                                        {libraryQuery.data.map((entry) => (
                                            <Table.Tr key={entry.id}>
                                                <Table.Td>
                                                    <Stack gap={4} maw={360}>
                                                        <Text fw={600}>{entry.name}</Text>
                                                        <Text size="sm" c="dimmed" lineClamp={2}>
                                                            {entry.shortDescription}
                                                        </Text>
                                                        <Group gap={4}>
                                                            {entry.tags.slice(0, 4).map((tag) => (
                                                                <Badge
                                                                    key={tag}
                                                                    size="xs"
                                                                    variant="outline"
                                                                >
                                                                    {tag}
                                                                </Badge>
                                                            ))}
                                                        </Group>
                                                    </Stack>
                                                </Table.Td>
                                                <Table.Td>{entry.authorNickname}</Table.Td>
                                                <Table.Td>
                                                    {Object.entries(entry.itemCounts)
                                                        .map(
                                                            ([itemKind, count]) =>
                                                                `${count} ${homebrewKindLabel(itemKind as never)}`
                                                        )
                                                        .join(", ")}
                                                </Table.Td>
                                                <Table.Td>
                                                    <Stack gap={2}>
                                                        <BloodRating value={entry.averageRating} />
                                                        <Text size="xs" c="dimmed">
                                                            {entry.ratingCount} ratings
                                                        </Text>
                                                    </Stack>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Text size="sm">{entry.copyCount} copies</Text>
                                                    <Text size="sm">{entry.commentCount} comments</Text>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Button
                                                        component={Link}
                                                        to="/homebrew/library/$collectionId"
                                                        params={{ collectionId: entry.id }}
                                                        size="xs"
                                                        variant="light"
                                                        color="grape"
                                                    >
                                                        Open details
                                                    </Button>
                                                </Table.Td>
                                            </Table.Tr>
                                        ))}
                                    </Table.Tbody>
                                </Table>
                            </ScrollArea>
                        ) : (
                            <Paper withBorder p="xl">
                                <Text c="dimmed" ta="center">
                                    No published collections match these filters yet.
                                </Text>
                            </Paper>
                        )}

                        {isAuthenticated && requestsQuery.data?.length ? (
                            <Paper withBorder p="lg" bg="rgba(0,0,0,.35)">
                                <Title order={3} mb="md">
                                    Your publication requests
                                </Title>
                                <Stack gap="sm">
                                    {requestsQuery.data.map((request) => (
                                        <Group key={request.id} justify="space-between">
                                            <div>
                                                <Text fw={500}>{request.snapshot.name}</Text>
                                                <Text size="sm" c="dimmed">
                                                    Opened {formatRequestOpenedDate(request.createdAt)}
                                                </Text>
                                                {request.denialMessage ? (
                                                    <Text size="sm" c="red">
                                                        {request.denialMessage}
                                                    </Text>
                                                ) : null}
                                            </div>
                                            <Group gap="xs">
                                                <Badge
                                                    color={
                                                        request.status === "approved"
                                                            ? "green"
                                                            : request.status === "denied"
                                                              ? "red"
                                                              : request.status === "pending"
                                                                ? "yellow"
                                                                : "gray"
                                                    }
                                                >
                                                    {request.status}
                                                </Badge>
                                                {request.status === "pending" ? (
                                                    <Button
                                                        size="compact-xs"
                                                        variant="subtle"
                                                        color="gray"
                                                        loading={withdrawMutation.isPending}
                                                        onClick={() => setWithdrawRequestId(request.id)}
                                                    >
                                                        Withdraw
                                                    </Button>
                                                ) : null}
                                            </Group>
                                        </Group>
                                    ))}
                                </Stack>
                            </Paper>
                        ) : null}
                    </Stack>
                </Container>
            </AppShell.Main>

            <Modal
                opened={publishOpened}
                onClose={() => setPublishOpened(false)}
                title="Request to publish a snapshot"
            >
                <Stack>
                    <Text size="sm" c="dimmed">
                        The submitted version is frozen. Future edits require another review and the
                        current approved version stays public while an update is pending.
                    </Text>
                    <Select
                        label="Collection"
                        value={publishCollectionId}
                        data={collections.map((collection) => ({
                            value: collection.id,
                            label: collection.name
                        }))}
                        onChange={setPublishCollectionId}
                    />
                    <Checkbox
                        checked={acknowledged}
                        onChange={(event) => setAcknowledged(event.currentTarget.checked)}
                        label="I created this content or have permission to share it, and it does not reproduce copyrighted sourcebook text."
                    />
                    {publishMutation.error ? (
                        <Alert color="red">{publishMutation.error.message}</Alert>
                    ) : null}
                    <Group justify="flex-end">
                        <Button variant="subtle" onClick={() => setPublishOpened(false)}>
                            Cancel
                        </Button>
                        <Button
                            color="grape"
                            disabled={!publishCollectionId || !acknowledged}
                            loading={publishMutation.isPending}
                            onClick={() =>
                                publishCollectionId && publishMutation.mutate(publishCollectionId)
                            }
                        >
                            Submit snapshot
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            <ConfirmActionModal
                opened={!!withdrawRequestId}
                onClose={() => setWithdrawRequestId(null)}
                onConfirm={() => {
                    if (!withdrawRequestId) return
                    withdrawMutation.mutate(withdrawRequestId, {
                        onSuccess: () => setWithdrawRequestId(null)
                    })
                }}
                title="Withdraw publication request?"
                body="This removes the pending snapshot from review. You can submit it again later."
                confirmLabel="Withdraw"
                loading={withdrawMutation.isPending}
            />
        </AppShell>
    )
}

export default HomebrewLibraryPage
