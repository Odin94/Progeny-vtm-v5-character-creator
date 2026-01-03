import { FastifyInstance } from "fastify"
import { eq, and } from "drizzle-orm"
import { db, schema } from "../db/index.js"
import { authenticateUser, AuthenticatedRequest } from "../middleware/auth.js"

interface CharacterUpdateMessage {
  type: "character_update"
  characterId: string
  data: unknown
  version: number
  userId: string
}

interface CharacterSubscribeMessage {
  type: "subscribe"
  characterId: string
}

interface CharacterUnsubscribeMessage {
  type: "unsubscribe"
  characterId: string
}

type WebSocketMessage = CharacterUpdateMessage | CharacterSubscribeMessage | CharacterUnsubscribeMessage

// Map of characterId -> Set of WebSocket connections
const characterSubscriptions = new Map<string, Set<any>>()

export async function characterSyncWebSocket(fastify: FastifyInstance) {
  fastify.get(
    "/ws/characters",
    { websocket: true },
    async (connection, request: AuthenticatedRequest) => {
      // Authenticate WebSocket connection
      const authHeader = request.headers.authorization
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        connection.socket.close(1008, "Unauthorized")
        return
      }

      const token = authHeader.substring(7)
      let userId: string

      try {
        const { workos } = await import("../config/workos.js")
        // Decode JWT token to get user ID
        const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString())
        const userIdFromToken = payload.sub || payload.user_id

        if (!userIdFromToken) {
          connection.socket.close(1008, "Unauthorized: Invalid token format")
          return
        }

        const user = await workos.userManagement.getUser(userIdFromToken)
        userId = user.id
      } catch (_error) {
        connection.socket.close(1008, "Unauthorized")
        return
      }

      const subscribedCharacters = new Set<string>()

      connection.socket.on("message", async (message: Buffer) => {
        try {
          const data: WebSocketMessage = JSON.parse(message.toString())

          switch (data.type) {
            case "subscribe": {
              const { characterId } = data

              // Verify user has access to character
              const character = await db.query.characters.findFirst({
                where: eq(schema.characters.id, characterId),
              })

              if (!character) {
                connection.socket.send(
                  JSON.stringify({ error: "Character not found", characterId })
                )
                return
              }

              const isOwner = character.userId === userId
              const isShared = await db.query.characterShares.findFirst({
                where: and(
                  eq(schema.characterShares.characterId, characterId),
                  eq(schema.characterShares.sharedWithUserId, userId)
                ),
              })

              if (!isOwner && !isShared) {
                connection.socket.send(
                  JSON.stringify({ error: "Forbidden: No access to character", characterId })
                )
                return
              }

              // Subscribe to character updates
              if (!characterSubscriptions.has(characterId)) {
                characterSubscriptions.set(characterId, new Set())
              }
              characterSubscriptions.get(characterId)!.add(connection.socket)
              subscribedCharacters.add(characterId)

              connection.socket.send(
                JSON.stringify({ type: "subscribed", characterId })
              )
              break
            }

            case "unsubscribe": {
              const { characterId } = data

              const subscribers = characterSubscriptions.get(characterId)
              if (subscribers) {
                subscribers.delete(connection.socket)
                if (subscribers.size === 0) {
                  characterSubscriptions.delete(characterId)
                }
              }
              subscribedCharacters.delete(characterId)

              connection.socket.send(
                JSON.stringify({ type: "unsubscribed", characterId })
              )
              break
            }

            case "character_update": {
              const { characterId, data: characterData, version } = data

              // Verify user owns the character
              const character = await db.query.characters.findFirst({
                where: eq(schema.characters.id, characterId),
              })

              if (!character) {
                connection.socket.send(
                  JSON.stringify({ error: "Character not found", characterId })
                )
                return
              }

              if (character.userId !== userId) {
                connection.socket.send(
                  JSON.stringify({ error: "Forbidden: Can only update own characters", characterId })
                )
                return
              }

              // Update character in database
              await db
                .update(schema.characters)
                .set({
                  data: JSON.stringify(characterData),
                  version,
                  updatedAt: new Date(),
                })
                .where(eq(schema.characters.id, characterId))

              // Broadcast update to all subscribers
              const subscribers = characterSubscriptions.get(characterId)
              if (subscribers) {
                const updateMessage = JSON.stringify({
                  type: "character_updated",
                  characterId,
                  data: characterData,
                  version,
                  updatedBy: userId,
                })

                subscribers.forEach((socket) => {
                  if (socket !== connection.socket && socket.readyState === 1) {
                    socket.send(updateMessage)
                  }
                })
              }

              connection.socket.send(
                JSON.stringify({ type: "update_confirmed", characterId })
              )
              break
            }

            default:
              connection.socket.send(JSON.stringify({ error: "Unknown message type" }))
          }
        } catch (error) {
          connection.socket.send(
            JSON.stringify({ error: "Invalid message format", details: String(error) })
          )
        }
      })

      connection.socket.on("close", () => {
        // Unsubscribe from all characters
        subscribedCharacters.forEach((characterId) => {
          const subscribers = characterSubscriptions.get(characterId)
          if (subscribers) {
            subscribers.delete(connection.socket)
            if (subscribers.size === 0) {
              characterSubscriptions.delete(characterId)
            }
          }
        })
      })
    }
  )
}
