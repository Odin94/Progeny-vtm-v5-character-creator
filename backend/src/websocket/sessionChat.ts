import { FastifyInstance } from "fastify"
import { authenticateWebSocketRequest, AuthenticatedRequest } from "../middleware/auth.js"
import { handleChatMessage } from "./chatMessageHandlers/handleChatMessage.js"
import { handleDiceRoll } from "./chatMessageHandlers/handleDiceRoll.js"
import { handleJoinSession } from "./chatMessageHandlers/handleJoinSession.js"
import { handleLeaveSession } from "./chatMessageHandlers/handleLeaveSession.js"
import { handleRemorseCheck } from "./chatMessageHandlers/handleRemorseCheck.js"
import { handleRouseCheck } from "./chatMessageHandlers/handleRouseCheck.js"
import { type Session, type UserLeftMessage, clientMessageSchema } from "./sessionChatTypes.js"
import { trackSessionClosed } from "./sessionChatLifecycle.js"
import {
    MAX_JSON_SIZE,
    broadcastToSession,
    parseJsonSafelyWithTracking,
    sendErrorAndTrack,
    validateWebSocketMessageSize
} from "./sessionChatUtils.js"

export const temporarySessions = new Map<string, Session>()
export const coterieSessions = new Map<string, Session>()

export function ensureCoterieSession(coterieId: string, creatorUserId: string): Session {
    const existingSession = coterieSessions.get(coterieId)
    if (existingSession) {
        return existingSession
    }

    const now = Date.now()
    const session: Session = {
        id: coterieId,
        type: "coterie",
        coterieId,
        creatorUserId,
        participants: new Map(),
        createdAt: now,
        lastActivity: now,
        maxParticipantCount: 0
    }
    coterieSessions.set(coterieId, session)
    return session
}

export function removeCoterieSession(coterieId: string): void {
    const session = coterieSessions.get(coterieId)
    if (session) {
        broadcastToSession(session, {
            type: "error",
            message: "Coterie chat closed because the coterie was deleted"
        })
        session.participants.clear()
        session.lastActivity = Date.now()
    }
    coterieSessions.delete(coterieId)
}

export function removeCoterieSessionParticipant(coterieId: string, userId: string): void {
    const session = coterieSessions.get(coterieId)
    const participant = session?.participants.get(userId)
    if (!session || !participant) {
        return
    }

    if (participant.socket.readyState === 1) {
        participant.socket.send(
            JSON.stringify({
                type: "error",
                message: "You were removed from this coterie chat"
            })
        )
    }

    session.participants.delete(userId)
    session.lastActivity = Date.now()
    broadcastToSession(session, {
        type: "user_left",
        userId
    })
}

const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000

const updateSessionExpiry = () => {
    const now = Date.now()
    for (const [sessionId, session] of temporarySessions.entries()) {
        if (now - session.lastActivity > SESSION_EXPIRY_MS) {
            trackSessionClosed(session, "timeout")
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

            const user = await authenticateWebSocketRequest(request)

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

                        const parseResult = parseJsonSafelyWithTracking(
                            message,
                            MAX_JSON_SIZE,
                            socket,
                            fastify,
                            userId
                        )
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
                                currentSession = await handleJoinSession(
                                    data,
                                    socket,
                                    fastify,
                                    userId,
                                    userName,
                                    currentSession
                                )
                                break

                            case "leave_session":
                                currentSession = handleLeaveSession(userId, currentSession)
                                break

                            case "chat_message":
                                currentSession = await handleChatMessage(
                                    data,
                                    socket,
                                    fastify,
                                    userId,
                                    currentSession
                                )
                                break

                            case "dice_roll":
                                currentSession = await handleDiceRoll(
                                    data,
                                    socket,
                                    fastify,
                                    userId,
                                    currentSession
                                )
                                break

                            case "rouse_check":
                                currentSession = await handleRouseCheck(
                                    data,
                                    socket,
                                    fastify,
                                    userId,
                                    currentSession
                                )
                                break

                            case "remorse_check":
                                currentSession = await handleRemorseCheck(
                                    data,
                                    socket,
                                    fastify,
                                    userId,
                                    currentSession
                                )
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
                                trackSessionClosed(currentSession, "empty", userId)
                                temporarySessions.delete(currentSession.id)
                            }
                        } else {
                            broadcastToSession(currentSession, {
                                type: "user_left",
                                userId
                            } as UserLeftMessage)
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

function getUserName(user: {
    firstName?: string
    lastName?: string
    nickname?: string | null
}): string {
    if (user.nickname) {
        return user.nickname
    }
    if (user.firstName || user.lastName) {
        return [user.firstName, user.lastName].filter(Boolean).join(" ")
    }
    return "anonymous"
}
