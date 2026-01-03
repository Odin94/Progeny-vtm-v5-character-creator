import { FastifyInstance } from "fastify"
import { eq, and } from "drizzle-orm"
import { db, schema } from "../db/index.js"
import { authenticateUser, AuthenticatedRequest } from "../middleware/auth.js"
import { shareCharacterSchema, shareParamsSchema } from "../schemas/share.js"
import { nanoid } from "nanoid"

export async function shareRoutes(fastify: FastifyInstance) {
  // Share character with user
  fastify.post<{
    Params: typeof shareParamsSchema._type
    Body: typeof shareCharacterSchema._type
  }>(
    "/characters/:characterId/share",
    {
      preHandler: authenticateUser,
      schema: {
        params: shareParamsSchema,
        body: shareCharacterSchema,
      },
    },
    async (request: AuthenticatedRequest, reply) => {
      const userId = request.user!.id
      const { characterId } = request.params
      const { sharedWithUserEmail } = request.body

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
    Params: typeof shareParamsSchema._type & { userId: string }
  }>(
    "/characters/:characterId/share/:userId",
    {
      preHandler: authenticateUser,
    },
    async (request: AuthenticatedRequest, reply) => {
      const userId = request.user!.id
      const { characterId, userId: sharedWithUserId } = request.params as {
        characterId: string
        userId: string
      }

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
          and(
            eq(schema.characterShares.characterId, characterId),
            eq(schema.characterShares.sharedWithUserId, sharedWithUserId)
          )
        )

      reply.code(204).send()
    }
  )

  // Get all shares for a character
  fastify.get<{ Params: typeof shareParamsSchema._type }>(
    "/characters/:characterId/shares",
    {
      preHandler: authenticateUser,
      schema: {
        params: shareParamsSchema,
      },
    },
    async (request: AuthenticatedRequest, reply) => {
      const userId = request.user!.id
      const { characterId } = request.params

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
