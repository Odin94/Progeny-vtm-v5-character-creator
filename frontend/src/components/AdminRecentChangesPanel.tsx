import { Button, Group, Modal, Paper, Stack, Text, TextInput, Textarea, Title } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { api, type RecentChange } from "~/utils/api"
import RecentChangesModal from "~/components/RecentChangesModal"

const formatDate = (date: string | null) =>
    date
        ? new Date(date).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric"
          })
        : "Not published"

const AdminRecentChangesPanel = () => {
    const queryClient = useQueryClient()
    const [editingId, setEditingId] = useState<string | null>(null)
    const [previewChange, setPreviewChange] = useState<RecentChange | null>(null)
    const [deletionCandidate, setDeletionCandidate] = useState<{
        change: RecentChange
        permanently: boolean
    } | null>(null)
    const [title, setTitle] = useState("")
    const [body, setBody] = useState("")
    const [imageUrl, setImageUrl] = useState("")
    const changesQuery = useQuery({
        queryKey: ["admin", "recent-changes"],
        queryFn: api.getAdminRecentChanges
    })
    const selectedChange = changesQuery.data?.changes.find((change) => change.id === editingId)

    useEffect(() => {
        if (!selectedChange) return
        setTitle(selectedChange.title)
        setBody(selectedChange.body)
        setImageUrl(selectedChange.imageUrl ?? "")
    }, [selectedChange])

    const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin", "recent-changes"] })
    const createDraft = () => {
        setEditingId(null)
        setTitle("")
        setBody("")
        setImageUrl("")
    }
    const saveMutation = useMutation({
        mutationFn: () =>
            editingId
                ? api.updateAdminRecentChange(editingId, {
                      title,
                      body,
                      imageUrl: imageUrl.trim() || null
                  })
                : api.createAdminRecentChange({ title, body, imageUrl: imageUrl.trim() || null }),
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
        mutationFn: ({ id, permanently }: { id: string; permanently: boolean }) =>
            permanently ? api.hardDeleteAdminRecentChange(id) : api.softDeleteAdminRecentChange(id),
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
    const canSave = title.trim().length > 0 && body.trim().length > 0 && !isReadOnly
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

    return (
        <Stack gap="lg">
            <Group justify="space-between" align="flex-end">
                <Stack gap={4}>
                    <Title order={1}>Recent changes</Title>
                    <Text c="dimmed">
                        Draft and publish the update dialog shown to signed-in users.
                    </Text>
                </Stack>
                <Button onClick={createDraft}>New draft</Button>
            </Group>

            <Paper p="md" withBorder>
                <Stack gap="md">
                    <Text fw={600}>
                        {isPublished
                            ? "Published update"
                            : isDeleted
                              ? "Deleted update"
                              : "Draft editor"}
                    </Text>
                    <TextInput
                        label="Title"
                        value={title}
                        onChange={(event) => setTitle(event.currentTarget.value)}
                        maxLength={160}
                        disabled={isReadOnly}
                        required
                    />
                    <Textarea
                        label="Update"
                        description="Markdown is supported, including headings, bold text, lists, and links."
                        value={body}
                        onChange={(event) => setBody(event.currentTarget.value)}
                        minRows={7}
                        maxLength={10_000}
                        disabled={isReadOnly}
                        required
                    />
                    <TextInput
                        label="Image URL"
                        description="Optional. Shown beside the introductory text in the update modal."
                        placeholder="https://example.com/update-image.jpg"
                        value={imageUrl}
                        onChange={(event) => setImageUrl(event.currentTarget.value)}
                        disabled={isReadOnly}
                    />
                    {isReadOnly ? (
                        <Text size="sm" c="dimmed">
                            {isDeleted
                                ? "Deleted updates are no longer shown to users or included in history."
                                : "Published updates are kept unchanged so the history remains accurate."}
                        </Text>
                    ) : (
                        <Group justify="flex-end">
                            <Button
                                variant="light"
                                onClick={() => saveMutation.mutate()}
                                loading={saveMutation.isPending}
                                disabled={!canSave}
                            >
                                Save draft
                            </Button>
                            {editingId ? (
                                <Button
                                    onClick={() => publishMutation.mutate(editingId)}
                                    loading={publishMutation.isPending}
                                    disabled={!canSave}
                                >
                                    Publish
                                </Button>
                            ) : null}
                        </Group>
                    )}
                </Stack>
            </Paper>

            <Stack gap="sm">
                <Title order={2} size="h3">
                    All updates
                </Title>
                {changesQuery.isLoading ? (
                    <Text c="dimmed">Loading updates…</Text>
                ) : changesQuery.isError ? (
                    <Text c="red">Could not load recent changes.</Text>
                ) : changesQuery.data?.changes.length ? (
                    changesQuery.data.changes.map((change) => (
                        <Paper
                            key={change.id}
                            p="md"
                            withBorder
                            style={{ cursor: "pointer" }}
                            onClick={() => setEditingId(change.id)}
                        >
                            <Group justify="space-between" align="flex-start">
                                <div>
                                    <Text fw={600}>{change.title}</Text>
                                    <Text size="sm" c="dimmed">
                                        {change.status === "published"
                                            ? `Published ${formatDate(change.publishedAt)}`
                                            : change.status === "deleted"
                                              ? "Deleted"
                                              : "Draft"}
                                    </Text>
                                </div>
                                <Group gap="md">
                                    <Text
                                        size="sm"
                                        c={
                                            change.status === "published"
                                                ? "green"
                                                : change.status === "deleted"
                                                  ? "red"
                                                  : "yellow"
                                        }
                                    >
                                        {change.status === "published"
                                            ? "Published"
                                            : change.status === "deleted"
                                              ? "Deleted"
                                              : "Draft"}
                                    </Text>
                                    {change.status !== "deleted" ? (
                                        <Button
                                            size="xs"
                                            variant="light"
                                            onClick={(event) => {
                                                event.stopPropagation()
                                                setPreviewChange(change)
                                            }}
                                        >
                                            View
                                        </Button>
                                    ) : null}
                                    <Button
                                        size="xs"
                                        color="red"
                                        variant={change.status === "deleted" ? "filled" : "subtle"}
                                        loading={
                                            deleteMutation.isPending &&
                                            deleteMutation.variables?.id === change.id
                                        }
                                        onClick={(event) => {
                                            event.stopPropagation()
                                            setDeletionCandidate({
                                                change,
                                                permanently: change.status === "deleted"
                                            })
                                        }}
                                    >
                                        {change.status === "deleted"
                                            ? "Delete permanently"
                                            : "Delete"}
                                    </Button>
                                </Group>
                            </Group>
                        </Paper>
                    ))
                ) : (
                    <Text c="dimmed">No recent changes yet.</Text>
                )}
            </Stack>

            <RecentChangesModal
                opened={!!previewChange}
                onClose={() => setPreviewChange(null)}
                changes={previewChanges}
                initialChangeId={previewChange?.id}
            />

            <Modal
                opened={!!deletionCandidate}
                onClose={() => setDeletionCandidate(null)}
                title={
                    deletionCandidate?.permanently ? "Permanently delete update?" : "Delete update?"
                }
                centered
            >
                <Stack gap="md">
                    <Text>
                        {deletionCandidate?.permanently
                            ? `This permanently removes “${deletionCandidate.change.title}” and its delivery records. This cannot be undone.`
                            : `“${deletionCandidate?.change.title}” will no longer be shown to users or included in update history. You can permanently delete it later.`}
                    </Text>
                    <Group justify="flex-end">
                        <Button
                            variant="subtle"
                            color="gray"
                            onClick={() => setDeletionCandidate(null)}
                            disabled={deleteMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            color="red"
                            loading={deleteMutation.isPending}
                            onClick={() => {
                                if (!deletionCandidate) return
                                deleteMutation.mutate({
                                    id: deletionCandidate.change.id,
                                    permanently: deletionCandidate.permanently
                                })
                            }}
                        >
                            {deletionCandidate?.permanently
                                ? "Delete permanently"
                                : "Delete update"}
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    )
}

export default AdminRecentChangesPanel
