import type { FastifyInstance } from "fastify"
import { and, asc, desc, eq } from "drizzle-orm"
import { nanoid } from "nanoid"
import { db, schema } from "../db/index.js"
import { authenticateUser, type AuthenticatedRequest } from "../middleware/auth.js"
import {
    characterNoteSchema,
    characterNoteVersionParamsSchema,
    characterParamsSchema,
    type CharacterNoteInput,
    type CharacterNoteVersionParams,
    type CharacterParams
} from "../schemas/character.js"
import { getCharacterAccess } from "../utils/characterAccess.js"
import {
    getNextNoteVersionCreatedAt,
    getPrivateNoteDuplicateVersionIdAfterUpdate,
    getPrivateNoteWriteAction,
    getPrivateNoteVersionIdsToPrune,
    getUtf8ByteLength,
    NOTE_MAX_BYTES
} from "../utils/privateNotes.js"
import { zodToFastifySchema } from "../utils/schema.js"
import { trackEvent } from "../utils/tracker.js"

const serializeNoteVersion = (version: typeof schema.characterNoteVersions.$inferSelect) => ({
    id: version.id,
    content: version.content,
    createdAt: version.createdAt
})

const getPrivateNoteVersions = (characterId: string, userId: string) =>
    db.query.characterNoteVersions.findMany({
        where: and(
            eq(schema.characterNoteVersions.characterId, characterId),
            eq(schema.characterNoteVersions.userId, userId)
        ),
        orderBy: [desc(schema.characterNoteVersions.createdAt)]
    })

const prunePrivateNoteVersions = (
    tx: Pick<typeof db, "select" | "delete">,
    characterId: string,
    userId: string
) => {
    const prunableVersions = tx
        .select({ id: schema.characterNoteVersions.id })
        .from(schema.characterNoteVersions)
        .where(
            and(
                eq(schema.characterNoteVersions.characterId, characterId),
                eq(schema.characterNoteVersions.userId, userId)
            )
        )
        .orderBy(asc(schema.characterNoteVersions.createdAt))
        .all()

    const versionIdsToDelete = getPrivateNoteVersionIdsToPrune(prunableVersions)

    for (const versionId of versionIdsToDelete) {
        tx.delete(schema.characterNoteVersions)
            .where(eq(schema.characterNoteVersions.id, versionId))
            .run()
    }
}

export async function characterNoteRoutes(fastify: FastifyInstance) {
    fastify.get<{ Params: CharacterParams }>(
        "/characters/:id/notes",
        {
            preHandler: authenticateUser,
            schema: {
                params: zodToFastifySchema(characterParamsSchema)
            }
        },
        async (request: AuthenticatedRequest, reply) => {
            const userId = request.user!.id
            const { id: characterId } = request.params as CharacterParams
            const access = await getCharacterAccess(characterId, userId)

            if (!access) {
                reply.code(404).send({ error: "Character not found" })
                return
            }

            if (!access.hasAccess) {
                reply
                    .code(403)
                    .send({ error: "Forbidden: You don't have access to this character" })
                return
            }

            const versions = await getPrivateNoteVersions(characterId, userId)

            await trackEvent(
                "character_private_notes_loaded",
                {
                    endpoint: "/characters/:id/notes",
                    method: "GET",
                    userId,
                    characterId,
                    versionCount: versions.length,
                    hasNotes: versions.length > 0
                },
                userId,
                request
            )

            reply.send({
                current: versions[0] ? serializeNoteVersion(versions[0]) : null,
                versions: versions.map(serializeNoteVersion)
            })
        }
    )

    fastify.put<{
        Params: CharacterParams
        Body: CharacterNoteInput
    }>(
        "/characters/:id/notes",
        {
            preHandler: authenticateUser,
            schema: {
                params: zodToFastifySchema(characterParamsSchema),
                body: zodToFastifySchema(characterNoteSchema)
            }
        },
        async (request: AuthenticatedRequest, reply) => {
            const userId = request.user!.id
            const { id: characterId } = request.params as CharacterParams
            const { content } = request.body as CharacterNoteInput
            const contentBytes = getUtf8ByteLength(content)
            const access = await getCharacterAccess(characterId, userId)

            if (!access) {
                reply.code(404).send({ error: "Character not found" })
                return
            }

            if (!access.hasAccess) {
                reply
                    .code(403)
                    .send({ error: "Forbidden: You don't have access to this character" })
                return
            }

            if (contentBytes > NOTE_MAX_BYTES) {
                await trackEvent(
                    "character_private_notes_save_rejected",
                    {
                        endpoint: "/characters/:id/notes",
                        method: "PUT",
                        userId,
                        characterId,
                        reason: "content_too_large",
                        contentBytes,
                        limitBytes: NOTE_MAX_BYTES
                    },
                    userId,
                    request
                )

                reply.code(413).send({
                    error: "Notes too large",
                    message: "Private notes must be 200 KB or less."
                })
                return
            }

            const existingVersions = await getPrivateNoteVersions(characterId, userId)
            const latestVersion = existingVersions[0]
            const writeAction = getPrivateNoteWriteAction({
                previousContent: latestVersion?.content,
                nextContent: content,
                latestCreatedAt: latestVersion?.createdAt
            })

            if (writeAction === "unchanged") {
                reply.send({
                    current: latestVersion ? serializeNoteVersion(latestVersion) : null,
                    versions: existingVersions.map(serializeNoteVersion),
                    createdNewVersion: false
                })
                return
            }

            const shouldCreateNewVersion = writeAction === "create"
            const duplicateVersionId =
                writeAction === "update"
                    ? getPrivateNoteDuplicateVersionIdAfterUpdate(content, existingVersions[1])
                    : undefined

            const currentVersion = db.transaction((tx) => {
                if (shouldCreateNewVersion) {
                    const inserted = tx
                        .insert(schema.characterNoteVersions)
                        .values({
                            id: nanoid(),
                            characterId,
                            userId,
                            content,
                            createdAt: getNextNoteVersionCreatedAt(latestVersion?.createdAt)
                        })
                        .returning()
                        .get()

                    prunePrivateNoteVersions(tx, characterId, userId)
                    return inserted
                }

                const updated = tx
                    .update(schema.characterNoteVersions)
                    .set({ content })
                    .where(eq(schema.characterNoteVersions.id, latestVersion!.id))
                    .returning()
                    .get()

                if (duplicateVersionId) {
                    tx.delete(schema.characterNoteVersions)
                        .where(eq(schema.characterNoteVersions.id, duplicateVersionId))
                        .run()
                }

                return updated
            })

            const versions = await getPrivateNoteVersions(characterId, userId)

            await trackEvent(
                "character_private_notes_saved",
                {
                    endpoint: "/characters/:id/notes",
                    method: "PUT",
                    userId,
                    characterId,
                    contentBytes,
                    createdNewVersion: shouldCreateNewVersion,
                    versionCount: versions.length
                },
                userId,
                request
            )

            reply.send({
                current: serializeNoteVersion(currentVersion),
                versions: versions.map(serializeNoteVersion),
                createdNewVersion: shouldCreateNewVersion
            })
        }
    )

    fastify.post<{ Params: CharacterNoteVersionParams }>(
        "/characters/:id/notes/versions/:versionId/restore",
        {
            preHandler: authenticateUser,
            schema: {
                params: zodToFastifySchema(characterNoteVersionParamsSchema)
            }
        },
        async (request: AuthenticatedRequest, reply) => {
            const userId = request.user!.id
            const { id: characterId, versionId } = request.params as CharacterNoteVersionParams
            const access = await getCharacterAccess(characterId, userId)

            if (!access) {
                reply.code(404).send({ error: "Character not found" })
                return
            }

            if (!access.hasAccess) {
                reply
                    .code(403)
                    .send({ error: "Forbidden: You don't have access to this character" })
                return
            }

            const versionToRestore = await db.query.characterNoteVersions.findFirst({
                where: and(
                    eq(schema.characterNoteVersions.id, versionId),
                    eq(schema.characterNoteVersions.characterId, characterId),
                    eq(schema.characterNoteVersions.userId, userId)
                )
            })

            if (!versionToRestore) {
                reply.code(404).send({ error: "Note version not found" })
                return
            }

            const existingVersions = await getPrivateNoteVersions(characterId, userId)
            const latestVersion = existingVersions[0]

            if (latestVersion?.content === versionToRestore.content) {
                reply.send({
                    current: serializeNoteVersion(latestVersion),
                    versions: existingVersions.map(serializeNoteVersion),
                    createdNewVersion: false
                })
                return
            }

            const restoredVersion = db.transaction((tx) => {
                const inserted = tx
                    .insert(schema.characterNoteVersions)
                    .values({
                        id: nanoid(),
                        characterId,
                        userId,
                        content: versionToRestore.content,
                        createdAt: getNextNoteVersionCreatedAt(latestVersion?.createdAt)
                    })
                    .returning()
                    .get()

                prunePrivateNoteVersions(tx, characterId, userId)
                return inserted
            })

            const versions = await getPrivateNoteVersions(characterId, userId)

            await trackEvent(
                "character_private_notes_version_restored",
                {
                    endpoint: "/characters/:id/notes/versions/:versionId/restore",
                    method: "POST",
                    userId,
                    characterId,
                    restoredVersionId: versionId,
                    newVersionId: restoredVersion.id,
                    versionCount: versions.length
                },
                userId,
                request
            )

            reply.send({
                current: serializeNoteVersion(restoredVersion),
                versions: versions.map(serializeNoteVersion),
                createdNewVersion: true
            })
        }
    )
}
