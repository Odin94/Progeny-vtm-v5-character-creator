import {
    ActionIcon,
    Alert,
    AppShell,
    Badge,
    Button,
    Card,
    Container,
    Group,
    Loader,
    Modal,
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
import { IconBook2, IconEdit, IconPlus, IconTrash, IconWorldShare } from "@tabler/icons-react"
import { Link } from "@tanstack/react-router"
import { useState } from "react"
import HomebrewItemEditor from "~/components/HomebrewItemEditor"
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
    useDeleteHomebrewCollection,
    useHomebrewCollections,
    useUpdateHomebrewCollection
} from "~/hooks/useHomebrew"
import AppTopbar from "~/components/AppTopbar"

const emptyCollection = (): HomebrewCollectionInput => ({
    name: "",
    shortDescription: "",
    description: "",
    tags: [],
    contentWarning: "",
    items: []
})

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

const HomebrewPage = () => {
    const { isAuthenticated, isLoading, signIn } = useAuth()
    const { data: collections = [], isLoading: collectionsLoading } =
        useHomebrewCollections(isAuthenticated)
    const createMutation = useCreateHomebrewCollection()
    const updateMutation = useUpdateHomebrewCollection()
    const deleteMutation = useDeleteHomebrewCollection()
    const [editorOpened, setEditorOpened] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [draft, setDraft] = useState<HomebrewCollectionInput>(emptyCollection())
    const [error, setError] = useState("")
    const [itemKind, setItemKind] = useState<HomebrewItemKind>("discipline")
    const [itemEditor, setItemEditor] = useState<{
        item: HomebrewItem
        index: number | null
    } | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<HomebrewCollection | null>(null)

    const openCreate = () => {
        setEditingId(null)
        setDraft(emptyCollection())
        setError("")
        setEditorOpened(true)
    }

    const openEdit = (collection: HomebrewCollection) => {
        setEditingId(collection.id)
        setDraft(toInput(collection))
        setError("")
        setEditorOpened(true)
    }

    const saveCollection = () => {
        if (!draft.name.trim()) {
            setError("Collection name is required.")
            return
        }
        const mutation = editingId
            ? updateMutation.mutateAsync({ id: editingId, input: draft })
            : createMutation.mutateAsync(draft)
        mutation
            .then(() => {
                setEditorOpened(false)
                notifications.show({
                    title: editingId ? "Collection updated" : "Collection created",
                    message: `${draft.name} is ready to use.`,
                    color: "grape"
                })
            })
            .catch((mutationError) =>
                setError(mutationError instanceof Error ? mutationError.message : "Could not save")
            )
    }

    if (isLoading) {
        return <Loader color="grape" />
    }

    if (!isAuthenticated) {
        return (
            <Container size="sm" py={100}>
                <Card withBorder p="xl">
                    <Stack align="center">
                        <Title order={2}>Sign in to create Homebrew</Title>
                        <Button color="grape" onClick={signIn}>
                            Sign in
                        </Button>
                        <Button component={Link} to="/homebrew/library" variant="subtle">
                            Browse the public library
                        </Button>
                    </Stack>
                </Card>
            </Container>
        )
    }

    return (
        <AppShell header={{ height: 52 }} padding={0}>
            <AppShell.Header>
                <AppTopbar />
            </AppShell.Header>
            <AppShell.Main bg="#100d12" mih="100vh">
                <Container size="lg" py={84}>
                    <Stack gap="xl">
                        <Group justify="space-between" align="flex-start">
                            <div>
                                <Group gap="sm">
                                    <IconBook2 size={34} />
                                    <Title>Homebrew</Title>
                                </Group>
                                <Text c="dimmed" mt="xs">
                                    Build original rules collections and enable them for your
                                    coteries.
                                </Text>
                            </div>
                            <Group>
                                <Button
                                    component={Link}
                                    to="/homebrew/library"
                                    variant="light"
                                    color="grape"
                                    leftSection={<IconWorldShare size={17} />}
                                >
                                    Community Library
                                </Button>
                                <Button
                                    color="grape"
                                    leftSection={<IconPlus size={17} />}
                                    onClick={openCreate}
                                >
                                    New collection
                                </Button>
                            </Group>
                        </Group>

                        {collectionsLoading ? (
                            <Loader color="grape" />
                        ) : collections.length === 0 ? (
                            <Paper withBorder p="xl" bg="rgba(0,0,0,.35)">
                                <Stack align="center">
                                    <Text fw={600}>Your workbench is empty.</Text>
                                    <Text c="dimmed" ta="center">
                                        Start a collection for your Disciplines, Powers, Loresheets,
                                        Merits, Flaws, and Clans.
                                    </Text>
                                    <Button color="grape" onClick={openCreate}>
                                        Create your first collection
                                    </Button>
                                </Stack>
                            </Paper>
                        ) : (
                            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
                                {collections.map((collection) => (
                                    <Card
                                        key={collection.id}
                                        withBorder
                                        p="lg"
                                        bg="rgba(0,0,0,.45)"
                                    >
                                        <Stack justify="space-between" h="100%">
                                            <Stack gap="sm">
                                                <Group justify="space-between" align="flex-start">
                                                    <Title order={3}>{collection.name}</Title>
                                                    <Badge color="grape" variant="light">
                                                        {collection.items.length} items
                                                    </Badge>
                                                </Group>
                                                <Text c="dimmed" lineClamp={3}>
                                                    {collection.shortDescription ||
                                                        "No description yet."}
                                                </Text>
                                                <Group gap="xs">
                                                    {collection.tags.map((tag) => (
                                                        <Badge
                                                            key={tag}
                                                            color="gray"
                                                            variant="outline"
                                                        >
                                                            {tag}
                                                        </Badge>
                                                    ))}
                                                </Group>
                                                {collection.sourceLibraryEntryId ? (
                                                    <Badge
                                                        color="blue"
                                                        variant="light"
                                                        w="fit-content"
                                                    >
                                                        Copied from Library
                                                    </Badge>
                                                ) : null}
                                            </Stack>
                                            <Group justify="flex-end" mt="md">
                                                <Button
                                                    size="xs"
                                                    variant="light"
                                                    color="grape"
                                                    leftSection={<IconEdit size={14} />}
                                                    onClick={() => openEdit(collection)}
                                                >
                                                    Edit
                                                </Button>
                                                <ActionIcon
                                                    color="red"
                                                    variant="light"
                                                    aria-label={`Delete ${collection.name}`}
                                                    onClick={() => setDeleteTarget(collection)}
                                                >
                                                    <IconTrash size={16} />
                                                </ActionIcon>
                                            </Group>
                                        </Stack>
                                    </Card>
                                ))}
                            </SimpleGrid>
                        )}
                    </Stack>
                </Container>
            </AppShell.Main>

            <Modal
                opened={editorOpened}
                onClose={() => setEditorOpened(false)}
                title={editingId ? "Edit Homebrew collection" : "Create Homebrew collection"}
                size="xl"
            >
                <Stack gap="md">
                    <TextInput
                        label="Collection name"
                        value={draft.name}
                        onChange={(event) =>
                            setDraft({ ...draft, name: event.currentTarget.value })
                        }
                        required
                    />
                    <TextInput
                        label="Short description"
                        description="Used on collection cards and in the Community Library."
                        maxLength={240}
                        value={draft.shortDescription}
                        onChange={(event) =>
                            setDraft({ ...draft, shortDescription: event.currentTarget.value })
                        }
                    />
                    <Textarea
                        label="Description"
                        minRows={3}
                        value={draft.description}
                        onChange={(event) =>
                            setDraft({ ...draft, description: event.currentTarget.value })
                        }
                    />
                    <TagsInput
                        label="Tags"
                        description="Up to eight discovery tags."
                        maxTags={8}
                        value={draft.tags}
                        onChange={(tags) => setDraft({ ...draft, tags })}
                    />
                    <Textarea
                        label="Content warning"
                        value={draft.contentWarning}
                        onChange={(event) =>
                            setDraft({ ...draft, contentWarning: event.currentTarget.value })
                        }
                    />
                    <Group justify="space-between" align="flex-end">
                        <div>
                            <Text fw={600}>Items</Text>
                            <Text size="sm" c="dimmed">
                                Merits and Flaws are shown under the Homebrew category.
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
                                onChange={(value) => setItemKind(value as HomebrewItemKind)}
                            />
                            <Button
                                color="grape"
                                leftSection={<IconPlus size={16} />}
                                onClick={() =>
                                    setItemEditor({
                                        item: {
                                            ...createEmptyHomebrewItem(itemKind),
                                            id: crypto.randomUUID()
                                        },
                                        index: null
                                    })
                                }
                            >
                                Add item
                            </Button>
                        </Group>
                    </Group>
                    {draft.items.length === 0 ? (
                        <Paper withBorder p="md">
                            <Text c="dimmed">No items in this collection yet.</Text>
                        </Paper>
                    ) : (
                        <Stack gap="xs">
                            {draft.items.map((item, index) => (
                                <Paper key={item.id ?? `${item.kind}-${index}`} withBorder p="sm">
                                    <Group justify="space-between">
                                        <Group>
                                            <Badge color="grape" variant="light">
                                                {homebrewKindLabel(item.kind)}
                                            </Badge>
                                            <Text fw={500}>{item.name}</Text>
                                        </Group>
                                        <Group gap="xs">
                                            <ActionIcon
                                                variant="subtle"
                                                color="grape"
                                                onClick={() => setItemEditor({ item, index })}
                                            >
                                                <IconEdit size={16} />
                                            </ActionIcon>
                                            <ActionIcon
                                                variant="subtle"
                                                color="red"
                                                onClick={() =>
                                                    setDraft({
                                                        ...draft,
                                                        items: draft.items.filter(
                                                            (_, itemIndex) => itemIndex !== index
                                                        )
                                                    })
                                                }
                                            >
                                                <IconTrash size={16} />
                                            </ActionIcon>
                                        </Group>
                                    </Group>
                                </Paper>
                            ))}
                        </Stack>
                    )}
                    {error ? <Alert color="red">{error}</Alert> : null}
                    <Group justify="flex-end">
                        <Button
                            variant="subtle"
                            color="gray"
                            onClick={() => setEditorOpened(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            color="grape"
                            loading={createMutation.isPending || updateMutation.isPending}
                            onClick={saveCollection}
                        >
                            Save collection
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            {itemEditor ? (
                <HomebrewItemEditor
                    opened
                    item={itemEditor.item}
                    collectionItems={draft.items}
                    onClose={() => setItemEditor(null)}
                    onSave={(item) => {
                        const items =
                            itemEditor.index === null
                                ? [...draft.items, item]
                                : replaceItemAndReferences(draft.items, itemEditor.index, item)
                        setDraft({ ...draft, items })
                        setItemEditor(null)
                    }}
                />
            ) : null}

            <Modal
                opened={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                title="Delete Homebrew collection?"
            >
                <Stack>
                    <Text>
                        This removes <strong>{deleteTarget?.name}</strong> from every coterie.
                        Existing character selections remain as unavailable snapshots.
                    </Text>
                    <Group justify="flex-end">
                        <Button variant="subtle" onClick={() => setDeleteTarget(null)}>
                            Cancel
                        </Button>
                        <Button
                            color="red"
                            loading={deleteMutation.isPending}
                            onClick={() => {
                                if (!deleteTarget) return
                                deleteMutation.mutate(deleteTarget.id, {
                                    onSuccess: () => setDeleteTarget(null)
                                })
                            }}
                        >
                            Delete
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </AppShell>
    )
}

export default HomebrewPage
