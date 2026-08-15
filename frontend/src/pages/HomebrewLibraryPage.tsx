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
    Select,
    Stack,
    Text,
    TextInput,
    Title
} from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { IconArrowLeft, IconBooks, IconDropletFilled, IconSend } from "@tabler/icons-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import AppTopbar from "~/components/AppTopbar"
import ConfirmActionModal from "~/components/ConfirmActionModal"
import { homebrewDropdownClassNames } from "~/components/homebrewFormControlProps"
import { homebrewItemKinds, homebrewKindLabel } from "~/data/Homebrew"
import { useAuth } from "~/hooks/useAuth"
import { useHomebrewCollections } from "~/hooks/useHomebrew"
import { api } from "~/utils/api"
import "./HomebrewLibraryPage.css"

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
                    onClick={(event) => {
                        event.stopPropagation()
                        onChange?.(rating)
                    }}
                    onKeyDown={(event) => event.stopPropagation()}
                >
                    <IconDropletFilled size={15} color={filled ? "#c74650" : "#908990"} />
                </ActionIcon>
            )
        })}
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
    const navigate = useNavigate()
    const { user, isAuthenticated, signIn, isSigningIn } = useAuth()
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
    const rateMutation = useMutation({
        mutationFn: ({ entryId, rating }: { entryId: string; rating: number }) =>
            api.rateHomebrewLibraryCollection(entryId, rating),
        onSuccess: refreshLibrary,
        onError: (error) => {
            notifications.show({
                title: "Could not save rating",
                message: error.message,
                color: "red"
            })
        }
    })

    return (
        <AppShell header={{ height: 52 }} padding={0}>
            <AppShell.Header>
                <AppTopbar />
            </AppShell.Header>
            <AppShell.Main className="homebrew-page" bg="#100d12" mih="100vh">
                <Container size="xl" py={84} className="homebrew-page__content">
                    <Stack gap="xl">
                        <Group
                            justify="space-between"
                            align="flex-start"
                            className="homebrew-page__header"
                        >
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
                            <Group className="homebrew-page__header-actions">
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
                                    loading={!isAuthenticated && isSigningIn}
                                >
                                    {!isAuthenticated && isSigningIn
                                        ? "Signing in…"
                                        : "Request to publish"}
                                </Button>
                            </Group>
                        </Group>

                        <Paper withBorder p="md" bg="rgba(0,0,0,.4)">
                            <Group grow align="flex-end" className="homebrew-library__filters">
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
                                    classNames={homebrewDropdownClassNames}
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
                                    classNames={homebrewDropdownClassNames}
                                />
                            </Group>
                        </Paper>

                        {libraryQuery.isLoading ? (
                            <Loader color="grape" />
                        ) : libraryQuery.data?.length ? (
                            <Stack gap="sm">
                                {libraryQuery.data.map((entry) => {
                                    const canRate =
                                        entry.authorId !== user?.id && !rateMutation.isPending
                                    const openEntry = () =>
                                        navigate({
                                            to: "/homebrew/library/$collectionId",
                                            params: { collectionId: entry.id }
                                        })

                                    return (
                                        <article
                                            key={entry.id}
                                            className="homebrew-library-card"
                                            role="link"
                                            tabIndex={0}
                                            aria-label={`Open ${entry.name}`}
                                            onClick={openEntry}
                                            onKeyDown={(event) => {
                                                if (event.key === "Enter" || event.key === " ") {
                                                    event.preventDefault()
                                                    openEntry()
                                                }
                                            }}
                                        >
                                            <div className="homebrew-library-card__body">
                                                <div className="homebrew-library-card__grid">
                                                    <Stack gap={4} className="homebrew-library-card__collection">
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
                                                    <div>
                                                        <Text className="homebrew-library-card__label">
                                                            Author
                                                        </Text>
                                                        <Text>{entry.authorNickname}</Text>
                                                    </div>
                                                    <div>
                                                        <Text className="homebrew-library-card__label">
                                                            Contents
                                                        </Text>
                                                        <Text size="sm">
                                                            {Object.entries(entry.itemCounts)
                                                                .map(
                                                                    ([itemKind, count]) =>
                                                                        `${count} ${homebrewKindLabel(itemKind as never)}`
                                                                )
                                                                .join(", ")}
                                                        </Text>
                                                    </div>
                                                    <Stack gap={2}>
                                                        <Text className="homebrew-library-card__label">
                                                            Rating
                                                        </Text>
                                                        <BloodRating
                                                            value={entry.averageRating}
                                                            interactive={canRate && !isSigningIn}
                                                            onChange={(rating) => {
                                                                if (isAuthenticated) {
                                                                    rateMutation.mutate({
                                                                        entryId: entry.id,
                                                                        rating
                                                                    })
                                                                } else {
                                                                    signIn()
                                                                }
                                                            }}
                                                        />
                                                        {!isAuthenticated && isSigningIn ? (
                                                            <Text size="xs">Signing in…</Text>
                                                        ) : null}
                                                        <Text size="xs" c="dimmed">
                                                            {entry.ratingCount} ratings
                                                        </Text>
                                                    </Stack>
                                                    <div>
                                                        <Text className="homebrew-library-card__label">
                                                            Community
                                                        </Text>
                                                        <Text size="sm">{entry.copyCount} copies</Text>
                                                        <Text size="sm">{entry.commentCount} comments</Text>
                                                    </div>
                                                </div>
                                            </div>
                                        </article>
                                    )
                                })}
                            </Stack>
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
                        classNames={homebrewDropdownClassNames}
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
