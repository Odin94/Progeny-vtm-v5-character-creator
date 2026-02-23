import { eq } from "drizzle-orm"
import { FastifyInstance } from "fastify"
import { env } from "../config/env.js"
import { workos } from "../config/workos.js"
import { db, schema } from "../db/index.js"
import { AuthenticatedRequest } from "../middleware/auth.js"
import { handleChatMessage } from "./chatMessageHandlers/handleChatMessage.js"
import { handleDiceRoll } from "./chatMessageHandlers/handleDiceRoll.js"
import { handleJoinSession } from "./chatMessageHandlers/handleJoinSession.js"
import { handleLeaveSession } from "./chatMessageHandlers/handleLeaveSession.js"
import { handleRemorseCheck } from "./chatMessageHandlers/handleRemorseCheck.js"
import { handleRouseCheck } from "./chatMessageHandlers/handleRouseCheck.js"
import {
  type Session,
  type UserLeftMessage,
  clientMessageSchema,
} from "./sessionChatTypes.js"
import {
  MAX_JSON_SIZE,
  broadcastToSession,
  parseJsonSafelyWithTracking,
  sendErrorAndTrack,
  validateWebSocketMessageSize,
} from "./sessionChatUtils.js"

export const temporarySessions = new Map<string, Session>()
export const coterieSessions = new Map<string, Session>()

const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000

const updateSessionExpiry = () => {
  const now = Date.now()
  for (const [sessionId, session] of temporarySessions.entries()) {
    if (now - session.lastActivity > SESSION_EXPIRY_MS) {
      temporarySessions.delete(sessionId)
    }
  }
}
setInterval(updateSessionExpiry, 60 * 60 * 1000)

export async function sessionChatWebSocket(fastify: FastifyInstance) {
  fastify.get(
    "/ws/sessions",
    { websocket: true },
    async (socket, request: AuthenticatedRequest) => {
      if (!socket) {
        fastify.log.error("WebSocket socket is undefined")
        return
      }

      const user = await authenticateWebSocketUser(request)

      if (!user) {
        socket.close(1008, "Unauthorized")
        return
      }

      const userId = user.id
      const userName = getUserName(user)
      let currentSession: Session | null = null

      try {
        socket.on("message", async (message: Buffer) => {
        try {
          if (!validateWebSocketMessageSize(message, socket, fastify, userId)) {
            return
          }

          const parseResult = parseJsonSafelyWithTracking(message, MAX_JSON_SIZE, socket, fastify, userId)
          if (!parseResult.success) {
            return
          }

          const validation = clientMessageSchema.safeParse(parseResult.data)
          if (!validation.success) {
            sendErrorAndTrack(
              socket,
              fastify,
              userId,
              validation.error.issues[0]?.message || "Invalid message format",
              "invalid_message_structure"
            )
            return
          }

          const data = validation.data

          switch (data.type) {
            case "join_session":
              currentSession = await handleJoinSession(data, socket, fastify, userId, userName, currentSession)
              break

            case "leave_session":
              currentSession = handleLeaveSession(userId, currentSession)
              break

            case "chat_message":
              currentSession = await handleChatMessage(data, socket, fastify, userId, currentSession)
              break

            case "dice_roll":
              currentSession = await handleDiceRoll(data, socket, fastify, userId, currentSession)
              break

            case "rouse_check":
              currentSession = await handleRouseCheck(data, socket, fastify, userId, currentSession)
              break

            case "remorse_check":
              currentSession = await handleRemorseCheck(data, socket, fastify, userId, currentSession)
              break

            default:
              sendErrorAndTrack(
                socket,
                fastify,
                userId,
                "Unknown message type",
                "unknown_message_type",
                { message_type: (data as { type?: string }).type || "unknown" }
              )
          }
        } catch (error) {
          sendErrorAndTrack(
            socket,
            fastify,
            userId,
            "Invalid message format",
            "message_parse_error",
            { error: error instanceof Error ? error.message : String(error) }
          )
        }
      })

        socket.on("close", () => {
          if (currentSession) {
            currentSession.participants.delete(userId)
            currentSession.lastActivity = Date.now()

            if (currentSession.participants.size === 0) {
              if (currentSession.type === "temporary") {
                temporarySessions.delete(currentSession.id)
              } else {
                coterieSessions.delete(currentSession.id)
              }
            } else {
              broadcastToSession(
                currentSession,
                {
                  type: "user_left",
                  userId,
                } as UserLeftMessage
              )
            }
          }
        })
      } catch (error) {
        fastify.log.error({ err: error }, "Error setting up WebSocket handlers")
        if (socket) {
          socket.close(1011, "Internal server error")
        }
      }
    }
  )
}

async function authenticateWebSocketUser(request: AuthenticatedRequest): Promise<{ id: string; firstName?: string; lastName?: string; nickname?: string } | null> {
  const cookiePassword = env.WORKOS_COOKIE_PASSWORD
  const sessionData = request.cookies["wos-session"]

  if (!sessionData) {
    return null
  }

  try {
    const session = workos.userManagement.loadSealedSession({
      sessionData,
      cookiePassword,
    })

    const authResult = await session.authenticate()

    if (!authResult.authenticated || !("user" in authResult)) {
      try {
        const refreshResult = await session.refresh()
        if (
          refreshResult.authenticated &&
          "user" in refreshResult &&
          refreshResult.user
        ) {
          const userId = refreshResult.user.id
          const dbUser = await db.query.users.findFirst({
            where: eq(schema.users.id, userId),
          })
          return {
            id: userId,
            firstName: refreshResult.user.firstName ?? undefined,
            lastName: refreshResult.user.lastName ?? undefined,
            nickname: dbUser?.nickname ?? undefined,
          }
        }
      } catch (_refreshError) {
      }
      return null
    }

    const userId = authResult.user.id
    const dbUser = await db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    })

    return {
      id: userId,
      firstName: authResult.user.firstName ?? undefined,
      lastName: authResult.user.lastName ?? undefined,
      nickname: dbUser?.nickname ?? undefined,
    }
  } catch (_error) {
    return null
  }
}

function getUserName(user: { firstName?: string; lastName?: string; nickname?: string }): string {
  if (user.nickname) {
    return user.nickname
  }
  if (user.firstName || user.lastName) {
    return [user.firstName, user.lastName].filter(Boolean).join(" ")
  }
  return "anonymous"
}



