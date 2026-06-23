import { FastifyInstance } from "fastify"
import {
    authenticateUser,
    authenticateWebSocketRequest,
    AuthenticatedRequest
} from "../middleware/auth.js"
import { eq, and } from "drizzle-orm"
import { db, schema } from "../db/index.js"
import { handleChatMessage } from "./chatMessageHandlers/handleChatMessage.js"
import { handleDiceRoll } from "./chatMessageHandlers/handleDiceRoll.js"
import { handleJoinSession } from "./chatMessageHandlers/handleJoinSession.js"
import {
    handleLeaveSession,
    removeParticipantFromSession
} from "./chatMessageHandlers/handleLeaveSession.js"
import { handleRemorseCheck } from "./chatMessageHandlers/handleRemorseCheck.js"
import { handleRouseCheck } from "./chatMessageHandlers/handleRouseCheck.js"
import { type Session, clientMessageSchema } from "./sessionChatTypes.js"
import {
    clearSessionHistory,
    resetSessionAnalytics,
    trackSessionClosed
} from "./sessionChatLifecycle.js"
import { trackEvent } from "../utils/tracker.js"
import { websocketConnectionRateLimit } from "../utils/rateLimit.js"
import {
    MAX_JSON_SIZE,
    broadcastToSession,
    parseJsonSafelyWithTracking,
    sendErrorAndTrack,
    validateWebSocketMessageSize
} from "./sessionChatUtils.js"

type RecentChatSession = {
    sessionId: string
    sessionType: "temporary" | "coterie"
    coterieId?: string
}

export const temporarySessions = new Map<string, Session>()
export const coterieSessions = new Map<string, Session>()
const recentChatSessions = new Map<string, RecentChatSession>()

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
        history: [],
        createdAt: now,
        lastActivity: now,
        maxParticipantCount: 0
    }
    coterieSessions.set(coterieId, session)
    trackEvent(
        "chat-session-created",
        {
            session_type: "coterie",
            session_id: coterieId,
            coterie_id: coterieId
        },
        creatorUserId
    )
    return session
}

export function removeCoterieSession(coterieId: string): void {
    const session = coterieSessions.get(coterieId)
    if (session) {
        broadcastToSession(session, {
            type: "session_closed",
            reason: "coterie_deleted",
            message: "Coterie chat closed because the coterie was deleted"
        })
        trackSessionClosed(session, "deleted")
        session.participants.clear()
        session.lastActivity = Date.now()
    }
    coterieSessions.delete(coterieId)
    clearRecentChatSessionsForSessionId(coterieId)
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
                type: "session_closed",
                reason: "removed_from_coterie",
                message: "You were removed from this coterie chat"
            })
        )
    }

    session.participants.delete(userId)
    session.lastActivity = Date.now()
    clearRecentChatSession(userId, session)
    if (session.participants.size === 0) {
        trackSessionClosed(session, "empty", userId)
        clearSessionHistory(session)
        clearRecentChatSessionsForSessionId(session.id)
        resetSessionAnalytics(session)
        return
    }
    broadcastToSession(session, {
        type: "user_left",
        userId
    })
}

export function rememberRecentChatSession(userId: string, session: Session): void {
    const hasOtherParticipants = Array.from(session.participants.keys()).some(
        (participantUserId) => participantUserId !== userId
    )

    if (!hasOtherParticipants) {
        clearRecentChatSession(userId, session)
        return
    }

    recentChatSessions.set(userId, {
        sessionId: session.id,
        sessionType: session.type,
        coterieId: session.coterieId
    })
}

export function clearRecentChatSession(userId: string, session?: Session): void {
    const recentSession = recentChatSessions.get(userId)
    if (!recentSession) {
        return
    }

    if (!session || recentSession.sessionId === session.id) {
        recentChatSessions.delete(userId)
    }
}

export function clearRecentChatSessionsForSessionId(sessionId: string): void {
    for (const [userId, recentSession] of recentChatSessions.entries()) {
        if (recentSession.sessionId === sessionId) {
            recentChatSessions.delete(userId)
        }
    }
}

function getSessionByRecentChat(recentSession: RecentChatSession): Session | null {
    return recentSession.sessionType === "coterie"
        ? coterieSessions.get(recentSession.sessionId) || null
        : temporarySessions.get(recentSession.sessionId) || null
}

async function userCanAccessCoterie(coterieId: string, userId: string): Promise<boolean> {
    const coterie = await db.query.coteries.findFirst({
        where: eq(schema.coteries.id, coterieId)
    })

    if (!coterie) {
        return false
    }

    if (coterie.ownerId === userId) {
        return true
    }

    const membership = await db.query.coteriePlayerMemberships.findFirst({
        where: and(
            eq(schema.coteriePlayerMemberships.coterieId, coterieId),
            eq(schema.coteriePlayerMemberships.userId, userId)
        )
    })

    return !!membership
}

async function getJoinableRecentChatSession(userId: string) {
    const recentSession = recentChatSessions.get(userId)
    if (!recentSession) {
        return null
    }

    const session = getSessionByRecentChat(recentSession)
    const hasOtherParticipants =
        session &&
        Array.from(session.participants.keys()).some(
            (participantUserId) => participantUserId !== userId
        )

    if (!session || !hasOtherParticipants) {
        recentChatSessions.delete(userId)
        return null
    }

    if (
        recentSession.sessionType === "coterie" &&
        recentSession.coterieId &&
        !(await userCanAccessCoterie(recentSession.coterieId, userId))
    ) {
        recentChatSessions.delete(userId)
        return null
    }

    return {
        available: true as const,
        sessionId: recentSession.sessionId,
        sessionType: recentSession.sessionType,
        coterieId: recentSession.coterieId,
        participantCount: session.participants.size
    }
}

const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000
const SESSION_HISTORY_EXPIRY_MS = 24 * 60 * 60 * 1000
const EMPTY_SESSION_GRACE_MS = 60 * 1000

const updateSessionExpiry = () => {
    const now = Date.now()
    for (const [sessionId, session] of temporarySessions.entries()) {
        if (session.emptySince && now - session.emptySince > EMPTY_SESSION_GRACE_MS) {
            trackSessionClosed(session, "empty")
            temporarySessions.delete(sessionId)
            clearRecentChatSessionsForSessionId(sessionId)
            continue
        }
        if (now - session.lastActivity > SESSION_EXPIRY_MS) {
            trackSessionClosed(session, "timeout")
            temporarySessions.delete(sessionId)
            clearRecentChatSessionsForSessionId(sessionId)
        }
    }
    for (const session of coterieSessions.values()) {
        if (session.emptySince && now - session.emptySince > EMPTY_SESSION_GRACE_MS) {
            trackSessionClosed(session, "empty")
            clearSessionHistory(session)
            clearRecentChatSessionsForSessionId(session.id)
            resetSessionAnalytics(session, now)
            session.emptySince = undefined
        }
        if (
            session.history.length > 0 &&
            session.lastMessageAt &&
            now - session.lastMessageAt > SESSION_HISTORY_EXPIRY_MS
        ) {
            clearSessionHistory(session)
        }
    }
}
setInterval(updateSessionExpiry, 60 * 60 * 1000)

export async function sessionChatWebSocket(fastify: FastifyInstance) {
    fastify.get(
        "/chat/recent-session",
        { preHandler: authenticateUser },
        async (request: AuthenticatedRequest) => {
            const recentSession = await getJoinableRecentChatSession(request.user!.id)
            return recentSession ?? { available: false }
        }
    )

    fastify.get(
        "/ws/sessions",
        {
            websocket: true,
            config: {
                rateLimit: websocketConnectionRateLimit
            }
        },
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
                        removeParticipantFromSession(userId, currentSession, { socket })
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
