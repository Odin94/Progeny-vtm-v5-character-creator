import type { FastifyInstance } from "fastify"
import { and, asc, desc, eq } from "drizzle-orm"
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
import { NOTE_MAX_BYTES, getUtf8ByteLength } from "../utils/privateNotes.js"
import { zodToFastifySchema } from "../utils/schema.js"
import { trackEvent } from "../utils/tracker.js"
import {
    loadVersionedNotes,
    restoreVersionedNotes,
    saveVersionedNotes,
    type VersionedNotesStore
} from "../modules/versionedPrivateNotes.js"

type CharacterNoteScope = { characterId: string }
type CharacterNoteVersion = typeof schema.characterNoteVersions.$inferSelect

const characterNotesStore: VersionedNotesStore<CharacterNoteScope, CharacterNoteVersion> = {
    list: ({ characterId }, userId) =>
        db.query.characterNoteVersions.findMany({
            where: and(
                eq(schema.characterNoteVersions.characterId, characterId),
                eq(schema.characterNoteVersions.userId, userId)
            ),
            orderBy: [desc(schema.characterNoteVersions.createdAt)]
        }),
    find: async ({ characterId }, userId, versionId) =>
        (await db.query.characterNoteVersions.findFirst({
            where: and(
                eq(schema.characterNoteVersions.id, versionId),
                eq(schema.characterNoteVersions.characterId, characterId),
                eq(schema.characterNoteVersions.userId, userId)
            )
        })) ?? null,
    transaction: (work) =>
        db.transaction((tx) =>
            work({
                create: ({ id, characterId, userId, content, createdAt }) =>
                    tx.insert(schema.characterNoteVersions)
                        .values({ id, characterId, userId, content, createdAt })
                        .returning()
                        .get(),
                update: (id, content) =>
                    tx.update(schema.characterNoteVersions)
                        .set({ content })
                        .where(eq(schema.characterNoteVersions.id, id))
                        .returning()
                        .get(),
                remove: (id) => {
                    tx.delete(schema.characterNoteVersions)
                        .where(eq(schema.characterNoteVersions.id, id))
                        .run()
                },
                listOldest: ({ characterId }, userId) =>
                    tx.select({ id: schema.characterNoteVersions.id })
                        .from(schema.characterNoteVersions)
                        .where(
                            and(
                                eq(schema.characterNoteVersions.characterId, characterId),
                                eq(schema.characterNoteVersions.userId, userId)
                            )
                        )
                        .orderBy(asc(schema.characterNoteVersions.createdAt))
                        .all()
            })
        )
}

const serializeNoteVersion = (version: CharacterNoteVersion) => ({
    id: version.id,
    content: version.content,
    createdAt: version.createdAt
})

const getAccessibleCharacter = async (characterId: string, userId: string) => {
    const access = await getCharacterAccess(characterId, userId)
    if (!access) return { status: 404 as const, error: "Character not found" }
    if (!access.hasAccess) {
        return { status: 403 as const, error: "Forbidden: You don't have access to this character" }
    }
    return { status: null, error: null }
}

export async function characterNoteRoutes(fastify: FastifyInstance) {
    fastify.get<{ Params: CharacterParams }>("/characters/:id/notes", {
        preHandler: authenticateUser,
        schema: { params: zodToFastifySchema(characterParamsSchema) }
    }, async (request: AuthenticatedRequest, reply) => {
        const userId = request.user!.id
        const scope = { characterId: (request.params as CharacterParams).id }
        const access = await getAccessibleCharacter(scope.characterId, userId)
        if (access.status) return reply.code(access.status).send({ error: access.error })
        const versions = await loadVersionedNotes(characterNotesStore, scope, userId)
        await trackEvent("character_private_notes_loaded", { endpoint: "/characters/:id/notes", method: "GET", userId, characterId: scope.characterId, versionCount: versions.length, hasNotes: versions.length > 0 }, userId, request)
        reply.send({ current: versions[0] ? serializeNoteVersion(versions[0]) : null, versions: versions.map(serializeNoteVersion) })
    })

    fastify.put<{ Params: CharacterParams; Body: CharacterNoteInput }>("/characters/:id/notes", {
        preHandler: authenticateUser,
        schema: { params: zodToFastifySchema(characterParamsSchema), body: zodToFastifySchema(characterNoteSchema) }
    }, async (request: AuthenticatedRequest, reply) => {
        const userId = request.user!.id
        const scope = { characterId: (request.params as CharacterParams).id }
        const { content } = request.body as CharacterNoteInput
        const contentBytes = getUtf8ByteLength(content)
        const access = await getAccessibleCharacter(scope.characterId, userId)
        if (access.status) return reply.code(access.status).send({ error: access.error })
        if (contentBytes > NOTE_MAX_BYTES) {
            await trackEvent("character_private_notes_save_rejected", { endpoint: "/characters/:id/notes", method: "PUT", userId, characterId: scope.characterId, reason: "content_too_large", contentBytes, limitBytes: NOTE_MAX_BYTES }, userId, request)
            return reply.code(413).send({ error: "Notes too large", message: "Private notes must be 200 KB or less." })
        }
        const result = await saveVersionedNotes(characterNotesStore, scope, userId, content)
        await trackEvent("character_private_notes_saved", { endpoint: "/characters/:id/notes", method: "PUT", userId, characterId: scope.characterId, contentBytes, createdNewVersion: result.createdNewVersion, versionCount: result.versions.length }, userId, request)
        reply.send({ current: result.current ? serializeNoteVersion(result.current) : null, versions: result.versions.map(serializeNoteVersion), createdNewVersion: result.createdNewVersion })
    })

    fastify.post<{ Params: CharacterNoteVersionParams }>("/characters/:id/notes/versions/:versionId/restore", {
        preHandler: authenticateUser,
        schema: { params: zodToFastifySchema(characterNoteVersionParamsSchema) }
    }, async (request: AuthenticatedRequest, reply) => {
        const userId = request.user!.id
        const { id: characterId, versionId } = request.params as CharacterNoteVersionParams
        const access = await getAccessibleCharacter(characterId, userId)
        if (access.status) return reply.code(access.status).send({ error: access.error })
        const result = await restoreVersionedNotes(characterNotesStore, { characterId }, userId, versionId)
        if (!result) return reply.code(404).send({ error: "Note version not found" })
        await trackEvent("character_private_notes_version_restored", { endpoint: "/characters/:id/notes/versions/:versionId/restore", method: "POST", userId, characterId, restoredVersionId: versionId, newVersionId: result.current.id, versionCount: result.versions.length }, userId, request)
        reply.send({ current: serializeNoteVersion(result.current), versions: result.versions.map(serializeNoteVersion), createdNewVersion: result.createdNewVersion })
    })
}
