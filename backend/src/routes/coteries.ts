import { FastifyInstance } from "fastify"
import { eq, and } from "drizzle-orm"
import { db, schema } from "../db/index.js"
import { authenticateUser, AuthenticatedRequest } from "../middleware/auth.js"
import {
    createCoterieSchema,
    updateCoterieSchema,
    addCharacterToCoterieSchema,
    coterieParamsSchema,
    CreateCoterieInput,
    CoterieParams,
    UpdateCoterieInput,
    AddCharacterToCoterieInput,
} from "../schemas/coterie.js"
import { nanoid } from "nanoid"
import { zodToFastifySchema } from "../utils/schema.js"
import { logger } from "../utils/logger.js"
import { trackEvent } from "../utils/tracker.js"
import z from "zod"

export async function coterieRoutes(fastify: FastifyInstance) {
    // Create coterie
    fastify.post<{ Body: CreateCoterieInput }>(
        "/coteries",
        {
            preHandler: authenticateUser,
            schema: {
                body: zodToFastifySchema(createCoterieSchema),
            },
        },
        async (request: AuthenticatedRequest, reply) => {
            try {
                const userId = request.user!.id
                const { name } = request.body as CreateCoterieInput

                const coterieId = nanoid()

                const [coterie] = await db
                    .insert(schema.coteries)
                    .values({
                        id: coterieId,
                        name,
                        ownerId: userId,
                    })
                    .returning()

                logger.info("Coterie created", {
                    endpoint: "/coteries",
                    method: "POST",
                    userId,
                    coterieId,
                    coterieName: name,
                })

                await trackEvent(
                    "coterie_created",
                    {
                        endpoint: "/coteries",
                        method: "POST",
                        userId,
                        coterieId,
                        coterieName: name,
                    },
                    userId
                )

                reply.code(201).send(coterie)
            } catch (error) {
                logger.error("Failed to create coterie", error, {
                    endpoint: "/coteries",
                    method: "POST",
                    userId: request.user?.id ?? null,
                })
                reply.code(500).send({
                    error: "Internal server error",
                    message: error instanceof Error ? error.message : "Failed to create coterie",
                })
            }
        }
    )

    // Get all coteries for user
    fastify.get(
        "/coteries",
        {
            preHandler: authenticateUser,
        },
        async (request: AuthenticatedRequest, reply) => {
            const userId = request.user!.id

            // Get owned coteries
            const ownedCoteries = await db.select().from(schema.coteries).where(eq(schema.coteries.ownerId, userId))

            // Get members for each coterie
            const coteriesWithMembers = await Promise.all(
                ownedCoteries.map(async (coterie) => {
                    const members = await db.select().from(schema.coterieMembers).where(eq(schema.coterieMembers.coterieId, coterie.id))

                    const characters = await Promise.all(
                        members.map(async (member) => {
                            const character = await db.query.characters.findFirst({
                                where: eq(schema.characters.id, member.characterId),
                            })
                            return character ? { ...member, character } : null
                        })
                    )

                    return {
                        ...coterie,
                        members: characters.filter((c) => c !== null),
                        owned: true,
                    }
                })
            )

            // Get shared characters and their coteries
            const sharedCharacters = await db
                .select()
                .from(schema.characterShares)
                .where(eq(schema.characterShares.sharedWithUserId, userId))

            const sharedCoterieIds = new Set<string>()
            for (const share of sharedCharacters) {
                const members = await db
                    .select()
                    .from(schema.coterieMembers)
                    .where(eq(schema.coterieMembers.characterId, share.characterId))

                members.forEach((m) => sharedCoterieIds.add(m.coterieId))
            }

            const sharedCoteries = await Promise.all(
                Array.from(sharedCoterieIds).map(async (coterieId) => {
                    const coterie = await db.query.coteries.findFirst({
                        where: eq(schema.coteries.id, coterieId),
                    })
                    return coterie ? { ...coterie, owned: false, members: [] } : null
                })
            )

            const allCoteries = [...coteriesWithMembers, ...sharedCoteries.filter((c) => c !== null)]

            await trackEvent(
                "coteries_listed",
                {
                    endpoint: "/coteries",
                    method: "GET",
                    userId,
                    ownedCount: ownedCoteries.length,
                    sharedCount: sharedCoteries.filter((c) => c !== null).length,
                    totalCount: allCoteries.length,
                },
                userId
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
                params: zodToFastifySchema(coterieParamsSchema),
            },
        },
        async (request: AuthenticatedRequest, reply) => {
            const userId = request.user!.id
            const { id } = request.params as CoterieParams

            const coterie = await db.query.coteries.findFirst({
                where: eq(schema.coteries.id, id),
            })

            if (!coterie) {
                reply.code(404).send({ error: "Coterie not found" })
                return
            }

            // Get members
            const members = await db.select().from(schema.coterieMembers).where(eq(schema.coterieMembers.coterieId, id))

            const membersWithCharacters = await Promise.all(
                members.map(async (member) => {
                    const character = await db.query.characters.findFirst({
                        where: eq(schema.characters.id, member.characterId),
                    })
                    return character ? { ...member, character } : null
                })
            )

            // Check if user owns coterie or has shared characters in it
            const isOwner = coterie.ownerId === userId
            const hasSharedAccess = membersWithCharacters.some((m) => {
                if (!m) return false
                // Check if character is shared with user
                return m.character.userId !== userId
            })

            if (!isOwner && !hasSharedAccess) {
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
                    isOwner,
                    hasSharedAccess,
                },
                userId
            )

            reply.send({
                ...coterie,
                members: membersWithCharacters
                    .filter((m) => m !== null)
                    .map((m) => ({
                        ...m!,
                        character: {
                            ...m!.character,
                            data: JSON.parse(m!.character.data),
                        },
                    })),
                canEdit: isOwner,
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
                body: zodToFastifySchema(updateCoterieSchema),
            },
        },
        async (request: AuthenticatedRequest, reply) => {
            const { id } = request.params as CoterieParams
            const { name } = request.body as UpdateCoterieInput
            try {
                const userId = request.user!.id

                const coterie = await db.query.coteries.findFirst({
                    where: eq(schema.coteries.id, id),
                })

                if (!coterie) {
                    logger.warn("Coterie not found for update", {
                        endpoint: "/coteries/:id",
                        method: "PUT",
                        userId,
                        coterieId: id,
                    })
                    reply.code(404).send({ error: "Coterie not found" })
                    return
                }

                if (coterie.ownerId !== userId) {
                    logger.warn("Unauthorized coterie update attempt", {
                        endpoint: "/coteries/:id",
                        method: "PUT",
                        userId,
                        coterieId: id,
                        coterieOwnerId: coterie.ownerId,
                    })
                    reply.code(403).send({ error: "Forbidden: You can only edit your own coteries" })
                    return
                }

                const [updated] = await db
                    .update(schema.coteries)
                    .set({
                        ...(name && { name }),
                        updatedAt: new Date(),
                    })
                    .where(eq(schema.coteries.id, id))
                    .returning()

                logger.info("Coterie updated", {
                    endpoint: "/coteries/:id",
                    method: "PUT",
                    userId,
                    coterieId: id,
                    updatedFields: name ? ["name"] : [],
                })

                await trackEvent(
                    "coterie_updated",
                    {
                        endpoint: "/coteries/:id",
                        method: "PUT",
                        userId,
                        coterieId: id,
                        updatedFields: name ? ["name"] : [],
                    },
                    userId
                )

                reply.send(updated)
            } catch (error) {
                logger.error("Failed to update coterie", error, {
                    endpoint: "/coteries/:id",
                    method: "PUT",
                    userId: request.user?.id ?? null,
                    coterieId: id,
                })
                reply.code(500).send({
                    error: "Internal server error",
                    message: error instanceof Error ? error.message : "Failed to update coterie",
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
                params: zodToFastifySchema(coterieParamsSchema),
            },
        },
        async (request: AuthenticatedRequest, reply) => {
            const userId = request.user!.id
            const { id } = request.params as CoterieParams

            const coterie = await db.query.coteries.findFirst({
                where: eq(schema.coteries.id, id),
            })

            if (!coterie) {
                reply.code(404).send({ error: "Coterie not found" })
                return
            }

            if (coterie.ownerId !== userId) {
                reply.code(403).send({ error: "Forbidden: You can only delete your own coteries" })
                return
            }

            await db.delete(schema.coteries).where(eq(schema.coteries.id, id))

            await trackEvent(
                "coterie_deleted",
                {
                    endpoint: "/coteries/:id",
                    method: "DELETE",
                    userId,
                    coterieId: id,
                },
                userId
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
                body: zodToFastifySchema(addCharacterToCoterieSchema),
            },
        },
        async (request: AuthenticatedRequest, reply) => {
            const { id: coterieId } = request.params as CoterieParams
            const { characterId } = request.body as AddCharacterToCoterieInput
            try {
                const userId = request.user!.id

                const coterie = await db.query.coteries.findFirst({
                    where: eq(schema.coteries.id, coterieId),
                })

                if (!coterie) {
                    logger.warn("Coterie not found for add character", {
                        endpoint: "/coteries/:id/characters",
                        method: "POST",
                        userId,
                        coterieId,
                    })
                    reply.code(404).send({ error: "Coterie not found" })
                    return
                }

                if (coterie.ownerId !== userId) {
                    logger.warn("Unauthorized add character to coterie attempt", {
                        endpoint: "/coteries/:id/characters",
                        method: "POST",
                        userId,
                        coterieId,
                        coterieOwnerId: coterie.ownerId,
                    })
                    reply.code(403).send({ error: "Forbidden: You can only add characters to your own coteries" })
                    return
                }

                const character = await db.query.characters.findFirst({
                    where: eq(schema.characters.id, characterId),
                })

                if (!character) {
                    logger.warn("Character not found for add to coterie", {
                        endpoint: "/coteries/:id/characters",
                        method: "POST",
                        userId,
                        coterieId,
                        characterId,
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
                        characterId,
                        characterOwnerId: character.userId,
                    })
                    reply.code(403).send({
                        error: "Forbidden: You can only add your own characters to coteries",
                    })
                    return
                }

                // Check if already in coterie
                const existing = await db.query.coterieMembers.findFirst({
                    where: and(eq(schema.coterieMembers.coterieId, coterieId), eq(schema.coterieMembers.characterId, characterId)),
                })

                if (existing) {
                    logger.warn("Character already in coterie", {
                        endpoint: "/coteries/:id/characters",
                        method: "POST",
                        userId,
                        coterieId,
                        characterId,
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
                        characterId,
                    })
                    .returning()

                logger.info("Character added to coterie", {
                    endpoint: "/coteries/:id/characters",
                    method: "POST",
                    userId,
                    coterieId,
                    characterId,
                })

                await trackEvent(
                    "character_added_to_coterie",
                    {
                        endpoint: "/coteries/:id/characters",
                        method: "POST",
                        userId,
                        coterieId,
                        characterId,
                    },
                    userId
                )

                reply.code(201).send(member)
            } catch (error) {
                logger.error("Failed to add character to coterie", error, {
                    endpoint: "/coteries/:id/characters",
                    method: "POST",
                    userId: request.user?.id ?? null,
                    coterieId,
                })
                reply.code(500).send({
                    error: "Internal server error",
                    message: error instanceof Error ? error.message : "Failed to add character to coterie",
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
                params: zodToFastifySchema(coterieParamsSchema.extend({ characterId: z.string().min(1) })),
            },
        },
        async (request: AuthenticatedRequest, reply) => {
            const { id: coterieId, characterId } = request.params as CoterieParams & { characterId: string }
            try {
                const userId = request.user!.id

                const coterie = await db.query.coteries.findFirst({
                    where: eq(schema.coteries.id, coterieId),
                })

                if (!coterie) {
                    logger.warn("Coterie not found for remove character", {
                        endpoint: "/coteries/:id/characters/:characterId",
                        method: "DELETE",
                        userId,
                        coterieId,
                    })
                    reply.code(404).send({ error: "Coterie not found" })
                    return
                }

                if (coterie.ownerId !== userId) {
                    logger.warn("Unauthorized remove character from coterie attempt", {
                        endpoint: "/coteries/:id/characters/:characterId",
                        method: "DELETE",
                        userId,
                        coterieId,
                        coterieOwnerId: coterie.ownerId,
                    })
                    reply.code(403).send({
                        error: "Forbidden: You can only remove characters from your own coteries",
                    })
                    return
                }

                await db
                    .delete(schema.coterieMembers)
                    .where(and(eq(schema.coterieMembers.coterieId, coterieId), eq(schema.coterieMembers.characterId, characterId)))

                logger.info("Character removed from coterie", {
                    endpoint: "/coteries/:id/characters/:characterId",
                    method: "DELETE",
                    userId,
                    coterieId,
                    characterId,
                })

                await trackEvent(
                    "character_removed_from_coterie",
                    {
                        endpoint: "/coteries/:id/characters/:characterId",
                        method: "DELETE",
                        userId,
                        coterieId,
                        characterId,
                    },
                    userId
                )

                reply.code(204).send()
            } catch (error) {
                logger.error("Failed to remove character from coterie", error, {
                    endpoint: "/coteries/:id/characters/:characterId",
                    method: "DELETE",
                    userId: request.user?.id ?? null,
                    coterieId,
                    characterId,
                })
                reply.code(500).send({
                    error: "Internal server error",
                    message: error instanceof Error ? error.message : "Failed to remove character from coterie",
                })
            }
        }
    )
}
