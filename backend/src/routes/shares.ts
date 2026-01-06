import { FastifyInstance } from "fastify"
import { eq, and } from "drizzle-orm"
import { db, schema } from "../db/index.js"
import { authenticateUser, AuthenticatedRequest } from "../middleware/auth.js"
import { ShareCharacterInput, shareCharacterSchema, ShareParams, shareParamsSchema } from "../schemas/share.js"
import { nanoid } from "nanoid"
import { zodToFastifySchema } from "../utils/schema.js"
import { logger } from "../utils/logger.js"
import { trackEvent } from "../utils/tracker.js"
import z from "zod"

export async function shareRoutes(fastify: FastifyInstance) {
    // Share character with user
    fastify.post<{
        Params: ShareParams
        Body: ShareCharacterInput
    }>(
        "/characters/:characterId/share",
        {
            preHandler: authenticateUser,
            schema: {
                params: zodToFastifySchema(shareParamsSchema),
                body: zodToFastifySchema(shareCharacterSchema),
            },
        },
        async (request: AuthenticatedRequest, reply) => {
            const { characterId } = request.params as ShareParams
            const { sharedWithUserNickname } = request.body as ShareCharacterInput
            try {
                const userId = request.user!.id

                const character = await db.query.characters.findFirst({
                    where: eq(schema.characters.id, characterId),
                })

                if (!character) {
                    logger.warn("Character not found for share", {
                        endpoint: "/characters/:characterId/share",
                        method: "POST",
                        userId,
                        characterId,
                    })
                    reply.code(404).send({ error: "Character not found" })
                    return
                }

                if (character.userId !== userId) {
                    logger.warn("Unauthorized character share attempt", {
                        endpoint: "/characters/:characterId/share",
                        method: "POST",
                        userId,
                        characterId,
                        characterOwnerId: character.userId,
                    })
                    reply.code(403).send({ error: "Forbidden: You can only share your own characters" })
                    return
                }

                // Find user by nickname
                const sharedWithUser = await db.query.users.findFirst({
                    where: eq(schema.users.nickname, sharedWithUserNickname),
                })

                if (!sharedWithUser) {
                    logger.warn("User not found for share", {
                        endpoint: "/characters/:characterId/share",
                        method: "POST",
                        userId,
                        characterId,
                        sharedWithUserNickname,
                    })
                    reply.code(404).send({ error: "User not found" })
                    return
                }

                if (sharedWithUser.id === userId) {
                    logger.warn("Attempt to share character with self", {
                        endpoint: "/characters/:characterId/share",
                        method: "POST",
                        userId,
                        characterId,
                    })
                    reply.code(400).send({ error: "Cannot share character with yourself" })
                    return
                }

                // Check if already shared
                const existingShare = await db.query.characterShares.findFirst({
                    where: and(
                        eq(schema.characterShares.characterId, characterId),
                        eq(schema.characterShares.sharedWithUserId, sharedWithUser.id)
                    ),
                })

                if (existingShare) {
                    logger.warn("Character already shared with user", {
                        endpoint: "/characters/:characterId/share",
                        method: "POST",
                        userId,
                        characterId,
                        sharedWithUserId: sharedWithUser.id,
                    })
                    reply.code(409).send({ error: "Character is already shared with this user" })
                    return
                }

                const shareId = nanoid()

                const [share] = await db
                    .insert(schema.characterShares)
                    .values({
                        id: shareId,
                        characterId,
                        sharedWithUserId: sharedWithUser.id,
                        sharedById: userId,
                    })
                    .returning()

                logger.info("Character shared", {
                    endpoint: "/characters/:characterId/share",
                    method: "POST",
                    userId,
                    characterId,
                    sharedWithUserId: sharedWithUser.id,
                    sharedWithUserNickname,
                })

                await trackEvent(
                    "character_shared",
                    {
                        endpoint: "/characters/:characterId/share",
                        method: "POST",
                        userId,
                        characterId,
                        sharedWithUserId: sharedWithUser.id,
                        sharedWithUserNickname,
                    },
                    userId
                )

                // Return only safe data without user IDs
                reply.code(201).send({
                    id: share.id,
                    characterId: share.characterId,
                    createdAt: share.createdAt,
                    sharedWith: {
                        nickname: sharedWithUser.nickname || null,
                    },
                })
            } catch (error) {
                logger.error("Failed to share character", error, {
                    endpoint: "/characters/:characterId/share",
                    method: "POST",
                    userId: request.user?.id ?? null,
                    characterId,
                })
                reply.code(500).send({
                    error: "Internal server error",
                    message: error instanceof Error ? error.message : "Failed to share character",
                })
            }
        }
    )

    // Unshare character
    fastify.delete<{
        Params: ShareParams & { userId: string }
    }>(
        "/characters/:characterId/share/:userId",
        {
            preHandler: authenticateUser,
            schema: {
                params: zodToFastifySchema(shareParamsSchema.extend({ userId: z.string().min(1) })),
            },
        },
        async (request: AuthenticatedRequest, reply) => {
            const userId = request.user!.id
            const { characterId, userId: sharedWithUserId } = request.params as ShareParams & { userId: string }

            const character = await db.query.characters.findFirst({
                where: eq(schema.characters.id, characterId),
            })

            if (!character) {
                reply.code(404).send({ error: "Character not found" })
                return
            }

            // Check if user is the character owner or the person who was shared with
            const isCharacterOwner = character.userId === userId
            const isSharedWithUser = userId === sharedWithUserId

            if (!isCharacterOwner && !isSharedWithUser) {
                reply.code(403).send({ error: "Forbidden: You can only unshare characters you own or that are shared with you" })
                return
            }

            // Verify the share exists
            const share = await db.query.characterShares.findFirst({
                where: and(
                    eq(schema.characterShares.characterId, characterId),
                    eq(schema.characterShares.sharedWithUserId, sharedWithUserId)
                ),
            })

            if (!share) {
                reply.code(404).send({ error: "Share not found" })
                return
            }

            await db
                .delete(schema.characterShares)
                .where(
                    and(eq(schema.characterShares.characterId, characterId), eq(schema.characterShares.sharedWithUserId, sharedWithUserId))
                )

            await trackEvent(
                "character_unshared",
                {
                    endpoint: "/characters/:characterId/share/:userId",
                    method: "DELETE",
                    userId,
                    characterId,
                    sharedWithUserId,
                },
                userId
            )

            reply.code(204).send()
        }
    )

    // Get all shares for a character
    fastify.get<{ Params: ShareParams }>(
        "/characters/:characterId/shares",
        {
            preHandler: authenticateUser,
            schema: {
                params: zodToFastifySchema(shareParamsSchema),
            },
        },
        async (request: AuthenticatedRequest, reply) => {
            const userId = request.user!.id
            const { characterId } = request.params as ShareParams

            const character = await db.query.characters.findFirst({
                where: eq(schema.characters.id, characterId),
            })

            if (!character) {
                reply.code(404).send({ error: "Character not found" })
                return
            }

            if (character.userId !== userId) {
                reply.code(403).send({ error: "Forbidden: You can only view shares for your own characters" })
                return
            }

            const shares = await db.query.characterShares.findMany({
                where: eq(schema.characterShares.characterId, characterId),
                with: {
                    sharedWith: true,
                },
            })

            await trackEvent(
                "character_shares_listed",
                {
                    endpoint: "/characters/:characterId/shares",
                    method: "GET",
                    userId,
                    characterId,
                    shareCount: shares.length,
                },
                userId
            )

            const response = shares.map((share) => ({
                characterId: share.characterId,
                characterName: character.name,
                createdAt: share.createdAt,
                sharedWith: {
                    nickname: share.sharedWith?.nickname || null,
                },
            }))

            reply.send(response)
        }
    )
}
