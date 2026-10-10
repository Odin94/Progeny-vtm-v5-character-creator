import { FastifyInstance } from "fastify"
import { eq, and } from "drizzle-orm"
import { z } from "zod"
import { db, schema } from "../db/index.js"
import { authenticateWebSocketRequest, AuthenticatedRequest } from "../middleware/auth.js"
import { websocketConnectionRateLimit } from "../utils/rateLimit.js"
import { updateCharacterSchema } from "../schemas/character.js"
import { getCharacterAccess } from "../utils/characterAccess.js"

const characterIdSchema = z.string().min(1)
const messageSchema = z.discriminatedUnion("type", [
    z.object({ type: z.literal("subscribe"), characterId: characterIdSchema }),
    z.object({ type: z.literal("unsubscribe"), characterId: characterIdSchema }),
    updateCharacterSchema.extend({
        type: z.literal("character_update"),
        characterId: characterIdSchema
    })
])
type Socket = { readyState: number; send: (message: string) => void }
const characterSubscriptions = new Map<string, Set<Socket>>()
const socketUsers = new WeakMap<Socket, string>()

export async function characterSyncWebSocket(fastify: FastifyInstance) {
    fastify.get(
        "/ws/characters",
        {
            websocket: true,
            config: { rateLimit: websocketConnectionRateLimit }
        },
        (socket, request: AuthenticatedRequest) => {
            const subscribedCharacters = new Set<string>()
            const send = (message: unknown) => {
                if (socket.readyState === 1) socket.send(JSON.stringify(message))
            }
            // Attach listeners synchronously: frames can arrive while cookie auth is pending.
            const authenticated = authenticateWebSocketRequest(request).catch(() => null)
            void authenticated.then((user) => {
                if (!user) socket.close(1008, "Unauthorized")
                else socketUsers.set(socket, user.id)
            })
            socket.on("message", async (message: Buffer) => {
                try {
                    const user = await authenticated
                    if (!user || socket.readyState !== 1) return
                    const data = messageSchema.parse(JSON.parse(message.toString()))
                    const { characterId } = data
                    if (data.type === "unsubscribe") {
                        const subscribers = characterSubscriptions.get(characterId)
                        subscribers?.delete(socket)
                        if (subscribers?.size === 0) characterSubscriptions.delete(characterId)
                        subscribedCharacters.delete(characterId)
                        send({ type: "unsubscribed", characterId })
                        return
                    }
                    const access = await getCharacterAccess(characterId, user.id)
                    if (socket.readyState !== 1) return
                    if (!access) {
                        send({ error: "Character not found", characterId })
                        return
                    }
                    if (
                        !access.hasAccess ||
                        (data.type === "character_update" && !access.isOwner)
                    ) {
                        send({ error: "Forbidden: Can only update own characters", characterId })
                        return
                    }
                    if (data.type === "subscribe") {
                        if (!characterSubscriptions.has(characterId))
                            characterSubscriptions.set(characterId, new Set())
                        characterSubscriptions.get(characterId)!.add(socket)
                        subscribedCharacters.add(characterId)
                        send({ type: "subscribed", characterId })
                        return
                    }
                    const characterVersion = data.characterVersion + 1
                    const characterData = {
                        ...(data.data ?? JSON.parse(access.character.data)),
                        characterVersion
                    }
                    const [updated] = await db
                        .update(schema.characters)
                        .set({
                            name: data.name ?? access.character.name,
                            data: JSON.stringify(characterData),
                            version: data.version ?? access.character.version,
                            characterVersion,
                            updatedAt: new Date()
                        })
                        .where(
                            and(
                                eq(schema.characters.id, characterId),
                                eq(schema.characters.userId, user.id),
                                eq(schema.characters.characterVersion, data.characterVersion)
                            )
                        )
                        .returning()
                    if (!updated) {
                        send({ error: "Character version conflict", status: 409, characterId })
                        return
                    }
                    const updateMessage = JSON.stringify({
                        type: "character_updated",
                        characterId,
                        data: characterData,
                        version: updated.version,
                        characterVersion
                    })
                    for (const subscriber of characterSubscriptions.get(characterId) ?? []) {
                        // Sharing may have been revoked since subscription. Check access again.
                        if (subscriber === socket || subscriber.readyState !== 1) continue
                        const subscriberUser = socketUsers.get(subscriber)
                        const subscriberAccess = subscriberUser
                            ? await getCharacterAccess(characterId, subscriberUser)
                            : null
                        if (subscriberAccess?.hasAccess && subscriber.readyState === 1)
                            subscriber.send(updateMessage)
                        else characterSubscriptions.get(characterId)?.delete(subscriber)
                    }
                    send({ type: "update_confirmed", characterId, characterVersion })
                } catch {
                    send({ error: "Invalid message format", status: 400 })
                }
            })
            socket.on("close", () => {
                for (const id of subscribedCharacters) {
                    const subscribers = characterSubscriptions.get(id)
                    subscribers?.delete(socket)
                    if (subscribers?.size === 0) characterSubscriptions.delete(id)
                }
            })
        }
    )
}
