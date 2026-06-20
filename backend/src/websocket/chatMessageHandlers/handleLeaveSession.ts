import { type Session, type UserLeftMessage } from "../sessionChatTypes.js"
import {
    clearRecentChatSession,
    clearRecentChatSessionsForSessionId,
    rememberRecentChatSession,
    temporarySessions
} from "../sessionChat.js"
import {
    clearSessionHistory,
    resetSessionAnalytics,
    trackSessionClosed
} from "../sessionChatLifecycle.js"
import { broadcastToSession } from "../sessionChatUtils.js"

export function handleLeaveSession(userId: string, currentSession: Session | null): Session | null {
    if (currentSession) {
        removeParticipantFromSession(userId, currentSession, { clearEmptySession: true })
        return null
    }
    return currentSession
}

export function removeParticipantFromSession(
    userId: string,
    session: Session,
    options: { clearEmptySession?: boolean; socket?: any } = {}
): void {
    const participant = session.participants.get(userId)
    if (options.socket && participant?.socket !== options.socket) {
        return
    }

    session.participants.delete(userId)
    session.lastActivity = Date.now()

    if (session.participants.size === 0) {
        session.emptySince = Date.now()
        if (options.clearEmptySession) {
            if (session.type === "temporary") {
                trackSessionClosed(session, "empty", userId)
                temporarySessions.delete(session.id)
                clearRecentChatSessionsForSessionId(session.id)
            } else {
                trackSessionClosed(session, "empty", userId)
                clearSessionHistory(session)
                clearRecentChatSessionsForSessionId(session.id)
                resetSessionAnalytics(session)
            }
            clearRecentChatSession(userId, session)
        } else {
            clearRecentChatSession(userId, session)
        }
        return
    }

    session.emptySince = undefined
    rememberRecentChatSession(userId, session)

    broadcastToSession(session, {
        type: "user_left",
        userId
    } as UserLeftMessage)
}
