import { Alert, Button, Skeleton, Textarea } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import {
    IconArrowLeft,
    IconBooks,
    IconCopy,
    IconEdit,
    IconExternalLink,
    IconGitFork,
    IconMessageCircle,
    IconSend,
    IconTrash
} from "@tabler/icons-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate } from "@tanstack/react-router"
import { memo, useCallback, useMemo, useState, type ReactNode } from "react"
import ConfirmActionModal from "~/components/ConfirmActionModal"
import ContentWarning from "~/components/ContentWarning"
import {
    BloodRating,
    countHomebrewItems,
    groupHomebrewItems,
    HomebrewKindCounts,
    HomebrewKindIndex,
    HomebrewKindSection
} from "~/components/HomebrewCodex"
import HomebrewItemPreview from "~/components/HomebrewItemPreview"
import {
    DeleteIconButton,
    DisabledReason,
    EmptyState,
    IconButton,
    PageHeader,
    PageShell,
    Panel,
    SectionHeader,
    SkeletonCard,
    SkeletonLines,
    useContextMenu
} from "~/components/ui"
import type { HomebrewItem, HomebrewItemKind, HomebrewLibraryDetail } from "~/data/Homebrew"
import { homebrewItemKinds } from "~/data/Homebrew"
import { useAuth } from "~/hooks/useAuth"
import { api } from "~/utils/api"
import "./HomebrewPage.css"
import "./HomebrewLibraryDetailsPage.css"

const storageLimitMessage =
    "your account is using over 100MB of storage, talk to support if you need more"

type Props = { collectionId: string }

const formatDate = (value: string) =>
    new Date(value).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric"
    })

const backLink = (
    <Button
        component={Link}
        to="/homebrew/library"
        variant="subtle"
        color="gray"
        className="hb-back"
        leftSection={<IconArrowLeft size={16} />}
    >
        Community Library
    </Button>
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

    const toggleItemKind = useCallback((kind: HomebrewItemKind, motionEnabled = true) => {
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
    }, [])
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
        return (
            <PageShell size="xl">
                {backLink}
                <div aria-busy="true" aria-label="Loading collection">
                    <Skeleton height={12} width={180} radius="sm" mb={14} />
                    <Skeleton height={34} width="40%" radius="sm" mb={18} />
                    <Skeleton height={14} width="55%" radius="sm" mb={40} />
                    <Panel p="lg" mb={40}>
                        <SkeletonLines lines={2} />
                    </Panel>
                    <div className="hb-codex">
                        <SkeletonLines lines={5} height={14} gap={16} />
                        <div className="hb-library-detail__skeleton-rules">
                            <SkeletonCard height={180} />
                            <SkeletonCard height={180} />
                            <SkeletonCard height={180} />
                        </div>
                    </div>
                </div>
            </PageShell>
        )
    }

    if (detailQuery.isError || !detailQuery.data) {
        return (
            <PageShell size="sm">
                <Panel tone="inset" p={0}>
                    <EmptyState
                        icon={<IconBooks size={26} stroke={1.5} />}
                        title="Collection not found"
                        description="It may have been unpublished or is no longer available."
                        actions={
                            <Button component={Link} to="/homebrew/library" variant="default">
                                Back to the library
                            </Button>
                        }
                    />
                </Panel>
            </PageShell>
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
    confirmation: ReactNode
}

const Colophon = ({ label, children }: { label: string; children: ReactNode }) => (
    <div className="hb-colophon__cell">
        <span className="hb-colophon__label">{label}</span>
        <div className="hb-colophon__value">{children}</div>
    </div>
)

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
    const isAuthor = detail.authorId === currentUserId
    const contextMenu = useContextMenu()
    const showDescription =
        !!detail.snapshot.description &&
        detail.snapshot.description !== detail.snapshot.shortDescription

    return (
        <PageShell size="xl">
            {backLink}
            <PageHeader
                eyebrow={`Community collection · Version ${detail.version}`}
                title={detail.snapshot.name}
                description={detail.snapshot.shortDescription || undefined}
                actions={
                    <>
                        {isAuthor ? (
                            <Button
                                color="red"
                                variant="subtle"
                                loading={unpublishPending}
                                onClick={onUnpublish}
                            >
                                Unpublish
                            </Button>
                        ) : null}
                        <Button
                            leftSection={<IconCopy size={16} />}
                            loading={copyPending}
                            onClick={isAuthenticated ? onCopy : signIn}
                        >
                            Copy to my account
                        </Button>
                    </>
                }
            />

            <Panel tone="ornate" grain className="hb-colophon" p={0}>
                <Colophon label="Author">
                    <span className="hb-colophon__author">{detail.authorNickname}</span>
                </Colophon>
                <Colophon label="Published">{formatDate(detail.publishedAt)}</Colophon>
                <Colophon label="Community rating">
                    <div className="hb-colophon__rating">
                        {isAuthor ? (
                            <DisabledReason reason="You cannot rate your own collection">
                                <BloodRating value={detail.averageRating} size={17} />
                            </DisabledReason>
                        ) : (
                            <BloodRating
                                value={detail.averageRating}
                                size={17}
                                interactive={isAuthenticated}
                                onChange={isAuthenticated ? onRate : signIn}
                            />
                        )}
                        <span className="hb-colophon__muted">
                            {detail.averageRating.toFixed(1)} from {detail.ratingCount} ratings
                        </span>
                    </div>
                    {!isAuthenticated && !isAuthor ? (
                        <Button
                            size="compact-xs"
                            variant="subtle"
                            color="gray"
                            onClick={signIn}
                            className="hb-colophon__signin"
                        >
                            Sign in to rate
                        </Button>
                    ) : null}
                </Colophon>
                <Colophon label="Contents">
                    <HomebrewKindCounts
                        counts={countHomebrewItems(detail.snapshot.items)}
                        max={10}
                    />
                </Colophon>
            </Panel>

            {showDescription || detail.snapshot.tags.length ? (
                <div className="hb-library-detail__about">
                    {showDescription ? (
                        <p className="hb-library-detail__description">
                            {detail.snapshot.description}
                        </p>
                    ) : null}
                    {detail.snapshot.tags.length ? (
                        <div className="hb-tags">
                            {detail.snapshot.tags.map((tag) => (
                                <span key={tag} className="hb-tag">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    ) : null}
                </div>
            ) : null}

            {detail.source ? (
                <Alert
                    color="blue"
                    title="Derived collection"
                    icon={<IconGitFork size={18} />}
                    className="hb-library-detail__notice"
                >
                    <div className="hb-library-detail__source">
                        <span>
                            Based on {detail.source.name}, version {detail.source.version}, by{" "}
                            {detail.source.authorNickname}.
                        </span>
                        {detail.source.available ? (
                            <Button
                                size="compact-sm"
                                variant="light"
                                color="blue"
                                rightSection={<IconExternalLink size={14} />}
                                onClick={() => onOpenSource(detail.source!.entryId)}
                            >
                                Open source
                            </Button>
                        ) : (
                            <span className="hb-colophon__muted">Source unpublished</span>
                        )}
                    </div>
                </Alert>
            ) : null}

            {detail.snapshot.contentWarning ? (
                <div className="hb-library-detail__notice">
                    <ContentWarning>{detail.snapshot.contentWarning}</ContentWarning>
                </div>
            ) : null}

            <SectionHeader
                title="Rules"
                description="Read-only details for this published snapshot."
            />
            <LibraryRules
                items={detail.snapshot.items}
                collapsedItemKinds={collapsedItemKinds}
                motionlessItemKinds={motionlessItemKinds}
                onToggleItemKind={onToggleItemKind}
            />

            <section className="hb-comments" aria-labelledby="hb-comments-title">
                <SectionHeader
                    id="hb-comments-title"
                    title={
                        <>
                            Comments
                            <span className="hb-comments__count">{detail.comments.length}</span>
                        </>
                    }
                />
                {isAuthenticated ? (
                    <div className="hb-comments__composer">
                        <Textarea
                            minRows={2}
                            value={comment}
                            onChange={(event) => setComment(event.currentTarget.value)}
                            placeholder="Add to the discussion"
                            aria-label="Comment"
                            onKeyDown={(event) => {
                                if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                                    event.preventDefault()
                                    onComment()
                                }
                            }}
                        />
                        <IconButton
                            className="hb-comments__send"
                            label="Post comment"
                            variant="filled"
                            color="grape"
                            size="lg"
                            icon={<IconSend size={17} />}
                            disabledReason={!comment.trim() ? "Write a comment first" : undefined}
                            loading={commentPending}
                            onClick={onComment}
                        />
                    </div>
                ) : (
                    <Button variant="default" onClick={signIn} className="hb-comments__signin">
                        Sign in to comment
                    </Button>
                )}
                {detail.comments.length === 0 ? (
                    <EmptyState
                        compact
                        icon={<IconMessageCircle size={20} stroke={1.5} />}
                        title="No comments yet."
                    />
                ) : (
                    <ol className="hb-comments__list">
                        {detail.comments.map((entryComment) => {
                            const isOwn = entryComment.userId === currentUserId
                            const canDelete = isOwn || isSuperadmin
                            const isEditing = editingComment?.id === entryComment.id
                            return (
                                <li
                                    key={entryComment.id}
                                    className="hb-comment"
                                    data-own={isOwn || undefined}
                                    onContextMenu={(event) =>
                                        !isEditing &&
                                        contextMenu.open(event, [
                                            ...(isOwn
                                                ? [
                                                      {
                                                          key: "edit",
                                                          label: "Edit",
                                                          icon: <IconEdit size={14} />,
                                                          onClick: () =>
                                                              onStartEditingComment(
                                                                  entryComment.id,
                                                                  entryComment.body
                                                              )
                                                      }
                                                  ]
                                                : []),
                                            ...(canDelete
                                                ? [
                                                      {
                                                          key: "delete",
                                                          label: "Delete…",
                                                          color: "red",
                                                          icon: <IconTrash size={14} />,
                                                          onClick: () =>
                                                              onDeleteComment(entryComment.id)
                                                      }
                                                  ]
                                                : [])
                                        ])
                                    }
                                >
                                    <div className="hb-comment__head">
                                        <span className="hb-comment__author">
                                            {entryComment.authorNickname}
                                        </span>
                                        <span className="hb-comment__date">
                                            {formatDate(entryComment.createdAt)}
                                            {entryComment.updatedAt !== entryComment.createdAt
                                                ? " · edited"
                                                : ""}
                                        </span>
                                        <div className="hb-comment__actions">
                                            {isOwn && !isEditing ? (
                                                <IconButton
                                                    size="sm"
                                                    label="Edit comment"
                                                    icon={<IconEdit size={15} />}
                                                    onClick={() =>
                                                        onStartEditingComment(
                                                            entryComment.id,
                                                            entryComment.body
                                                        )
                                                    }
                                                />
                                            ) : null}
                                            {canDelete ? (
                                                <DeleteIconButton
                                                    size="sm"
                                                    label="Delete comment"
                                                    onClick={() => onDeleteComment(entryComment.id)}
                                                />
                                            ) : null}
                                        </div>
                                    </div>
                                    {isEditing && editingComment ? (
                                        <div className="hb-comment__edit">
                                            <Textarea
                                                value={editingComment.body}
                                                onChange={(event) =>
                                                    onChangeEditingComment(
                                                        event.currentTarget.value
                                                    )
                                                }
                                                aria-label="Edit comment text"
                                                // eslint-disable-next-line jsx-a11y/no-autofocus
                                                autoFocus
                                                autosize
                                                minRows={2}
                                            />
                                            <div className="hb-comment__edit-actions">
                                                <Button
                                                    size="compact-sm"
                                                    variant="subtle"
                                                    color="gray"
                                                    onClick={onCancelEditingComment}
                                                >
                                                    Cancel
                                                </Button>
                                                <DisabledReason
                                                    reason={
                                                        !editingComment.body.trim()
                                                            ? "A comment cannot be empty"
                                                            : undefined
                                                    }
                                                >
                                                    <Button
                                                        size="compact-sm"
                                                        disabled={!editingComment.body.trim()}
                                                        loading={updateCommentPending}
                                                        onClick={onSaveEditingComment}
                                                    >
                                                        Save
                                                    </Button>
                                                </DisabledReason>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="hb-comment__body">{entryComment.body}</p>
                                    )}
                                </li>
                            )
                        })}
                    </ol>
                )}
            </section>
            {contextMenu.menu}
            {confirmation}
        </PageShell>
    )
}

export default HomebrewLibraryDetailsPage

const LibraryRules = memo(
    ({
        items,
        collapsedItemKinds,
        motionlessItemKinds,
        onToggleItemKind
    }: {
        items: HomebrewItem[]
        collapsedItemKinds: Set<HomebrewItemKind>
        motionlessItemKinds: Set<HomebrewItemKind>
        onToggleItemKind: LibraryDetailProps["onToggleItemKind"]
    }) => {
        const itemsByKind = useMemo(() => groupHomebrewItems(items, homebrewItemKinds), [items])

        if (!itemsByKind.length) {
            return (
                <Panel tone="inset" p={0}>
                    <EmptyState compact title="This collection has no rules yet." />
                </Panel>
            )
        }

        return (
            <div className="hb-codex">
                <HomebrewKindIndex groups={itemsByKind} idPrefix="hb-library" />
                <div>
                    {itemsByKind.map(({ kind, items }) => (
                        <HomebrewKindSection
                            key={kind}
                            kind={kind}
                            count={items.length}
                            idPrefix="hb-library"
                            collapsed={collapsedItemKinds.has(kind)}
                            motionEnabled={!motionlessItemKinds.has(kind)}
                            onToggle={(motionEnabled) => onToggleItemKind(kind, motionEnabled)}
                        >
                            <div
                                className="hb-library-detail__entries"
                                data-layout={
                                    kind === "loresheet" || kind === "predatorType"
                                        ? "sheet"
                                        : kind === "merit" || kind === "flaw"
                                          ? "compact"
                                          : "grid"
                                }
                            >
                                {items.map((item) => (
                                    <HomebrewItemPreview
                                        key={item.id ?? `${item.kind}-${item.name}`}
                                        item={item}
                                    />
                                ))}
                            </div>
                        </HomebrewKindSection>
                    ))}
                </div>
            </div>
        )
    }
)
