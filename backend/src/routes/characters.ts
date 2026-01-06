import { FastifyInstance } from "fastify"
import { eq, and, sql } from "drizzle-orm"
import { db, schema } from "../db/index.js"
import { authenticateUser, AuthenticatedRequest } from "../middleware/auth.js"
import {
    createCharacterSchema,
    updateCharacterSchema,
    characterParamsSchema,
    CreateCharacterInput,
    CharacterParams,
    UpdateCharacterInput,
} from "../schemas/character.js"
import { nanoid } from "nanoid"
import { zodToFastifySchema } from "../utils/schema.js"
import { logger } from "../utils/logger.js"
import { trackEvent } from "../utils/tracker.js"

export async function characterRoutes(fastify: FastifyInstance) {
    // Create character
    fastify.post<{ Body: CreateCharacterInput }>(
        "/characters",
        {
            preHandler: authenticateUser,
            schema: {
                body: zodToFastifySchema(createCharacterSchema),
            },
        },
        async (request: AuthenticatedRequest, reply) => {
            try {
                const userId = request.user!.id
                const { name, data, version } = request.body as CreateCharacterInput

                // Check character count limit (100 per user)
                const characterCount = await db
                    .select({ count: sql<number>`count(*)` })
                    .from(schema.characters)
                    .where(eq(schema.characters.userId, userId))

                if (characterCount[0]?.count >= 100) {
                    logger.warn("Character limit reached", {
                        endpoint: "/characters",
                        method: "POST",
                        userId,
                        characterCount: characterCount[0]?.count,
                    })
                    await trackEvent(
                        "character_limit_exceeded",
                        {
                            endpoint: "/characters",
                            method: "POST",
                            userId,
                            characterCount: characterCount[0]?.count,
                            limit: 100,
                        },
                        userId
                    )
                    reply.code(403).send({
                        error: "Character limit reached",
                        message:
                            "You have reached the maximum limit of 100 characters. Please delete some characters before creating new ones.",
                    })
                    return
                }

                // Ensure characterVersion is set to 0 for new characters
                const characterDataWithVersion = { ...data, characterVersion: 0 }

                // Ensure user exists in database
                const user = await db.query.users.findFirst({
                    where: eq(schema.users.id, userId),
                })

                if (!user) {
                    // Create user if doesn't exist
                    await db.insert(schema.users).values({
                        id: userId,
                        email: request.user!.email,
                        firstName: request.user!.firstName,
                        lastName: request.user!.lastName,
                    })
                }

                const characterId = nanoid()

                const [character] = await db
                    .insert(schema.characters)
                    .values({
                        id: characterId,
                        userId,
                        name,
                        data: JSON.stringify(characterDataWithVersion),
                        version,
                        characterVersion: 0,
                    })
                    .returning()

                logger.info("Character created", {
                    endpoint: "/characters",
                    method: "POST",
                    userId,
                    characterId,
                    characterName: name,
                })

                await trackEvent(
                    "character_created",
                    {
                        endpoint: "/characters",
                        method: "POST",
                        userId,
                        characterId,
                        characterName: name,
                    },
                    userId
                )

                reply.code(201).send({
                    ...character,
                    data: JSON.parse(character.data),
                })
            } catch (error) {
                logger.error("Failed to create character", error, {
                    endpoint: "/characters",
                    method: "POST",
                    userId: request.user?.id ?? null,
                })
                reply.code(500).send({
                    error: "Internal server error",
                    message: error instanceof Error ? error.message : "Failed to create character",
                })
            }
        }
    )

    // Get all characters for user (owned + shared)
    fastify.get(
        "/characters",
        {
            preHandler: authenticateUser,
        },
        async (request: AuthenticatedRequest, reply) => {
            const userId = request.user!.id

            // Get owned characters
            const ownedCharacters = await db.query.characters.findMany({
                where: eq(schema.characters.userId, userId),
            })

            // Get shared characters
            const sharedShares = await db.query.characterShares.findMany({
                where: eq(schema.characterShares.sharedWithUserId, userId),
                with: {
                    character: true,
                },
            })

            const sharedCharacters = sharedShares.map((share) => ({
                ...share.character,
                shared: true,
                sharedBy: share.sharedById,
            }))

            const allCharacters = [...ownedCharacters.map((c) => ({ ...c, shared: false })), ...sharedCharacters].map((c) => ({
                ...c,
                data: JSON.parse(c.data),
            }))

            await trackEvent(
                "characters_listed",
                {
                    endpoint: "/characters",
                    method: "GET",
                    userId,
                    ownedCount: ownedCharacters.length,
                    sharedCount: sharedCharacters.length,
                    totalCount: allCharacters.length,
                },
                userId
            )

            reply.send(allCharacters)
        }
    )

    // Get single character
    fastify.get<{ Params: CharacterParams }>(
        "/characters/:id",
        {
            preHandler: authenticateUser,
            schema: {
                params: zodToFastifySchema(characterParamsSchema),
            },
        },
        async (request: AuthenticatedRequest, reply) => {
            const userId = request.user!.id
            const { id } = request.params as CharacterParams

            const character = await db.query.characters.findFirst({
                where: eq(schema.characters.id, id),
            })

            if (!character) {
                reply.code(404).send({ error: "Character not found" })
                return
            }

            // Check if user owns or has access to character
            const isOwner = character.userId === userId
            const isShared = await db.query.characterShares.findFirst({
                where: and(eq(schema.characterShares.characterId, id), eq(schema.characterShares.sharedWithUserId, userId)),
            })

            if (!isOwner && !isShared) {
                reply.code(403).send({ error: "Forbidden: You don't have access to this character" })
                return
            }

            await trackEvent(
                "character_viewed",
                {
                    endpoint: "/characters/:id",
                    method: "GET",
                    userId,
                    characterId: id,
                    isOwner,
                    isShared: !!isShared,
                },
                userId
            )

            reply.send({
                ...character,
                data: JSON.parse(character.data),
                canEdit: isOwner,
            })
        }
    )

    // Update character
    fastify.put<{
        Params: CharacterParams
        Body: UpdateCharacterInput
    }>(
        "/characters/:id",
        {
            preHandler: authenticateUser,
            schema: {
                params: zodToFastifySchema(characterParamsSchema),
                body: zodToFastifySchema(updateCharacterSchema),
            },
        },
        async (request: AuthenticatedRequest, reply) => {
            const { id: characterId } = request.params as CharacterParams
            const updateData = request.body as UpdateCharacterInput
            try {
                const userId = request.user!.id

                const character = await db.query.characters.findFirst({
                    where: eq(schema.characters.id, characterId),
                })

                if (!character) {
                    logger.warn("Character not found for update", {
                        endpoint: "/characters/:id",
                        method: "PUT",
                        userId,
                        characterId,
                    })
                    reply.code(404).send({ error: "Character not found" })
                    return
                }

                if (character.userId !== userId) {
                    logger.warn("Unauthorized character update attempt", {
                        endpoint: "/characters/:id",
                        method: "PUT",
                        userId,
                        characterId,
                        characterOwnerId: character.userId,
                    })
                    reply.code(403).send({ error: "Forbidden: You can only edit your own characters" })
                    return
                }

                // Increment characterVersion on update
                const currentCharacter = await db.query.characters.findFirst({
                    where: eq(schema.characters.id, characterId),
                })
                const newCharacterVersion = (currentCharacter?.characterVersion ?? 0) + 1

                // Update character data to include characterVersion
                const characterData = updateData.data ? { ...updateData.data, characterVersion: newCharacterVersion } : undefined

                const [updated] = await db
                    .update(schema.characters)
                    .set({
                        ...(updateData.name && { name: updateData.name }),
                        ...(characterData && { data: JSON.stringify(characterData) }),
                        ...(updateData.version && { version: updateData.version }),
                        characterVersion: newCharacterVersion,
                        updatedAt: new Date(),
                    })
                    .where(eq(schema.characters.id, characterId))
                    .returning()

                logger.info("Character updated", {
                    endpoint: "/characters/:id",
                    method: "PUT",
                    userId,
                    characterId,
                    updatedFields: Object.keys(updateData),
                })

                await trackEvent(
                    "character_updated",
                    {
                        endpoint: "/characters/:id",
                        method: "PUT",
                        userId,
                        characterId,
                        updatedFields: Object.keys(updateData),
                    },
                    userId
                )

                reply.send({
                    ...updated,
                    data: JSON.parse(updated.data),
                })
            } catch (error) {
                logger.error("Failed to update character", error, {
                    endpoint: "/characters/:id",
                    method: "PUT",
                    userId: request.user?.id ?? null,
                    characterId,
                })
                reply.code(500).send({
                    error: "Internal server error",
                    message: error instanceof Error ? error.message : "Failed to update character",
                })
            }
        }
    )

    // Delete character
    fastify.delete<{ Params: CharacterParams }>(
        "/characters/:id",
        {
            preHandler: authenticateUser,
            schema: {
                params: zodToFastifySchema(characterParamsSchema),
            },
        },
        async (request: AuthenticatedRequest, reply) => {
            const { id: characterId } = request.params as CharacterParams
            try {
                const userId = request.user!.id

                const character = await db.query.characters.findFirst({
                    where: eq(schema.characters.id, characterId),
                })

                if (!character) {
                    logger.warn("Character not found for delete", {
                        endpoint: "/characters/:id",
                        method: "DELETE",
                        userId,
                        characterId,
                    })
                    reply.code(404).send({ error: "Character not found" })
                    return
                }

                if (character.userId !== userId) {
                    logger.warn("Unauthorized character delete attempt", {
                        endpoint: "/characters/:id",
                        method: "DELETE",
                        userId,
                        characterId,
                        characterOwnerId: character.userId,
                    })
                    reply.code(403).send({ error: "Forbidden: You can only delete your own characters" })
                    return
                }

                await db.delete(schema.characters).where(eq(schema.characters.id, characterId))

                logger.info("Character deleted", {
                    endpoint: "/characters/:id",
                    method: "DELETE",
                    userId,
                    characterId,
                })

                await trackEvent(
                    "character_deleted",
                    {
                        endpoint: "/characters/:id",
                        method: "DELETE",
                        userId,
                        characterId,
                    },
                    userId
                )

                reply.code(204).send()
            } catch (error) {
                logger.error("Failed to delete character", error, {
                    endpoint: "/characters/:id",
                    method: "DELETE",
                    userId: request.user?.id ?? null,
                    characterId,
                })
                reply.code(500).send({
                    error: "Internal server error",
                    message: error instanceof Error ? error.message : "Failed to delete character",
                })
            }
        }
    )
}
