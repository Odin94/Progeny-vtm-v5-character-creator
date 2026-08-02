import { asc, eq, inArray, sql } from "drizzle-orm"
import { nanoid } from "nanoid"
import { db, schema } from "../db/index.js"
import {
    homebrewCollectionInputSchema,
    homebrewItemSchema,
    type HomebrewCollectionInput,
    type HomebrewItemInput
} from "../schemas/homebrew.js"

export const HOMEBREW_STORAGE_LIMIT_BYTES = 100 * 1024 * 1024
export const HOMEBREW_STORAGE_LIMIT_MESSAGE =
    "your account is using over 100MB of storage, talk to support if you need more"

export class HomebrewStorageLimitError extends Error {
    constructor() {
        super(HOMEBREW_STORAGE_LIMIT_MESSAGE)
        this.name = "HomebrewStorageLimitError"
    }
}

export type HomebrewCollectionSnapshot = {
    id: string
    name: string
    shortDescription: string
    description: string
    tags: string[]
    contentWarning: string
    sourceLibraryEntryId: string | null
    sourcePublicationId: string | null
    rootSourceLibraryEntryId: string | null
    createdAt: Date
    updatedAt: Date
    items: Array<HomebrewItemInput & { id: string }>
}

const parseTags = (value: string): string[] => {
    try {
        const parsed = JSON.parse(value)
        return Array.isArray(parsed) ? parsed.filter((tag) => typeof tag === "string") : []
    } catch {
        return []
    }
}

const parseItem = (row: typeof schema.homebrewItems.$inferSelect) => {
    const parsed = homebrewItemSchema.parse(JSON.parse(row.data))
    return { ...parsed, id: row.id }
}

type HomebrewItemWithId = HomebrewItemInput & { id: string }

const collectionStorageSize = (collection: {
    name: string
    shortDescription: string
    description: string
    tags: string[]
    contentWarning: string
}) =>
    Buffer.byteLength(
        [
            collection.name,
            collection.shortDescription,
            collection.description,
            JSON.stringify(collection.tags),
            collection.contentWarning
        ].join("")
    )

const itemsStorageSize = (items: HomebrewItemWithId[]) =>
    items.reduce((size, item) => size + Buffer.byteLength(JSON.stringify(item)), 0)

const assertHomebrewStorageLimit = (
    tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
    ownerId: string,
    existingCollectionId: string | null,
    collection: HomebrewCollectionInput,
    items: HomebrewItemWithId[],
    isNewCollection = false
) => {
    const storedCollectionSize = tx
        .select({
            size: sql<number>`coalesce(sum(length(cast(${schema.homebrewCollections.name} as blob)) + length(cast(${schema.homebrewCollections.shortDescription} as blob)) + length(cast(${schema.homebrewCollections.description} as blob)) + length(cast(${schema.homebrewCollections.tags} as blob)) + length(cast(${schema.homebrewCollections.contentWarning} as blob))), 0)`
        })
        .from(schema.homebrewCollections)
        .where(eq(schema.homebrewCollections.ownerId, ownerId))
        .get()?.size ?? 0
    const storedItemSize = tx
        .select({ size: sql<number>`coalesce(sum(length(cast(${schema.homebrewItems.data} as blob))), 0)` })
        .from(schema.homebrewItems)
        .innerJoin(
            schema.homebrewCollections,
            eq(schema.homebrewItems.collectionId, schema.homebrewCollections.id)
        )
        .where(eq(schema.homebrewCollections.ownerId, ownerId))
        .get()?.size ?? 0
    let existingCollectionSize = 0
    if (existingCollectionId) {
        const storedExistingCollectionSize =
            tx
                .select({
                    size: sql<number>`coalesce(sum(length(cast(${schema.homebrewCollections.name} as blob)) + length(cast(${schema.homebrewCollections.shortDescription} as blob)) + length(cast(${schema.homebrewCollections.description} as blob)) + length(cast(${schema.homebrewCollections.tags} as blob)) + length(cast(${schema.homebrewCollections.contentWarning} as blob))), 0)`
                })
                .from(schema.homebrewCollections)
                .where(eq(schema.homebrewCollections.id, existingCollectionId))
                .get()?.size ?? 0
        const storedExistingItemSize =
            tx
                .select({ size: sql<number>`coalesce(sum(length(cast(${schema.homebrewItems.data} as blob))), 0)` })
                .from(schema.homebrewItems)
                .where(eq(schema.homebrewItems.collectionId, existingCollectionId))
                .get()?.size ?? 0
        existingCollectionSize = Number(storedExistingCollectionSize) + Number(storedExistingItemSize)
    }
    const currentSize = Number(storedCollectionSize) + Number(storedItemSize)
    const sizeBeforeSave = currentSize - existingCollectionSize
    const projectedSize = sizeBeforeSave + collectionStorageSize(collection) + itemsStorageSize(items)
    const sizeToCompareAgainst = isNewCollection ? sizeBeforeSave : currentSize

    // Existing accounts that predate the limit can still save changes that do not grow their data.
    if (projectedSize > HOMEBREW_STORAGE_LIMIT_BYTES && projectedSize > sizeToCompareAgainst) {
        throw new HomebrewStorageLimitError()
    }
}

const canonicalizeDisciplineReferences = (items: HomebrewItemWithId[]): HomebrewItemWithId[] => {
    const disciplineNamesById = new Map(
        items.filter((item) => item.kind === "discipline").map((item) => [item.id, item.name])
    )
    const canonicalizeReference = <T extends { type: string; name: string; itemId?: string }>(
        reference: T
    ): T =>
        reference.type === "homebrew" && reference.itemId
            ? {
                  ...reference,
                  name: disciplineNamesById.get(reference.itemId) ?? reference.name
              }
            : reference

    return items.map((item): HomebrewItemWithId => {
        if (
            item.kind === "power" ||
            item.kind === "ritual" ||
            item.kind === "ceremony" ||
            item.kind === "formula"
        ) {
            if (item.disciplineRef?.type !== "homebrew") return item
            const disciplineRef = canonicalizeReference(item.disciplineRef)
            return {
                ...item,
                disciplineRef,
                discipline: disciplineRef.name
            } as HomebrewItemWithId
        }
        if (item.kind === "clan" && item.nativeDisciplineRefs) {
            const nativeDisciplineRefs = item.nativeDisciplineRefs.map(canonicalizeReference)
            return {
                ...item,
                nativeDisciplineRefs,
                nativeDisciplines: nativeDisciplineRefs.map((reference) => reference.name)
            }
        }
        return item
    })
}

export const serializeHomebrewCollection = (
    collection: typeof schema.homebrewCollections.$inferSelect,
    items: Array<typeof schema.homebrewItems.$inferSelect>
): HomebrewCollectionSnapshot => ({
    id: collection.id,
    name: collection.name,
    shortDescription: collection.shortDescription,
    description: collection.description,
    tags: parseTags(collection.tags),
    contentWarning: collection.contentWarning,
    sourceLibraryEntryId: collection.sourceLibraryEntryId,
    sourcePublicationId: collection.sourcePublicationId,
    rootSourceLibraryEntryId: collection.rootSourceLibraryEntryId,
    createdAt: collection.createdAt,
    updatedAt: collection.updatedAt,
    items: items.sort((a, b) => a.sortOrder - b.sortOrder).map(parseItem)
})

export const getHomebrewCollectionSnapshot = async (
    collectionId: string
): Promise<HomebrewCollectionSnapshot | null> => {
    const collection = await db.query.homebrewCollections.findFirst({
        where: eq(schema.homebrewCollections.id, collectionId)
    })
    if (!collection) return null

    const items = await db.query.homebrewItems.findMany({
        where: eq(schema.homebrewItems.collectionId, collectionId),
        orderBy: [asc(schema.homebrewItems.sortOrder)]
    })
    return serializeHomebrewCollection(collection, items)
}

const normalizeItemIds = async (collectionId: string, items: HomebrewItemInput[]) => {
    const existing = await db
        .select({ id: schema.homebrewItems.id })
        .from(schema.homebrewItems)
        .where(eq(schema.homebrewItems.collectionId, collectionId))
    const existingIds = new Set(existing.map(({ id }) => id))
    const requestedIds = items.flatMap((item) => (item.id ? [item.id] : []))
    const globallyUsed =
        requestedIds.length > 0
            ? await db
                  .select({
                      id: schema.homebrewItems.id,
                      collectionId: schema.homebrewItems.collectionId
                  })
                  .from(schema.homebrewItems)
                  .where(inArray(schema.homebrewItems.id, requestedIds))
            : []
    const usedByOtherCollections = new Set(
        globallyUsed.filter((item) => item.collectionId !== collectionId).map((item) => item.id)
    )
    const idMap = new Map<string, string>()
    const assignedIds = new Set<string>()

    const normalized = items.map((item) => {
        const canKeepRequestedId =
            !!item.id &&
            !assignedIds.has(item.id) &&
            !usedByOtherCollections.has(item.id) &&
            (existingIds.has(item.id) ||
                !globallyUsed.some((existingItem) => existingItem.id === item.id))
        const id = canKeepRequestedId ? item.id! : nanoid()
        if (item.id) idMap.set(item.id, id)
        assignedIds.add(id)
        return { ...item, id }
    })

    const remapped = normalized.map((item) => {
        const remapReference = <T extends { type: string; itemId?: string }>(reference: T): T =>
            reference.type === "homebrew" && reference.itemId
                ? { ...reference, itemId: idMap.get(reference.itemId) ?? reference.itemId }
                : reference

        if (
            item.kind === "power" ||
            item.kind === "ritual" ||
            item.kind === "ceremony" ||
            item.kind === "formula"
        ) {
            return {
                ...item,
                ...(item.disciplineRef && {
                    disciplineRef: remapReference(item.disciplineRef)
                })
            }
        }
        if (item.kind === "clan") {
            return {
                ...item,
                ...(item.nativeDisciplineRefs && {
                    nativeDisciplineRefs: item.nativeDisciplineRefs.map(remapReference)
                })
            }
        }
        return item
    })
    return canonicalizeDisciplineReferences(remapped)
}

export const replaceHomebrewCollection = async (
    collectionId: string,
    input: HomebrewCollectionInput,
    ownerId: string,
    isNewCollection = false
) => {
    const parsed = homebrewCollectionInputSchema.parse(input)
    const normalizedItems = await normalizeItemIds(collectionId, parsed.items)
    const normalized = homebrewCollectionInputSchema.parse({
        ...parsed,
        items: normalizedItems
    })
    const items = normalized.items.map((item) => ({ ...item, id: item.id! }))

    db.transaction((tx) => {
        assertHomebrewStorageLimit(tx, ownerId, collectionId, normalized, items, isNewCollection)

        tx.update(schema.homebrewCollections)
            .set({
                name: parsed.name,
                shortDescription: parsed.shortDescription,
                description: parsed.description,
                tags: JSON.stringify(parsed.tags),
                contentWarning: parsed.contentWarning,
                updatedAt: new Date()
            })
            .where(eq(schema.homebrewCollections.id, collectionId))
            .run()

        tx.delete(schema.homebrewItems)
            .where(eq(schema.homebrewItems.collectionId, collectionId))
            .run()

        if (items.length > 0) {
            tx.insert(schema.homebrewItems)
                .values(
                    items.map((item, sortOrder) => ({
                        id: item.id,
                        collectionId,
                        kind: item.kind,
                        data: JSON.stringify(item),
                        sortOrder
                    }))
                )
                .run()
        }
    })

    return getHomebrewCollectionSnapshot(collectionId)
}

export const insertSnapshotAsCollection = async ({
    ownerId,
    snapshot,
    sourceLibraryEntryId = null,
    sourcePublicationId = null,
    rootSourceLibraryEntryId = null
}: {
    ownerId: string
    snapshot: HomebrewCollectionSnapshot
    sourceLibraryEntryId?: string | null
    sourcePublicationId?: string | null
    rootSourceLibraryEntryId?: string | null
}) => {
    const collectionId = nanoid()
    const parsed = homebrewCollectionInputSchema.parse(snapshot)
    const copiedItemIds = new Map(
        parsed.items.flatMap((item) => (item.id ? [[item.id, nanoid()] as const] : []))
    )
    const remapReference = <T extends { type: string; itemId?: string }>(reference: T): T =>
        reference.type === "homebrew" && reference.itemId
            ? { ...reference, itemId: copiedItemIds.get(reference.itemId) ?? reference.itemId }
            : reference
    const copiedItems = canonicalizeDisciplineReferences(
        parsed.items.map((item): HomebrewItemWithId => {
            const id = (item.id && copiedItemIds.get(item.id)) || nanoid()
            if (
                item.kind === "power" ||
                item.kind === "ritual" ||
                item.kind === "ceremony" ||
                item.kind === "formula"
            ) {
                return {
                    ...item,
                    id,
                    ...(item.disciplineRef && {
                        disciplineRef: remapReference(item.disciplineRef)
                    })
                }
            }
            if (item.kind === "clan") {
                return {
                    ...item,
                    id,
                    ...(item.nativeDisciplineRefs && {
                        nativeDisciplineRefs: item.nativeDisciplineRefs.map(remapReference)
                    })
                }
            }
            return { ...item, id }
        })
    )

    db.transaction((tx) => {
        assertHomebrewStorageLimit(tx, ownerId, null, parsed, copiedItems)

        tx.insert(schema.homebrewCollections)
            .values({
                id: collectionId,
                ownerId,
                name: parsed.name,
                shortDescription: parsed.shortDescription,
                description: parsed.description,
                tags: JSON.stringify(parsed.tags),
                contentWarning: parsed.contentWarning,
                sourceLibraryEntryId,
                sourcePublicationId,
                rootSourceLibraryEntryId
            })
            .run()

        if (copiedItems.length > 0) {
            tx.insert(schema.homebrewItems)
                .values(
                    copiedItems.map((item, sortOrder) => {
                        return {
                            id: item.id,
                            collectionId,
                            kind: item.kind,
                            data: JSON.stringify(item),
                            sortOrder
                        }
                    })
                )
                .run()
        }
    })

    return getHomebrewCollectionSnapshot(collectionId)
}
