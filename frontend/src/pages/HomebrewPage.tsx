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
    SimpleGrid,
    Stack,
    Switch,
    Text,
    Title
} from "@mantine/core"
import {
    IconBook2,
    IconPlus,
    IconTrash,
    IconBooks
} from "@tabler/icons-react"
import { Link, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import type { HomebrewCollection } from "~/data/Homebrew"
import { useAuth } from "~/hooks/useAuth"
import {
    useDeleteHomebrewCollection,
    useHomebrewCollections,
    useSetHomebrewCollectionAccountEnabled
} from "~/hooks/useHomebrew"
import AppTopbar from "~/components/AppTopbar"

const HomebrewPage = () => {
    const navigate = useNavigate()
    const { isAuthenticated, isLoading, signIn } = useAuth()
    const {
        data: collections = [],
        isLoading: collectionsLoading,
        error: collectionsError
    } =
        useHomebrewCollections(isAuthenticated)
    const deleteMutation = useDeleteHomebrewCollection()
    const setAccountEnabledMutation = useSetHomebrewCollectionAccountEnabled()
    const [deleteTarget, setDeleteTarget] = useState<HomebrewCollection | null>(null)

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
            <AppShell.Main className="homebrew-page" bg="#100d12" mih="100vh">
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
                                    leftSection={<IconBooks size={17} />}
                                >
                                    Community Library
                                </Button>
                                <Button
                                    component={Link}
                                    to="/homebrew/$collectionId"
                                    params={{ collectionId: "new" }}
                                    color="grape"
                                    leftSection={<IconPlus size={17} />}
                                >
                                    New collection
                                </Button>
                            </Group>
                        </Group>

                        {collectionsLoading ? (
                            <Loader color="grape" />
                        ) : collectionsError ? (
                            <Alert color="red" title="Could not load your collections">
                                {collectionsError.message}
                            </Alert>
                        ) : collections.length === 0 ? (
                            <Paper withBorder p="xl" bg="rgba(0,0,0,.35)">
                                <Stack align="center">
                                    <Text fw={600}>Your workbench is empty.</Text>
                                    <Text c="dimmed" ta="center">
                                        Start a collection for your Disciplines, Powers, Loresheets,
                                        Merits, Flaws, and Clans.
                                    </Text>
                                    <Button
                                        component={Link}
                                        to="/homebrew/$collectionId"
                                        params={{ collectionId: "new" }}
                                        color="grape"
                                    >
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
                                        role="link"
                                        tabIndex={0}
                                        onClick={() =>
                                            navigate({
                                                to: "/homebrew/$collectionId",
                                                params: { collectionId: collection.id }
                                            })
                                        }
                                        onKeyDown={(event) => {
                                            if (event.key === "Enter" || event.key === " ") {
                                                event.preventDefault()
                                                navigate({
                                                    to: "/homebrew/$collectionId",
                                                    params: { collectionId: collection.id }
                                                })
                                            }
                                        }}
                                        style={{ cursor: "pointer" }}
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
                                            <Group justify="space-between" mt="md">
                                                <div
                                                    onClick={(event) => event.stopPropagation()}
                                                    onKeyDown={(event) => event.stopPropagation()}
                                                >
                                                    <Switch
                                                        size="sm"
                                                        label="Enable for all my characters"
                                                        checked={collection.enabledForAccount ?? false}
                                                        disabled={setAccountEnabledMutation.isPending}
                                                        onChange={(event) =>
                                                            setAccountEnabledMutation.mutate({
                                                                collectionId: collection.id,
                                                                enabled: event.currentTarget.checked
                                                            })
                                                        }
                                                    />
                                                </div>
                                                <ActionIcon
                                                    color="red"
                                                    variant="light"
                                                    aria-label={`Delete ${collection.name}`}
                                                    onClick={(event) => {
                                                        event.stopPropagation()
                                                        setDeleteTarget(collection)
                                                    }}
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
