import { Button, Switch, Tooltip } from "@mantine/core"
import {
    IconBook2,
    IconBooks,
    IconCopy,
    IconExternalLink,
    IconPlus,
    IconRefresh,
    IconToggleLeft,
    IconToggleRight,
    IconTrash
} from "@tabler/icons-react"
import { Link, useNavigate } from "@tanstack/react-router"
import { useState, type KeyboardEvent } from "react"
import ConfirmActionModal from "~/components/ConfirmActionModal"
import { countHomebrewItems, HomebrewKindCounts } from "~/components/HomebrewCodex"
import {
    DeleteIconButton,
    EmptyState,
    PageHeader,
    PageShell,
    Panel,
    SkeletonGrid,
    useContextMenu
} from "~/components/ui"
import type { HomebrewCollection } from "~/data/Homebrew"
import { useAuth } from "~/hooks/useAuth"
import {
    useDeleteHomebrewCollection,
    useHomebrewCollections,
    useSetHomebrewCollectionAccountEnabled
} from "~/hooks/useHomebrew"
import "./HomebrewPage.css"

const formatEdited = (value: string) =>
    new Date(value).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric"
    })

const HomebrewPage = () => {
    const navigate = useNavigate()
    const { isAuthenticated, isLoading, signIn, isSigningIn } = useAuth()
    const {
        data: collections = [],
        isLoading: collectionsLoading,
        error: collectionsError,
        refetch,
        isRefetching
    } = useHomebrewCollections(isAuthenticated)
    const deleteMutation = useDeleteHomebrewCollection()
    const setAccountEnabledMutation = useSetHomebrewCollectionAccountEnabled()
    const [deleteTarget, setDeleteTarget] = useState<HomebrewCollection | null>(null)
    const contextMenu = useContextMenu()

    const openCollection = (collectionId: string) =>
        navigate({ to: "/homebrew/$collectionId", params: { collectionId } })
    const createCollection = () => openCollection("new")

    const header = (
        <PageHeader
            eyebrow="Homebrew"
            title="My Homebrew"
            icon={<IconBook2 size={30} stroke={1.5} />}
            description="Build original rules collections and enable them for your coteries."
            actions={
                isAuthenticated ? (
                    <>
                        <Button
                            component={Link}
                            to="/homebrew/library"
                            variant="default"
                            leftSection={<IconBooks size={17} />}
                        >
                            Community Library
                        </Button>
                        <Button onClick={createCollection} leftSection={<IconPlus size={17} />}>
                            New collection
                        </Button>
                    </>
                ) : null
            }
        />
    )

    if (isLoading) {
        return (
            <PageShell size="lg">
                {header}
                <SkeletonGrid count={3} cols={{ base: 1, sm: 2, lg: 3 }} cardHeight={236} />
            </PageShell>
        )
    }

    if (!isAuthenticated) {
        return (
            <PageShell size="lg">
                {header}
                <Panel tone="ornate" grain p={0}>
                    <EmptyState
                        icon={<IconBook2 size={26} stroke={1.5} />}
                        title="Sign in to create Homebrew"
                        description="Write Disciplines, Merits, Loresheets and more for your chronicle."
                        actions={
                            <>
                                <Button onClick={signIn} loading={isSigningIn}>
                                    Sign in
                                </Button>
                                <Button component={Link} to="/homebrew/library" variant="default">
                                    Browse the public library
                                </Button>
                            </>
                        }
                    />
                </Panel>
            </PageShell>
        )
    }

    const setEnabled = (collection: HomebrewCollection, enabled: boolean) =>
        setAccountEnabledMutation.mutate({ collectionId: collection.id, enabled })

    const openMenu = (
        event: Parameters<typeof contextMenu.open>[0],
        collection: HomebrewCollection
    ) =>
        contextMenu.open(event, [
            {
                key: "open",
                label: "Open collection",
                icon: <IconExternalLink size={14} />,
                onClick: () => openCollection(collection.id)
            },
            {
                key: "toggle",
                label: collection.enabledForAccount
                    ? "Disable for my characters"
                    : "Enable for all my characters",
                icon: collection.enabledForAccount ? (
                    <IconToggleLeft size={14} />
                ) : (
                    <IconToggleRight size={14} />
                ),
                disabled: setAccountEnabledMutation.isPending,
                onClick: () => setEnabled(collection, !collection.enabledForAccount)
            },
            { type: "divider", key: "divider" },
            {
                key: "delete",
                label: "Delete…",
                color: "red",
                icon: <IconTrash size={14} />,
                onClick: () => setDeleteTarget(collection)
            }
        ])

    return (
        <PageShell size="lg">
            {header}

            {collectionsLoading ? (
                <SkeletonGrid count={3} cols={{ base: 1, sm: 2, lg: 3 }} cardHeight={236} />
            ) : collectionsError ? (
                <Panel tone="inset" p={0}>
                    <EmptyState
                        compact
                        title="Could not load your collections"
                        description={collectionsError.message}
                        actions={
                            <Button
                                variant="default"
                                leftSection={<IconRefresh size={16} />}
                                loading={isRefetching}
                                onClick={() => refetch()}
                            >
                                Try again
                            </Button>
                        }
                    />
                </Panel>
            ) : collections.length === 0 ? (
                <Panel tone="ornate" grain p={0}>
                    <EmptyState
                        icon={<IconBook2 size={26} stroke={1.5} />}
                        title="Your workbench is empty."
                        description="Start a collection for your Disciplines, Powers, Loresheets, Merits, Flaws, and Clans."
                        actions={
                            <>
                                <Button onClick={createCollection}>
                                    Create your first collection
                                </Button>
                                <Button component={Link} to="/homebrew/library" variant="default">
                                    Browse the library
                                </Button>
                            </>
                        }
                    />
                </Panel>
            ) : (
                <div className="hb-tomes">
                    {collections.map((collection) => (
                        <Panel
                            key={collection.id}
                            component="article"
                            interactive
                            className="hb-tome"
                            data-homebrew-collection
                            data-enabled={collection.enabledForAccount || undefined}
                            role="link"
                            tabIndex={0}
                            aria-labelledby={`hb-tome-${collection.id}`}
                            onClick={() => openCollection(collection.id)}
                            onKeyDown={(event: KeyboardEvent<HTMLElement>) => {
                                if (event.target !== event.currentTarget) return
                                if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault()
                                    openCollection(collection.id)
                                }
                            }}
                            onContextMenu={(event: Parameters<typeof contextMenu.open>[0]) =>
                                openMenu(event, collection)
                            }
                        >
                            <div className="hb-tome__top">
                                <HomebrewKindCounts counts={countHomebrewItems(collection.items)} />
                                {collection.sourceLibraryEntryId ? (
                                    <Tooltip label="Copied from the Community Library">
                                        <span className="hb-tome__origin">
                                            <IconCopy size={12} aria-hidden="true" />
                                            Copied from Library
                                        </span>
                                    </Tooltip>
                                ) : null}
                            </div>
                            <h2 className="hb-tome__name" id={`hb-tome-${collection.id}`}>
                                {collection.name}
                            </h2>
                            <p
                                className="hb-tome__desc"
                                data-empty={!collection.shortDescription || undefined}
                            >
                                {collection.shortDescription || "No description yet."}
                            </p>
                            {collection.tags.length ? (
                                <div className="hb-tags">
                                    {collection.tags.map((tag) => (
                                        <span key={tag} className="hb-tag">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            ) : null}
                            <p className="hb-tome__meta">
                                Edited {formatEdited(collection.updatedAt)}
                                {collection.coteries?.length
                                    ? ` · ${collection.coteries.map((coterie) => coterie.name).join(", ")}`
                                    : ""}
                            </p>
                            <div
                                className="hb-tome__footer"
                                onClick={(event) => event.stopPropagation()}
                                onKeyDown={(event) => event.stopPropagation()}
                            >
                                <Switch
                                    size="sm"
                                    label="Enable for all my characters"
                                    checked={collection.enabledForAccount ?? false}
                                    disabled={setAccountEnabledMutation.isPending}
                                    onChange={(event) =>
                                        setEnabled(collection, event.currentTarget.checked)
                                    }
                                />
                                <DeleteIconButton
                                    label={`Delete ${collection.name}`}
                                    onClick={() => setDeleteTarget(collection)}
                                />
                            </div>
                        </Panel>
                    ))}
                </div>
            )}
            {contextMenu.menu}

            <ConfirmActionModal
                opened={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={() => {
                    if (!deleteTarget) return
                    deleteMutation.mutate(deleteTarget.id, {
                        onSuccess: () => setDeleteTarget(null)
                    })
                }}
                title="Delete Homebrew Collection"
                body={
                    <>
                        This removes <strong>{deleteTarget?.name}</strong> from every coterie.
                        Existing character selections remain as unavailable snapshots.
                    </>
                }
                confirmLabel="Delete"
                loading={deleteMutation.isPending}
            />
        </PageShell>
    )
}

export default HomebrewPage
