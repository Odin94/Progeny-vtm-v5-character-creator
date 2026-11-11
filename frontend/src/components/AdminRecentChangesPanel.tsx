import { Button, SimpleGrid, Skeleton, TextInput, Textarea } from "@mantine/core"
import {
    IconAlertTriangle,
    IconEye,
    IconNews,
    IconPencil,
    IconPhoto,
    IconPlus,
    IconRefresh,
    IconSend,
    IconTrash
} from "@tabler/icons-react"
import { notifications } from "@mantine/notifications"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { api, type RecentChange } from "~/utils/api"
import { composeRecentChangeBody, splitRecentChangeLayout } from "~/utils/recentChangeLayout"
import RecentChangesModal from "~/components/RecentChangesModal"
import ConfirmActionModal from "~/components/ConfirmActionModal"
import FileDropZone from "~/components/FileDropZone"
import {
    DeleteIconButton,
    DisabledReason,
    EmptyState,
    IconButton,
    Panel,
    SectionHeader,
    useContextMenu,
    type ContextMenuEntry
} from "~/components/ui"
import classes from "./AdminPanels.module.css"

const formatDate = (date: string | null) =>
    date
        ? new Date(date).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric"
          })
        : "Not published"

const statusLabel = (change: RecentChange) =>
    change.status === "published" ? "Published" : change.status === "deleted" ? "Deleted" : "Draft"

const AdminRecentChangesPanel = () => {
    const queryClient = useQueryClient()
    const contextMenu = useContextMenu()
    const [editingId, setEditingId] = useState<string | null>(null)
    const [previewChange, setPreviewChange] = useState<RecentChange | null>(null)
    const [deletionCandidate, setDeletionCandidate] = useState<{
        change: RecentChange
        permanently: boolean
    } | null>(null)
    const [title, setTitle] = useState("")
    const [topSection, setTopSection] = useState("")
    const [bottomColumns, setBottomColumns] = useState(["", "", ""])
    const [linkText, setLinkText] = useState("")
    const [linkUrl, setLinkUrl] = useState("")
    const changesQuery = useQuery({
        queryKey: ["admin", "recent-changes"],
        queryFn: api.getAdminRecentChanges
    })
    const selectedChange = changesQuery.data?.changes.find((change) => change.id === editingId)

    useEffect(() => {
        if (!selectedChange) return
        setTitle(selectedChange.title)
        const layout = splitRecentChangeLayout(selectedChange.body)
        setTopSection(layout.topSection)
        setBottomColumns([...layout.columns, "", "", ""].slice(0, 3))
        setLinkText(selectedChange.linkText ?? "")
        setLinkUrl(selectedChange.linkUrl ?? "")
    }, [selectedChange])

    const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin", "recent-changes"] })
    const createDraft = () => {
        setEditingId(null)
        setTitle("")
        setTopSection("")
        setBottomColumns(["", "", ""])
        setLinkText("")
        setLinkUrl("")
    }
    const body = composeRecentChangeBody(topSection, bottomColumns)
    const updateBottomColumn = (index: number, value: string) => {
        setBottomColumns((columns) =>
            columns.map((column, columnIndex) => (columnIndex === index ? value : column))
        )
    }
    const saveMutation = useMutation({
        mutationFn: () =>
            editingId
                ? api.updateAdminRecentChange(editingId, {
                      title,
                      body,
                      linkText: linkText.trim() || null,
                      linkUrl: linkUrl.trim() || null
                  })
                : api.createAdminRecentChange({
                      title,
                      body,
                      linkText: linkText.trim() || null,
                      linkUrl: linkUrl.trim() || null
                  }),
        onSuccess: (change) => {
            setEditingId(change.id)
            void refresh()
            notifications.show({
                title: "Draft saved",
                message: "This update will not be shown until you publish it.",
                color: "green"
            })
        },
        onError: (error) => {
            notifications.show({
                title: "Could not save draft",
                message: error instanceof Error ? error.message : "Please try again.",
                color: "red"
            })
        }
    })
    const imageUploadMutation = useMutation({
        mutationFn: ({ id, file }: { id: string; file: File }) =>
            api.uploadAdminRecentChangeImage(id, file),
        onSuccess: () => {
            void refresh()
            notifications.show({
                title: "Image uploaded",
                message: "The image will appear beside the introduction in this update.",
                color: "green"
            })
        },
        onError: (error) => {
            notifications.show({
                title: "Could not upload image",
                message: error instanceof Error ? error.message : "Please try again.",
                color: "red"
            })
        }
    })
    const removeImageMutation = useMutation({
        mutationFn: (id: string) => api.removeAdminRecentChangeImage(id),
        onSuccess: () => {
            void refresh()
            notifications.show({
                title: "Image removed",
                message: "The draft no longer has an image.",
                color: "green"
            })
        },
        onError: (error) => {
            notifications.show({
                title: "Could not remove image",
                message: error instanceof Error ? error.message : "Please try again.",
                color: "red"
            })
        }
    })
    const publishMutation = useMutation({
        mutationFn: (id: string) => api.publishAdminRecentChange(id),
        onSuccess: () => {
            void refresh()
            notifications.show({
                title: "Recent change published",
                message: "Signed-in users will receive it on their next pageview.",
                color: "green"
            })
        },
        onError: (error) => {
            notifications.show({
                title: "Could not publish draft",
                message: error instanceof Error ? error.message : "Please try again.",
                color: "red"
            })
        }
    })
    const deleteMutation = useMutation({
        mutationFn: async ({ id, permanently }: { id: string; permanently: boolean }) => {
            if (permanently) {
                await api.hardDeleteAdminRecentChange(id)
                return
            }
            await api.softDeleteAdminRecentChange(id)
        },
        onSuccess: (_result, { id, permanently }) => {
            setDeletionCandidate(null)
            if (editingId === id) createDraft()
            if (previewChange?.id === id) setPreviewChange(null)
            void refresh()
            notifications.show({
                title: permanently ? "Update permanently deleted" : "Update deleted",
                message: permanently
                    ? "The update and its delivery records have been removed."
                    : "The update is no longer shown to users and can be permanently deleted later.",
                color: "green"
            })
        },
        onError: (error) => {
            notifications.show({
                title: "Could not delete update",
                message: error instanceof Error ? error.message : "Please try again.",
                color: "red"
            })
        }
    })
    const isPublished = selectedChange?.status === "published"
    const isDeleted = selectedChange?.status === "deleted"
    const isReadOnly = isPublished || isDeleted
    const bodyOverLimit = body.length > 10_000
    const hasIncompleteLink = Boolean(linkText.trim()) !== Boolean(linkUrl.trim())
    const canSave =
        title.trim().length > 0 &&
        topSection.trim().length > 0 &&
        !bodyOverLimit &&
        !hasIncompleteLink &&
        !isReadOnly
    const publishedChanges = (changesQuery.data?.changes ?? [])
        .filter((change) => change.status === "published")
        .sort(
            (first, second) =>
                new Date(first.publishedAt ?? 0).getTime() -
                new Date(second.publishedAt ?? 0).getTime()
        )
    const previewChanges = !previewChange
        ? []
        : previewChange.status === "published"
          ? publishedChanges
          : [...publishedChanges, { ...previewChange, publishedAt: new Date().toISOString() }]

    const saveBlockReason = isReadOnly
        ? undefined
        : !title.trim()
          ? "Add a title first"
          : !topSection.trim()
            ? "Add the top section first"
            : bodyOverLimit
              ? "All sections together must be 10,000 characters or fewer"
              : hasIncompleteLink
                ? "Enter both link text and a URL, or leave both empty"
                : undefined

    const changeMenuEntries = (change: RecentChange): ContextMenuEntry[] => [
        { type: "label", key: "label", label: change.title },
        {
            key: "edit",
            label: change.status === "draft" ? "Edit" : "Open",
            icon: <IconPencil size={14} />,
            onClick: () => setEditingId(change.id)
        },
        ...(change.status !== "deleted"
            ? [
                  {
                      key: "view",
                      label: "View",
                      icon: <IconEye size={14} />,
                      onClick: () => setPreviewChange(change)
                  }
              ]
            : []),
        { type: "divider", key: "divider" },
        {
            key: "delete",
            label: change.status === "deleted" ? "Delete permanently…" : "Delete…",
            color: "red",
            icon: <IconTrash size={14} />,
            onClick: () =>
                setDeletionCandidate({ change, permanently: change.status === "deleted" })
        }
    ]

    return (
        <div className={classes.stack}>
            <SectionHeader
                title="Recent changes"
                description="Draft and publish the update dialog shown to signed-in users."
                actions={
                    <Button size="xs" leftSection={<IconPlus size={14} />} onClick={createDraft}>
                        New draft
                    </Button>
                }
            />

            <div className={classes.split}>
                <div className={classes.splitGrid}>
                    <Panel p="lg">
                        <div className={classes.stack}>
                            <div className={classes.editorHead}>
                                <h3 className={classes.editorTitle}>
                                    {isPublished
                                        ? "Published update"
                                        : isDeleted
                                          ? "Deleted update"
                                          : "Draft editor"}
                                </h3>
                                {selectedChange ? (
                                    <span
                                        className={classes.status}
                                        data-status={selectedChange.status}
                                    >
                                        {statusLabel(selectedChange)}
                                    </span>
                                ) : null}
                            </div>
                            <TextInput
                                label="Title"
                                value={title}
                                onChange={(event) => setTitle(event.currentTarget.value)}
                                maxLength={160}
                                disabled={isReadOnly}
                                required
                            />
                            <Textarea
                                label="Top section"
                                description="Shown above the ornamental divider, beside the optional image. Markdown is supported."
                                value={topSection}
                                onChange={(event) => setTopSection(event.currentTarget.value)}
                                minRows={5}
                                autosize
                                maxLength={10_000}
                                disabled={isReadOnly}
                                required
                            />
                            <div className={classes.fieldGroup}>
                                <div>
                                    <p className={classes.fieldLabel}>Bottom columns</p>
                                    <p className={classes.fieldHint}>
                                        Each field maps directly to its column below the divider.
                                        Leave fields empty to use fewer columns.
                                    </p>
                                </div>
                                <SimpleGrid cols={{ base: 1, md: 3 }} spacing="sm">
                                    {(
                                        ["Left column", "Center column", "Right column"] as const
                                    ).map((label, index) => (
                                        <Textarea
                                            key={label}
                                            label={label}
                                            value={bottomColumns[index]}
                                            onChange={(event) =>
                                                updateBottomColumn(index, event.currentTarget.value)
                                            }
                                            minRows={8}
                                            maxLength={10_000}
                                            disabled={isReadOnly}
                                        />
                                    ))}
                                </SimpleGrid>
                                {bodyOverLimit ? (
                                    <p className={classes.fieldError}>
                                        All sections together must be 10,000 characters or fewer.
                                    </p>
                                ) : null}
                            </div>
                            <div className={classes.fieldGroup}>
                                <div>
                                    <p className={classes.fieldLabel}>Optional link</p>
                                    <p className={classes.fieldHint}>
                                        Displayed below the update content and above the footer.
                                    </p>
                                </div>
                                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="sm">
                                    <TextInput
                                        label="Link text"
                                        value={linkText}
                                        onChange={(event) => setLinkText(event.currentTarget.value)}
                                        maxLength={160}
                                        disabled={isReadOnly}
                                    />
                                    <TextInput
                                        label="Link URL"
                                        type="url"
                                        value={linkUrl}
                                        onChange={(event) => setLinkUrl(event.currentTarget.value)}
                                        maxLength={2_048}
                                        disabled={isReadOnly}
                                    />
                                </SimpleGrid>
                                {hasIncompleteLink ? (
                                    <p className={classes.fieldError}>
                                        Enter both link text and a URL, or leave both empty.
                                    </p>
                                ) : null}
                            </div>
                            <div className={classes.fieldGroup}>
                                <div>
                                    <p className={classes.fieldLabel}>Image</p>
                                    <p className={classes.fieldHint}>
                                        Optional. JPEG, PNG, or WebP, up to 3 MB. It is stored with
                                        the update.
                                    </p>
                                </div>
                                {isReadOnly ? (
                                    <p className={classes.fieldHint}>
                                        {selectedChange?.hasImage || selectedChange?.imageUrl
                                            ? "This update includes an image."
                                            : "This update has no image."}
                                    </p>
                                ) : editingId ? (
                                    <div className={classes.imageRow}>
                                        <FileDropZone
                                            accept="image/jpeg,image/png,image/webp"
                                            listenToPaste
                                            disabled={imageUploadMutation.isPending}
                                            onFile={(file) =>
                                                imageUploadMutation.mutate({
                                                    id: editingId,
                                                    file
                                                })
                                            }
                                            icon={<IconPhoto size={18} stroke={1.6} />}
                                            title={
                                                imageUploadMutation.isPending
                                                    ? "Uploading…"
                                                    : selectedChange?.hasImage
                                                      ? "Replace image"
                                                      : "Upload image"
                                            }
                                            hint="Drop an image here, paste it, or click to browse"
                                        />
                                        {selectedChange?.hasImage ? (
                                            <DeleteIconButton
                                                label="Remove image"
                                                loading={removeImageMutation.isPending}
                                                onClick={() =>
                                                    removeImageMutation.mutate(editingId)
                                                }
                                            />
                                        ) : null}
                                    </div>
                                ) : (
                                    <p className={classes.fieldHint}>
                                        Save the draft before uploading an image.
                                    </p>
                                )}
                            </div>
                            {isReadOnly ? (
                                <p className={classes.readOnlyNote}>
                                    {isDeleted
                                        ? "Deleted updates are no longer shown to users or included in history."
                                        : "Published updates are kept unchanged so the history remains accurate."}
                                </p>
                            ) : (
                                <div className={classes.editorFooter}>
                                    <DisabledReason reason={saveBlockReason}>
                                        <Button
                                            variant="default"
                                            onClick={() => saveMutation.mutate()}
                                            loading={saveMutation.isPending}
                                            disabled={!canSave}
                                        >
                                            Save draft
                                        </Button>
                                    </DisabledReason>
                                    {editingId ? (
                                        <DisabledReason reason={saveBlockReason}>
                                            <Button
                                                leftSection={<IconSend size={16} />}
                                                onClick={() => publishMutation.mutate(editingId)}
                                                loading={publishMutation.isPending}
                                                disabled={!canSave}
                                            >
                                                Publish
                                            </Button>
                                        </DisabledReason>
                                    ) : null}
                                </div>
                            )}
                        </div>
                    </Panel>

                    <div className={classes.list}>
                        <p className={classes.listLabel}>All updates</p>
                        <Panel p={0}>
                            {changesQuery.isLoading ? (
                                <div className={classes.items} aria-busy="true">
                                    {Array.from({ length: 4 }, (_, index) => (
                                        <div key={index} className={classes.skeletonItem}>
                                            <Skeleton height={12} width="60%" radius="sm" />
                                            <Skeleton height={10} width="35%" radius="sm" />
                                        </div>
                                    ))}
                                </div>
                            ) : changesQuery.isError ? (
                                <EmptyState
                                    compact
                                    icon={<IconAlertTriangle size={22} stroke={1.5} />}
                                    title="Could not load recent changes."
                                    actions={
                                        <Button
                                            size="xs"
                                            variant="default"
                                            leftSection={<IconRefresh size={14} />}
                                            loading={changesQuery.isFetching}
                                            onClick={() => void changesQuery.refetch()}
                                        >
                                            Retry
                                        </Button>
                                    }
                                />
                            ) : changesQuery.data?.changes.length ? (
                                <div className={classes.items}>
                                    {changesQuery.data.changes.map((change) => (
                                        <div
                                            key={change.id}
                                            className={classes.item}
                                            data-selected={editingId === change.id || undefined}
                                            onContextMenu={(event) =>
                                                contextMenu.open(event, changeMenuEntries(change))
                                            }
                                        >
                                            <button
                                                type="button"
                                                className={classes.itemMain}
                                                onClick={() => setEditingId(change.id)}
                                            >
                                                <span className={classes.itemTitle}>
                                                    {change.title}
                                                </span>
                                                <span className={classes.itemMeta}>
                                                    <span
                                                        className={classes.status}
                                                        data-status={change.status}
                                                    >
                                                        {statusLabel(change)}
                                                    </span>
                                                    {change.status === "published"
                                                        ? formatDate(change.publishedAt)
                                                        : null}
                                                </span>
                                            </button>
                                            <div className={classes.itemActions}>
                                                {change.status !== "deleted" ? (
                                                    <IconButton
                                                        size="sm"
                                                        label="View"
                                                        icon={<IconEye size={15} />}
                                                        onClick={() => setPreviewChange(change)}
                                                    />
                                                ) : null}
                                                <DeleteIconButton
                                                    size="sm"
                                                    label={
                                                        change.status === "deleted"
                                                            ? "Delete permanently"
                                                            : "Delete"
                                                    }
                                                    loading={
                                                        deleteMutation.isPending &&
                                                        deleteMutation.variables?.id === change.id
                                                    }
                                                    onClick={() =>
                                                        setDeletionCandidate({
                                                            change,
                                                            permanently: change.status === "deleted"
                                                        })
                                                    }
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState
                                    compact
                                    icon={<IconNews size={22} stroke={1.5} />}
                                    title="No recent changes yet."
                                    actions={
                                        <Button size="xs" variant="default" onClick={createDraft}>
                                            New draft
                                        </Button>
                                    }
                                />
                            )}
                        </Panel>
                    </div>
                </div>
            </div>

            <RecentChangesModal
                opened={!!previewChange}
                onClose={() => setPreviewChange(null)}
                changes={previewChanges}
                initialChangeId={previewChange?.id}
            />

            <ConfirmActionModal
                opened={!!deletionCandidate}
                onClose={() => setDeletionCandidate(null)}
                onConfirm={() => {
                    if (!deletionCandidate) return
                    deleteMutation.mutate({
                        id: deletionCandidate.change.id,
                        permanently: deletionCandidate.permanently
                    })
                }}
                title={
                    deletionCandidate?.permanently ? "Permanently Delete Update" : "Delete Update"
                }
                body={
                    deletionCandidate?.permanently
                        ? `This permanently removes “${deletionCandidate.change.title}” and its delivery records. This cannot be undone.`
                        : `“${deletionCandidate?.change.title}” will no longer be shown to users or included in update history. You can permanently delete it later.`
                }
                confirmLabel={deletionCandidate?.permanently ? "Delete Permanently" : "Delete"}
                loading={deleteMutation.isPending}
                disabled={deleteMutation.isPending}
            />
            {contextMenu.menu}
        </div>
    )
}

export default AdminRecentChangesPanel
