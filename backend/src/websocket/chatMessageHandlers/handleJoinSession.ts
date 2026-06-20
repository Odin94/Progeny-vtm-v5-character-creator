import { FastifyInstance } from "fastify"
import { eq, and } from "drizzle-orm"
import { nanoid } from "nanoid"
import { db, schema } from "../../db/index.js"
import { trackEvent } from "../../utils/tracker.js"
import {
    type Session,
    type JoinSessionMessage,
    type Participant,
    type SessionJoinedMessage,
    type UserJoinedMessage
} from "../sessionChatTypes.js"
import {
    clearRecentChatSession,
    temporarySessions,
    ensureCoterieSession
} from "../sessionChat.js"
import { recordSessionJoin } from "../sessionChatLifecycle.js"
import { sendErrorAndTrack, broadcastToSession } from "../sessionChatUtils.js"
import { removeParticipantFromSession } from "./handleLeaveSession.js"

export async function handleJoinSession(
    data: JoinSessionMessage,
    socket: any,
    fastify: FastifyInstance,
    userId: string,
    userName: string,
    currentSession: Session | null
): Promise<Session | null> {
    const { sessionId, coterieId, characterName } = data
    const previousSession = currentSession

    if (coterieId) {
        const coterie = await db.query.coteries.findFirst({
            where: eq(schema.coteries.id, coterieId)
        })

        if (!coterie) {
            sendErrorAndTrack(socket, fastify, userId, "Coterie not found", "coterie_not_found", {
                coterie_id: coterieId
            })
            return currentSession
        }

        const isOwner = coterie.ownerId === userId
        const playerMembership = isOwner
            ? null
            : await db.query.coteriePlayerMemberships.findFirst({
                  where: and(
                      eq(schema.coteriePlayerMemberships.coterieId, coterieId),
                      eq(schema.coteriePlayerMemberships.userId, userId)
                  )
              })
        const hasAccess = isOwner || !!playerMembership

        if (!hasAccess) {
            sendErrorAndTrack(
                socket,
                fastify,
                userId,
                "Forbidden: No access to coterie",
                "coterie_access_denied",
                { coterie_id: coterieId }
            )
            return currentSession
        }

        currentSession = ensureCoterieSession(coterieId, coterie.ownerId)
    } else if (sessionId) {
        if (!temporarySessions.has(sessionId)) {
            sendErrorAndTrack(socket, fastify, userId, "Session not found", "session_not_found", {
                session_id: sessionId
            })
            return currentSession
        }

        currentSession = temporarySessions.get(sessionId)!
    } else {
        const newSessionId = nanoid(8)
        const newSession: Session = {
            id: newSessionId,
            type: "temporary",
            creatorUserId: userId,
            participants: new Map(),
            history: [],
            createdAt: Date.now(),
            lastActivity: Date.now(),
            maxParticipantCount: 0
        }
        temporarySessions.set(newSessionId, newSession)
        currentSession = newSession

        trackEvent(
            "chat-session-created",
            {
                session_type: "temporary",
                session_id: newSessionId
            },
            userId
        )
    }

    if (currentSession) {
        if (previousSession && previousSession.id !== currentSession.id) {
            removeParticipantFromSession(userId, previousSession)
        }

        const wasExistingSession = currentSession.participants.size > 0
        const participant: Participant = {
            userId,
            userName,
            characterName,
            socket: socket
        }

        currentSession.participants.set(userId, participant)
        currentSession.emptySince = undefined
        clearRecentChatSession(userId, currentSession)
        const joinedAt = Date.now()
        currentSession.lastActivity = joinedAt
        recordSessionJoin(currentSession, userId, joinedAt)
        participant.joinedAt = joinedAt
        participant.messageCount = 0

        const participants = Array.from(currentSession.participants.values()).map((p) => ({
            userId: p.userId,
            userName: p.userName,
            characterName: p.characterName
        }))

        if (wasExistingSession) {
            trackEvent(
                "chat-session-joined",
                {
                    session_type: currentSession.type,
                    session_id: currentSession.id,
                    creator_user_id: currentSession.creatorUserId,
                    participant_count: participants.length,
                    player_count: participants.length,
                    max_participant_count: currentSession.maxParticipantCount
                },
                userId
            )
        }

        trackEvent(
            "chat-session-connected",
            {
                session_type: currentSession.type,
                session_id: currentSession.id,
                coterie_id: currentSession.coterieId,
                creator_user_id: currentSession.creatorUserId,
                participant_count: participants.length,
                player_count: participants.length,
                max_participant_count: currentSession.maxParticipantCount,
                participant_join_count: currentSession.participantJoinCount ?? 0,
                unique_participant_count: currentSession.uniqueParticipantIds?.size ?? 0,
                was_existing_active_session: wasExistingSession,
                had_history: currentSession.history.length > 0,
                history_message_count: currentSession.history.length,
                message_count: currentSession.totalMessageCount ?? 0
            },
            userId
        )

        socket.send(
            JSON.stringify({
                type: "session_joined",
                sessionId: currentSession.id,
                sessionType: currentSession.type,
                coterieId: currentSession.coterieId,
                participants,
                history: currentSession.history
            } as SessionJoinedMessage)
        )

        broadcastToSession(
            currentSession,
            {
                type: "user_joined",
                userId,
                userName,
                characterName: participant.characterName
            } as UserJoinedMessage,
            userId
        )
    }

    return currentSession
}
