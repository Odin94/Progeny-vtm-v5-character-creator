import { asc, eq } from "drizzle-orm"
import { nanoid } from "nanoid"
import { db, schema } from "../db/index.js"
import {
    homebrewCollectionInputSchema,
    homebrewItemSchema,
    type HomebrewCollectionInput,
    type HomebrewItemInput
} from "../schemas/homebrew.js"

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

    return items.map((item) => ({
        ...item,
        id: item.id && existingIds.has(item.id) ? item.id : nanoid()
    }))
}

export const replaceHomebrewCollection = async (
    collectionId: string,
    input: HomebrewCollectionInput
) => {
    const parsed = homebrewCollectionInputSchema.parse(input)
    const items = await normalizeItemIds(collectionId, parsed.items)

    db.transaction((tx) => {
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

    db.transaction((tx) => {
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

        if (parsed.items.length > 0) {
            tx.insert(schema.homebrewItems)
                .values(
                    parsed.items.map((item, sortOrder) => {
                        const id = nanoid()
                        return {
                            id,
                            collectionId,
                            kind: item.kind,
                            data: JSON.stringify({ ...item, id }),
                            sortOrder
                        }
                    })
                )
                .run()
        }
    })

    return getHomebrewCollectionSnapshot(collectionId)
}
