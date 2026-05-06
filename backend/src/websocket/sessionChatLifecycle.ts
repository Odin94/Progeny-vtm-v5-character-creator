import { logger } from "../utils/logger.js"
import { trackEvent } from "../utils/tracker.js"
import { type Session } from "./sessionChatTypes.js"

export function recordSessionJoin(session: Session, userId: string, joinedAt = Date.now()): void {
    session.maxParticipantCount = Math.max(session.maxParticipantCount, session.participants.size)

    if (
        !session.activeStartedAt &&
        userId !== session.creatorUserId &&
        session.participants.size > 1
    ) {
        session.activeStartedAt = joinedAt
    }
}

export function recordSessionMessage(session: Session, timestamp = Date.now()): number {
    session.lastActivity = timestamp
    session.lastMessageAt = timestamp
    return timestamp
}

export function trackSessionClosed(
    session: Session,
    reason: "empty" | "timeout",
    distinctId = session.creatorUserId
): void {
    if (session.closedTrackedAt) {
        return
    }

    const closedAt = Date.now()
    session.closedTrackedAt = closedAt

    const activeDurationMs =
        session.activeStartedAt && session.lastMessageAt
            ? Math.max(0, session.lastMessageAt - session.activeStartedAt)
            : null

    trackEvent(
        "chat-session-closed",
        {
            session_type: session.type,
            session_id: session.id,
            close_reason: reason,
            creator_user_id: session.creatorUserId,
            participant_count: session.participants.size,
            max_participant_count: session.maxParticipantCount,
            active_started_at: session.activeStartedAt
                ? new Date(session.activeStartedAt).toISOString()
                : null,
            last_message_at: session.lastMessageAt
                ? new Date(session.lastMessageAt).toISOString()
                : null,
            chat_active_duration_ms: activeDurationMs,
            chat_active_duration_seconds:
                activeDurationMs === null ? null : Math.round(activeDurationMs / 1000),
            closed_at: new Date(closedAt).toISOString()
        },
        distinctId
    ).catch((error) => {
        logger.warn("Failed to track chat session closed event", {
            session_id: session.id,
            session_type: session.type,
            close_reason: reason,
            error: error instanceof Error ? error.message : String(error)
        })
    })
}
