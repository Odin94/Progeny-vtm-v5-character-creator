import type { FastifyInstance } from "fastify"
import { and, asc, desc, eq, ne } from "drizzle-orm"
import { nanoid } from "nanoid"
import { db, schema } from "../db/index.js"
import {
    authenticateUser,
    requireSuperadmin,
    type AuthenticatedRequest
} from "../middleware/auth.js"
import {
    recentChangeDraftSchema,
    recentChangeParamsSchema,
    type RecentChangeDraftInput,
    type RecentChangeParams
} from "../schemas/recentChanges.js"
import { zodToFastifySchema } from "../utils/schema.js"

const serializeRecentChange = (change: typeof schema.recentChanges.$inferSelect) => ({
    id: change.id,
    title: change.title,
    body: change.body,
    imageUrl: change.imageUrl,
    hasImage: Boolean(change.imageData && change.imageMimeType),
    status: change.status,
    publishedAt: change.publishedAt?.toISOString() ?? null,
    createdAt: change.createdAt.toISOString(),
    updatedAt: change.updatedAt.toISOString()
})

const getPublishedChanges = () =>
    db.query.recentChanges.findMany({
        where: eq(schema.recentChanges.status, "published"),
        orderBy: [asc(schema.recentChanges.publishedAt), asc(schema.recentChanges.createdAt)]
    })

export async function recentChangesRoutes(fastify: FastifyInstance) {
    fastify.get(
        "/recent-changes/history",
        { preHandler: authenticateUser },
        async (_request, reply) => {
            const changes = await getPublishedChanges()
            reply.send({ changes: changes.map(serializeRecentChange) })
        }
    )

    fastify.get<{ Params: RecentChangeParams }>(
        "/recent-changes/:id/image",
        {
            preHandler: authenticateUser,
            schema: { params: zodToFastifySchema(recentChangeParamsSchema) }
        },
        async (request, reply) => {
            const { id } = request.params as RecentChangeParams
            const change = await db.query.recentChanges.findFirst({
                where: and(
                    eq(schema.recentChanges.id, id),
                    eq(schema.recentChanges.status, "published")
                )
            })

            if (!change?.imageData || !change.imageMimeType) {
                reply.code(404).send({ error: "Update image not found" })
                return
            }

            reply
                .header("Cache-Control", "private, max-age=3600")
                .type(change.imageMimeType)
                .send(change.imageData)
        }
    )

    fastify.post(
        "/recent-changes/deliver-latest",
        { preHandler: authenticateUser },
        async (request: AuthenticatedRequest, reply) => {
            const result = db.transaction((tx) => {
                const latest = tx
                    .select()
                    .from(schema.recentChanges)
                    .where(eq(schema.recentChanges.status, "published"))
                    .orderBy(
                        desc(schema.recentChanges.publishedAt),
                        desc(schema.recentChanges.createdAt)
                    )
                    .limit(1)
                    .get()

                if (!latest) {
                    return { announcement: null, changes: [] }
                }

                const delivery = tx
                    .insert(schema.recentChangeDeliveries)
                    .values({
                        id: nanoid(),
                        userId: request.user!.id,
                        recentChangeId: latest.id
                    })
                    .onConflictDoNothing()
                    .returning({ id: schema.recentChangeDeliveries.id })
                    .get()

                if (!delivery) {
                    return { announcement: null, changes: [] }
                }

                const changes = tx
                    .select()
                    .from(schema.recentChanges)
                    .where(eq(schema.recentChanges.status, "published"))
                    .orderBy(
                        asc(schema.recentChanges.publishedAt),
                        asc(schema.recentChanges.createdAt)
                    )
                    .all()

                return { announcement: latest, changes }
            })

            reply.send({
                announcement: result.announcement
                    ? serializeRecentChange(result.announcement)
                    : null,
                changes: result.changes.map(serializeRecentChange)
            })
        }
    )

    fastify.get(
        "/admin/recent-changes",
        { preHandler: [authenticateUser, requireSuperadmin] },
        async (_request, reply) => {
            const changes = await db.query.recentChanges.findMany({
                orderBy: [
                    desc(schema.recentChanges.updatedAt),
                    desc(schema.recentChanges.createdAt)
                ]
            })
            reply.send({ changes: changes.map(serializeRecentChange) })
        }
    )

    fastify.post<{ Body: RecentChangeDraftInput }>(
        "/admin/recent-changes",
        {
            preHandler: [authenticateUser, requireSuperadmin],
            schema: { body: zodToFastifySchema(recentChangeDraftSchema) }
        },
        async (request: AuthenticatedRequest, reply) => {
            const draft = request.body as RecentChangeDraftInput
            const [created] = await db
                .insert(schema.recentChanges)
                .values({ id: nanoid(), ...draft, createdByUserId: request.actorUser!.id })
                .returning()
            reply.code(201).send(serializeRecentChange(created))
        }
    )

    fastify.patch<{ Params: RecentChangeParams; Body: RecentChangeDraftInput }>(
        "/admin/recent-changes/:id",
        {
            preHandler: [authenticateUser, requireSuperadmin],
            schema: {
                params: zodToFastifySchema(recentChangeParamsSchema),
                body: zodToFastifySchema(recentChangeDraftSchema)
            }
        },
        async (request, reply) => {
            const { id } = request.params as RecentChangeParams
            const draft = request.body as RecentChangeDraftInput
            const [updated] = await db
                .update(schema.recentChanges)
                .set({ ...draft, updatedAt: new Date() })
                .where(
                    and(eq(schema.recentChanges.id, id), eq(schema.recentChanges.status, "draft"))
                )
                .returning()

            if (!updated) {
                reply.code(404).send({ error: "Draft not found" })
                return
            }

            reply.send(serializeRecentChange(updated))
        }
    )

    fastify.post<{ Params: RecentChangeParams }>(
        "/admin/recent-changes/:id/image",
        {
            preHandler: [authenticateUser, requireSuperadmin],
            schema: { params: zodToFastifySchema(recentChangeParamsSchema) }
        },
        async (request, reply) => {
            const { id } = request.params as RecentChangeParams
            const upload = await request.file()

            if (!upload || upload.fieldname !== "image") {
                reply.code(400).send({ error: "Please upload an image file" })
                return
            }

            const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"])
            if (!allowedMimeTypes.has(upload.mimetype)) {
                reply.code(400).send({ error: "Images must be JPEG, PNG, or WebP" })
                return
            }

            const imageData = await upload.toBuffer()
            if (upload.file.truncated || imageData.length > 3 * 1024 * 1024) {
                reply.code(400).send({ error: "Images must be 3 MB or smaller" })
                return
            }

            const [updated] = await db
                .update(schema.recentChanges)
                .set({
                    imageUrl: null,
                    imageData,
                    imageMimeType: upload.mimetype,
                    updatedAt: new Date()
                })
                .where(
                    and(eq(schema.recentChanges.id, id), eq(schema.recentChanges.status, "draft"))
                )
                .returning()

            if (!updated) {
                reply.code(404).send({ error: "Draft not found" })
                return
            }

            reply.send(serializeRecentChange(updated))
        }
    )

    fastify.delete<{ Params: RecentChangeParams }>(
        "/admin/recent-changes/:id/image",
        {
            preHandler: [authenticateUser, requireSuperadmin],
            schema: { params: zodToFastifySchema(recentChangeParamsSchema) }
        },
        async (request, reply) => {
            const { id } = request.params as RecentChangeParams
            const [updated] = await db
                .update(schema.recentChanges)
                .set({
                    imageUrl: null,
                    imageData: null,
                    imageMimeType: null,
                    updatedAt: new Date()
                })
                .where(
                    and(eq(schema.recentChanges.id, id), eq(schema.recentChanges.status, "draft"))
                )
                .returning()

            if (!updated) {
                reply.code(404).send({ error: "Draft not found" })
                return
            }

            reply.send(serializeRecentChange(updated))
        }
    )

    fastify.post<{ Params: RecentChangeParams }>(
        "/admin/recent-changes/:id/publish",
        {
            preHandler: [authenticateUser, requireSuperadmin],
            schema: { params: zodToFastifySchema(recentChangeParamsSchema) }
        },
        async (request: AuthenticatedRequest, reply) => {
            const { id } = request.params as RecentChangeParams
            const now = new Date()
            const [published] = await db
                .update(schema.recentChanges)
                .set({
                    status: "published",
                    publishedAt: now,
                    publishedByUserId: request.actorUser!.id,
                    updatedAt: now
                })
                .where(
                    and(eq(schema.recentChanges.id, id), eq(schema.recentChanges.status, "draft"))
                )
                .returning()

            if (!published) {
                reply.code(404).send({ error: "Draft not found" })
                return
            }

            reply.send(serializeRecentChange(published))
        }
    )

    fastify.post<{ Params: RecentChangeParams }>(
        "/admin/recent-changes/:id/delete",
        {
            preHandler: [authenticateUser, requireSuperadmin],
            schema: { params: zodToFastifySchema(recentChangeParamsSchema) }
        },
        async (request, reply) => {
            const { id } = request.params as RecentChangeParams
            const [deleted] = await db
                .update(schema.recentChanges)
                .set({ status: "deleted", updatedAt: new Date() })
                .where(
                    and(eq(schema.recentChanges.id, id), ne(schema.recentChanges.status, "deleted"))
                )
                .returning()

            if (!deleted) {
                reply.code(404).send({ error: "Update not found or already deleted" })
                return
            }

            reply.send(serializeRecentChange(deleted))
        }
    )

    fastify.delete<{ Params: RecentChangeParams }>(
        "/admin/recent-changes/:id",
        {
            preHandler: [authenticateUser, requireSuperadmin],
            schema: { params: zodToFastifySchema(recentChangeParamsSchema) }
        },
        async (request, reply) => {
            const { id } = request.params as RecentChangeParams
            const [deleted] = await db
                .delete(schema.recentChanges)
                .where(
                    and(eq(schema.recentChanges.id, id), eq(schema.recentChanges.status, "deleted"))
                )
                .returning({ id: schema.recentChanges.id })

            if (!deleted) {
                reply.code(404).send({ error: "Deleted update not found" })
                return
            }

            reply.code(204).send()
        }
    )
}
