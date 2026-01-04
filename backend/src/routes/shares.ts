import { FastifyInstance } from "fastify"
import { eq, and } from "drizzle-orm"
import { db, schema } from "../db/index.js"
import { authenticateUser, AuthenticatedRequest } from "../middleware/auth.js"
import { ShareCharacterInput, shareCharacterSchema, ShareParams, shareParamsSchema } from "../schemas/share.js"
import { nanoid } from "nanoid"
import { zodToFastifySchema } from "../utils/schema.js"

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
            const userId = request.user!.id
            const { characterId } = request.params as ShareParams
            const { sharedWithUserEmail } = request.body as ShareCharacterInput

            const character = await db.query.characters.findFirst({
                where: eq(schema.characters.id, characterId),
            })

            if (!character) {
                reply.code(404).send({ error: "Character not found" })
                return
            }

            if (character.userId !== userId) {
                reply.code(403).send({ error: "Forbidden: You can only share your own characters" })
                return
            }

            // Find user by email
            const sharedWithUser = await db.query.users.findFirst({
                where: eq(schema.users.email, sharedWithUserEmail),
            })

            if (!sharedWithUser) {
                reply.code(404).send({ error: "User not found" })
                return
            }

            if (sharedWithUser.id === userId) {
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

            reply.code(201).send(share)
        }
    )

    // Unshare character
    fastify.delete<{
        Params: ShareParams & { userId: string }
    }>(
        "/characters/:characterId/share/:userId",
        {
            preHandler: authenticateUser,
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

            if (character.userId !== userId) {
                reply.code(403).send({ error: "Forbidden: You can only unshare your own characters" })
                return
            }

            await db
                .delete(schema.characterShares)
                .where(
                    and(eq(schema.characterShares.characterId, characterId), eq(schema.characterShares.sharedWithUserId, sharedWithUserId))
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

            reply.send(shares)
        }
    )
}
