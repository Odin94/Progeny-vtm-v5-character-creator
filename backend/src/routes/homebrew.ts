import type { FastifyInstance } from "fastify"
import { and, desc, eq, gte, inArray, isNull, sql } from "drizzle-orm"
import { nanoid } from "nanoid"
import { db, schema } from "../db/index.js"
import { authenticateUser, requireSuperadmin } from "../middleware/auth.js"
import {
    attachHomebrewCollectionsSchema,
    commentSchema,
    homebrewCollectionInputSchema,
    homebrewCollectionParamsSchema,
    homebrewCommentParamsSchema,
    homebrewCoterieParamsSchema,
    libraryQuerySchema,
    moderatePublishRequestSchema,
    publishRequestParamsSchema,
    publishRequestSchema,
    ratingSchema,
    type AttachHomebrewCollectionsInput,
    type CommentInput,
    type HomebrewCollectionInput,
    type LibraryQuery,
    type ModeratePublishRequestInput,
    type PublishRequestInput,
    type RatingInput
} from "../schemas/homebrew.js"
import { getCharacterAccess } from "../utils/characterAccess.js"
import {
    getHomebrewCollectionSnapshot,
    insertSnapshotAsCollection,
    replaceHomebrewCollection,
    type HomebrewCollectionSnapshot
} from "../utils/homebrew.js"
import { zodToFastifySchema } from "../utils/schema.js"
import { homebrewLibraryReadRateLimit } from "../utils/rateLimit.js"

const MAX_COLLECTIONS = 50
const MAX_WEEKLY_REQUESTS = 5
const REQUEST_WINDOW_MS = 7 * 24 * 60 * 60 * 1000
const BAYESIAN_PRIOR_WEIGHT = 8

type IdParams = { id: string }
type CommentParams = IdParams & { commentId: string }

const getOwnedCollection = async (collectionId: string, userId: string) => {
    const collection = await db.query.homebrewCollections.findFirst({
        where: eq(schema.homebrewCollections.id, collectionId)
    })
    return collection?.ownerId === userId ? collection : null
}

const getPublishedLibraryEntry = (entryId: string) =>
    db.query.homebrewLibraryEntries.findFirst({
        where: and(
            eq(schema.homebrewLibraryEntries.id, entryId),
            isNull(schema.homebrewLibraryEntries.unpublishedAt)
        )
    })

const getAccessibleCoterie = async (coterieId: string, userId: string) => {
    const coterie = await db.query.coteries.findFirst({
        where: eq(schema.coteries.id, coterieId)
    })
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

const parseSnapshot = (value: string): HomebrewCollectionSnapshot =>
    JSON.parse(value) as HomebrewCollectionSnapshot

const countKinds = (snapshot: HomebrewCollectionSnapshot) =>
    snapshot.items.reduce<Record<string, number>>((counts, item) => {
        counts[item.kind] = (counts[item.kind] ?? 0) + 1
        return counts
    }, {})

const approveRequest = async (requestId: string, reviewerId: string) => {
    const request = await db.query.homebrewPublishRequests.findFirst({
        where: eq(schema.homebrewPublishRequests.id, requestId),
        with: { requester: true }
    })
    if (!request) return null

    return db.transaction((tx) => {
        const claimedRequest = tx
            .update(schema.homebrewPublishRequests)
            .set({
                status: "approved",
                reviewedById: reviewerId,
                reviewedAt: new Date(),
                denialMessage: null
            })
            .where(
                and(
                    eq(schema.homebrewPublishRequests.id, request.id),
                    eq(schema.homebrewPublishRequests.status, "pending")
                )
            )
            .returning()
            .get()
        if (!claimedRequest) return null

        let entry = claimedRequest.libraryEntryId
            ? tx
                  .select()
                  .from(schema.homebrewLibraryEntries)
                  .where(eq(schema.homebrewLibraryEntries.id, claimedRequest.libraryEntryId))
                  .get()
            : null
        if (!entry && claimedRequest.collectionId) {
            entry = tx
                .select()
                .from(schema.homebrewLibraryEntries)
                .where(
                    and(
                        eq(
                            schema.homebrewLibraryEntries.originalCollectionId,
                            claimedRequest.collectionId
                        ),
                        eq(schema.homebrewLibraryEntries.authorId, claimedRequest.requesterId)
                    )
                )
                .get()
        }

        const existingEntryId = entry?.id
        const entryId = existingEntryId ?? nanoid()
        if (!existingEntryId) {
            tx.insert(schema.homebrewLibraryEntries)
                .values({
                    id: entryId,
                    originalCollectionId: claimedRequest.collectionId,
                    authorId: claimedRequest.requesterId,
                    authorNickname: request.requester.nickname ?? "Former user"
                })
                .run()
        }

        const latestVersion = tx
            .select({ version: schema.homebrewPublications.version })
            .from(schema.homebrewPublications)
            .where(eq(schema.homebrewPublications.libraryEntryId, entryId))
            .orderBy(desc(schema.homebrewPublications.version))
            .limit(1)
            .get()
        const publicationId = nanoid()
        const version = (latestVersion?.version ?? 0) + 1
        tx.insert(schema.homebrewPublications)
            .values({
                id: publicationId,
                libraryEntryId: entryId,
                version,
                snapshot: claimedRequest.snapshot,
                approvedById: reviewerId
            })
            .run()
        tx.update(schema.homebrewLibraryEntries)
            .set({ activePublicationId: publicationId, unpublishedAt: null })
            .where(eq(schema.homebrewLibraryEntries.id, entryId))
            .run()
        const updatedRequest = tx
            .update(schema.homebrewPublishRequests)
            .set({ libraryEntryId: entryId })
            .where(eq(schema.homebrewPublishRequests.id, claimedRequest.id))
            .returning()
            .get()

        return { request: updatedRequest, libraryEntryId: entryId, publicationId, version }
    })
}

// `authorNickname` on a library entry is only a snapshot taken at publish-approval time,
// so it goes stale the moment the author renames themselves. Prefer the author's current
// nickname from the users table and fall back to the snapshot only when the author record
// is gone (authorId was set null on user deletion) or has no nickname.
const resolveAuthorNickname = (entry: {
    authorNickname: string
    author?: { nickname: string | null } | null
}) => entry.author?.nickname?.trim() || entry.authorNickname

const getLibrarySummaries = async (query: LibraryQuery) => {
    const entries = await db.query.homebrewLibraryEntries.findMany({
        where: and(
            isNull(schema.homebrewLibraryEntries.unpublishedAt),
            sql`${schema.homebrewLibraryEntries.activePublicationId} is not null`
        ),
        with: { author: { columns: { nickname: true } } }
    })
    if (entries.length === 0) return []

    const publicationIds = entries
        .map((entry) => entry.activePublicationId)
        .filter((id): id is string => !!id)
    const entryIds = entries.map((entry) => entry.id)
    const [publications, ratings, copies, comments] = await Promise.all([
        db
            .select()
            .from(schema.homebrewPublications)
            .where(inArray(schema.homebrewPublications.id, publicationIds)),
        db
            .select()
            .from(schema.homebrewRatings)
            .where(inArray(schema.homebrewRatings.libraryEntryId, entryIds)),
        db
            .select({ sourceLibraryEntryId: schema.homebrewCollections.sourceLibraryEntryId })
            .from(schema.homebrewCollections)
            .where(inArray(schema.homebrewCollections.sourceLibraryEntryId, entryIds)),
        db
            .select({ libraryEntryId: schema.homebrewComments.libraryEntryId })
            .from(schema.homebrewComments)
            .where(inArray(schema.homebrewComments.libraryEntryId, entryIds))
    ])
    const publicationById = new Map(
        publications.map((publication) => [publication.id, publication])
    )
    const globalAverage =
        ratings.length > 0
            ? ratings.reduce((total, rating) => total + rating.rating, 0) / ratings.length
            : 3.5

    const normalizedQuery = query.query?.toLocaleLowerCase()
    const now = Date.now()
    const results = entries.flatMap((entry) => {
        const publication = entry.activePublicationId
            ? publicationById.get(entry.activePublicationId)
            : undefined
        if (!publication) return []
        const snapshot = parseSnapshot(publication.snapshot)
        const entryRatings = ratings.filter((rating) => rating.libraryEntryId === entry.id)
        const ratingCount = entryRatings.length
        const averageRating =
            ratingCount > 0
                ? entryRatings.reduce((total, rating) => total + rating.rating, 0) / ratingCount
                : 0
        const weightedRating =
            (ratingCount / (ratingCount + BAYESIAN_PRIOR_WEIGHT)) * averageRating +
            (BAYESIAN_PRIOR_WEIGHT / (ratingCount + BAYESIAN_PRIOR_WEIGHT)) * globalAverage
        const ageDays = Math.max(0, (now - publication.approvedAt.getTime()) / 86_400_000)
        const recencyBoost = 0.35 * Math.exp(-ageDays / 45)
        const copyCount = copies.filter((copy) => copy.sourceLibraryEntryId === entry.id).length
        const commentCount = comments.filter(
            (comment) => comment.libraryEntryId === entry.id
        ).length
        const kinds = countKinds(snapshot)
        const authorNickname = resolveAuthorNickname(entry)
        const searchable =
            `${snapshot.name} ${snapshot.shortDescription} ${snapshot.description} ${snapshot.tags.join(" ")} ${authorNickname}`.toLocaleLowerCase()

        if (normalizedQuery && !searchable.includes(normalizedQuery)) return []
        if (
            query.tag &&
            !snapshot.tags.some((tag) => tag.toLowerCase() === query.tag!.toLowerCase())
        ) {
            return []
        }
        if (query.type && !kinds[query.type]) return []

        return [
            {
                id: entry.id,
                publicationId: publication.id,
                version: publication.version,
                name: snapshot.name,
                shortDescription: snapshot.shortDescription,
                tags: snapshot.tags,
                contentWarning: snapshot.contentWarning,
                authorNickname,
                publishedAt: publication.approvedAt,
                itemCounts: kinds,
                ratingCount,
                averageRating,
                weightedRating,
                trendingScore: weightedRating + recencyBoost + Math.log10(copyCount + 1) * 0.15,
                copyCount,
                commentCount
            }
        ]
    })

    results.sort((a, b) => {
        if (query.sort === "newest") return b.publishedAt.getTime() - a.publishedAt.getTime()
        if (query.sort === "copied")
            return b.copyCount - a.copyCount || b.weightedRating - a.weightedRating
        if (query.sort === "trending") return b.trendingScore - a.trendingScore
        return b.weightedRating - a.weightedRating || b.ratingCount - a.ratingCount
    })
    return results
}

export async function homebrewRoutes(fastify: FastifyInstance) {
    fastify.get(
        "/homebrew/collections",
        { preHandler: authenticateUser },
        async (request, reply) => {
            const collections = await db.query.homebrewCollections.findMany({
                where: eq(schema.homebrewCollections.ownerId, request.user!.id),
                orderBy: [desc(schema.homebrewCollections.updatedAt)]
            })
            const snapshots = await Promise.all(
                collections.map((collection) => getHomebrewCollectionSnapshot(collection.id))
            )
            reply.send(snapshots.filter(Boolean))
        }
    )

    fastify.get<{ Params: IdParams }>(
        "/homebrew/collections/:id",
        {
            preHandler: authenticateUser,
            schema: { params: zodToFastifySchema(homebrewCollectionParamsSchema) }
        },
        async (request, reply) => {
            const collection = await getOwnedCollection(request.params.id, request.user!.id)
            if (!collection) return reply.code(404).send({ error: "Homebrew collection not found" })
            reply.send(await getHomebrewCollectionSnapshot(collection.id))
        }
    )

    fastify.post<{ Body: HomebrewCollectionInput }>(
        "/homebrew/collections",
        {
            preHandler: authenticateUser,
            schema: {
                body: zodToFastifySchema(homebrewCollectionInputSchema, {
                    preserveUnionBranchProperties: true
                })
            }
        },
        async (request, reply) => {
            const parsedInput = homebrewCollectionInputSchema.safeParse(request.body)
            if (!parsedInput.success) {
                return reply.code(400).send({ error: parsedInput.error.issues[0]?.message })
            }
            const [{ count }] = await db
                .select({ count: sql<number>`count(*)` })
                .from(schema.homebrewCollections)
                .where(eq(schema.homebrewCollections.ownerId, request.user!.id))
            if (count >= MAX_COLLECTIONS) {
                return reply
                    .code(400)
                    .send({ error: `You can own at most ${MAX_COLLECTIONS} collections` })
            }

            const id = nanoid()
            await db.insert(schema.homebrewCollections).values({
                id,
                ownerId: request.user!.id,
                name: parsedInput.data.name,
                shortDescription: parsedInput.data.shortDescription,
                description: parsedInput.data.description,
                tags: JSON.stringify(parsedInput.data.tags),
                contentWarning: parsedInput.data.contentWarning
            })
            const collection = await replaceHomebrewCollection(id, parsedInput.data)
            reply.code(201).send(collection)
        }
    )

    fastify.put<{ Params: IdParams; Body: HomebrewCollectionInput }>(
        "/homebrew/collections/:id",
        {
            preHandler: authenticateUser,
            schema: {
                params: zodToFastifySchema(homebrewCollectionParamsSchema),
                body: zodToFastifySchema(homebrewCollectionInputSchema, {
                    preserveUnionBranchProperties: true
                })
            }
        },
        async (request, reply) => {
            const collection = await getOwnedCollection(request.params.id, request.user!.id)
            if (!collection) return reply.code(404).send({ error: "Homebrew collection not found" })
            const parsedInput = homebrewCollectionInputSchema.safeParse(request.body)
            if (!parsedInput.success) {
                return reply.code(400).send({ error: parsedInput.error.issues[0]?.message })
            }
            reply.send(await replaceHomebrewCollection(collection.id, parsedInput.data))
        }
    )

    fastify.delete<{ Params: IdParams }>(
        "/homebrew/collections/:id",
        {
            preHandler: authenticateUser,
            schema: { params: zodToFastifySchema(homebrewCollectionParamsSchema) }
        },
        async (request, reply) => {
            const collection = await getOwnedCollection(request.params.id, request.user!.id)
            if (!collection) return reply.code(404).send({ error: "Homebrew collection not found" })
            await db
                .delete(schema.homebrewCollections)
                .where(eq(schema.homebrewCollections.id, collection.id))
            reply.code(204).send()
        }
    )

    fastify.get<{ Params: IdParams }>(
        "/coteries/:id/homebrew",
        {
            preHandler: authenticateUser,
            schema: { params: zodToFastifySchema(homebrewCoterieParamsSchema) }
        },
        async (request, reply) => {
            const access = await getAccessibleCoterie(request.params.id, request.user!.id)
            if (!access) return reply.code(404).send({ error: "Coterie not found" })
            const attached = await db.query.coterieHomebrewCollections.findMany({
                where: eq(schema.coterieHomebrewCollections.coterieId, request.params.id)
            })
            const snapshots = await Promise.all(
                attached.map(({ collectionId }) => getHomebrewCollectionSnapshot(collectionId))
            )
            reply.send({ canManage: access.isOwner, collections: snapshots.filter(Boolean) })
        }
    )

    fastify.put<{ Params: IdParams; Body: AttachHomebrewCollectionsInput }>(
        "/coteries/:id/homebrew",
        {
            preHandler: authenticateUser,
            schema: {
                params: zodToFastifySchema(homebrewCoterieParamsSchema),
                body: zodToFastifySchema(attachHomebrewCollectionsSchema)
            }
        },
        async (request, reply) => {
            const access = await getAccessibleCoterie(request.params.id, request.user!.id)
            if (!access) return reply.code(404).send({ error: "Coterie not found" })
            if (!access.isOwner)
                return reply.code(403).send({ error: "Only the coterie owner can manage Homebrew" })

            const uniqueIds = [...new Set(request.body.collectionIds)]
            if (uniqueIds.length > 0) {
                const owned = await db
                    .select({ id: schema.homebrewCollections.id })
                    .from(schema.homebrewCollections)
                    .where(
                        and(
                            eq(schema.homebrewCollections.ownerId, request.user!.id),
                            inArray(schema.homebrewCollections.id, uniqueIds)
                        )
                    )
                if (owned.length !== uniqueIds.length) {
                    return reply
                        .code(400)
                        .send({ error: "Only your own collections can be enabled" })
                }
            }

            db.transaction((tx) => {
                tx.delete(schema.coterieHomebrewCollections)
                    .where(eq(schema.coterieHomebrewCollections.coterieId, request.params.id))
                    .run()
                if (uniqueIds.length > 0) {
                    tx.insert(schema.coterieHomebrewCollections)
                        .values(
                            uniqueIds.map((collectionId) => ({
                                id: nanoid(),
                                coterieId: request.params.id,
                                collectionId
                            }))
                        )
                        .run()
                }
            })
            reply.send({ collectionIds: uniqueIds })
        }
    )

    fastify.get<{ Params: IdParams }>(
        "/characters/:id/homebrew",
        {
            preHandler: authenticateUser,
            schema: { params: zodToFastifySchema(homebrewCollectionParamsSchema) }
        },
        async (request, reply) => {
            const access = await getCharacterAccess(request.params.id, request.user!.id)
            if (!access?.hasAccess) return reply.code(404).send({ error: "Character not found" })

            const rows = await db
                .select({
                    collectionId: schema.homebrewCollections.id,
                    coterieId: schema.coteries.id,
                    coterieName: schema.coteries.name
                })
                .from(schema.coterieMembers)
                .innerJoin(schema.coteries, eq(schema.coteries.id, schema.coterieMembers.coterieId))
                .innerJoin(
                    schema.coterieHomebrewCollections,
                    eq(schema.coterieHomebrewCollections.coterieId, schema.coteries.id)
                )
                .innerJoin(
                    schema.homebrewCollections,
                    eq(
                        schema.homebrewCollections.id,
                        schema.coterieHomebrewCollections.collectionId
                    )
                )
                .where(eq(schema.coterieMembers.characterId, request.params.id))

            const collectionIds = [...new Set(rows.map((row) => row.collectionId))]
            const collections = await Promise.all(
                collectionIds.map(async (collectionId) => ({
                    ...(await getHomebrewCollectionSnapshot(collectionId))!,
                    coteries: rows
                        .filter((row) => row.collectionId === collectionId)
                        .map(({ coterieId, coterieName }) => ({ id: coterieId, name: coterieName }))
                }))
            )
            reply.send(collections)
        }
    )

    fastify.get<{ Querystring: LibraryQuery }>(
        "/homebrew/library",
        { schema: { querystring: zodToFastifySchema(libraryQuerySchema) } },
        async (request, reply) => {
            const query = libraryQuerySchema.parse(request.query)
            reply.send(await getLibrarySummaries(query))
        }
    )

    fastify.get<{ Params: IdParams }>(
        "/homebrew/library/:id",
        {
            config: { rateLimit: homebrewLibraryReadRateLimit },
            schema: { params: zodToFastifySchema(homebrewCollectionParamsSchema) }
        },
        async (request, reply) => {
            const entry = await db.query.homebrewLibraryEntries.findFirst({
                where: and(
                    eq(schema.homebrewLibraryEntries.id, request.params.id),
                    isNull(schema.homebrewLibraryEntries.unpublishedAt)
                ),
                with: { author: { columns: { nickname: true } } }
            })
            if (!entry?.activePublicationId)
                return reply.code(404).send({ error: "Library collection not found" })
            const publication = await db.query.homebrewPublications.findFirst({
                where: eq(schema.homebrewPublications.id, entry.activePublicationId)
            })
            if (!publication) return reply.code(404).send({ error: "Library collection not found" })
            const snapshot = parseSnapshot(publication.snapshot)

            let source: null | {
                entryId: string
                publicationId: string
                version: number
                name: string
                authorNickname: string
                available: boolean
            } = null
            if (snapshot.sourceLibraryEntryId && snapshot.sourcePublicationId) {
                const [sourceEntry, sourcePublication] = await Promise.all([
                    db.query.homebrewLibraryEntries.findFirst({
                        where: eq(schema.homebrewLibraryEntries.id, snapshot.sourceLibraryEntryId),
                        with: { author: { columns: { nickname: true } } }
                    }),
                    db.query.homebrewPublications.findFirst({
                        where: and(
                            eq(schema.homebrewPublications.id, snapshot.sourcePublicationId),
                            eq(
                                schema.homebrewPublications.libraryEntryId,
                                snapshot.sourceLibraryEntryId
                            )
                        )
                    })
                ])
                if (sourceEntry && sourcePublication) {
                    source = {
                        entryId: sourceEntry.id,
                        publicationId: sourcePublication.id,
                        version: sourcePublication.version,
                        name: parseSnapshot(sourcePublication.snapshot).name,
                        authorNickname: resolveAuthorNickname(sourceEntry),
                        available: !sourceEntry.unpublishedAt
                    }
                }
            }

            const [ratings, comments] = await Promise.all([
                db.query.homebrewRatings.findMany({
                    where: eq(schema.homebrewRatings.libraryEntryId, entry.id)
                }),
                db.query.homebrewComments.findMany({
                    where: eq(schema.homebrewComments.libraryEntryId, entry.id),
                    orderBy: [desc(schema.homebrewComments.createdAt)],
                    limit: 200,
                    with: { user: true }
                })
            ])
            reply.send({
                id: entry.id,
                publicationId: publication.id,
                version: publication.version,
                authorId: entry.authorId,
                authorNickname: resolveAuthorNickname(entry),
                publishedAt: publication.approvedAt,
                snapshot,
                source,
                ratingCount: ratings.length,
                averageRating:
                    ratings.length > 0
                        ? ratings.reduce((total, rating) => total + rating.rating, 0) /
                          ratings.length
                        : 0,
                comments: comments.map((comment) => ({
                    id: comment.id,
                    userId: comment.userId,
                    authorNickname: comment.user.nickname ?? "User",
                    body: comment.body,
                    createdAt: comment.createdAt,
                    updatedAt: comment.updatedAt
                }))
            })
        }
    )

    fastify.get(
        "/homebrew/publish-requests",
        { preHandler: authenticateUser },
        async (request, reply) => {
            const requests = await db.query.homebrewPublishRequests.findMany({
                where: eq(schema.homebrewPublishRequests.requesterId, request.user!.id),
                orderBy: [desc(schema.homebrewPublishRequests.createdAt)]
            })
            reply.send(
                requests.map((item) => ({
                    ...item,
                    snapshot: parseSnapshot(item.snapshot)
                }))
            )
        }
    )

    fastify.post<{ Body: PublishRequestInput }>(
        "/homebrew/publish-requests",
        {
            preHandler: authenticateUser,
            schema: { body: zodToFastifySchema(publishRequestSchema) }
        },
        async (request, reply) => {
            const user = request.user!
            if (!user.nickname)
                return reply.code(400).send({ error: "Set a nickname before publishing" })
            const collection = await getOwnedCollection(request.body.collectionId, user.id)
            if (!collection) return reply.code(404).send({ error: "Homebrew collection not found" })

            const pending = await db.query.homebrewPublishRequests.findFirst({
                where: and(
                    eq(schema.homebrewPublishRequests.collectionId, collection.id),
                    eq(schema.homebrewPublishRequests.status, "pending")
                )
            })
            if (pending)
                return reply
                    .code(409)
                    .send({ error: "This collection already has a pending request" })

            const since = new Date(Date.now() - REQUEST_WINDOW_MS)
            const [{ count }] = await db
                .select({ count: sql<number>`count(*)` })
                .from(schema.homebrewPublishRequests)
                .where(
                    and(
                        eq(schema.homebrewPublishRequests.requesterId, user.id),
                        gte(schema.homebrewPublishRequests.createdAt, since)
                    )
                )
            if (count >= MAX_WEEKLY_REQUESTS) {
                return reply
                    .code(429)
                    .send({ error: "You can submit five publish requests in any seven-day period" })
            }

            const snapshot = await getHomebrewCollectionSnapshot(collection.id)
            const existingEntry = await db.query.homebrewLibraryEntries.findFirst({
                where: and(
                    eq(schema.homebrewLibraryEntries.originalCollectionId, collection.id),
                    eq(schema.homebrewLibraryEntries.authorId, user.id)
                )
            })
            const id = nanoid()
            const [created] = await db
                .insert(schema.homebrewPublishRequests)
                .values({
                    id,
                    collectionId: collection.id,
                    requesterId: user.id,
                    libraryEntryId: existingEntry?.id,
                    snapshot: JSON.stringify(snapshot)
                })
                .returning()

            if (user.isSuperadmin && !request.impersonation?.active) {
                const approved = await approveRequest(id, user.id)
                return reply.code(201).send(approved)
            }
            reply.code(201).send({ ...created, snapshot })
        }
    )

    fastify.post<{ Params: IdParams }>(
        "/homebrew/publish-requests/:id/withdraw",
        {
            preHandler: authenticateUser,
            schema: { params: zodToFastifySchema(publishRequestParamsSchema) }
        },
        async (request, reply) => {
            const item = await db.query.homebrewPublishRequests.findFirst({
                where: eq(schema.homebrewPublishRequests.id, request.params.id)
            })
            if (!item || item.requesterId !== request.user!.id)
                return reply.code(404).send({ error: "Request not found" })
            if (item.status !== "pending")
                return reply.code(409).send({ error: "Only pending requests can be withdrawn" })
            const withdrawn = await db
                .update(schema.homebrewPublishRequests)
                .set({ status: "withdrawn", reviewedAt: new Date() })
                .where(
                    and(
                        eq(schema.homebrewPublishRequests.id, item.id),
                        eq(schema.homebrewPublishRequests.status, "pending")
                    )
                )
                .returning()
            if (withdrawn.length === 0)
                return reply.code(409).send({ error: "Only pending requests can be withdrawn" })
            reply.send({ status: "withdrawn" })
        }
    )

    fastify.get(
        "/admin/homebrew/publish-requests",
        { preHandler: [authenticateUser, requireSuperadmin] },
        async (_request, reply) => {
            const requests = await db.query.homebrewPublishRequests.findMany({
                orderBy: [desc(schema.homebrewPublishRequests.createdAt)],
                with: { requester: true }
            })
            reply.send(
                requests.map((item) => ({
                    ...item,
                    requester: {
                        id: item.requester.id,
                        nickname: item.requester.nickname,
                        email: item.requester.email
                    },
                    snapshot: parseSnapshot(item.snapshot)
                }))
            )
        }
    )

    fastify.post<{ Params: IdParams; Body: ModeratePublishRequestInput }>(
        "/admin/homebrew/publish-requests/:id",
        {
            preHandler: [authenticateUser, requireSuperadmin],
            schema: {
                params: zodToFastifySchema(publishRequestParamsSchema),
                body: zodToFastifySchema(moderatePublishRequestSchema)
            }
        },
        async (request, reply) => {
            if (request.body.decision === "approve") {
                const approved = await approveRequest(request.params.id, request.actorUser!.id)
                if (!approved) return reply.code(404).send({ error: "Pending request not found" })
                return reply.send(approved)
            }

            const denialMessage = request.body.message?.trim()
            if (!denialMessage) {
                return reply.code(400).send({ error: "A denial message is required" })
            }

            const [denied] = await db
                .update(schema.homebrewPublishRequests)
                .set({
                    status: "denied",
                    denialMessage,
                    reviewedById: request.actorUser!.id,
                    reviewedAt: new Date()
                })
                .where(
                    and(
                        eq(schema.homebrewPublishRequests.id, request.params.id),
                        eq(schema.homebrewPublishRequests.status, "pending")
                    )
                )
                .returning()
            if (!denied) return reply.code(404).send({ error: "Pending request not found" })
            reply.send(denied)
        }
    )

    fastify.post<{ Params: IdParams }>(
        "/homebrew/library/:id/copy",
        {
            preHandler: authenticateUser,
            schema: { params: zodToFastifySchema(homebrewCollectionParamsSchema) }
        },
        async (request, reply) => {
            const entry = await db.query.homebrewLibraryEntries.findFirst({
                where: and(
                    eq(schema.homebrewLibraryEntries.id, request.params.id),
                    isNull(schema.homebrewLibraryEntries.unpublishedAt)
                )
            })
            if (!entry?.activePublicationId)
                return reply.code(404).send({ error: "Library collection not found" })
            const publication = await db.query.homebrewPublications.findFirst({
                where: eq(schema.homebrewPublications.id, entry.activePublicationId)
            })
            if (!publication) return reply.code(404).send({ error: "Library collection not found" })

            const [{ count }] = await db
                .select({ count: sql<number>`count(*)` })
                .from(schema.homebrewCollections)
                .where(eq(schema.homebrewCollections.ownerId, request.user!.id))
            if (count >= MAX_COLLECTIONS)
                return reply
                    .code(400)
                    .send({ error: `You can own at most ${MAX_COLLECTIONS} collections` })

            const snapshot = parseSnapshot(publication.snapshot)
            const copied = await insertSnapshotAsCollection({
                ownerId: request.user!.id,
                snapshot,
                sourceLibraryEntryId: entry.id,
                sourcePublicationId: publication.id,
                rootSourceLibraryEntryId: snapshot.rootSourceLibraryEntryId ?? entry.id
            })
            reply.code(201).send(copied)
        }
    )

    fastify.post<{ Params: IdParams; Body: RatingInput }>(
        "/homebrew/library/:id/rating",
        {
            preHandler: authenticateUser,
            schema: {
                params: zodToFastifySchema(homebrewCollectionParamsSchema),
                body: zodToFastifySchema(ratingSchema)
            }
        },
        async (request, reply) => {
            const entry = await getPublishedLibraryEntry(request.params.id)
            if (!entry?.activePublicationId)
                return reply.code(404).send({ error: "Library collection not found" })
            if (entry.authorId === request.user!.id)
                return reply.code(400).send({ error: "You cannot rate your own collection" })

            await db
                .insert(schema.homebrewRatings)
                .values({
                    id: nanoid(),
                    libraryEntryId: entry.id,
                    userId: request.user!.id,
                    rating: request.body.rating
                })
                .onConflictDoUpdate({
                    target: [schema.homebrewRatings.libraryEntryId, schema.homebrewRatings.userId],
                    set: { rating: request.body.rating, updatedAt: new Date() }
                })
            reply.send({ rating: request.body.rating })
        }
    )

    fastify.delete<{ Params: IdParams }>(
        "/homebrew/library/:id/rating",
        {
            preHandler: authenticateUser,
            schema: { params: zodToFastifySchema(homebrewCollectionParamsSchema) }
        },
        async (request, reply) => {
            const entry = await getPublishedLibraryEntry(request.params.id)
            if (!entry?.activePublicationId)
                return reply.code(404).send({ error: "Library collection not found" })
            await db
                .delete(schema.homebrewRatings)
                .where(
                    and(
                        eq(schema.homebrewRatings.libraryEntryId, request.params.id),
                        eq(schema.homebrewRatings.userId, request.user!.id)
                    )
                )
            reply.code(204).send()
        }
    )

    fastify.post<{ Params: IdParams; Body: CommentInput }>(
        "/homebrew/library/:id/comments",
        {
            preHandler: authenticateUser,
            schema: {
                params: zodToFastifySchema(homebrewCollectionParamsSchema),
                body: zodToFastifySchema(commentSchema)
            }
        },
        async (request, reply) => {
            const entry = await getPublishedLibraryEntry(request.params.id)
            if (!entry?.activePublicationId)
                return reply.code(404).send({ error: "Library collection not found" })
            const [comment] = await db
                .insert(schema.homebrewComments)
                .values({
                    id: nanoid(),
                    libraryEntryId: entry.id,
                    userId: request.user!.id,
                    body: request.body.body
                })
                .returning()
            reply.code(201).send({ ...comment, authorNickname: request.user!.nickname ?? "User" })
        }
    )

    fastify.patch<{ Params: CommentParams; Body: CommentInput }>(
        "/homebrew/library/:id/comments/:commentId",
        {
            preHandler: authenticateUser,
            schema: {
                params: zodToFastifySchema(homebrewCommentParamsSchema),
                body: zodToFastifySchema(commentSchema)
            }
        },
        async (request, reply) => {
            const entry = await getPublishedLibraryEntry(request.params.id)
            if (!entry?.activePublicationId)
                return reply.code(404).send({ error: "Library collection not found" })
            const comment = await db.query.homebrewComments.findFirst({
                where: and(
                    eq(schema.homebrewComments.id, request.params.commentId),
                    eq(schema.homebrewComments.libraryEntryId, request.params.id)
                )
            })
            if (!comment || comment.userId !== request.user!.id)
                return reply.code(404).send({ error: "Comment not found" })
            const [updated] = await db
                .update(schema.homebrewComments)
                .set({ body: request.body.body, updatedAt: new Date() })
                .where(eq(schema.homebrewComments.id, comment.id))
                .returning()
            reply.send(updated)
        }
    )

    fastify.delete<{ Params: CommentParams }>(
        "/homebrew/library/:id/comments/:commentId",
        {
            preHandler: authenticateUser,
            schema: { params: zodToFastifySchema(homebrewCommentParamsSchema) }
        },
        async (request, reply) => {
            const entry = await getPublishedLibraryEntry(request.params.id)
            if (!entry?.activePublicationId)
                return reply.code(404).send({ error: "Library collection not found" })
            const comment = await db.query.homebrewComments.findFirst({
                where: and(
                    eq(schema.homebrewComments.id, request.params.commentId),
                    eq(schema.homebrewComments.libraryEntryId, request.params.id)
                )
            })
            const canDelete =
                comment &&
                (comment.userId === request.user!.id ||
                    (request.actorUser?.isSuperadmin && !request.impersonation?.active))
            if (!canDelete) return reply.code(404).send({ error: "Comment not found" })
            await db
                .delete(schema.homebrewComments)
                .where(eq(schema.homebrewComments.id, comment.id))
            reply.code(204).send()
        }
    )

    fastify.post<{ Params: IdParams }>(
        "/homebrew/library/:id/unpublish",
        {
            preHandler: authenticateUser,
            schema: { params: zodToFastifySchema(homebrewCollectionParamsSchema) }
        },
        async (request, reply) => {
            const entry = await db.query.homebrewLibraryEntries.findFirst({
                where: eq(schema.homebrewLibraryEntries.id, request.params.id)
            })
            if (
                !entry ||
                (entry.authorId !== request.user!.id &&
                    !(request.actorUser?.isSuperadmin && !request.impersonation?.active))
            ) {
                return reply.code(404).send({ error: "Library collection not found" })
            }
            await db
                .update(schema.homebrewLibraryEntries)
                .set({ unpublishedAt: new Date() })
                .where(eq(schema.homebrewLibraryEntries.id, entry.id))
            reply.send({ unpublished: true })
        }
    )
}
