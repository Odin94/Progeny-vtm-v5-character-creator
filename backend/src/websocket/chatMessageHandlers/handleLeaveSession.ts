import { type Session, type UserLeftMessage } from "../sessionChatTypes.js"
import {
    clearRecentChatSession,
    clearRecentChatSessionsForSessionId,
    rememberRecentChatSession,
    temporarySessions
} from "../sessionChat.js"
import { trackSessionClosed } from "../sessionChatLifecycle.js"
import { broadcastToSession } from "../sessionChatUtils.js"

export function handleLeaveSession(userId: string, currentSession: Session | null): Session | null {
    if (currentSession) {
        removeParticipantFromSession(userId, currentSession)
        return null
    }
    return currentSession
}

export function removeParticipantFromSession(userId: string, session: Session): void {
    session.participants.delete(userId)
    session.lastActivity = Date.now()

    if (session.participants.size === 0) {
        if (session.type === "temporary") {
            trackSessionClosed(session, "empty", userId)
            temporarySessions.delete(session.id)
            clearRecentChatSessionsForSessionId(session.id)
        }
        clearRecentChatSession(userId, session)
        return
    }

    rememberRecentChatSession(userId, session)

    broadcastToSession(session, {
        type: "user_left",
        userId
    } as UserLeftMessage)
}
