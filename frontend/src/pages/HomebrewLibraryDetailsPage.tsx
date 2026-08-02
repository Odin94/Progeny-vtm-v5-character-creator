import {
    ActionIcon,
    Alert,
    AppShell,
    Badge,
    Box,
    Button,
    Card,
    Container,
    Divider,
    Group,
    Loader,
    Paper,
    SimpleGrid,
    Stack,
    Text,
    Textarea,
    Title,
    Tooltip
} from "@mantine/core"
import { notifications } from "@mantine/notifications"
import {
    IconArrowLeft,
    IconChevronDown,
    IconCopy,
    IconDropletFilled,
    IconEdit,
    IconMessageCircle,
    IconSend,
    IconTrash
} from "@tabler/icons-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import AnimatedCollapse from "~/components/AnimatedCollapse"
import AppTopbar from "~/components/AppTopbar"
import ConfirmActionModal from "~/components/ConfirmActionModal"
import ContentWarning from "~/components/ContentWarning"
import HomebrewItemPreview from "~/components/HomebrewItemPreview"
import type { HomebrewItemKind, HomebrewLibraryDetail } from "~/data/Homebrew"
import { homebrewItemKinds, homebrewKindLabel } from "~/data/Homebrew"
import { useAuth } from "~/hooks/useAuth"
import { api } from "~/utils/api"
import "./HomebrewLibraryDetailsPage.css"

const storageLimitMessage =
    "your account is using over 100MB of storage, talk to support if you need more"

type Props = { collectionId: string }

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
        {[1, 2, 3, 4, 5].map((rating) => {
            const filled = rating <= Math.round(value)

            return (
                <ActionIcon
                    key={rating}
                    variant="transparent"
                    color={filled ? "red" : "gray"}
                    size="sm"
                    disabled={!interactive}
                    styles={{ root: { opacity: 1 } }}
                    aria-label={interactive ? `Rate ${rating} blood` : undefined}
                    onClick={() => onChange?.(rating)}
                >
                    <IconDropletFilled size={15} color={filled ? "#c74650" : "#908990"} />
                </ActionIcon>
            )
        })}
    </Group>
)

const HomebrewLibraryDetailsPage = ({ collectionId }: Props) => {
    const client = useQueryClient()
    const navigate = useNavigate()
    const { user, isAuthenticated, signIn } = useAuth()
    const hasSuperadminPrivileges =
        (user?.actorIsSuperadmin ?? false) && !user?.impersonation.active
    const [comment, setComment] = useState("")
    const [editingComment, setEditingComment] = useState<{ id: string; body: string } | null>(null)
    const [copyConfirmationOpened, setCopyConfirmationOpened] = useState(false)
    const [unpublishConfirmationOpened, setUnpublishConfirmationOpened] = useState(false)
    const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null)
    const [collapsedItemKinds, setCollapsedItemKinds] = useState<Set<HomebrewItemKind>>(new Set())
    const [motionlessItemKinds, setMotionlessItemKinds] = useState<Set<HomebrewItemKind>>(new Set())
    const detailQuery = useQuery({
        queryKey: ["homebrew", "library", "detail", collectionId],
        queryFn: () => api.getHomebrewLibraryDetail(collectionId)
    })

    const toggleItemKind = (kind: HomebrewItemKind, motionEnabled = true) => {
        setMotionlessItemKinds((current) => {
            const next = new Set(current)
            if (motionEnabled) next.delete(kind)
            else next.add(kind)
            return next
        })
        setCollapsedItemKinds((current) => {
            const next = new Set(current)
            if (next.has(kind)) {
                next.delete(kind)
            } else {
                next.add(kind)
            }
            return next
        })
    }
    const refreshLibrary = () => client.invalidateQueries({ queryKey: ["homebrew", "library"] })
    const copyMutation = useMutation({
        mutationFn: () => api.copyHomebrewLibraryCollection(collectionId),
        onSuccess: () => {
            setCopyConfirmationOpened(false)
            client.invalidateQueries({ queryKey: ["homebrew", "collections"] })
            refreshLibrary()
            navigate({ to: "/homebrew" })
        },
        onError: (error) => {
            notifications.show({
                message: error instanceof Error ? error.message : storageLimitMessage,
                color: "red"
            })
        }
    })
    const rateMutation = useMutation({
        mutationFn: (rating: number) => api.rateHomebrewLibraryCollection(collectionId, rating),
        onSuccess: () => {
            client.invalidateQueries({ queryKey: ["homebrew", "library", "detail", collectionId] })
            refreshLibrary()
        }
    })
    const commentMutation = useMutation({
        mutationFn: (body: string) => api.commentOnHomebrewLibraryCollection(collectionId, body),
        onSuccess: () => {
            setComment("")
            client.invalidateQueries({ queryKey: ["homebrew", "library", "detail", collectionId] })
            refreshLibrary()
        }
    })
    const deleteCommentMutation = useMutation({
        mutationFn: (commentId: string) =>
            api.deleteHomebrewLibraryComment(collectionId, commentId),
        onSuccess: () => {
            client.invalidateQueries({ queryKey: ["homebrew", "library", "detail", collectionId] })
            refreshLibrary()
        }
    })
    const updateCommentMutation = useMutation({
        mutationFn: ({ commentId, body }: { commentId: string; body: string }) =>
            api.updateHomebrewLibraryComment(collectionId, commentId, body),
        onSuccess: () => {
            setEditingComment(null)
            client.invalidateQueries({ queryKey: ["homebrew", "library", "detail", collectionId] })
        }
    })
    const unpublishMutation = useMutation({
        mutationFn: () => api.unpublishHomebrewLibraryCollection(collectionId),
        onSuccess: () => {
            setUnpublishConfirmationOpened(false)
            refreshLibrary()
            navigate({ to: "/homebrew/library" })
        }
    })

    if (detailQuery.isLoading) {
        return <Loader color="grape" />
    }

    if (detailQuery.isError || !detailQuery.data) {
        return (
            <Container size="sm" py={100}>
                <Card withBorder p="xl">
                    <Stack align="center">
                        <Title order={2}>Collection not found</Title>
                        <Text c="dimmed">
                            It may have been unpublished or is no longer available.
                        </Text>
                        <Button
                            component={Link}
                            to="/homebrew/library"
                            variant="light"
                            color="grape"
                        >
                            Back to the library
                        </Button>
                    </Stack>
                </Card>
            </Container>
        )
    }

    return (
        <LibraryDetail
            detail={detailQuery.data}
            isAuthenticated={isAuthenticated}
            currentUserId={user?.id}
            isSuperadmin={hasSuperadminPrivileges}
            signIn={signIn}
            comment={comment}
            setComment={setComment}
            onCopy={() => setCopyConfirmationOpened(true)}
            copyPending={copyMutation.isPending}
            onRate={(rating) => rateMutation.mutate(rating)}
            onComment={() => comment.trim() && commentMutation.mutate(comment.trim())}
            commentPending={commentMutation.isPending}
            onDeleteComment={setDeleteCommentId}
            editingComment={editingComment}
            onStartEditingComment={(id, body) => setEditingComment({ id, body })}
            onChangeEditingComment={(body) =>
                setEditingComment((current) => (current ? { ...current, body } : null))
            }
            onCancelEditingComment={() => setEditingComment(null)}
            onSaveEditingComment={() =>
                editingComment?.body.trim() &&
                updateCommentMutation.mutate({
                    commentId: editingComment.id,
                    body: editingComment.body.trim()
                })
            }
            updateCommentPending={updateCommentMutation.isPending}
            onUnpublish={() => setUnpublishConfirmationOpened(true)}
            unpublishPending={unpublishMutation.isPending}
            collapsedItemKinds={collapsedItemKinds}
            motionlessItemKinds={motionlessItemKinds}
            onToggleItemKind={toggleItemKind}
            onOpenSource={(entryId) => {
                navigate({
                    to: "/homebrew/library/$collectionId",
                    params: { collectionId: entryId }
                })
            }}
            confirmation={
                <>
                    <ConfirmActionModal
                        opened={copyConfirmationOpened}
                        onClose={() => setCopyConfirmationOpened(false)}
                        onConfirm={() => copyMutation.mutate()}
                        title="Copy to your account?"
                        body={`Create your own editable copy of ${detailQuery.data.snapshot.name} in My Homebrew.`}
                        confirmLabel="Copy collection"
                        confirmColor="grape"
                        loading={copyMutation.isPending}
                    />
                    <ConfirmActionModal
                        opened={unpublishConfirmationOpened}
                        onClose={() => setUnpublishConfirmationOpened(false)}
                        onConfirm={() => unpublishMutation.mutate()}
                        title="Unpublish collection"
                        body="This will remove the collection from the Homebrew Community Library."
                        confirmLabel="Unpublish"
                        loading={unpublishMutation.isPending}
                    />
                    <ConfirmActionModal
                        opened={!!deleteCommentId}
                        onClose={() => setDeleteCommentId(null)}
                        onConfirm={() => {
                            if (!deleteCommentId) return
                            deleteCommentMutation.mutate(deleteCommentId, {
                                onSuccess: () => setDeleteCommentId(null)
                            })
                        }}
                        title="Delete comment?"
                        body="This comment will be permanently removed."
                        confirmLabel="Delete comment"
                        loading={deleteCommentMutation.isPending}
                    />
                </>
            }
        />
    )
}

type LibraryDetailProps = {
    detail: HomebrewLibraryDetail
    isAuthenticated: boolean
    currentUserId?: string
    isSuperadmin: boolean
    signIn: () => void
    comment: string
    setComment: (value: string) => void
    onCopy: () => void
    copyPending: boolean
    onRate: (rating: number) => void
    onComment: () => void
    commentPending: boolean
    onDeleteComment: (commentId: string) => void
    editingComment: { id: string; body: string } | null
    onStartEditingComment: (id: string, body: string) => void
    onChangeEditingComment: (body: string) => void
    onCancelEditingComment: () => void
    onSaveEditingComment: () => void
    updateCommentPending: boolean
    onOpenSource: (entryId: string) => void
    onUnpublish: () => void
    unpublishPending: boolean
    collapsedItemKinds: Set<HomebrewItemKind>
    motionlessItemKinds: Set<HomebrewItemKind>
    onToggleItemKind: (kind: HomebrewItemKind, motionEnabled?: boolean) => void
    confirmation: React.ReactNode
}

const LibraryDetail = ({
    detail,
    isAuthenticated,
    currentUserId,
    isSuperadmin,
    signIn,
    comment,
    setComment,
    onCopy,
    copyPending,
    onRate,
    onComment,
    commentPending,
    onDeleteComment,
    editingComment,
    onStartEditingComment,
    onChangeEditingComment,
    onCancelEditingComment,
    onSaveEditingComment,
    updateCommentPending,
    onOpenSource,
    onUnpublish,
    unpublishPending,
    collapsedItemKinds,
    motionlessItemKinds,
    onToggleItemKind,
    confirmation
}: LibraryDetailProps) => {
    const itemsByKind = homebrewItemKinds
        .map((kind) => ({
            kind,
            items: detail.snapshot.items.filter((item) => item.kind === kind)
        }))
        .filter(({ items }) => items.length)

    return (
        <AppShell header={{ height: 52 }} padding={0}>
            <AppShell.Header>
                <AppTopbar />
            </AppShell.Header>
            <AppShell.Main className="homebrew-page" bg="#100d12" mih="100vh">
                <Box pt="lg" pb="2rem">
                    <Container size="xl">
                        <Stack gap="xl">
                            <Button
                                component={Link}
                                to="/homebrew/library"
                                variant="subtle"
                                color="gray"
                                px={0}
                                w="fit-content"
                                leftSection={<IconArrowLeft size={16} />}
                            >
                                Community Library
                            </Button>

                            <Paper withBorder p="xl" bg="rgba(0,0,0,.28)">
                                <Stack gap="lg">
                                <Group
                                    justify="space-between"
                                    align="flex-start"
                                    className="homebrew-page__header"
                                >
                                        <div>
                                            <Text size="sm" c="dimmed">
                                                Community collection · Version {detail.version}
                                            </Text>
                                            <Title mt={4}>{detail.snapshot.name}</Title>
                                            <Text c="dimmed" mt="xs">
                                                by {detail.authorNickname}
                                            </Text>
                                        </div>
                                        <Group className="homebrew-page__header-actions">
                                            <Button
                                                color="grape"
                                                variant="outline"
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
                                    </Group>
                                    {detail.snapshot.shortDescription ? (
                                        <Text size="lg">{detail.snapshot.shortDescription}</Text>
                                    ) : null}
                                    {detail.snapshot.description &&
                                    detail.snapshot.description !==
                                        detail.snapshot.shortDescription ? (
                                        <Text c="dimmed" style={{ whiteSpace: "pre-wrap" }}>
                                            {detail.snapshot.description}
                                        </Text>
                                    ) : null}
                                    {detail.snapshot.tags.length ? (
                                        <Group gap="xs">
                                            {detail.snapshot.tags.map((tag) => (
                                                <Badge key={tag} color="gray" variant="outline">
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </Group>
                                    ) : null}
                                </Stack>
                            </Paper>

                            {detail.source ? (
                                <Alert color="blue" title="Derived collection">
                                    <Group justify="space-between" align="center">
                                        <Text size="sm">
                                            Based on {detail.source.name}, version{" "}
                                            {detail.source.version}, by{" "}
                                            {detail.source.authorNickname}.
                                        </Text>
                                        {detail.source.available ? (
                                            <Button
                                                size="compact-xs"
                                                variant="light"
                                                onClick={() => onOpenSource(detail.source!.entryId)}
                                            >
                                                Open source
                                            </Button>
                                        ) : (
                                            <Badge color="gray">Source unpublished</Badge>
                                        )}
                                    </Group>
                                </Alert>
                            ) : null}

                            {detail.snapshot.contentWarning ? (
                                <ContentWarning>{detail.snapshot.contentWarning}</ContentWarning>
                            ) : null}

                            <Stack gap="lg">
                                <div>
                                    <Title order={2}>Rules</Title>
                                    <Text size="sm" c="dimmed">
                                        Read-only details for this published snapshot.
                                    </Text>
                                </div>
                                {itemsByKind.length ? (
                                    itemsByKind.map(({ kind, items }) => {
                                        const isCollapsed = collapsedItemKinds.has(kind)

                                        return (
                                            <Stack key={kind} gap="sm">
                                                <Group gap="xs">
                                                    <Badge color="grape" variant="light">
                                                        {homebrewKindLabel(kind)}
                                                    </Badge>
                                                    <Text size="sm" c="dimmed">
                                                        {items.length}{" "}
                                                        {items.length === 1 ? "entry" : "entries"}
                                                    </Text>
                                                    <ActionIcon
                                                        variant="subtle"
                                                        color="gray"
                                                        size="sm"
                                                        aria-label={`${isCollapsed ? "Expand" : "Collapse"} ${homebrewKindLabel(kind)}`}
                                                        aria-expanded={!isCollapsed}
                                                        onClick={(event) =>
                                                            onToggleItemKind(kind, event.detail !== 0)
                                                        }
                                                    >
                                                        <IconChevronDown
                                                            size={16}
                                                            className={`animated-collapse-toggle__chevron${motionlessItemKinds.has(kind) ? " animated-collapse-toggle__chevron--instant" : ""}`}
                                                            style={{
                                                                transform: isCollapsed
                                                                    ? "rotate(-90deg)"
                                                                    : undefined
                                                            }}
                                                        />
                                                    </ActionIcon>
                                                </Group>
                                                <AnimatedCollapse
                                                    opened={!isCollapsed}
                                                    motionEnabled={!motionlessItemKinds.has(kind)}
                                                >
                                                    {kind === "merit" || kind === "flaw" ? (
                                                        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
                                                            {items.map((item) => (
                                                                <HomebrewItemPreview
                                                                    key={
                                                                        item.id ??
                                                                        `${item.kind}-${item.name}`
                                                                    }
                                                                    item={item}
                                                                />
                                                            ))}
                                                        </SimpleGrid>
                                                    ) : (
                                                        <Stack gap="md">
                                                            {items.map((item) => (
                                                                <HomebrewItemPreview
                                                                    key={
                                                                        item.id ??
                                                                        `${item.kind}-${item.name}`
                                                                    }
                                                                    item={item}
                                                                />
                                                            ))}
                                                        </Stack>
                                                    )}
                                                </AnimatedCollapse>
                                            </Stack>
                                        )
                                    })
                                ) : (
                                    <Paper withBorder p="xl" bg="rgba(0,0,0,.18)">
                                        <Text c="dimmed">This collection has no rules yet.</Text>
                                    </Paper>
                                )}
                            </Stack>

                            <Divider />
                            <Group justify="space-between">
                                <div>
                                    <Text fw={600}>Community rating</Text>
                                    <Text size="sm" c="dimmed">
                                        {detail.averageRating.toFixed(1)} from {detail.ratingCount}{" "}
                                        ratings
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
                                        onChange={isAuthenticated ? onRate : signIn}
                                    />
                                )}
                            </Group>

                            <Stack gap="sm">
                                <Group gap="xs">
                                    <IconMessageCircle size={18} />
                                    <Title order={2}>Comments</Title>
                                </Group>
                                {isAuthenticated ? (
                                    <Box className="homebrew-library-detail__comment-composer">
                                        <Textarea
                                            minRows={2}
                                            value={comment}
                                            onChange={(event) =>
                                                setComment(event.currentTarget.value)
                                            }
                                            placeholder="Add to the discussion"
                                            classNames={{
                                                input:
                                                    "homebrew-library-detail__comment-composer-input"
                                            }}
                                        />
                                        <ActionIcon
                                            className="homebrew-library-detail__comment-send"
                                            color="grape"
                                            variant="filled"
                                            size="lg"
                                            disabled={!comment.trim()}
                                            loading={commentPending}
                                            onClick={onComment}
                                            aria-label="Post comment"
                                        >
                                            <IconSend size={18} />
                                        </ActionIcon>
                                    </Box>
                                ) : (
                                    <Button variant="light" onClick={signIn} w="fit-content">
                                        Sign in to comment
                                    </Button>
                                )}
                                {detail.comments.length === 0 ? (
                                    <Text c="dimmed">No comments yet.</Text>
                                ) : (
                                    detail.comments.map((entryComment) => (
                                        <Paper
                                            key={entryComment.id}
                                            withBorder
                                            p="md"
                                            className="homebrew-library-detail__comment"
                                        >
                                            <Group justify="space-between" align="flex-start">
                                                <div style={{ flex: 1 }}>
                                                    <Text
                                                        size="sm"
                                                        fw={600}
                                                        className="homebrew-library-detail__comment-author"
                                                    >
                                                        {entryComment.authorNickname}
                                                    </Text>
                                                    {editingComment?.id === entryComment.id ? (
                                                        <Stack gap="xs" mt="xs">
                                                            <Textarea
                                                                value={editingComment.body}
                                                                onChange={(event) =>
                                                                    onChangeEditingComment(
                                                                        event.currentTarget.value
                                                                    )
                                                                }
                                                                autosize
                                                                minRows={2}
                                                            />
                                                            <Group justify="flex-end" gap="xs">
                                                                <Button
                                                                    size="compact-xs"
                                                                    variant="subtle"
                                                                    onClick={onCancelEditingComment}
                                                                >
                                                                    Cancel
                                                                </Button>
                                                                <Button
                                                                    size="compact-xs"
                                                                    color="grape"
                                                                    disabled={
                                                                        !editingComment.body.trim()
                                                                    }
                                                                    loading={updateCommentPending}
                                                                    onClick={onSaveEditingComment}
                                                                >
                                                                    Save
                                                                </Button>
                                                            </Group>
                                                        </Stack>
                                                    ) : (
                                                        <Text
                                                            className="homebrew-library-detail__comment-body"
                                                        >
                                                            {entryComment.body}
                                                        </Text>
                                                    )}
                                                </div>
                                                <Group gap={2}>
                                                    {entryComment.userId === currentUserId ? (
                                                        <ActionIcon
                                                            color="grape"
                                                            variant="subtle"
                                                            aria-label="Edit comment"
                                                            onClick={() =>
                                                                onStartEditingComment(
                                                                    entryComment.id,
                                                                    entryComment.body
                                                                )
                                                            }
                                                        >
                                                            <IconEdit size={15} />
                                                        </ActionIcon>
                                                    ) : null}
                                                    {entryComment.userId === currentUserId ||
                                                    isSuperadmin ? (
                                                        <ActionIcon
                                                            color="red"
                                                            variant="subtle"
                                                            aria-label="Delete comment"
                                                            onClick={() =>
                                                                onDeleteComment(entryComment.id)
                                                            }
                                                        >
                                                            <IconTrash size={15} />
                                                        </ActionIcon>
                                                    ) : null}
                                                </Group>
                                            </Group>
                                        </Paper>
                                    ))
                                )}
                            </Stack>
                        </Stack>
                    </Container>
                </Box>
            </AppShell.Main>
            {confirmation}
        </AppShell>
    )
}

export default HomebrewLibraryDetailsPage
