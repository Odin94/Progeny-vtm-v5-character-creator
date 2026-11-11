import { useDebouncedValue } from "@mantine/hooks"
import {
    Alert,
    Badge,
    Button,
    Checkbox,
    Loader,
    Modal,
    Select,
    Stack,
    Text,
    TextInput
} from "@mantine/core"
import { notifications } from "@mantine/notifications"
import {
    IconArrowLeft,
    IconArrowsSort,
    IconBooks,
    IconExternalLink,
    IconFilter,
    IconLink,
    IconMessageCircle,
    IconRefresh,
    IconSearch,
    IconSend,
    IconX,
    IconCopy
} from "@tabler/icons-react"
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate } from "@tanstack/react-router"
import { useEffect, useRef, useState, type KeyboardEvent } from "react"
import ConfirmActionModal from "~/components/ConfirmActionModal"
import { BloodRating, HomebrewKindCounts } from "~/components/HomebrewCodex"
import { homebrewDropdownClassNames } from "~/components/homebrewFormControlProps"
import {
    DisabledReason,
    EmptyState,
    IconButton,
    PageHeader,
    PageShell,
    Panel,
    SectionHeader,
    SkeletonGrid,
    useContextMenu
} from "~/components/ui"
import type { HomebrewItemKind, HomebrewLibrarySummary } from "~/data/Homebrew"
import { homebrewItemKinds, homebrewKindLabel } from "~/data/Homebrew"
import { useAuth } from "~/hooks/useAuth"
import { useHomebrewCollections } from "~/hooks/useHomebrew"
import type { HomebrewLibrarySearch, HomebrewLibrarySort } from "~/routes/homebrew.library"
import { api } from "~/utils/api"
import "./HomebrewPage.css"
import "./HomebrewLibraryPage.css"

const sortOptions: Array<{ value: HomebrewLibrarySort; label: string }> = [
    { value: "top", label: "Top rated" },
    { value: "trending", label: "Trending" },
    { value: "newest", label: "Newest" },
    { value: "copied", label: "Most copied" }
]

const formatRequestOpenedDate = (createdAt: string) =>
    new Date(createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric"
    })

/** Cards rendered per batch; more are added as the reader nears the end of the list. */
const PAGE_SIZE = 24

const statusColor = (status: string) =>
    status === "approved"
        ? "green"
        : status === "denied"
          ? "red"
          : status === "pending"
            ? "yellow"
            : "gray"

const HomebrewLibraryPage = ({ search = {} }: { search?: HomebrewLibrarySearch }) => {
    const client = useQueryClient()
    const navigate = useNavigate()
    const { user, isAuthenticated, signIn, isSigningIn } = useAuth()
    const hasSuperadminPrivileges =
        (user?.actorIsSuperadmin ?? false) && !user?.impersonation.active
    const { data: collections = [] } = useHomebrewCollections(isAuthenticated)
    const [query, setQuery] = useState(search.q ?? "")
    const [debouncedQuery] = useDebouncedValue(query, 200)
    const searchQuery = debouncedQuery.trim()
    const [kind, setKind] = useState<HomebrewItemKind | null>(search.type ?? null)
    const [sort, setSort] = useState<HomebrewLibrarySort>(search.sort ?? "top")
    const [publishOpened, setPublishOpened] = useState(false)
    const [publishCollectionId, setPublishCollectionId] = useState<string | null>(null)
    const [acknowledged, setAcknowledged] = useState(false)
    const [withdrawRequestId, setWithdrawRequestId] = useState<string | null>(null)
    const contextMenu = useContextMenu()

    const setSearch = (next: Partial<HomebrewLibrarySearch>) =>
        navigate({
            to: "/homebrew/library",
            search: (previous: HomebrewLibrarySearch) => ({ ...previous, ...next }),
            replace: true
        })

    // Filters are local state mirrored into the URL (search params), so reloads, shared links
    // and back/forward restore them. Only fields that changed locally are written back.
    useEffect(() => {
        setQuery((current) => (current.trim() === (search.q ?? "") ? current : (search.q ?? "")))
    }, [search.q])
    useEffect(() => setKind(search.type ?? null), [search.type])
    useEffect(() => setSort(search.sort ?? "top"), [search.sort])
    const pushedFilters = useRef({ q: searchQuery, type: kind, sort })
    useEffect(() => {
        const previous = pushedFilters.current
        const changed: Partial<HomebrewLibrarySearch> = {}
        if (searchQuery !== previous.q) changed.q = searchQuery || undefined
        if (kind !== previous.type) changed.type = kind ?? undefined
        if (sort !== previous.sort) changed.sort = sort === "top" ? undefined : sort
        pushedFilters.current = { q: searchQuery, type: kind, sort }
        if (Object.keys(changed).length) setSearch(changed)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery, kind, sort])

    const libraryQuery = useQuery({
        queryKey: ["homebrew", "library", searchQuery, kind, sort],
        queryFn: () =>
            api.getHomebrewLibrary({ query: searchQuery, type: kind ?? undefined, sort }),
        placeholderData: keepPreviousData
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

    const openEntry = (entryId: string) =>
        navigate({ to: "/homebrew/library/$collectionId", params: { collectionId: entryId } })
    const copyEntryLink = (entryId: string) => {
        const url = `${window.location.origin}/homebrew/library/${entryId}`
        void navigator.clipboard
            ?.writeText(url)
            .then(() => notifications.show({ message: "Link copied", color: "grape" }))
    }
    const hasFilters = !!searchQuery || !!kind || sort !== "top"
    const clearFilters = () => {
        setQuery("")
        setKind(null)
        setSort("top")
    }
    const entries = libraryQuery.data ?? []

    // Incremental rendering keeps very large libraries cheap without virtualizing a
    // responsive grid (which would blank cards during fast scrolls).
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
    const sentinelRef = useRef<HTMLDivElement>(null)
    useEffect(() => setVisibleCount(PAGE_SIZE), [searchQuery, kind, sort])
    const hasMore = entries.length > visibleCount
    useEffect(() => {
        const sentinel = sentinelRef.current
        if (!sentinel || !hasMore) return
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry?.isIntersecting) setVisibleCount((count) => count + PAGE_SIZE)
            },
            { rootMargin: "1200px 0px" }
        )
        observer.observe(sentinel)
        return () => observer.disconnect()
    }, [hasMore, visibleCount])

    const publishDisabledReason = !publishCollectionId
        ? "Choose a collection first."
        : !acknowledged
          ? "Confirm that you may share this content."
          : undefined

    return (
        <PageShell size="xl">
            <PageHeader
                eyebrow="Homebrew"
                title="Community Library"
                icon={<IconBooks size={30} stroke={1.5} />}
                description="Discover community-built rules, ranked by reputation and proven ratings."
                actions={
                    <>
                        <Button
                            component={Link}
                            to="/homebrew"
                            variant="default"
                            leftSection={<IconArrowLeft size={16} />}
                        >
                            My Homebrew
                        </Button>
                        <Button
                            leftSection={<IconSend size={16} />}
                            onClick={() => (isAuthenticated ? setPublishOpened(true) : signIn())}
                            loading={!isAuthenticated && isSigningIn}
                        >
                            {!isAuthenticated && isSigningIn ? "Signing in…" : "Request to publish"}
                        </Button>
                    </>
                }
            />

            <div className="hb-library__toolbar" role="search">
                <TextInput
                    className="hb-library__search"
                    aria-label="Search"
                    placeholder="Search collections, authors or tags"
                    leftSection={<IconSearch size={16} />}
                    rightSection={
                        libraryQuery.isFetching && !libraryQuery.isLoading ? (
                            <Loader size={14} />
                        ) : query ? (
                            <IconButton
                                size="sm"
                                label="Clear search"
                                icon={<IconX size={14} />}
                                onClick={() => setQuery("")}
                            />
                        ) : null
                    }
                    value={query}
                    onChange={(event) => setQuery(event.currentTarget.value)}
                />
                <Select
                    className="hb-library__select"
                    aria-label="Contains"
                    placeholder="Any content"
                    leftSection={<IconFilter size={16} />}
                    clearable
                    value={kind}
                    data={homebrewItemKinds.map((itemKind) => ({
                        value: itemKind,
                        label: homebrewKindLabel(itemKind)
                    }))}
                    onChange={(value) => setKind((value as HomebrewItemKind | null) ?? null)}
                    classNames={homebrewDropdownClassNames}
                />
                <Select
                    className="hb-library__select"
                    aria-label="Sort by"
                    leftSection={<IconArrowsSort size={16} />}
                    allowDeselect={false}
                    value={sort}
                    data={sortOptions}
                    onChange={(value) => value && setSort(value as HomebrewLibrarySort)}
                    classNames={homebrewDropdownClassNames}
                />
            </div>
            <p className="hb-library__count" aria-live="polite">
                {libraryQuery.isLoading
                    ? " "
                    : `${entries.length} ${entries.length === 1 ? "collection" : "collections"}`}
                {hasFilters && !libraryQuery.isLoading ? (
                    <Button
                        size="compact-xs"
                        variant="subtle"
                        color="gray"
                        ml="xs"
                        onClick={clearFilters}
                    >
                        Clear filters
                    </Button>
                ) : null}
            </p>

            {libraryQuery.isLoading ? (
                <SkeletonGrid count={6} cols={{ base: 1, sm: 2, lg: 3 }} cardHeight={268} />
            ) : libraryQuery.isError && !entries.length ? (
                <Panel tone="inset" p={0}>
                    <EmptyState
                        compact
                        title="Could not load the library"
                        description={libraryQuery.error.message}
                        actions={
                            <Button
                                variant="default"
                                leftSection={<IconRefresh size={16} />}
                                loading={libraryQuery.isFetching}
                                onClick={() => libraryQuery.refetch()}
                            >
                                Try again
                            </Button>
                        }
                    />
                </Panel>
            ) : entries.length ? (
                <div
                    className="hb-library__grid"
                    data-stale={libraryQuery.isPlaceholderData || undefined}
                >
                    {entries.slice(0, visibleCount).map((entry) => (
                        <LibraryCard
                            key={entry.id}
                            entry={entry}
                            canRate={
                                entry.authorId !== user?.id &&
                                !rateMutation.isPending &&
                                !isSigningIn
                            }
                            isOwn={entry.authorId === user?.id}
                            signingIn={!isAuthenticated && isSigningIn}
                            onOpen={() => openEntry(entry.id)}
                            onRate={(rating) => {
                                if (isAuthenticated) {
                                    rateMutation.mutate({ entryId: entry.id, rating })
                                } else {
                                    signIn()
                                }
                            }}
                            onContextMenu={(event) =>
                                contextMenu.open(event, [
                                    {
                                        key: "open",
                                        label: "Open collection",
                                        icon: <IconExternalLink size={14} />,
                                        onClick: () => openEntry(entry.id)
                                    },
                                    {
                                        key: "link",
                                        label: "Copy link",
                                        icon: <IconLink size={14} />,
                                        onClick: () => copyEntryLink(entry.id)
                                    }
                                ])
                            }
                        />
                    ))}
                    {hasMore ? <div ref={sentinelRef} className="hb-library__sentinel" /> : null}
                </div>
            ) : (
                <Panel tone="inset" p={0}>
                    <EmptyState
                        icon={<IconBooks size={26} stroke={1.5} />}
                        title={hasFilters ? "Nothing matches" : "The library is empty"}
                        description={
                            hasFilters
                                ? "No published collections match these filters yet."
                                : "No collections have been published yet."
                        }
                        actions={
                            hasFilters ? (
                                <Button variant="default" onClick={clearFilters}>
                                    Clear filters
                                </Button>
                            ) : (
                                <Button
                                    onClick={() =>
                                        isAuthenticated ? setPublishOpened(true) : signIn()
                                    }
                                >
                                    Request to publish
                                </Button>
                            )
                        }
                    />
                </Panel>
            )}

            {isAuthenticated && requestsQuery.data?.length ? (
                <section className="hb-requests">
                    <SectionHeader title="Your publication requests" />
                    <Panel p={0} className="hb-requests__list">
                        {requestsQuery.data.map((request) => (
                            <div
                                key={request.id}
                                className="hb-request"
                                onContextMenu={(event) =>
                                    contextMenu.open(event, [
                                        ...(request.libraryEntryId
                                            ? [
                                                  {
                                                      key: "open",
                                                      label: "Open in library",
                                                      icon: <IconExternalLink size={14} />,
                                                      onClick: () =>
                                                          openEntry(request.libraryEntryId!)
                                                  }
                                              ]
                                            : []),
                                        ...(request.status === "pending"
                                            ? [
                                                  {
                                                      key: "withdraw",
                                                      label: "Withdraw…",
                                                      color: "red",
                                                      icon: <IconX size={14} />,
                                                      onClick: () =>
                                                          setWithdrawRequestId(request.id)
                                                  }
                                              ]
                                            : [])
                                    ])
                                }
                            >
                                <div className="hb-request__main">
                                    <Text fw={600} className="hb-request__name">
                                        {request.snapshot.name}
                                    </Text>
                                    <Text size="sm" c="dimmed">
                                        Opened {formatRequestOpenedDate(request.createdAt)}
                                    </Text>
                                    {request.denialMessage ? (
                                        <Text size="sm" className="hb-request__denial">
                                            {request.denialMessage}
                                        </Text>
                                    ) : null}
                                </div>
                                <div className="hb-request__side">
                                    <Badge color={statusColor(request.status)} variant="light">
                                        {request.status}
                                    </Badge>
                                    {request.status === "pending" ? (
                                        <Button
                                            size="compact-sm"
                                            variant="subtle"
                                            color="gray"
                                            loading={
                                                withdrawMutation.isPending &&
                                                withdrawMutation.variables === request.id
                                            }
                                            onClick={() => setWithdrawRequestId(request.id)}
                                        >
                                            Withdraw
                                        </Button>
                                    ) : null}
                                </div>
                            </div>
                        ))}
                    </Panel>
                </section>
            ) : null}
            {contextMenu.menu}

            <Modal
                opened={publishOpened}
                onClose={() => setPublishOpened(false)}
                title="Request to publish a snapshot"
            >
                <Stack gap="md">
                    <Text size="sm" c="dimmed">
                        The submitted version is frozen. Future edits require another review and the
                        current approved version stays public while an update is pending.
                    </Text>
                    <Select
                        label="Collection"
                        placeholder="Choose a collection"
                        data-autofocus
                        value={publishCollectionId}
                        data={collections.map((collection) => ({
                            value: collection.id,
                            label: collection.name
                        }))}
                        nothingFoundMessage="You have no collections yet"
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
                    <div className="hb-modal-actions">
                        <Button
                            variant="subtle"
                            color="gray"
                            onClick={() => setPublishOpened(false)}
                        >
                            Cancel
                        </Button>
                        <DisabledReason reason={publishDisabledReason}>
                            <Button
                                disabled={!publishCollectionId || !acknowledged}
                                loading={publishMutation.isPending}
                                onClick={() =>
                                    publishCollectionId &&
                                    publishMutation.mutate(publishCollectionId)
                                }
                            >
                                Submit snapshot
                            </Button>
                        </DisabledReason>
                    </div>
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
        </PageShell>
    )
}

const LibraryCard = ({
    entry,
    canRate,
    isOwn,
    signingIn,
    onOpen,
    onRate,
    onContextMenu
}: {
    entry: HomebrewLibrarySummary
    canRate: boolean
    isOwn: boolean
    signingIn: boolean
    onOpen: () => void
    onRate: (rating: number) => void
    onContextMenu: (event: React.MouseEvent<HTMLElement>) => void
}) => (
    <Panel
        component="article"
        interactive
        className="hb-libcard"
        role="link"
        tabIndex={0}
        aria-label={`Open ${entry.name}`}
        onClick={onOpen}
        onContextMenu={onContextMenu}
        onKeyDown={(event: KeyboardEvent<HTMLElement>) => {
            if (event.target !== event.currentTarget) return
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault()
                onOpen()
            }
        }}
    >
        <header className="hb-libcard__head">
            <span className="hb-libcard__author">
                by <strong>{entry.authorNickname}</strong>
            </span>
            <span className="hb-libcard__version">v{entry.version}</span>
        </header>
        <h2 className="hb-libcard__name">{entry.name}</h2>
        <p className="hb-libcard__desc" data-empty={!entry.shortDescription || undefined}>
            {entry.shortDescription || "No description."}
        </p>
        {entry.tags.length ? (
            <div className="hb-tags">
                {entry.tags.slice(0, 4).map((tag) => (
                    <span key={tag} className="hb-tag">
                        {tag}
                    </span>
                ))}
            </div>
        ) : null}
        <HomebrewKindCounts counts={entry.itemCounts} max={6} />
        <footer className="hb-libcard__footer">
            <div className="hb-libcard__rating">
                {isOwn ? (
                    <DisabledReason reason="You cannot rate your own collection">
                        <BloodRating value={entry.averageRating} />
                    </DisabledReason>
                ) : (
                    <BloodRating
                        value={entry.averageRating}
                        interactive={canRate}
                        onChange={onRate}
                    />
                )}
                <span className="hb-libcard__stat">
                    {signingIn
                        ? "Signing in…"
                        : `${entry.ratingCount ? entry.averageRating.toFixed(1) : "–"} · ${entry.ratingCount} ratings`}
                </span>
            </div>
            <div className="hb-libcard__stats">
                <span className="hb-libcard__stat" aria-label={`${entry.copyCount} copies`}>
                    <IconCopy size={13} aria-hidden="true" />
                    {entry.copyCount}
                </span>
                <span className="hb-libcard__stat" aria-label={`${entry.commentCount} comments`}>
                    <IconMessageCircle size={13} aria-hidden="true" />
                    {entry.commentCount}
                </span>
            </div>
        </footer>
    </Panel>
)

export default HomebrewLibraryPage
