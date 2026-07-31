import {
    Alert,
    Badge,
    Button,
    Group,
    Modal,
    Paper,
    ScrollArea,
    Stack,
    Table,
    Text,
    Textarea,
    Title
} from "@mantine/core"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import type { HomebrewPublishRequest } from "~/data/Homebrew"
import { api } from "~/utils/api"
import HomebrewRuleDetails from "~/components/HomebrewRuleDetails"
import ContentWarning from "~/components/ContentWarning"

const HomebrewModerationPanel = () => {
    const client = useQueryClient()
    const [review, setReview] = useState<HomebrewPublishRequest | null>(null)
    const [denialMessage, setDenialMessage] = useState("")
    const requestsQuery = useQuery({
        queryKey: ["admin", "homebrew", "publish-requests"],
        queryFn: api.getAdminHomebrewPublishRequests
    })
    const moderateMutation = useMutation({
        mutationFn: ({
            id,
            decision
        }: {
            id: string
            decision: { decision: "approve" } | { decision: "deny"; message: string }
        }) => api.moderateHomebrewPublishRequest(id, decision),
        onSuccess: () => {
            setReview(null)
            setDenialMessage("")
            client.invalidateQueries({ queryKey: ["admin", "homebrew"] })
            client.invalidateQueries({ queryKey: ["homebrew", "library"] })
        }
    })

    const requests = requestsQuery.data ?? []
    const pendingCount = requests.filter((request) => request.status === "pending").length

    return (
        <Paper p="md" withBorder>
            <Group justify="space-between" mb="md">
                <div>
                    <Title order={2}>Homebrew publication review</Title>
                    <Text c="dimmed" size="sm">
                        Review immutable snapshots before they enter the Community Library.
                    </Text>
                </div>
                <Badge color={pendingCount ? "yellow" : "gray"}>{pendingCount} pending</Badge>
            </Group>
            <ScrollArea>
                <Table miw={760} verticalSpacing="sm">
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Collection</Table.Th>
                            <Table.Th>Requester</Table.Th>
                            <Table.Th>Items</Table.Th>
                            <Table.Th>Status</Table.Th>
                            <Table.Th />
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {requests.map((request) => (
                            <Table.Tr key={request.id}>
                                <Table.Td>{request.snapshot.name}</Table.Td>
                                <Table.Td>
                                    {request.requester?.nickname ??
                                        request.requester?.email ??
                                        "User"}
                                </Table.Td>
                                <Table.Td>{request.snapshot.items.length}</Table.Td>
                                <Table.Td>
                                    <Badge color={request.status === "pending" ? "yellow" : "gray"}>
                                        {request.status}
                                    </Badge>
                                </Table.Td>
                                <Table.Td>
                                    <Button
                                        size="xs"
                                        variant="light"
                                        disabled={request.status !== "pending"}
                                        onClick={() => setReview(request)}
                                    >
                                        Review
                                    </Button>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            </ScrollArea>
            {requests.length === 0 ? <Text c="dimmed">No requests yet.</Text> : null}

            <Modal
                opened={!!review}
                onClose={() => setReview(null)}
                title={`Review ${review?.snapshot.name ?? "collection"}`}
                size="lg"
            >
                <Stack>
                    <Text>{review?.snapshot.description || review?.snapshot.shortDescription}</Text>
                    {review?.snapshot.contentWarning ? (
                        <ContentWarning>{review.snapshot.contentWarning}</ContentWarning>
                    ) : null}
                    <Stack gap="xs">
                        {review?.snapshot.items.map((item) => (
                            <Paper key={item.id} p="xs" withBorder>
                                <Group justify="space-between">
                                    <Text fw={600}>{item.name}</Text>
                                    <Badge color="grape">{item.kind}</Badge>
                                </Group>
                                <HomebrewRuleDetails item={item} />
                            </Paper>
                        ))}
                    </Stack>
                    <Textarea
                        label="Denial message"
                        description="Required only when denying; shown privately to the requester."
                        value={denialMessage}
                        onChange={(event) => setDenialMessage(event.currentTarget.value)}
                    />
                    {moderateMutation.error ? (
                        <Alert color="red">{moderateMutation.error.message}</Alert>
                    ) : null}
                    <Group justify="flex-end">
                        <Button variant="subtle" onClick={() => setReview(null)}>
                            Cancel
                        </Button>
                        <Button
                            color="red"
                            disabled={!denialMessage.trim()}
                            loading={moderateMutation.isPending}
                            onClick={() =>
                                review &&
                                moderateMutation.mutate({
                                    id: review.id,
                                    decision: { decision: "deny", message: denialMessage }
                                })
                            }
                        >
                            Deny
                        </Button>
                        <Button
                            color="green"
                            loading={moderateMutation.isPending}
                            onClick={() =>
                                review &&
                                moderateMutation.mutate({
                                    id: review.id,
                                    decision: { decision: "approve" }
                                })
                            }
                        >
                            Approve snapshot
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Paper>
    )
}

export default HomebrewModerationPanel
