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
    Textarea,
    TextInput,
    Title,
    Tooltip
} from "@mantine/core"
import { notifications } from "@mantine/notifications"
import {
    IconArrowLeft,
    IconCopy,
    IconDropletFilled,
    IconMessageCircle,
    IconSend,
    IconTrash,
    IconWorldShare
} from "@tabler/icons-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { useState } from "react"
import AppTopbar from "~/components/AppTopbar"
import type { HomebrewLibraryDetail, HomebrewLibrarySummary } from "~/data/Homebrew"
import { homebrewItemKinds, homebrewKindLabel } from "~/data/Homebrew"
import { useAuth } from "~/hooks/useAuth"
import { useHomebrewCollections } from "~/hooks/useHomebrew"
import { api } from "~/utils/api"

const BloodRating = ({
    value,
    interactive = false,
    onChange
}: {
    value: number
    interactive?: boolean
    onChange?: (rating: number) => void
}) => (
    <Group gap={2} wrap="nowrap" aria-label={`${value.toFixed(1)} out of 5 blood rating`}>
        {[1, 2, 3, 4, 5].map((rating) => (
            <ActionIcon
                key={rating}
                variant="transparent"
                color={rating <= Math.round(value) ? "red" : "gray"}
                size="sm"
                disabled={!interactive}
                aria-label={interactive ? `Rate ${rating} blood` : undefined}
                onClick={() => onChange?.(rating)}
            >
                <IconDropletFilled size={15} />
            </ActionIcon>
        ))}
    </Group>
)

const HomebrewLibraryPage = () => {
    const client = useQueryClient()
    const { user, isAuthenticated, signIn } = useAuth()
    const { data: collections = [] } = useHomebrewCollections(isAuthenticated)
    const [query, setQuery] = useState("")
    const [kind, setKind] = useState<string | null>(null)
    const [sort, setSort] = useState<"top" | "trending" | "newest" | "copied">("top")
    const [selected, setSelected] = useState<HomebrewLibrarySummary | null>(null)
    const [publishOpened, setPublishOpened] = useState(false)
    const [publishCollectionId, setPublishCollectionId] = useState<string | null>(null)
    const [acknowledged, setAcknowledged] = useState(false)
    const [comment, setComment] = useState("")

    const libraryQuery = useQuery({
        queryKey: ["homebrew", "library", query, kind, sort],
        queryFn: () => api.getHomebrewLibrary({ query, type: kind ?? undefined, sort })
    })
    const detailQuery = useQuery({
        queryKey: ["homebrew", "library", "detail", selected?.id],
        queryFn: () => api.getHomebrewLibraryDetail(selected!.id),
        enabled: !!selected
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
                message: user?.actorIsSuperadmin
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
    const copyMutation = useMutation({
        mutationFn: (id: string) => api.copyHomebrewLibraryCollection(id),
        onSuccess: (collection) => {
            client.invalidateQueries({ queryKey: ["homebrew", "collections"] })
            refreshLibrary()
            notifications.show({
                title: "Collection copied",
                message: `${collection.name} is now an editable snapshot in your account.`,
                color: "grape"
            })
        }
    })
    const rateMutation = useMutation({
        mutationFn: ({ id, rating }: { id: string; rating: number }) =>
            api.rateHomebrewLibraryCollection(id, rating),
        onSuccess: () => refreshLibrary()
    })
    const commentMutation = useMutation({
        mutationFn: ({ id, body }: { id: string; body: string }) =>
            api.commentOnHomebrewLibraryCollection(id, body),
        onSuccess: () => {
            setComment("")
            client.invalidateQueries({
                queryKey: ["homebrew", "library", "detail", selected?.id]
            })
            refreshLibrary()
        }
    })
    const deleteCommentMutation = useMutation({
        mutationFn: ({ id, commentId }: { id: string; commentId: string }) =>
            api.deleteHomebrewLibraryComment(id, commentId),
        onSuccess: () => {
            client.invalidateQueries({
                queryKey: ["homebrew", "library", "detail", selected?.id]
            })
            refreshLibrary()
        }
    })
    const unpublishMutation = useMutation({
        mutationFn: api.unpublishHomebrewLibraryCollection,
        onSuccess: () => {
            setSelected(null)
            refreshLibrary()
        }
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
                                    <IconWorldShare size={34} />
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
                                                    <Text size="sm">
                                                        {entry.commentCount} comments
                                                    </Text>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Button
                                                        size="xs"
                                                        variant="light"
                                                        color="grape"
                                                        onClick={() => setSelected(entry)}
                                                    >
                                                        Open
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
                                                        onClick={() =>
                                                            withdrawMutation.mutate(request.id)
                                                        }
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

            <LibraryDetailModal
                detail={detailQuery.data}
                loading={detailQuery.isLoading}
                opened={!!selected}
                onClose={() => setSelected(null)}
                isAuthenticated={isAuthenticated}
                currentUserId={user?.id}
                signIn={signIn}
                comment={comment}
                setComment={setComment}
                onCopy={() => selected && copyMutation.mutate(selected.id)}
                copyPending={copyMutation.isPending}
                onRate={(rating) => selected && rateMutation.mutate({ id: selected.id, rating })}
                onComment={() =>
                    selected &&
                    comment.trim() &&
                    commentMutation.mutate({ id: selected.id, body: comment })
                }
                onDeleteComment={(commentId) =>
                    selected && deleteCommentMutation.mutate({ id: selected.id, commentId })
                }
                onUnpublish={() => selected && unpublishMutation.mutate(selected.id)}
                unpublishPending={unpublishMutation.isPending}
            />
        </AppShell>
    )
}

const LibraryDetailModal = ({
    detail,
    loading,
    opened,
    onClose,
    isAuthenticated,
    currentUserId,
    signIn,
    comment,
    setComment,
    onCopy,
    copyPending,
    onRate,
    onComment,
    onDeleteComment,
    onUnpublish,
    unpublishPending
}: {
    detail?: HomebrewLibraryDetail
    loading: boolean
    opened: boolean
    onClose: () => void
    isAuthenticated: boolean
    currentUserId?: string
    signIn: () => void
    comment: string
    setComment: (value: string) => void
    onCopy: () => void
    copyPending: boolean
    onRate: (rating: number) => void
    onComment: () => void
    onDeleteComment: (commentId: string) => void
    onUnpublish: () => void
    unpublishPending: boolean
}) => (
    <Modal
        opened={opened}
        onClose={onClose}
        title={detail?.snapshot.name ?? "Collection"}
        size="xl"
    >
        {loading || !detail ? (
            <Loader color="grape" />
        ) : (
            <Stack gap="lg">
                <Group justify="space-between">
                    <div>
                        <Text c="dimmed">by {detail.authorNickname}</Text>
                        <Text size="sm" c="dimmed">
                            Version {detail.version}
                        </Text>
                    </div>
                    <Button
                        color="grape"
                        leftSection={<IconCopy size={16} />}
                        loading={copyPending}
                        onClick={isAuthenticated ? onCopy : signIn}
                    >
                        Copy to my account
                    </Button>
                    {detail.authorId === currentUserId ? (
                        <Button
                            color="red"
                            variant="subtle"
                            loading={unpublishPending}
                            onClick={onUnpublish}
                        >
                            Unpublish
                        </Button>
                    ) : null}
                </Group>
                <Text>{detail.snapshot.description || detail.snapshot.shortDescription}</Text>
                {detail.snapshot.contentWarning ? (
                    <Alert color="yellow" title="Content warning">
                        {detail.snapshot.contentWarning}
                    </Alert>
                ) : null}
                <Stack gap="xs">
                    {detail.snapshot.items.map((item) => (
                        <Paper key={item.id} withBorder p="sm">
                            <Group justify="space-between">
                                <Text fw={600}>{item.name}</Text>
                                <Badge color="grape" variant="light">
                                    {homebrewKindLabel(item.kind)}
                                </Badge>
                            </Group>
                            {"summary" in item && item.summary ? (
                                <Text size="sm" c="dimmed" mt={4}>
                                    {item.summary}
                                </Text>
                            ) : null}
                        </Paper>
                    ))}
                </Stack>
                <Group justify="space-between">
                    <div>
                        <Text fw={600}>Community rating</Text>
                        <Text size="sm" c="dimmed">
                            {detail.averageRating.toFixed(1)} from {detail.ratingCount} ratings
                        </Text>
                    </div>
                    {detail.authorId === currentUserId ? (
                        <Tooltip label="You cannot rate your own collection">
                            <div>
                                <BloodRating value={detail.averageRating} />
                            </div>
                        </Tooltip>
                    ) : (
                        <BloodRating
                            value={detail.averageRating}
                            interactive={isAuthenticated}
                            onChange={isAuthenticated ? onRate : () => signIn()}
                        />
                    )}
                </Group>
                <Stack gap="sm">
                    <Group gap="xs">
                        <IconMessageCircle size={18} />
                        <Text fw={600}>Comments</Text>
                    </Group>
                    {isAuthenticated ? (
                        <Group align="flex-end">
                            <Textarea
                                style={{ flex: 1 }}
                                minRows={2}
                                value={comment}
                                onChange={(event) => setComment(event.currentTarget.value)}
                                placeholder="Add to the discussion"
                            />
                            <Button color="grape" disabled={!comment.trim()} onClick={onComment}>
                                Comment
                            </Button>
                        </Group>
                    ) : (
                        <Button variant="light" onClick={signIn}>
                            Sign in to comment
                        </Button>
                    )}
                    {detail.comments.length === 0 ? (
                        <Text c="dimmed">No comments yet.</Text>
                    ) : (
                        detail.comments.map((entryComment) => (
                            <Paper key={entryComment.id} withBorder p="sm">
                                <Group justify="space-between" align="flex-start">
                                    <div>
                                        <Text size="sm" fw={600}>
                                            {entryComment.authorNickname}
                                        </Text>
                                        <Text>{entryComment.body}</Text>
                                    </div>
                                    {entryComment.userId === currentUserId ? (
                                        <ActionIcon
                                            color="red"
                                            variant="subtle"
                                            onClick={() => onDeleteComment(entryComment.id)}
                                        >
                                            <IconTrash size={15} />
                                        </ActionIcon>
                                    ) : null}
                                </Group>
                            </Paper>
                        ))
                    )}
                </Stack>
            </Stack>
        )}
    </Modal>
)

export default HomebrewLibraryPage
