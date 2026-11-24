import {
    Alert,
    Badge,
    Button,
    Group,
    Modal,
    ScrollArea,
    SimpleGrid,
    Skeleton,
    Stack,
    Table,
    Text,
    Textarea,
    Title
} from "@mantine/core"
import {
    IconAlertTriangle,
    IconCheck,
    IconEye,
    IconGavel,
    IconInbox,
    IconRefresh,
    IconX
} from "@tabler/icons-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import type { HomebrewCollection, HomebrewItem, HomebrewPublishRequest } from "~/data/Homebrew"
import { homebrewItemKinds, homebrewKindLabel } from "~/data/Homebrew"
import { api } from "~/utils/api"
import HomebrewRuleDetails from "~/components/HomebrewRuleDetails"
import ContentWarning from "~/components/ContentWarning"
import HomebrewItemPreview from "~/components/HomebrewItemPreview"
import {
    DisabledReason,
    EmptyState,
    Panel,
    SectionHeader,
    useContextMenu,
    type ContextMenuEntry
} from "~/components/ui"
import classes from "./AdminPanels.module.css"

const CollectionPreview = ({ collection }: { collection: HomebrewCollection }) => {
    const itemsByKind = homebrewItemKinds
        .map((kind) => ({
            kind,
            items: collection.items.filter((item) => item.kind === kind)
        }))
        .filter(({ items }) => items.length)

    return (
        <Stack gap="xl">
            <Panel tone="inset" p="xl">
                <Stack gap="md">
                    <div>
                        <Text size="sm" c="dimmed">
                            Homebrew collection preview
                        </Text>
                        <Title order={1}>{collection.name || "Untitled collection"}</Title>
                    </div>
                    {collection.shortDescription ? (
                        <Text>{collection.shortDescription}</Text>
                    ) : null}
                    {collection.description ? (
                        <Text c="dimmed" style={{ whiteSpace: "pre-wrap" }}>
                            {collection.description}
                        </Text>
                    ) : null}
                    {collection.tags.length ? (
                        <Group gap="xs">
                            {collection.tags.map((tag) => (
                                <Badge key={tag} variant="outline" color="grape">
                                    {tag}
                                </Badge>
                            ))}
                        </Group>
                    ) : null}
                    {collection.contentWarning ? (
                        <ContentWarning>{collection.contentWarning}</ContentWarning>
                    ) : null}
                </Stack>
            </Panel>

            {itemsByKind.map(({ kind, items }) => (
                <Stack key={kind} gap="sm">
                    <Group gap="xs">
                        <Badge color="grape" variant="light">
                            {homebrewKindLabel(kind)}
                        </Badge>
                        <Text size="sm" c="dimmed">
                            {items.length} {items.length === 1 ? "entry" : "entries"}
                        </Text>
                    </Group>
                    {kind === "merit" || kind === "flaw" ? (
                        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
                            {items.map((item) => (
                                <HomebrewItemPreview key={item.id} item={item} />
                            ))}
                        </SimpleGrid>
                    ) : (
                        <Stack gap="md">
                            {items.map((item) => (
                                <HomebrewItemPreview key={item.id} item={item} />
                            ))}
                        </Stack>
                    )}
                </Stack>
            ))}

            {itemsByKind.length === 0 ? (
                <Panel tone="inset" p={0}>
                    <EmptyState compact title="This collection has no rules yet." />
                </Panel>
            ) : null}
        </Stack>
    )
}

const HomebrewModerationPanel = () => {
    const client = useQueryClient()
    const [review, setReview] = useState<HomebrewPublishRequest | null>(null)
    const [preview, setPreview] = useState<HomebrewPublishRequest | null>(null)
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
    const contextMenu = useContextMenu()
    const requesterLabel = (request: HomebrewPublishRequest) =>
        request.requester?.nickname ?? request.requester?.email ?? "User"

    const requestMenuEntries = (request: HomebrewPublishRequest): ContextMenuEntry[] => [
        { type: "label", key: "label", label: request.snapshot.name },
        {
            key: "preview",
            label: "Preview",
            icon: <IconEye size={14} />,
            onClick: () => setPreview(request)
        },
        {
            key: "review",
            label: "Review…",
            icon: <IconGavel size={14} />,
            disabled: request.status !== "pending",
            onClick: () => setReview(request)
        }
    ]

    return (
        <div className={classes.stack}>
            <SectionHeader
                title="Homebrew publication review"
                description="Review immutable snapshots before they enter the Community Library."
                actions={
                    <Badge color={pendingCount ? "gold" : "gray"} variant="light">
                        {pendingCount} pending
                    </Badge>
                }
            />
            <Panel p={0}>
                {requestsQuery.isLoading ? (
                    <Stack gap={0} p="md" aria-busy="true">
                        {Array.from({ length: 4 }, (_, index) => (
                            <Group key={index} h={52} gap="xl" wrap="nowrap">
                                <Skeleton height={12} width="30%" radius="sm" />
                                <Skeleton height={12} width="20%" radius="sm" />
                                <Skeleton height={12} width={24} radius="sm" />
                                <Skeleton height={18} width={64} radius="sm" ml="auto" />
                            </Group>
                        ))}
                    </Stack>
                ) : requestsQuery.isError ? (
                    <EmptyState
                        compact
                        icon={<IconAlertTriangle size={22} stroke={1.5} />}
                        title="Could not load publish requests"
                        description={requestsQuery.error.message}
                        actions={
                            <Button
                                size="xs"
                                variant="default"
                                leftSection={<IconRefresh size={14} />}
                                loading={requestsQuery.isFetching}
                                onClick={() => void requestsQuery.refetch()}
                            >
                                Retry
                            </Button>
                        }
                    />
                ) : requests.length === 0 ? (
                    <EmptyState
                        compact
                        icon={<IconInbox size={22} stroke={1.5} />}
                        title="No requests yet."
                    />
                ) : (
                    <ScrollArea>
                        <Table miw={720} verticalSpacing="sm" highlightOnHover>
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
                                    <Table.Tr
                                        key={request.id}
                                        onContextMenu={(event) =>
                                            contextMenu.open(event, requestMenuEntries(request))
                                        }
                                    >
                                        <Table.Td>
                                            <div className={classes.collectionCell}>
                                                <span className={classes.collectionName}>
                                                    {request.snapshot.name}
                                                </span>
                                                {request.snapshot.shortDescription ? (
                                                    <span className={classes.collectionMeta}>
                                                        {request.snapshot.shortDescription}
                                                    </span>
                                                ) : null}
                                            </div>
                                        </Table.Td>
                                        <Table.Td>{requesterLabel(request)}</Table.Td>
                                        <Table.Td className={classes.numeric}>
                                            {request.snapshot.items.length}
                                        </Table.Td>
                                        <Table.Td>
                                            <span
                                                className={classes.status}
                                                data-status={request.status}
                                            >
                                                {request.status}
                                            </span>
                                        </Table.Td>
                                        <Table.Td>
                                            <Group gap="xs" wrap="nowrap" justify="flex-end">
                                                <Button
                                                    size="xs"
                                                    variant="subtle"
                                                    color="gray"
                                                    leftSection={<IconEye size={14} />}
                                                    onClick={() => setPreview(request)}
                                                >
                                                    Preview
                                                </Button>
                                                <DisabledReason
                                                    reason={
                                                        request.status !== "pending"
                                                            ? "Already reviewed"
                                                            : undefined
                                                    }
                                                >
                                                    <Button
                                                        size="xs"
                                                        variant="light"
                                                        color="gold"
                                                        leftSection={<IconGavel size={14} />}
                                                        disabled={request.status !== "pending"}
                                                        onClick={() => setReview(request)}
                                                    >
                                                        Review
                                                    </Button>
                                                </DisabledReason>
                                            </Group>
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    </ScrollArea>
                )}
            </Panel>

            <Modal
                opened={!!review}
                onClose={() => setReview(null)}
                title={`Review ${review?.snapshot.name ?? "collection"}`}
                size="lg"
            >
                <Stack>
                    {review?.snapshot.description || review?.snapshot.shortDescription ? (
                        <Text c="dimmed" style={{ whiteSpace: "pre-wrap" }}>
                            {review?.snapshot.description || review?.snapshot.shortDescription}
                        </Text>
                    ) : null}
                    {review?.snapshot.contentWarning ? (
                        <ContentWarning>{review.snapshot.contentWarning}</ContentWarning>
                    ) : null}
                    <Stack gap="xs">
                        {review?.snapshot.items.map((item) => (
                            <Panel key={item.id} tone="inset" p="sm">
                                <div className={classes.reviewItem}>
                                    <div className={classes.reviewItemHead}>
                                        <Text fw={600}>{item.name}</Text>
                                        <Badge color="grape" variant="light">
                                            {homebrewKindLabel(item.kind)}
                                        </Badge>
                                    </div>
                                    <HomebrewRuleDetails item={item} />
                                </div>
                            </Panel>
                        ))}
                    </Stack>
                    <Textarea
                        label="Denial message"
                        description="Required only when denying; shown privately to the requester."
                        value={denialMessage}
                        onChange={(event) => setDenialMessage(event.currentTarget.value)}
                        autosize
                        minRows={3}
                    />
                    {moderateMutation.error ? (
                        <Alert color="red" icon={<IconAlertTriangle size={16} />}>
                            {moderateMutation.error.message}
                        </Alert>
                    ) : null}
                    <div className={classes.reviewActions}>
                        <Button variant="subtle" color="gray" onClick={() => setReview(null)}>
                            Cancel
                        </Button>
                        <div className={classes.reviewDecision}>
                            <DisabledReason
                                reason={
                                    !denialMessage.trim()
                                        ? "Write a denial message first"
                                        : undefined
                                }
                            >
                                <Button
                                    color="red"
                                    variant="light"
                                    leftSection={<IconX size={16} />}
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
                            </DisabledReason>
                            <Button
                                color="green"
                                leftSection={<IconCheck size={16} />}
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
                        </div>
                    </div>
                </Stack>
            </Modal>

            <Modal
                opened={!!preview}
                onClose={() => setPreview(null)}
                title={`Preview ${preview?.snapshot.name ?? "collection"}`}
                size="calc(100vw - 4rem)"
                centered
            >
                <ScrollArea h="calc(100dvh - 12rem)" type="auto" offsetScrollbars>
                    {preview ? <CollectionPreview collection={preview.snapshot} /> : null}
                </ScrollArea>
            </Modal>
            {contextMenu.menu}
        </div>
    )
}

export default HomebrewModerationPanel
