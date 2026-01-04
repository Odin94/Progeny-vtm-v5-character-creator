import { FastifyInstance } from "fastify"
import { eq, and } from "drizzle-orm"
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
            const userId = request.user!.id
            const { name, data, version } = request.body as CreateCharacterInput

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
                    data: JSON.stringify(data),
                    version,
                })
                .returning()

            reply.code(201).send({
                ...character,
                data: JSON.parse(character.data),
            })
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
            const userId = request.user!.id
            const { id } = request.params as CharacterParams
            const updateData = request.body as UpdateCharacterInput

            const character = await db.query.characters.findFirst({
                where: eq(schema.characters.id, id),
            })

            if (!character) {
                reply.code(404).send({ error: "Character not found" })
                return
            }

            if (character.userId !== userId) {
                reply.code(403).send({ error: "Forbidden: You can only edit your own characters" })
                return
            }

            const [updated] = await db
                .update(schema.characters)
                .set({
                    ...(updateData.name && { name: updateData.name }),
                    ...(updateData.data && { data: JSON.stringify(updateData.data) }),
                    ...(updateData.version && { version: updateData.version }),
                    updatedAt: new Date(),
                })
                .where(eq(schema.characters.id, id))
                .returning()

            reply.send({
                ...updated,
                data: JSON.parse(updated.data),
            })
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
            const userId = request.user!.id
            const { id } = request.params as CharacterParams

            const character = await db.query.characters.findFirst({
                where: eq(schema.characters.id, id),
            })

            if (!character) {
                reply.code(404).send({ error: "Character not found" })
                return
            }

            if (character.userId !== userId) {
                reply.code(403).send({ error: "Forbidden: You can only delete your own characters" })
                return
            }

            await db.delete(schema.characters).where(eq(schema.characters.id, id))

            reply.code(204).send()
        }
    )
}
