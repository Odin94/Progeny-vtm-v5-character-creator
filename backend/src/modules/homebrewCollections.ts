import { and, eq } from "drizzle-orm"
import { db, schema } from "../db/index.js"

export const getOwnedHomebrewCollection = async (collectionId: string, userId: string) => {
    const collection = await db.query.homebrewCollections.findFirst({
        where: eq(schema.homebrewCollections.id, collectionId)
    })
    return collection?.ownerId === userId ? collection : null
}

export const getAccessibleHomebrewCoterie = async (coterieId: string, userId: string) => {
    const coterie = await db.query.coteries.findFirst({ where: eq(schema.coteries.id, coterieId) })
    if (!coterie) return null
    if (coterie.ownerId === userId) return { coterie, isOwner: true }
    const membership = await db.query.coteriePlayerMemberships.findFirst({
        where: and(
            eq(schema.coteriePlayerMemberships.coterieId, coterieId),
            eq(schema.coteriePlayerMemberships.userId, userId)
        )
    })
    return membership ? { coterie, isOwner: false } : null
}
