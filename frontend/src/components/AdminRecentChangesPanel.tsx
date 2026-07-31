import { Button, Group, Paper, Stack, Text, TextInput, Textarea, Title } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { api, type RecentChange } from "~/utils/api"

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
    const [title, setTitle] = useState("")
    const [body, setBody] = useState("")
    const changesQuery = useQuery({
        queryKey: ["admin", "recent-changes"],
        queryFn: api.getAdminRecentChanges
    })
    const selectedChange = changesQuery.data?.changes.find((change) => change.id === editingId)

    useEffect(() => {
        if (!selectedChange) return
        setTitle(selectedChange.title)
        setBody(selectedChange.body)
    }, [selectedChange])

    const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin", "recent-changes"] })
    const saveMutation = useMutation({
        mutationFn: () =>
            editingId
                ? api.updateAdminRecentChange(editingId, { title, body })
                : api.createAdminRecentChange({ title, body }),
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

    const createDraft = () => {
        setEditingId(null)
        setTitle("")
        setBody("")
    }
    const isPublished = selectedChange?.status === "published"
    const canSave = title.trim().length > 0 && body.trim().length > 0 && !isPublished

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
                    <Text fw={600}>{isPublished ? "Published update" : "Draft editor"}</Text>
                    <TextInput
                        label="Title"
                        value={title}
                        onChange={(event) => setTitle(event.currentTarget.value)}
                        maxLength={160}
                        disabled={isPublished}
                        required
                    />
                    <Textarea
                        label="Update"
                        description="Markdown is supported, including headings, bold text, lists, and links."
                        value={body}
                        onChange={(event) => setBody(event.currentTarget.value)}
                        minRows={7}
                        maxLength={10_000}
                        disabled={isPublished}
                        required
                    />
                    {isPublished ? (
                        <Text size="sm" c="dimmed">
                            Published updates are kept unchanged so the history remains accurate.
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
                                            : "Draft"}
                                    </Text>
                                </div>
                                <Text
                                    size="sm"
                                    c={change.status === "published" ? "green" : "yellow"}
                                >
                                    {change.status === "published" ? "Published" : "Draft"}
                                </Text>
                            </Group>
                        </Paper>
                    ))
                ) : (
                    <Text c="dimmed">No recent changes yet.</Text>
                )}
            </Stack>
        </Stack>
    )
}

export default AdminRecentChangesPanel
