import {
    Button,
    Select,
    Skeleton,
    TagsInput,
    TextInput,
    Textarea,
    UnstyledButton
} from "@mantine/core"
import { notifications } from "@mantine/notifications"
import {
    IconArrowLeft,
    IconBooks,
    IconEdit,
    IconPlus,
    IconTrash,
    IconWand
} from "@tabler/icons-react"
import { Link, useNavigate } from "@tanstack/react-router"
import { memo, useCallback, useEffect, useMemo, useState } from "react"
import ConfirmActionModal from "~/components/ConfirmActionModal"
import {
    CostPips,
    DotPips,
    groupHomebrewItems,
    HomebrewKindIcon,
    HomebrewKindIndex,
    HomebrewKindSection
} from "~/components/HomebrewCodex"
import HomebrewItemEditor from "~/components/HomebrewItemEditor"
import { belowInput } from "~/components/HomebrewEditorFrame"
import { homebrewDropdownClassNames } from "~/components/homebrewFormControlProps"
import {
    DeleteIconButton,
    EmptyState,
    IconButton,
    PageHeader,
    PageShell,
    Panel,
    SectionHeader,
    SkeletonLines,
    useContextMenu
} from "~/components/ui"
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
import "./HomebrewPage.css"

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
        if (item.kind === "predatorType")
            return {
                ...item,
                disciplineOptions: item.disciplineOptions.map((reference) =>
                    reference.type === "homebrew" && reference.itemId === previous.id
                        ? { ...reference, name: replacement.name }
                        : reference
                )
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
    const { user, isAuthenticated, isLoading: authLoading, signIn } = useAuth()
    const collectionQuery = useHomebrewCollection(collectionId, isAuthenticated && !isNew)
    const createMutation = useCreateHomebrewCollection()
    const updateMutation = useUpdateHomebrewCollection()
    const [draft, setDraft] = useState<HomebrewCollectionInput>(emptyCollection)
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

    const openNewItemEditor = useCallback(
        (kind: HomebrewItemKind) => {
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
        },
        [draft.items]
    )

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

    const isSaving = createMutation.isPending || updateMutation.isPending
    const savedInput = useMemo(
        () => (collectionQuery.data ? toInput(collectionQuery.data) : emptyCollection()),
        [collectionQuery.data]
    )
    const isDirty = useMemo(
        () => JSON.stringify(draft) !== JSON.stringify(savedInput),
        [draft, savedInput]
    )

    const backLink = (
        <Button
            component={Link}
            to="/homebrew"
            variant="subtle"
            color="gray"
            className="hb-back"
            leftSection={<IconArrowLeft size={16} />}
        >
            All collections
        </Button>
    )

    if (authLoading || (!isNew && collectionQuery.isLoading)) {
        return (
            <PageShell size="xl">
                {backLink}
                <div aria-busy="true" aria-label="Loading collection">
                    <Skeleton height={12} width={140} radius="sm" mb={14} />
                    <Skeleton height={34} width="42%" radius="sm" mb={40} />
                    <Panel p="lg" mb={40}>
                        <div className="hb-details-form">
                            <SkeletonLines lines={4} height={36} gap={20} />
                            <SkeletonLines lines={4} height={36} gap={20} />
                        </div>
                    </Panel>
                    <div className="hb-rows">
                        {Array.from({ length: 6 }, (_, index) => (
                            <Skeleton key={index} height={92} radius="md" />
                        ))}
                    </div>
                </div>
            </PageShell>
        )
    }

    if (!isAuthenticated) {
        return (
            <PageShell size="sm">
                <Panel tone="ornate" grain p={0}>
                    <EmptyState
                        icon={<IconBooks size={26} stroke={1.5} />}
                        title="Sign in to edit Homebrew"
                        actions={<Button onClick={signIn}>Sign in</Button>}
                    />
                </Panel>
            </PageShell>
        )
    }

    if (!isNew && (collectionQuery.isError || !collectionQuery.data)) {
        return (
            <PageShell size="sm">
                <Panel tone="inset" p={0}>
                    <EmptyState
                        icon={<IconBooks size={26} stroke={1.5} />}
                        title="Collection not found"
                        description="It may have been deleted or you may not have access to it."
                        actions={
                            <Button component={Link} to="/homebrew" variant="default">
                                Back to Homebrew
                            </Button>
                        }
                    />
                </Panel>
            </PageShell>
        )
    }

    const saveLabel = isNew ? "Create collection" : "Save changes"

    return (
        <PageShell size="xl">
            {backLink}
            <PageHeader
                eyebrow={isNew ? "New collection" : "Homebrew collection"}
                title={isNew ? "New Homebrew Collection" : draft.name || "Untitled collection"}
                description={
                    isNew
                        ? "Set up your collection, then add the rules that belong in it."
                        : "Shape the collection and its homebrew rules in one place."
                }
                actions={
                    <Button
                        variant={isNew || isDirty ? "filled" : "default"}
                        onClick={saveCollection}
                        loading={isSaving}
                    >
                        {saveLabel}
                    </Button>
                }
            />

            <SectionHeader title="Collection" />
            <Panel p="lg" mb="xl">
                <div className="hb-details-form">
                    <div className="hb-details-form__column">
                        <TextInput
                            label="Collection name"
                            required
                            value={draft.name}
                            // A brand-new collection starts with its name.
                            // eslint-disable-next-line jsx-a11y/no-autofocus
                            autoFocus={isNew}
                            onChange={(event) =>
                                setDraft({ ...draft, name: event.currentTarget.value })
                            }
                        />
                        <TextInput
                            label="Short description"
                            description="Used on collection cards and in the Community Library."
                            inputWrapperOrder={belowInput}
                            maxLength={240}
                            value={draft.shortDescription}
                            onChange={(event) =>
                                setDraft({ ...draft, shortDescription: event.currentTarget.value })
                            }
                        />
                        <TagsInput
                            label="Tags"
                            description="Up to eight discovery tags."
                            inputWrapperOrder={belowInput}
                            maxTags={8}
                            value={draft.tags}
                            onChange={(tags) => setDraft({ ...draft, tags })}
                            classNames={homebrewDropdownClassNames}
                        />
                    </div>
                    <div className="hb-details-form__column">
                        <Textarea
                            label="Description"
                            minRows={5}
                            value={draft.description}
                            onChange={(event) =>
                                setDraft({ ...draft, description: event.currentTarget.value })
                            }
                        />
                        <Textarea
                            label="Content warning"
                            minRows={2}
                            value={draft.contentWarning}
                            onChange={(event) =>
                                setDraft({ ...draft, contentWarning: event.currentTarget.value })
                            }
                        />
                    </div>
                </div>
            </Panel>

            <SectionHeader
                className="hb-rules-header"
                title="Rules"
                description="Add each rule to its own entry. Merits and Flaws appear under the Homebrew category in character creation."
                actions={
                    <div className="hb-rules-toolbar">
                        <Select
                            aria-label="Item type"
                            value={itemKind}
                            allowDeselect={false}
                            data={homebrewItemKinds.map((kind) => ({
                                value: kind,
                                label: homebrewKindLabel(kind)
                            }))}
                            onChange={(value) => value && setItemKind(value as HomebrewItemKind)}
                            classNames={homebrewDropdownClassNames}
                        />
                        <Button
                            leftSection={<IconPlus size={16} />}
                            onClick={() => openNewItemEditor(itemKind)}
                        >
                            Add rule
                        </Button>
                    </div>
                }
            />

            <EditableRules
                allItems={draft.items}
                itemValidationErrors={itemValidationErrors}
                collapsedItemKinds={collapsedItemKinds}
                motionlessItemKinds={motionlessItemKinds}
                toggleItemKind={toggleItemKind}
                openNewItemEditor={openNewItemEditor}
                setItemEditor={setItemEditor}
                setItemToDelete={setItemToDelete}
            />

            <div
                className="hb-savebar"
                data-dirty={isDirty || undefined}
                data-error={error ? true : undefined}
                role={error ? "alert" : undefined}
            >
                <span className="hb-savebar__status">
                    <span className="hb-savebar__dot" aria-hidden="true" />
                    {error ||
                        (isDirty
                            ? "Unsaved changes"
                            : isNew
                              ? "Name the collection to create it"
                              : "All changes saved")}
                </span>
                <Button
                    variant={isNew || isDirty ? "filled" : "default"}
                    onClick={saveCollection}
                    loading={isSaving}
                >
                    {saveLabel}
                </Button>
            </div>

            {itemEditor ? (
                <HomebrewItemEditor
                    isNew={itemEditor.index === null}
                    draftStorageKey={
                        itemEditor.index === null
                            ? `homebrew:new-item:${user?.id ?? "local"}:${collectionId}:${itemEditor.item.kind}`
                            : undefined
                    }
                    opened
                    item={itemEditor.item}
                    collectionItems={draft.items}
                    onClose={() => setItemEditor(null)}
                    onSave={(item) => {
                        const itemIndex = itemEditor.index
                        const isAddingItem = itemIndex === null
                        const items = isAddingItem
                            ? [...draft.items, item]
                            : replaceItemAndReferences(draft.items, itemIndex, item)
                        const nextDraft = { ...draft, items }
                        setDraft(nextDraft)
                        if (itemIndex !== null) {
                            setItemValidationErrors((current) => {
                                const { [itemIndex]: _removed, ...remaining } = current
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
                body={`Delete ${itemToDelete?.item.name || "this rule"} from this collection? The change is kept once you save the collection.`}
                confirmLabel="Delete rule"
            />
        </PageShell>
    )
}

export default HomebrewDetailsPage

const titleCase = (value: string) => value.replace(/\b\w/g, (character) => character.toUpperCase())

/** The short line under a rule's name: discipline + level, dot costs, etc. */
const ItemMeta = ({ item }: { item: HomebrewItem }) => {
    switch (item.kind) {
        case "power":
        case "ritual":
        case "ceremony":
        case "formula":
            return (
                <>
                    <span>{item.discipline ? titleCase(item.discipline) : "No discipline"}</span>
                    <DotPips value={item.level} label={`Level ${item.level}`} />
                </>
            )
        case "merit":
        case "flaw":
            return <CostPips costs={item.costs} tone={item.kind === "flaw" ? "blood" : "gold"} />
        case "clan":
            return (
                <span>
                    {item.nativeDisciplines.length
                        ? item.nativeDisciplines.map(titleCase).join(" · ")
                        : "No native Disciplines"}
                </span>
            )
        case "loresheet":
            return <span>{item.source || "Homebrew"} · 5 levels</span>
        case "predatorType":
            return (
                <span>
                    Humanity {item.humanityChange >= 0 ? "+" : "−"}
                    {Math.abs(item.humanityChange)} · Blood Potency{" "}
                    {item.bloodPotencyChange >= 0 ? "+" : "−"}
                    {Math.abs(item.bloodPotencyChange)}
                </span>
            )
        default:
            return <span>{homebrewKindLabel(item.kind)}</span>
    }
}

const EditableRules = memo(
    ({
        allItems,
        itemValidationErrors,
        collapsedItemKinds,
        motionlessItemKinds,
        toggleItemKind,
        openNewItemEditor,
        setItemEditor,
        setItemToDelete
    }: {
        allItems: HomebrewItem[]
        itemValidationErrors: ItemValidationErrors
        collapsedItemKinds: Set<HomebrewItemKind>
        motionlessItemKinds: Set<HomebrewItemKind>
        toggleItemKind: (kind: HomebrewItemKind, motionEnabled?: boolean) => void
        openNewItemEditor: (kind: HomebrewItemKind) => void
        setItemEditor: (selection: { item: HomebrewItem; index: number | null }) => void
        setItemToDelete: (selection: { item: HomebrewItem; index: number }) => void
    }) => {
        const itemsByKind = useMemo(
            () => groupHomebrewItems(allItems, homebrewItemKinds),
            [allItems]
        )
        const contextMenu = useContextMenu()

        if (itemsByKind.length === 0) {
            return (
                <Panel tone="inset" p={0}>
                    <EmptyState
                        icon={<IconWand size={26} stroke={1.5} />}
                        title="This collection has no rules yet."
                        description="Choose what to write first."
                        actions={
                            <div className="hb-starter">
                                {homebrewItemKinds.map((kind) => (
                                    <UnstyledButton
                                        key={kind}
                                        className="hb-starter__tile"
                                        onClick={() => openNewItemEditor(kind)}
                                    >
                                        <HomebrewKindIcon kind={kind} size={16} />
                                        {homebrewKindLabel(kind)}
                                    </UnstyledButton>
                                ))}
                            </div>
                        }
                    />
                </Panel>
            )
        }

        return (
            <div className="hb-codex">
                <HomebrewKindIndex groups={itemsByKind} idPrefix="hb-rules" />
                <div>
                    {itemsByKind.map(({ kind, items }) => {
                        const isCollapsed = collapsedItemKinds.has(kind)
                        const label = homebrewKindLabel(kind)

                        return (
                            <HomebrewKindSection
                                key={kind}
                                kind={kind}
                                count={items.length}
                                idPrefix="hb-rules"
                                collapsed={isCollapsed}
                                motionEnabled={!motionlessItemKinds.has(kind)}
                                onToggle={(motionEnabled) => toggleItemKind(kind, motionEnabled)}
                                actions={
                                    <IconButton
                                        label={`Add ${label}`}
                                        icon={<IconPlus size={16} />}
                                        variant="default"
                                        onClick={() => openNewItemEditor(kind)}
                                    />
                                }
                            >
                                <div className="hb-rows">
                                    {items.map((item) => {
                                        const index = allItems.indexOf(item)
                                        const errors = itemValidationErrors[index]
                                        const name = item.name || "rule"
                                        const edit = () => setItemEditor({ item, index })
                                        const askDelete = () => setItemToDelete({ item, index })

                                        return (
                                            <Panel
                                                key={item.id ?? `${item.kind}-${index}`}
                                                interactive
                                                className="hb-row"
                                                data-invalid={errors?.length ? true : undefined}
                                                onClick={edit}
                                                onContextMenu={(
                                                    event: Parameters<typeof contextMenu.open>[0]
                                                ) =>
                                                    contextMenu.open(event, [
                                                        {
                                                            key: "edit",
                                                            label: "Edit",
                                                            icon: <IconEdit size={14} />,
                                                            onClick: edit
                                                        },
                                                        {
                                                            key: "add",
                                                            label: `Add another ${label}`,
                                                            icon: <IconPlus size={14} />,
                                                            onClick: () => openNewItemEditor(kind)
                                                        },
                                                        { type: "divider", key: "divider" },
                                                        {
                                                            key: "delete",
                                                            label: "Delete…",
                                                            color: "red",
                                                            icon: <IconTrash size={14} />,
                                                            onClick: askDelete
                                                        }
                                                    ])
                                                }
                                            >
                                                <div className="hb-row__main">
                                                    <div className="hb-row__meta">
                                                        <ItemMeta item={item} />
                                                    </div>
                                                    <h4
                                                        className="hb-row__name"
                                                        data-untitled={!item.name || undefined}
                                                    >
                                                        {item.name || "Untitled rule"}
                                                    </h4>
                                                    <p className="hb-row__summary">
                                                        {item.summary ||
                                                            item.description ||
                                                            "No summary yet."}
                                                    </p>
                                                </div>
                                                <div
                                                    className="hb-row__actions"
                                                    onClick={(event) => event.stopPropagation()}
                                                >
                                                    <IconButton
                                                        label={`Edit ${name}`}
                                                        icon={<IconEdit size={16} />}
                                                        onClick={edit}
                                                    />
                                                    <DeleteIconButton
                                                        label={`Delete ${name}`}
                                                        onClick={askDelete}
                                                    />
                                                </div>
                                                {errors?.length ? (
                                                    <div
                                                        className="hb-row__errors"
                                                        onClick={(event) => event.stopPropagation()}
                                                    >
                                                        {errors.map((message, messageIndex) => (
                                                            <div
                                                                key={`${message}-${messageIndex}`}
                                                                className="hb-row__error"
                                                            >
                                                                <span>{message}</span>
                                                                {messageIndex === 0 ? (
                                                                    <Button
                                                                        size="compact-xs"
                                                                        variant="light"
                                                                        color="red"
                                                                        onClick={edit}
                                                                    >
                                                                        Fix
                                                                    </Button>
                                                                ) : null}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : null}
                                            </Panel>
                                        )
                                    })}
                                </div>
                            </HomebrewKindSection>
                        )
                    })}
                </div>
                {contextMenu.menu}
            </div>
        )
    }
)
