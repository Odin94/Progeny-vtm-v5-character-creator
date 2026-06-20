import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import { FastifyInstance } from "fastify"
import { eq, and, sql, inArray, desc, asc } from "drizzle-orm"
import { db, schema } from "../db/index.js"
import { authenticateUser, AuthenticatedRequest } from "../middleware/auth.js"
import {
    createCoterieSchema,
    updateCoterieSchema,
    addCharacterToCoterieSchema,
    coterieNoteSchema,
    coterieParamsSchema,
    coterieInviteParamsSchema,
    coteriePlayerParamsSchema,
    coterieNoteVersionParamsSchema,
    acceptCoterieInviteParamsSchema,
    CreateCoterieInput,
    CoterieParams,
    CoterieInviteParams,
    CoteriePlayerParams,
    CoterieNoteVersionParams,
    AcceptCoterieInviteParams,
    UpdateCoterieInput,
    AddCharacterToCoterieInput,
    CoterieNoteInput
} from "../schemas/coterie.js"
import { nanoid } from "nanoid"
import { zodToFastifySchema } from "../utils/schema.js"
import { logger } from "../utils/logger.js"
import { trackEvent } from "../utils/tracker.js"
import {
    ensureCoterieSession,
    removeCoterieSession,
    removeCoterieSessionParticipant
} from "../websocket/sessionChat.js"
import z from "zod"

const INVITE_TTL_MS = 30 * 24 * 60 * 60 * 1000
const NOTE_MAX_BYTES = 200 * 1024
const NOTE_VERSION_LIMIT = 10
const NOTE_VERSION_SPLIT_MS = 60 * 60 * 1000
const NOTE_SUBSTANTIAL_MIN_CHANGED_WORDS = 4
const NOTE_SUBSTANTIAL_MIN_CHANGED_CHARS = 24

const hashInviteToken = (token: string) => createHash("sha256").update(token).digest("hex")

const inviteUnavailableReply = { error: "Invite link is invalid or expired" }

const getUtf8ByteLength = (value: string) => Buffer.byteLength(value, "utf8")

const tokenizeNoteWords = (value: string) =>
    value
        .toLowerCase()
        .match(/[\p{L}\p{N}']+/gu) ?? []

const getMultisetWordDelta = (previous: string, next: string) => {
    const counts = new Map<string, number>()

    for (const word of tokenizeNoteWords(previous)) {
        counts.set(word, (counts.get(word) ?? 0) + 1)
    }

    for (const word of tokenizeNoteWords(next)) {
        counts.set(word, (counts.get(word) ?? 0) - 1)
    }

    let changedWords = 0
    for (const count of counts.values()) {
        changedWords += Math.abs(count)
    }

    return changedWords
}

const isSubstantialNoteEdit = (previous: string, next: string) => {
    const normalizedPrevious = previous.trim().replace(/\s+/g, " ")
    const normalizedNext = next.trim().replace(/\s+/g, " ")

    if (normalizedPrevious === normalizedNext) {
        return false
    }

    const changedWords = getMultisetWordDelta(normalizedPrevious, normalizedNext)
    const changedChars = Math.abs(normalizedNext.length - normalizedPrevious.length)

    return (
        changedWords >= NOTE_SUBSTANTIAL_MIN_CHANGED_WORDS ||
        changedChars >= NOTE_SUBSTANTIAL_MIN_CHANGED_CHARS
    )
}

const serializeNoteVersion = (version: typeof schema.coterieNoteVersions.$inferSelect) => ({
    id: version.id,
    content: version.content,
    createdAt: version.createdAt
})

const getPrivateNoteVersions = (coterieId: string, userId: string) =>
    db.query.coterieNoteVersions.findMany({
        where: and(
            eq(schema.coterieNoteVersions.coterieId, coterieId),
            eq(schema.coterieNoteVersions.userId, userId)
        ),
        orderBy: [desc(schema.coterieNoteVersions.createdAt)]
    })

const prunePrivateNoteVersions = (
    tx: Pick<typeof db, "select" | "delete">,
    coterieId: string,
    userId: string
) => {
    const prunableVersions = tx
        .select({ id: schema.coterieNoteVersions.id })
        .from(schema.coterieNoteVersions)
        .where(
            and(
                eq(schema.coterieNoteVersions.coterieId, coterieId),
                eq(schema.coterieNoteVersions.userId, userId)
            )
        )
        .orderBy(asc(schema.coterieNoteVersions.createdAt))
        .all()

    const versionsToDelete = prunableVersions.slice(
        0,
        Math.max(0, prunableVersions.length - NOTE_VERSION_LIMIT)
    )

    for (const version of versionsToDelete) {
        tx.delete(schema.coterieNoteVersions)
            .where(eq(schema.coterieNoteVersions.id, version.id))
            .run()
    }
}

const withoutOwnerId = <T extends { ownerId: string }>(coterie: T) => {
    const { ownerId: _, ...safeCoterie } = coterie
    return safeCoterie
}

const parseCharacter = (
    character: typeof schema.characters.$inferSelect,
    currentUserId: string
) => {
    const { userId, ...characterWithoutUserId } = character
    return {
        ...characterWithoutUserId,
        data: JSON.parse(character.data),
        ownedByCurrentUser: userId === currentUserId
    }
}

const getPlayerRoster = async (coterie: typeof schema.coteries.$inferSelect) => {
    const memberships = await db.query.coteriePlayerMemberships.findMany({
        where: eq(schema.coteriePlayerMemberships.coterieId, coterie.id),
        with: {
            user: true
        }
    })

    const roster: Array<{
        membershipId: string | null
        nickname: string | null
        isOwner: boolean
        joinedAt: Date
    }> = memberships.map((membership) => ({
        membershipId: membership.id,
        nickname: membership.user?.nickname ?? null,
        isOwner: membership.userId === coterie.ownerId,
        joinedAt: membership.createdAt
    }))

    if (!memberships.some((membership) => membership.userId === coterie.ownerId)) {
        const owner = await db.query.users.findFirst({
            where: eq(schema.users.id, coterie.ownerId)
        })

        roster.unshift({
            membershipId: null,
            nickname: owner?.nickname ?? null,
            isOwner: true,
            joinedAt: coterie.createdAt
        })
    }

    return roster
}

const getCoterieAccess = async (coterieId: string, userId: string) => {
    const coterie = await db.query.coteries.findFirst({
        where: eq(schema.coteries.id, coterieId)
    })

    if (!coterie) {
        return null
    }

    const isOwner = coterie.ownerId === userId
    const playerMembership = isOwner
        ? null
        : await db.query.coteriePlayerMemberships.findFirst({
              where: and(
                  eq(schema.coteriePlayerMemberships.coterieId, coterieId),
                  eq(schema.coteriePlayerMemberships.userId, userId)
              )
          })

    return {
        coterie,
        isOwner,
        hasAccess: isOwner || !!playerMembership
    }
}

const buildCoterieResponse = async (
    coterie: typeof schema.coteries.$inferSelect,
    userId: string,
    isOwner: boolean
) => {
    const characterMembers = await db.query.coterieMembers.findMany({
        where: eq(schema.coterieMembers.coterieId, coterie.id),
        with: {
            character: true
        }
    })
    const characterOwnerIds = Array.from(
        new Set(
            characterMembers
                .map((member) => member.character?.userId)
                .filter((userId): userId is string => !!userId)
        )
    )
    const characterOwners =
        characterOwnerIds.length > 0
            ? await db
                  .select({
                      id: schema.users.id,
                      nickname: schema.users.nickname
                  })
                  .from(schema.users)
                  .where(inArray(schema.users.id, characterOwnerIds))
            : []
    const nicknameByUserId = new Map(
        characterOwners.map((owner) => [owner.id, owner.nickname])
    )

    return {
        ...withoutOwnerId(coterie),
        owned: isOwner,
        canEdit: isOwner,
        canManageInvites: isOwner,
        canManagePlayers: isOwner,
        members: characterMembers
            .filter((member) => member.character)
            .map((member) => ({
                id: member.id,
                characterId: member.characterId,
                createdAt: member.createdAt,
                playerNickname: nicknameByUserId.get(member.character!.userId) ?? null,
                character: parseCharacter(member.character!, userId)
            })),
        players: isOwner ? await getPlayerRoster(coterie) : undefined
    }
}

const requireOwnedCoterie = async (coterieId: string, userId: string) => {
    const coterie = await db.query.coteries.findFirst({
        where: eq(schema.coteries.id, coterieId)
    })

    if (!coterie) {
        return { coterie: null, errorCode: 404 as const, error: "Coterie not found" }
    }

    if (coterie.ownerId !== userId) {
        return {
            coterie,
            errorCode: 403 as const,
            error: "Forbidden: You can only manage your own coteries"
        }
    }

    return { coterie, errorCode: null, error: null }
}

export async function coterieRoutes(fastify: FastifyInstance) {
    // Create coterie
    fastify.post<{ Body: CreateCoterieInput }>(
        "/coteries",
        {
            preHandler: authenticateUser,
            schema: {
                body: zodToFastifySchema(createCoterieSchema)
            }
        },
        async (request: AuthenticatedRequest, reply) => {
            try {
                const userId = request.user!.id
                const { name } = request.body as CreateCoterieInput

                const coterieCount = await db
                    .select({ count: sql<number>`count(*)` })
                    .from(schema.coteries)
                    .where(eq(schema.coteries.ownerId, userId))

                if (coterieCount[0]?.count >= 100) {
                    logger.warn("Coterie limit reached", {
                        endpoint: "/coteries",
                        method: "POST",
                        userId,
                        coterieCount: coterieCount[0]?.count
                    })
                    await trackEvent(
                        "coterie_limit_exceeded",
                        {
                            endpoint: "/coteries",
                            method: "POST",
                            userId,
                            coterieCount: coterieCount[0]?.count,
                            limit: 100
                        },
                        userId,
                        request
                    )
                    reply.code(403).send({
                        error: "Coterie limit reached",
                        message:
                            "You have reached the maximum limit of 100 coteries. Please delete some coteries before creating new ones."
                    })
                    return
                }

                const coterieId = nanoid()
                const membershipId = nanoid()

                const coterie = db.transaction((tx) => {
                    const createdCoterie = tx
                        .insert(schema.coteries)
                        .values({
                            id: coterieId,
                            name,
                            ownerId: userId
                        })
                        .returning()
                        .get()

                    tx.insert(schema.coteriePlayerMemberships)
                        .values({
                            id: membershipId,
                            coterieId,
                            userId
                        })
                        .run()

                    return createdCoterie
                })
                ensureCoterieSession(coterieId, userId)

                logger.info("Coterie created", {
                    endpoint: "/coteries",
                    method: "POST",
                    userId,
                    coterieId,
                    coterieName: name
                })

                await trackEvent(
                    "coterie_created",
                    {
                        endpoint: "/coteries",
                        method: "POST",
                        userId,
                        coterieId,
                        coterieName: name,
                        ownedCoterieCount: (coterieCount[0]?.count ?? 0) + 1
                    },
                    userId,
                    request
                )

                reply.code(201).send(await buildCoterieResponse(coterie, userId, true))
            } catch (error) {
                logger.error("Failed to create coterie", error, {
                    endpoint: "/coteries",
                    method: "POST",
                    userId: request.user?.id ?? null
                })
                reply.code(500).send({
                    error: "Internal server error",
                    message: error instanceof Error ? error.message : "Failed to create coterie"
                })
            }
        }
    )

    // Get all coteries for user
    fastify.get(
        "/coteries",
        {
            preHandler: authenticateUser
        },
        async (request: AuthenticatedRequest, reply) => {
            const userId = request.user!.id

            const ownedCoteries = await db
                .select()
                .from(schema.coteries)
                .where(eq(schema.coteries.ownerId, userId))

            const playerMemberships = await db.query.coteriePlayerMemberships.findMany({
                where: eq(schema.coteriePlayerMemberships.userId, userId),
                with: {
                    coterie: true
                }
            })

            const coteriesById = new Map<
                string,
                { coterie: typeof schema.coteries.$inferSelect; isOwner: boolean }
            >()

            for (const coterie of ownedCoteries) {
                coteriesById.set(coterie.id, { coterie, isOwner: true })
            }

            for (const membership of playerMemberships) {
                if (!membership.coterie || coteriesById.has(membership.coterieId)) {
                    continue
                }
                coteriesById.set(membership.coterieId, {
                    coterie: membership.coterie,
                    isOwner: membership.coterie.ownerId === userId
                })
            }

            const allCoteries = await Promise.all(
                Array.from(coteriesById.values()).map(({ coterie, isOwner }) =>
                    buildCoterieResponse(coterie, userId, isOwner)
                )
            )

            await trackEvent(
                "coteries_listed",
                {
                    endpoint: "/coteries",
                    method: "GET",
                    userId,
                    ownedCount: ownedCoteries.length,
                    joinedCount: playerMemberships.length,
                    totalCount: allCoteries.length
                },
                userId,
                request
            )

            reply.send(allCoteries)
        }
    )

    // Get single coterie
    fastify.get<{ Params: CoterieParams }>(
        "/coteries/:id",
        {
            preHandler: authenticateUser,
            schema: {
                params: zodToFastifySchema(coterieParamsSchema)
            }
        },
        async (request: AuthenticatedRequest, reply) => {
            const userId = request.user!.id
            const { id } = request.params as CoterieParams

            const access = await getCoterieAccess(id, userId)

            if (!access) {
                reply.code(404).send({ error: "Coterie not found" })
                return
            }

            if (!access.hasAccess) {
                reply.code(403).send({ error: "Forbidden: You don't have access to this coterie" })
                return
            }

            await trackEvent(
                "coterie_viewed",
                {
                    endpoint: "/coteries/:id",
                    method: "GET",
                    userId,
                    coterieId: id,
                    isOwner: access.isOwner
                },
                userId,
                request
            )

            reply.send(await buildCoterieResponse(access.coterie, userId, access.isOwner))
        }
    )

    // Get current user's private notes for a coterie
    fastify.get<{ Params: CoterieParams }>(
        "/coteries/:id/notes",
        {
            preHandler: authenticateUser,
            schema: {
                params: zodToFastifySchema(coterieParamsSchema)
            }
        },
        async (request: AuthenticatedRequest, reply) => {
            const userId = request.user!.id
            const { id: coterieId } = request.params as CoterieParams

            const access = await getCoterieAccess(coterieId, userId)

            if (!access) {
                reply.code(404).send({ error: "Coterie not found" })
                return
            }

            if (!access.hasAccess) {
                reply.code(403).send({ error: "Forbidden: You don't have access to this coterie" })
                return
            }

            const versions = await getPrivateNoteVersions(coterieId, userId)

            await trackEvent(
                "coterie_private_notes_loaded",
                {
                    endpoint: "/coteries/:id/notes",
                    method: "GET",
                    userId,
                    coterieId,
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

    // Save current user's private notes for a coterie
    fastify.put<{
        Params: CoterieParams
        Body: CoterieNoteInput
    }>(
        "/coteries/:id/notes",
        {
            preHandler: authenticateUser,
            schema: {
                params: zodToFastifySchema(coterieParamsSchema),
                body: zodToFastifySchema(coterieNoteSchema)
            }
        },
        async (request: AuthenticatedRequest, reply) => {
            const userId = request.user!.id
            const { id: coterieId } = request.params as CoterieParams
            const { content } = request.body as CoterieNoteInput
            const contentBytes = getUtf8ByteLength(content)

            if (contentBytes > NOTE_MAX_BYTES) {
                await trackEvent(
                    "coterie_private_notes_save_rejected",
                    {
                        endpoint: "/coteries/:id/notes",
                        method: "PUT",
                        userId,
                        coterieId,
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

            const access = await getCoterieAccess(coterieId, userId)

            if (!access) {
                reply.code(404).send({ error: "Coterie not found" })
                return
            }

            if (!access.hasAccess) {
                reply.code(403).send({ error: "Forbidden: You don't have access to this coterie" })
                return
            }

            const existingVersions = await getPrivateNoteVersions(coterieId, userId)
            const latestVersion = existingVersions[0]

            if (latestVersion?.content === content) {
                reply.send({
                    current: serializeNoteVersion(latestVersion),
                    versions: existingVersions.map(serializeNoteVersion),
                    createdNewVersion: false
                })
                return
            }

            const shouldCreateNewVersion =
                !latestVersion ||
                (Date.now() - latestVersion.createdAt.getTime() > NOTE_VERSION_SPLIT_MS &&
                    isSubstantialNoteEdit(latestVersion.content, content))

            const currentVersion = db.transaction((tx) => {
                if (shouldCreateNewVersion) {
                    const inserted = tx
                        .insert(schema.coterieNoteVersions)
                        .values({
                            id: nanoid(),
                            coterieId,
                            userId,
                            content
                        })
                        .returning()
                        .get()

                    prunePrivateNoteVersions(tx, coterieId, userId)

                    return inserted
                }

                return tx
                    .update(schema.coterieNoteVersions)
                    .set({ content })
                    .where(eq(schema.coterieNoteVersions.id, latestVersion!.id))
                    .returning()
                    .get()
            })

            const versions = await getPrivateNoteVersions(coterieId, userId)

            await trackEvent(
                "coterie_private_notes_saved",
                {
                    endpoint: "/coteries/:id/notes",
                    method: "PUT",
                    userId,
                    coterieId,
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

    // Restore one of the current user's private note versions as a fresh latest version.
    fastify.post<{ Params: CoterieNoteVersionParams }>(
        "/coteries/:id/notes/versions/:versionId/restore",
        {
            preHandler: authenticateUser,
            schema: {
                params: zodToFastifySchema(coterieNoteVersionParamsSchema)
            }
        },
        async (request: AuthenticatedRequest, reply) => {
            const userId = request.user!.id
            const { id: coterieId, versionId } = request.params as CoterieNoteVersionParams

            const access = await getCoterieAccess(coterieId, userId)

            if (!access) {
                reply.code(404).send({ error: "Coterie not found" })
                return
            }

            if (!access.hasAccess) {
                reply.code(403).send({ error: "Forbidden: You don't have access to this coterie" })
                return
            }

            const versionToRestore = await db.query.coterieNoteVersions.findFirst({
                where: and(
                    eq(schema.coterieNoteVersions.id, versionId),
                    eq(schema.coterieNoteVersions.coterieId, coterieId),
                    eq(schema.coterieNoteVersions.userId, userId)
                )
            })

            if (!versionToRestore) {
                reply.code(404).send({ error: "Note version not found" })
                return
            }

            const restoredVersion = db.transaction((tx) => {
                const inserted = tx
                    .insert(schema.coterieNoteVersions)
                    .values({
                        id: nanoid(),
                        coterieId,
                        userId,
                        content: versionToRestore.content
                    })
                    .returning()
                    .get()

                prunePrivateNoteVersions(tx, coterieId, userId)

                return inserted
            })

            const versions = await getPrivateNoteVersions(coterieId, userId)

            await trackEvent(
                "coterie_private_notes_version_restored",
                {
                    endpoint: "/coteries/:id/notes/versions/:versionId/restore",
                    method: "POST",
                    userId,
                    coterieId,
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

    // Update coterie
    fastify.put<{
        Params: CoterieParams
        Body: UpdateCoterieInput
    }>(
        "/coteries/:id",
        {
            preHandler: authenticateUser,
            schema: {
                params: zodToFastifySchema(coterieParamsSchema),
                body: zodToFastifySchema(updateCoterieSchema)
            }
        },
        async (request: AuthenticatedRequest, reply) => {
            const { id } = request.params as CoterieParams
            const { name } = request.body as UpdateCoterieInput
            try {
                const userId = request.user!.id

                const ownership = await requireOwnedCoterie(id, userId)
                if (ownership.errorCode) {
                    reply.code(ownership.errorCode).send({ error: ownership.error })
                    return
                }

                const [updated] = await db
                    .update(schema.coteries)
                    .set({
                        ...(name && { name }),
                        updatedAt: new Date()
                    })
                    .where(eq(schema.coteries.id, id))
                    .returning()

                logger.info("Coterie updated", {
                    endpoint: "/coteries/:id",
                    method: "PUT",
                    userId,
                    coterieId: id,
                    updatedFields: name ? ["name"] : []
                })

                await trackEvent(
                    "coterie_updated",
                    {
                        endpoint: "/coteries/:id",
                        method: "PUT",
                        userId,
                        coterieId: id,
                        updatedFields: name ? ["name"] : []
                    },
                    userId,
                    request
                )

                reply.send(await buildCoterieResponse(updated, userId, true))
            } catch (error) {
                logger.error("Failed to update coterie", error, {
                    endpoint: "/coteries/:id",
                    method: "PUT",
                    userId: request.user?.id ?? null,
                    coterieId: id
                })
                reply.code(500).send({
                    error: "Internal server error",
                    message: error instanceof Error ? error.message : "Failed to update coterie"
                })
            }
        }
    )

    // Delete coterie
    fastify.delete<{ Params: CoterieParams }>(
        "/coteries/:id",
        {
            preHandler: authenticateUser,
            schema: {
                params: zodToFastifySchema(coterieParamsSchema)
            }
        },
        async (request: AuthenticatedRequest, reply) => {
            const userId = request.user!.id
            const { id } = request.params as CoterieParams

            const ownership = await requireOwnedCoterie(id, userId)
            if (ownership.errorCode) {
                reply.code(ownership.errorCode).send({ error: ownership.error })
                return
            }

            await db.delete(schema.coteries).where(eq(schema.coteries.id, id))
            removeCoterieSession(id)

            await trackEvent(
                "coterie_deleted",
                {
                    endpoint: "/coteries/:id",
                    method: "DELETE",
                    userId,
                    coterieId: id
                },
                userId,
                request
            )

            reply.code(204).send()
        }
    )

    // Generate coterie invite
    fastify.post<{ Params: CoterieParams }>(
        "/coteries/:id/invites",
        {
            preHandler: authenticateUser,
            schema: {
                params: zodToFastifySchema(coterieParamsSchema)
            }
        },
        async (request: AuthenticatedRequest, reply) => {
            const userId = request.user!.id
            const { id: coterieId } = request.params as CoterieParams

            const ownership = await requireOwnedCoterie(coterieId, userId)
            if (ownership.errorCode) {
                reply.code(ownership.errorCode).send({ error: ownership.error })
                return
            }

            const token = nanoid(48)
            const tokenHash = hashInviteToken(token)
            const expiresAt = new Date(Date.now() + INVITE_TTL_MS)

            const [invite] = await db
                .insert(schema.coterieInvites)
                .values({
                    id: nanoid(),
                    coterieId,
                    tokenHash,
                    createdById: userId,
                    expiresAt
                })
                .returning()

            await trackEvent(
                "coterie_invite_created",
                {
                    endpoint: "/coteries/:id/invites",
                    method: "POST",
                    userId,
                    coterieId,
                    inviteId: invite.id,
                    inviteTtlHours: Math.round(INVITE_TTL_MS / (60 * 60 * 1000)),
                    expiresAt: invite.expiresAt.toISOString()
                },
                userId,
                request
            )

            reply.code(201).send({
                id: invite.id,
                token,
                createdAt: invite.createdAt,
                expiresAt: invite.expiresAt,
                revokedAt: invite.revokedAt
            })
        }
    )

    // List coterie invites
    fastify.get<{ Params: CoterieParams }>(
        "/coteries/:id/invites",
        {
            preHandler: authenticateUser,
            schema: {
                params: zodToFastifySchema(coterieParamsSchema)
            }
        },
        async (request: AuthenticatedRequest, reply) => {
            const userId = request.user!.id
            const { id: coterieId } = request.params as CoterieParams

            const ownership = await requireOwnedCoterie(coterieId, userId)
            if (ownership.errorCode) {
                reply.code(ownership.errorCode).send({ error: ownership.error })
                return
            }

            const now = new Date()
            const invites = await db.query.coterieInvites.findMany({
                where: eq(schema.coterieInvites.coterieId, coterieId),
                orderBy: (invites, { desc }) => [desc(invites.createdAt), desc(invites.expiresAt)]
            })

            const inviteSummaries = invites.map((invite) => ({
                id: invite.id,
                createdAt: invite.createdAt,
                expiresAt: invite.expiresAt,
                revokedAt: invite.revokedAt,
                active: !invite.revokedAt && invite.expiresAt > now
            }))

            await trackEvent(
                "coterie_invites_listed",
                {
                    endpoint: "/coteries/:id/invites",
                    method: "GET",
                    userId,
                    coterieId,
                    inviteCount: inviteSummaries.length,
                    activeInviteCount: inviteSummaries.filter((invite) => invite.active).length,
                    revokedInviteCount: inviteSummaries.filter((invite) => invite.revokedAt).length,
                    expiredInviteCount: inviteSummaries.filter(
                        (invite) => !invite.revokedAt && invite.expiresAt <= now
                    ).length
                },
                userId,
                request
            )

            reply.send(
                inviteSummaries.map((invite) => ({
                    id: invite.id,
                    createdAt: invite.createdAt,
                    expiresAt: invite.expiresAt,
                    revokedAt: invite.revokedAt,
                    active: !invite.revokedAt && invite.expiresAt > now
                }))
            )
        }
    )

    // Revoke coterie invite
    fastify.delete<{ Params: CoterieInviteParams }>(
        "/coteries/:id/invites/:inviteId",
        {
            preHandler: authenticateUser,
            schema: {
                params: zodToFastifySchema(coterieInviteParamsSchema)
            }
        },
        async (request: AuthenticatedRequest, reply) => {
            const userId = request.user!.id
            const { id: coterieId, inviteId } = request.params as CoterieInviteParams

            const ownership = await requireOwnedCoterie(coterieId, userId)
            if (ownership.errorCode) {
                reply.code(ownership.errorCode).send({ error: ownership.error })
                return
            }

            const invite = await db.query.coterieInvites.findFirst({
                where: and(
                    eq(schema.coterieInvites.id, inviteId),
                    eq(schema.coterieInvites.coterieId, coterieId)
                )
            })

            if (!invite) {
                reply.code(404).send({ error: "Invite not found" })
                return
            }

            await db
                .update(schema.coterieInvites)
                .set({ revokedAt: new Date() })
                .where(eq(schema.coterieInvites.id, inviteId))

            await trackEvent(
                "coterie_invite_revoked",
                {
                    endpoint: "/coteries/:id/invites/:inviteId",
                    method: "DELETE",
                    userId,
                    coterieId,
                    inviteId,
                    alreadyRevoked: !!invite.revokedAt,
                    inviteAgeHours: Math.round((Date.now() - invite.createdAt.getTime()) / 3_600_000)
                },
                userId,
                request
            )

            reply.code(204).send()
        }
    )

    // Accept coterie invite
    fastify.post<{ Params: AcceptCoterieInviteParams }>(
        "/coterie-invites/:token/accept",
        {
            preHandler: authenticateUser,
            schema: {
                params: zodToFastifySchema(acceptCoterieInviteParamsSchema)
            }
        },
        async (request: AuthenticatedRequest, reply) => {
            const userId = request.user!.id
            const { token } = request.params as AcceptCoterieInviteParams
            const tokenHash = hashInviteToken(token)

            const invite = await db.query.coterieInvites.findFirst({
                where: eq(schema.coterieInvites.tokenHash, tokenHash),
                with: {
                    coterie: true
                }
            })

            const trackAcceptFailure = async (
                failureReason: string,
                matchedInvite?: typeof invite
            ) => {
                await trackEvent(
                    "coterie_invite_accept_failed",
                    {
                        endpoint: "/coterie-invites/:token/accept",
                        method: "POST",
                        userId,
                        failureReason,
                        coterieId: matchedInvite?.coterieId,
                        inviteId: matchedInvite?.id,
                        inviteAgeHours: matchedInvite
                            ? Math.round((Date.now() - matchedInvite.createdAt.getTime()) / 3_600_000)
                            : null
                    },
                    userId,
                    request
                )
            }

            if (!invite) {
                await trackAcceptFailure("not_found")
                reply.code(404).send(inviteUnavailableReply)
                return
            }

            if (!invite.coterie) {
                await trackAcceptFailure("coterie_deleted", invite)
                reply.code(404).send(inviteUnavailableReply)
                return
            }

            if (invite.revokedAt) {
                await trackAcceptFailure("revoked", invite)
                reply.code(404).send(inviteUnavailableReply)
                return
            }

            if (invite.expiresAt <= new Date()) {
                await trackAcceptFailure("expired", invite)
                reply.code(404).send(inviteUnavailableReply)
                return
            }

            if (invite.coterie.ownerId === userId) {
                await trackAcceptFailure("already_owner", invite)
                reply.code(409).send({
                    error: "Already coterie owner",
                    message:
                        "You already own this coterie. Sign in with a different account to join as a player."
                })
                return
            }

            const user = await db.query.users.findFirst({
                where: eq(schema.users.id, userId)
            })

            if (!user?.nickname) {
                await trackAcceptFailure("nickname_required", invite)
                reply.code(400).send({
                    error: "Nickname required",
                    message: "Set a nickname before joining a coterie."
                })
                return
            }

            const existingMembership = await db.query.coteriePlayerMemberships.findFirst({
                where: and(
                    eq(schema.coteriePlayerMemberships.coterieId, invite.coterieId),
                    eq(schema.coteriePlayerMemberships.userId, userId)
                )
            })

            if (!existingMembership) {
                await db.insert(schema.coteriePlayerMemberships).values({
                    id: nanoid(),
                    coterieId: invite.coterieId,
                    userId
                })
            }

            await trackEvent(
                "coterie_invite_accepted",
                {
                    endpoint: "/coterie-invites/:token/accept",
                    method: "POST",
                    userId,
                    coterieId: invite.coterieId,
                    inviteId: invite.id,
                    alreadyMember: !!existingMembership,
                    inviteAgeHours: Math.round((Date.now() - invite.createdAt.getTime()) / 3_600_000)
                },
                userId,
                request
            )

            reply.send({
                coterie: await buildCoterieResponse(
                    invite.coterie,
                    userId,
                    invite.coterie.ownerId === userId
                )
            })
        }
    )

    // Remove player from coterie
    fastify.delete<{ Params: CoteriePlayerParams }>(
        "/coteries/:id/players/:membershipId",
        {
            preHandler: authenticateUser,
            schema: {
                params: zodToFastifySchema(coteriePlayerParamsSchema)
            }
        },
        async (request: AuthenticatedRequest, reply) => {
            const userId = request.user!.id
            const { id: coterieId, membershipId } = request.params as CoteriePlayerParams

            const ownership = await requireOwnedCoterie(coterieId, userId)
            if (ownership.errorCode) {
                reply.code(ownership.errorCode).send({ error: ownership.error })
                return
            }

            const membership = await db.query.coteriePlayerMemberships.findFirst({
                where: and(
                    eq(schema.coteriePlayerMemberships.id, membershipId),
                    eq(schema.coteriePlayerMemberships.coterieId, coterieId)
                )
            })

            if (!membership) {
                reply.code(404).send({ error: "Player not found" })
                return
            }

            if (membership.userId === ownership.coterie!.ownerId) {
                reply.code(400).send({ error: "Cannot remove the coterie owner" })
                return
            }

            const playerCharacters = await db
                .select({ id: schema.characters.id })
                .from(schema.characters)
                .where(eq(schema.characters.userId, membership.userId))

            db.transaction((tx) => {
                if (playerCharacters.length > 0) {
                    tx.delete(schema.coterieMembers)
                        .where(
                            and(
                                eq(schema.coterieMembers.coterieId, coterieId),
                                inArray(
                                    schema.coterieMembers.characterId,
                                    playerCharacters.map((character) => character.id)
                                )
                            )
                        )
                        .run()
                }

                tx.delete(schema.coteriePlayerMemberships)
                    .where(eq(schema.coteriePlayerMemberships.id, membershipId))
                    .run()
            })
            removeCoterieSessionParticipant(coterieId, membership.userId)

            await trackEvent(
                "coterie_player_removed",
                {
                    endpoint: "/coteries/:id/players/:membershipId",
                    method: "DELETE",
                    userId,
                    coterieId,
                    membershipId,
                    removedCharacterCount: playerCharacters.length
                },
                userId,
                request
            )

            reply.code(204).send()
        }
    )

    // Add character to coterie
    fastify.post<{
        Params: CoterieParams
        Body: AddCharacterToCoterieInput
    }>(
        "/coteries/:id/characters",
        {
            preHandler: authenticateUser,
            schema: {
                params: zodToFastifySchema(coterieParamsSchema),
                body: zodToFastifySchema(addCharacterToCoterieSchema)
            }
        },
        async (request: AuthenticatedRequest, reply) => {
            const { id: coterieId } = request.params as CoterieParams
            const { characterId } = request.body as AddCharacterToCoterieInput
            try {
                const userId = request.user!.id

                const access = await getCoterieAccess(coterieId, userId)
                if (!access) {
                    reply.code(404).send({ error: "Coterie not found" })
                    return
                }

                if (!access.hasAccess) {
                    reply.code(403).send({
                        error: "Forbidden: You must join this coterie before adding characters"
                    })
                    return
                }

                const character = await db.query.characters.findFirst({
                    where: eq(schema.characters.id, characterId)
                })

                if (!character) {
                    logger.warn("Character not found for add to coterie", {
                        endpoint: "/coteries/:id/characters",
                        method: "POST",
                        userId,
                        coterieId,
                        characterId
                    })
                    reply.code(404).send({ error: "Character not found" })
                    return
                }

                if (character.userId !== userId) {
                    logger.warn("Unauthorized add character to coterie - character not owned", {
                        endpoint: "/coteries/:id/characters",
                        method: "POST",
                        userId,
                        coterieId,
                        characterId
                    })
                    reply.code(403).send({
                        error: "Forbidden: You can only add your own characters to coteries"
                    })
                    return
                }

                const existing = await db.query.coterieMembers.findFirst({
                    where: and(
                        eq(schema.coterieMembers.coterieId, coterieId),
                        eq(schema.coterieMembers.characterId, characterId)
                    )
                })

                if (existing) {
                    logger.warn("Character already in coterie", {
                        endpoint: "/coteries/:id/characters",
                        method: "POST",
                        userId,
                        coterieId,
                        characterId
                    })
                    reply.code(409).send({ error: "Character is already in this coterie" })
                    return
                }

                const memberId = nanoid()

                const [member] = await db
                    .insert(schema.coterieMembers)
                    .values({
                        id: memberId,
                        coterieId,
                        characterId
                    })
                    .returning()

                logger.info("Character added to coterie", {
                    endpoint: "/coteries/:id/characters",
                    method: "POST",
                    userId,
                    coterieId,
                    characterId
                })

                await trackEvent(
                    "character_added_to_coterie",
                    {
                        endpoint: "/coteries/:id/characters",
                        method: "POST",
                        userId,
                        coterieId,
                        characterId
                    },
                    userId,
                    request
                )

                reply.code(201).send(member)
            } catch (error) {
                logger.error("Failed to add character to coterie", error, {
                    endpoint: "/coteries/:id/characters",
                    method: "POST",
                    userId: request.user?.id ?? null,
                    coterieId
                })
                reply.code(500).send({
                    error: "Internal server error",
                    message:
                        error instanceof Error
                            ? error.message
                            : "Failed to add character to coterie"
                })
            }
        }
    )

    // Remove character from coterie
    fastify.delete<{
        Params: CoterieParams & { characterId: string }
    }>(
        "/coteries/:id/characters/:characterId",
        {
            preHandler: authenticateUser,
            schema: {
                params: zodToFastifySchema(
                    coterieParamsSchema.extend({ characterId: z.string().min(1) })
                )
            }
        },
        async (request: AuthenticatedRequest, reply) => {
            const { id: coterieId, characterId } = request.params as CoterieParams & {
                characterId: string
            }
            try {
                const userId = request.user!.id

                const access = await getCoterieAccess(coterieId, userId)
                if (!access) {
                    reply.code(404).send({ error: "Coterie not found" })
                    return
                }

                const member = await db.query.coterieMembers.findFirst({
                    where: and(
                        eq(schema.coterieMembers.coterieId, coterieId),
                        eq(schema.coterieMembers.characterId, characterId)
                    ),
                    with: {
                        character: true
                    }
                })

                if (!member?.character) {
                    reply.code(404).send({ error: "Character is not in this coterie" })
                    return
                }

                const ownsCharacter = member.character.userId === userId

                if (!access.isOwner && !ownsCharacter) {
                    logger.warn("Unauthorized remove character from coterie attempt", {
                        endpoint: "/coteries/:id/characters/:characterId",
                        method: "DELETE",
                        userId,
                        coterieId,
                        characterId
                    })
                    reply.code(403).send({
                        error:
                            "Forbidden: You can only remove your own characters unless you own the coterie"
                    })
                    return
                }

                await db
                    .delete(schema.coterieMembers)
                    .where(
                        and(
                            eq(schema.coterieMembers.coterieId, coterieId),
                            eq(schema.coterieMembers.characterId, characterId)
                        )
                    )

                logger.info("Character removed from coterie", {
                    endpoint: "/coteries/:id/characters/:characterId",
                    method: "DELETE",
                    userId,
                    coterieId,
                    characterId
                })

                await trackEvent(
                    "character_removed_from_coterie",
                    {
                        endpoint: "/coteries/:id/characters/:characterId",
                        method: "DELETE",
                        userId,
                        coterieId,
                        characterId
                    },
                    userId,
                    request
                )

                reply.code(204).send()
            } catch (error) {
                logger.error("Failed to remove character from coterie", error, {
                    endpoint: "/coteries/:id/characters/:characterId",
                    method: "DELETE",
                    userId: request.user?.id ?? null,
                    coterieId,
                    characterId
                })
                reply.code(500).send({
                    error: "Internal server error",
                    message:
                        error instanceof Error
                            ? error.message
                            : "Failed to remove character from coterie"
                })
            }
        }
    )
}
