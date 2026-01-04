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

            reply.code(201).send(coterie)
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
            const userId = request.user!.id
            const { id } = request.params as CoterieParams
            const { name } = request.body as UpdateCoterieInput

            const coterie = await db.query.coteries.findFirst({
                where: eq(schema.coteries.id, id),
            })

            if (!coterie) {
                reply.code(404).send({ error: "Coterie not found" })
                return
            }

            if (coterie.ownerId !== userId) {
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

            reply.send(updated)
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
            const userId = request.user!.id
            const { id: coterieId } = request.params as CoterieParams
            const { characterId } = request.body as AddCharacterToCoterieInput

            const coterie = await db.query.coteries.findFirst({
                where: eq(schema.coteries.id, coterieId),
            })

            if (!coterie) {
                reply.code(404).send({ error: "Coterie not found" })
                return
            }

            if (coterie.ownerId !== userId) {
                reply.code(403).send({ error: "Forbidden: You can only add characters to your own coteries" })
                return
            }

            const character = await db.query.characters.findFirst({
                where: eq(schema.characters.id, characterId),
            })

            if (!character) {
                reply.code(404).send({ error: "Character not found" })
                return
            }

            if (character.userId !== userId) {
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

            reply.code(201).send(member)
        }
    )

    // Remove character from coterie
    fastify.delete<{
        Params: CoterieParams & { characterId: string }
    }>(
        "/coteries/:id/characters/:characterId",
        {
            preHandler: authenticateUser,
        },
        async (request: AuthenticatedRequest, reply) => {
            const userId = request.user!.id
            const { id: coterieId, characterId } = request.params as CoterieParams & { characterId: string }

            const coterie = await db.query.coteries.findFirst({
                where: eq(schema.coteries.id, coterieId),
            })

            if (!coterie) {
                reply.code(404).send({ error: "Coterie not found" })
                return
            }

            if (coterie.ownerId !== userId) {
                reply.code(403).send({
                    error: "Forbidden: You can only remove characters from your own coteries",
                })
                return
            }

            await db
                .delete(schema.coterieMembers)
                .where(and(eq(schema.coterieMembers.coterieId, coterieId), eq(schema.coterieMembers.characterId, characterId)))

            reply.code(204).send()
        }
    )
}
