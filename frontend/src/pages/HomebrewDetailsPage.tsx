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
    Select,
    SimpleGrid,
    Stack,
    TagsInput,
    Text,
    TextInput,
    Textarea,
    Title
} from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { IconArrowLeft, IconChevronDown, IconEdit, IconPlus, IconTrash } from "@tabler/icons-react"
import { Link, useNavigate } from "@tanstack/react-router"
import { useEffect, useMemo, useState } from "react"
import AnimatedCollapse from "~/components/AnimatedCollapse"
import AppTopbar from "~/components/AppTopbar"
import ConfirmActionModal from "~/components/ConfirmActionModal"
import HomebrewItemEditor from "~/components/HomebrewItemEditor"
import { homebrewDropdownClassNames } from "~/components/homebrewFormControlProps"
import type {
    HomebrewCollection,
    HomebrewCollectionInput,
    HomebrewItem,
    HomebrewItemKind
} from "~/data/Homebrew"
import { createEmptyHomebrewItem, homebrewItemKinds, homebrewKindLabel } from "~/data/Homebrew"
import { useAuth } from "~/hooks/useAuth"
import {
    useCreateHomebrewCollection,
    useHomebrewCollection,
    useUpdateHomebrewCollection
} from "~/hooks/useHomebrew"
import type { ApiError } from "~/utils/api"

type Props = { collectionId: string }

const emptyCollection = (): HomebrewCollectionInput => ({
    name: "",
    shortDescription: "",
    description: "",
    tags: [],
    contentWarning: "",
    items: []
})

const storageLimitMessage =
    "your account is using over 100MB of storage, talk to support if you need more"

type ItemValidationErrors = Record<number, string[]>

const getItemValidationErrors = (error: unknown): ItemValidationErrors => {
    const issues = (error as ApiError | undefined)?.issues
    if (!issues) return {}

    return issues.reduce<ItemValidationErrors>((itemErrors, issue) => {
        const [field, itemIndex] = issue.path
        if (field !== "items" || typeof itemIndex !== "number") return itemErrors
        itemErrors[itemIndex] = [...(itemErrors[itemIndex] ?? []), issue.message]
        return itemErrors
    }, {})
}

const showSaveError = (error: unknown, setError: (message: string) => void) => {
    const message = error instanceof Error ? error.message : "Could not save the collection"
    if (message === storageLimitMessage) {
        notifications.show({ message, color: "red" })
        return
    }
    setError(message)
}

const toInput = (collection: HomebrewCollection): HomebrewCollectionInput => ({
    name: collection.name,
    shortDescription: collection.shortDescription,
    description: collection.description,
    tags: collection.tags,
    contentWarning: collection.contentWarning,
    items: collection.items
})

const replaceItemAndReferences = (
    items: HomebrewItem[],
    index: number,
    replacement: HomebrewItem
): HomebrewItem[] => {
    const previous = items[index]
    const nextItems = items.map((item, itemIndex) => (itemIndex === index ? replacement : item))
    if (
        previous?.kind !== "discipline" ||
        replacement.kind !== "discipline" ||
        !previous.id ||
        previous.name === replacement.name
    ) {
        return nextItems
    }

    return nextItems.map((item) => {
        if (
            (item.kind === "power" ||
                item.kind === "ritual" ||
                item.kind === "ceremony" ||
                item.kind === "formula") &&
            item.disciplineRef?.type === "homebrew" &&
            item.disciplineRef.itemId === previous.id
        ) {
            return {
                ...item,
                discipline: replacement.name,
                disciplineRef: { ...item.disciplineRef, name: replacement.name }
            }
        }
        if (item.kind === "clan" && item.nativeDisciplineRefs) {
            const nativeDisciplineRefs = item.nativeDisciplineRefs.map((reference) =>
                reference.type === "homebrew" && reference.itemId === previous.id
                    ? { ...reference, name: replacement.name }
                    : reference
            )
            return {
                ...item,
                nativeDisciplineRefs,
                nativeDisciplines: nativeDisciplineRefs.map((reference) => reference.name)
            }
        }
        return item
    })
}

const HomebrewDetailsPage = ({ collectionId }: Props) => {
    const isNew = collectionId === "new"
    const navigate = useNavigate()
    const { isAuthenticated, isLoading: authLoading, signIn } = useAuth()
    const collectionQuery = useHomebrewCollection(collectionId, isAuthenticated && !isNew)
    const createMutation = useCreateHomebrewCollection()
    const updateMutation = useUpdateHomebrewCollection()
    const [draft, setDraft] = useState<HomebrewCollectionInput>(emptyCollection())
    const [error, setError] = useState("")
    const [itemValidationErrors, setItemValidationErrors] = useState<ItemValidationErrors>({})
    const [itemKind, setItemKind] = useState<HomebrewItemKind>("discipline")
    const [itemEditor, setItemEditor] = useState<{
        item: HomebrewItem
        index: number | null
    } | null>(null)
    const [itemToDelete, setItemToDelete] = useState<{
        item: HomebrewItem
        index: number
    } | null>(null)
    const [collapsedItemKinds, setCollapsedItemKinds] = useState<Set<HomebrewItemKind>>(new Set())
    const [motionlessItemKinds, setMotionlessItemKinds] = useState<Set<HomebrewItemKind>>(new Set())

    useEffect(() => {
        if (collectionQuery.data) {
            setDraft(toInput(collectionQuery.data))
            setError("")
            setItemValidationErrors({})
        }
    }, [collectionQuery.data])

    const itemsByKind = useMemo(
        () =>
            homebrewItemKinds
                .map((kind) => ({ kind, items: draft.items.filter((item) => item.kind === kind) }))
                .filter(({ items }) => items.length > 0),
        [draft.items]
    )

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

    const handleSaveError = (mutationError: unknown) => {
        const nextItemErrors = getItemValidationErrors(mutationError)
        setItemValidationErrors(nextItemErrors)
        if (Object.keys(nextItemErrors).length) {
            setError("")
            setCollapsedItemKinds((current) => {
                const next = new Set(current)
                Object.keys(nextItemErrors).forEach((itemIndex) => {
                    const item = draft.items[Number(itemIndex)]
                    if (item) next.delete(item.kind)
                })
                return next
            })
            return
        }
        showSaveError(mutationError, setError)
    }

    const openNewItemEditor = (kind: HomebrewItemKind) => {
        const firstHomebrewDiscipline = draft.items.find(
            (item): item is Extract<HomebrewItem, { kind: "discipline" }> & { id: string } =>
                item.kind === "discipline" && !!item.id
        )
        const newItem = createEmptyHomebrewItem(kind)
        const item =
            kind === "power" && firstHomebrewDiscipline
                ? {
                      ...newItem,
                      discipline: firstHomebrewDiscipline.name,
                      disciplineRef: {
                          type: "homebrew" as const,
                          itemId: firstHomebrewDiscipline.id,
                          name: firstHomebrewDiscipline.name
                      }
                  }
                : newItem

        setItemEditor({
            item: { ...item, id: crypto.randomUUID() },
            index: null
        })
    }

    const saveCollection = async () => {
        if (!draft.name.trim()) {
            setError("Collection name is required.")
            return
        }

        setError("")
        setItemValidationErrors({})
        try {
            const saved = isNew
                ? await createMutation.mutateAsync(draft)
                : await updateMutation.mutateAsync({ id: collectionId, input: draft })
            notifications.show({
                title: isNew ? "Collection created" : "Collection updated",
                message: `${saved.name} is ready to use.`,
                color: "grape"
            })
            if (isNew) {
                navigate({ to: "/homebrew/$collectionId", params: { collectionId: saved.id } })
            }
        } catch (mutationError) {
            handleSaveError(mutationError)
        }
    }

    if (authLoading || (!isNew && collectionQuery.isLoading)) {
        return <Loader color="grape" />
    }

    if (!isAuthenticated) {
        return (
            <Container size="sm" py={100}>
                <Card withBorder p="xl">
                    <Stack align="center">
                        <Title order={2}>Sign in to edit Homebrew</Title>
                        <Button color="grape" onClick={signIn}>
                            Sign in
                        </Button>
                    </Stack>
                </Card>
            </Container>
        )
    }

    if (!isNew && (collectionQuery.isError || !collectionQuery.data)) {
        return (
            <Container size="sm" py={100}>
                <Paper withBorder p="xl">
                    <Stack align="center">
                        <Title order={2}>Collection not found</Title>
                        <Text c="dimmed">
                            It may have been deleted or you may not have access to it.
                        </Text>
                        <Button component={Link} to="/homebrew" variant="light" color="grape">
                            Back to Homebrew
                        </Button>
                    </Stack>
                </Paper>
            </Container>
        )
    }

    return (
        <AppShell
            padding={0}
            header={{ height: 52 }}
            styles={{
                root: { minHeight: "100vh" },
                header: {
                    background: "rgba(8, 7, 8, 0.86)",
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                    zIndex: 200
                }
            }}
        >
            <AppShell.Header>
                <AppTopbar />
            </AppShell.Header>
            <AppShell.Main className="homebrew-page" bg="#100d12" mih="100vh">
                <Box py="calc(2rem + 52px)" pb="2rem">
                    <Container size="xl">
                        <Box
                            style={{
                                backgroundColor: "rgba(255, 255, 255, 0.055)",
                                backdropFilter: "blur(7px)",
                                border: "1px solid rgba(255, 255, 255, 0.1)",
                                borderRadius: 8,
                                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.18)",
                                padding: "1.5rem"
                            }}
                        >
                            <Stack gap="lg">
                                <Group justify="space-between" align="flex-start">
                                    <div>
                                        <Button
                                            component={Link}
                                            to="/homebrew"
                                            variant="subtle"
                                            color="gray"
                                            px={0}
                                            leftSection={<IconArrowLeft size={16} />}
                                        >
                                            All collections
                                        </Button>
                                        <Title mt="xs">
                                            {isNew ? "New Homebrew Collection" : draft.name}
                                        </Title>
                                        <Text c="dimmed" mt={4}>
                                            {isNew
                                                ? "Set up your collection, then add the rules that belong in it."
                                                : "Shape the collection and its homebrew rules in one place."}
                                        </Text>
                                    </div>
                                    <Button
                                        color="grape"
                                        onClick={saveCollection}
                                        loading={
                                            createMutation.isPending || updateMutation.isPending
                                        }
                                    >
                                        {isNew ? "Create collection" : "Save changes"}
                                    </Button>
                                </Group>

                                <Divider />

                                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                                    <TextInput
                                        label="Collection name"
                                        description={<span aria-hidden="true">&nbsp;</span>}
                                        required
                                        value={draft.name}
                                        onChange={(event) =>
                                            setDraft({ ...draft, name: event.currentTarget.value })
                                        }
                                    />
                                    <TextInput
                                        label="Short description"
                                        description="Used on collection cards and in the Community Library."
                                        maxLength={240}
                                        value={draft.shortDescription}
                                        onChange={(event) =>
                                            setDraft({
                                                ...draft,
                                                shortDescription: event.currentTarget.value
                                            })
                                        }
                                    />
                                    <Textarea
                                        label="Description"
                                        description={<span aria-hidden="true">&nbsp;</span>}
                                        minRows={4}
                                        value={draft.description}
                                        onChange={(event) =>
                                            setDraft({
                                                ...draft,
                                                description: event.currentTarget.value
                                            })
                                        }
                                    />
                                    <Stack gap="md">
                                        <TagsInput
                                            label="Tags"
                                            description="Up to eight discovery tags."
                                            maxTags={8}
                                            value={draft.tags}
                                            onChange={(tags) => setDraft({ ...draft, tags })}
                                            classNames={homebrewDropdownClassNames}
                                        />
                                        <Textarea
                                            label="Content warning"
                                            minRows={2}
                                            value={draft.contentWarning}
                                            onChange={(event) =>
                                                setDraft({
                                                    ...draft,
                                                    contentWarning: event.currentTarget.value
                                                })
                                            }
                                        />
                                    </Stack>
                                </SimpleGrid>

                                <Divider />

                                <Group justify="space-between" align="flex-end">
                                    <div>
                                        <Title order={2}>Rules</Title>
                                        <Text size="sm" c="dimmed">
                                            Add each rule to its own entry. Merits and Flaws appear
                                            under the Homebrew category in character creation.
                                        </Text>
                                    </div>
                                    <Group align="flex-end">
                                        <Select
                                            label="Item type"
                                            value={itemKind}
                                            data={homebrewItemKinds.map((kind) => ({
                                                value: kind,
                                                label: homebrewKindLabel(kind)
                                            }))}
                                            onChange={(value) =>
                                                setItemKind(value as HomebrewItemKind)
                                            }
                                            classNames={homebrewDropdownClassNames}
                                        />
                                        <Button
                                            color="grape"
                                            leftSection={<IconPlus size={16} />}
                                            onClick={() => openNewItemEditor(itemKind)}
                                        >
                                            Add rule
                                        </Button>
                                    </Group>
                                </Group>

                                {itemsByKind.length === 0 ? (
                                    <Paper withBorder p="xl" bg="rgba(0,0,0,.18)">
                                        <Stack align="center" gap="xs">
                                            <Text fw={600}>This collection has no rules yet.</Text>
                                            <Text c="dimmed" size="sm" ta="center">
                                                Choose an item type above to start filling out this
                                                homebrew sheet.
                                            </Text>
                                        </Stack>
                                    </Paper>
                                ) : (
                                    <Stack gap="lg">
                                        {itemsByKind.map(({ kind, items }) => {
                                            const isCollapsed = collapsedItemKinds.has(kind)

                                            return (
                                                <Stack key={kind} gap="sm">
                                                    <Group gap="xs">
                                                        <Badge color="grape" variant="light">
                                                            {homebrewKindLabel(kind)}
                                                        </Badge>
                                                        <Text size="sm" c="dimmed">
                                                            {items.length}{" "}
                                                            {items.length === 1
                                                                ? "entry"
                                                                : "entries"}
                                                        </Text>
                                                        <ActionIcon
                                                            variant="subtle"
                                                            color="gray"
                                                            size="sm"
                                                            aria-label={`${isCollapsed ? "Expand" : "Collapse"} ${homebrewKindLabel(kind)}`}
                                                            aria-expanded={!isCollapsed}
                                                            onClick={(event) =>
                                                                toggleItemKind(kind, event.detail !== 0)
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
                                                        <>
                                                            <SimpleGrid
                                                                cols={{
                                                                    base: 1,
                                                                    md:
                                                                        kind === "merit" ||
                                                                        kind === "flaw"
                                                                            ? 3
                                                                            : 2
                                                                }}
                                                                spacing="sm"
                                                            >
                                                                {items.map((item) => {
                                                                    const index =
                                                                        draft.items.indexOf(item)
                                                                    return (
                                                                        <Paper
                                                                            key={
                                                                                item.id ??
                                                                                `${item.kind}-${index}`
                                                                            }
                                                                            withBorder
                                                                            p="md"
                                                                            bg="rgba(0,0,0,.2)"
                                                                        >
                                                                            <Stack gap="xs">
                                                                                <Group
                                                                                    justify="space-between"
                                                                                    align="flex-start"
                                                                                    wrap="nowrap"
                                                                                >
                                                                                <div>
                                                                                    <Text fw={600}>
                                                                                        {item.name ||
                                                                                            "Untitled rule"}
                                                                                    </Text>
                                                                                    {item.kind ===
                                                                                    "power" ? (
                                                                                        <Badge
                                                                                            mt={4}
                                                                                            size="sm"
                                                                                            variant="light"
                                                                                            color="grape"
                                                                                        >
                                                                                            {item.discipline ||
                                                                                                "No discipline"}
                                                                                        </Badge>
                                                                                    ) : null}
                                                                                    <Text
                                                                                        size="sm"
                                                                                        c="dimmed"
                                                                                        lineClamp={
                                                                                            2
                                                                                        }
                                                                                    >
                                                                                        {item.summary ||
                                                                                            item.description ||
                                                                                            "No summary yet."}
                                                                                    </Text>
                                                                                </div>
                                                                                <Group
                                                                                    gap={4}
                                                                                    wrap="nowrap"
                                                                                >
                                                                                    <ActionIcon
                                                                                        variant="subtle"
                                                                                        color="grape"
                                                                                        aria-label={`Edit ${item.name || "rule"}`}
                                                                                        onClick={() =>
                                                                                            setItemEditor(
                                                                                                {
                                                                                                    item,
                                                                                                    index
                                                                                                }
                                                                                            )
                                                                                        }
                                                                                    >
                                                                                        <IconEdit
                                                                                            size={
                                                                                                16
                                                                                            }
                                                                                        />
                                                                                    </ActionIcon>
                                                                                    <ActionIcon
                                                                                        variant="subtle"
                                                                                        color="red"
                                                                                        aria-label={`Delete ${item.name || "rule"}`}
                                                                                        onClick={() =>
                                                                                            setItemToDelete({
                                                                                                item,
                                                                                                index
                                                                                            })
                                                                                        }
                                                                                    >
                                                                                        <IconTrash
                                                                                            size={
                                                                                                16
                                                                                            }
                                                                                        />
                                                                                    </ActionIcon>
                                                                                </Group>
                                                                                </Group>
                                                                                {itemValidationErrors[index]?.map(
                                                                                    (message, messageIndex) => (
                                                                                        <Alert
                                                                                            key={`${message}-${messageIndex}`}
                                                                                            color="red"
                                                                                            variant="light"
                                                                                        >
                                                                                            {message}
                                                                                        </Alert>
                                                                                    )
                                                                                )}
                                                                            </Stack>
                                                                        </Paper>
                                                                    )
                                                                })}
                                                            </SimpleGrid>
                                                            <Group justify="center">
                                                                <ActionIcon
                                                                    variant="light"
                                                                    color="grape"
                                                                    size="lg"
                                                                    radius="xl"
                                                                    aria-label={`Add ${homebrewKindLabel(kind)}`}
                                                                    onClick={() =>
                                                                        openNewItemEditor(kind)
                                                                    }
                                                                >
                                                                    <IconPlus size={18} />
                                                                </ActionIcon>
                                                            </Group>
                                                        </>
                                                    </AnimatedCollapse>
                                                </Stack>
                                            )
                                        })}
                                    </Stack>
                                )}

                                {error ? <Alert color="red">{error}</Alert> : null}
                                <Group justify="flex-end">
                                    <Button
                                        color="grape"
                                        onClick={saveCollection}
                                        loading={
                                            createMutation.isPending || updateMutation.isPending
                                        }
                                    >
                                        {isNew ? "Create collection" : "Save changes"}
                                    </Button>
                                </Group>
                            </Stack>
                        </Box>
                    </Container>
                </Box>
            </AppShell.Main>

            {itemEditor ? (
                <HomebrewItemEditor
                    opened
                    item={itemEditor.item}
                    collectionItems={draft.items}
                    onClose={() => setItemEditor(null)}
                    onSave={(item) => {
                        const isAddingItem = itemEditor.index === null
                        const items = isAddingItem
                            ? [...draft.items, item]
                            : replaceItemAndReferences(draft.items, itemEditor.index, item)
                        const nextDraft = { ...draft, items }
                        setDraft(nextDraft)
                        if (itemEditor.index !== null) {
                            setItemValidationErrors((current) => {
                                const { [itemEditor.index!]: _removed, ...remaining } = current
                                return remaining
                            })
                        }
                        setItemEditor(null)

                        if (!isAddingItem) return

                        if (!nextDraft.name.trim()) {
                            setError(
                                "Give this collection a name before adding a rule so it can be saved."
                            )
                            return
                        }

                        void (
                            isNew
                                ? createMutation.mutateAsync(nextDraft)
                                : updateMutation.mutateAsync({ id: collectionId, input: nextDraft })
                        )
                            .then((saved) => {
                                notifications.show({
                                    title: "Rule added",
                                    message: `${saved.name} was saved automatically.`,
                                    color: "grape"
                                })
                                if (isNew) {
                                    navigate({
                                        to: "/homebrew/$collectionId",
                                        params: { collectionId: saved.id }
                                    })
                                }
                            })
                            .catch(handleSaveError)
                    }}
                />
            ) : null}
            <ConfirmActionModal
                opened={!!itemToDelete}
                onClose={() => setItemToDelete(null)}
                onConfirm={() => {
                    if (!itemToDelete) return
                    setDraft((current) => ({
                        ...current,
                        items: current.items.filter((_, index) => index !== itemToDelete.index)
                    }))
                    setItemValidationErrors({})
                    setItemToDelete(null)
                }}
                title="Delete rule?"
                body={`Delete ${itemToDelete?.item.name || "this rule"} from this collection?`}
                confirmLabel="Delete rule"
            />
        </AppShell>
    )
}

export default HomebrewDetailsPage
