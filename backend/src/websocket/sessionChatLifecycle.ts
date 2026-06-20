import { logger } from "../utils/logger.js"
import { trackEvent } from "../utils/tracker.js"
import {
    MAX_SESSION_HISTORY_MESSAGES,
    type DiceRollReceived,
    type Session,
    type SessionHistoryMessage
} from "./sessionChatTypes.js"

export type ChatMessageKind = "chat_message" | "dice_roll" | "rouse_check" | "remorse_check"

const messageCountKeyByKind: Record<
    ChatMessageKind,
    "chatMessageCount" | "diceRollCount" | "rouseCheckCount" | "remorseCheckCount"
> = {
    chat_message: "chatMessageCount",
    dice_roll: "diceRollCount",
    rouse_check: "rouseCheckCount",
    remorse_check: "remorseCheckCount"
}

function ensureSessionAnalytics(session: Session, timestamp = Date.now()): void {
    session.analyticsStartedAt ??= session.createdAt || timestamp
    session.participantJoinCount ??= 0
    session.uniqueParticipantIds ??= new Set<string>()
    session.totalMessageCount ??= 0
    session.chatMessageCount ??= 0
    session.diceRollCount ??= 0
    session.rouseCheckCount ??= 0
    session.remorseCheckCount ??= 0
}

export function resetSessionAnalytics(session: Session, timestamp = Date.now()): void {
    session.analyticsStartedAt = timestamp
    session.activeStartedAt = undefined
    session.lastMessageAt = undefined
    session.maxParticipantCount = session.participants.size
    session.participantJoinCount = 0
    session.uniqueParticipantIds = new Set<string>()
    session.totalMessageCount = 0
    session.chatMessageCount = 0
    session.diceRollCount = 0
    session.rouseCheckCount = 0
    session.remorseCheckCount = 0
    session.closedTrackedAt = undefined
}

export function recordSessionJoin(session: Session, userId: string, joinedAt = Date.now()): void {
    ensureSessionAnalytics(session, joinedAt)
    session.maxParticipantCount = Math.max(session.maxParticipantCount, session.participants.size)
    session.participantJoinCount = (session.participantJoinCount ?? 0) + 1
    session.uniqueParticipantIds?.add(userId)

    if (
        !session.activeStartedAt &&
        userId !== session.creatorUserId &&
        session.participants.size > 1
    ) {
        session.activeStartedAt = joinedAt
    }
}

export function recordSessionMessage(
    session: Session,
    kind: ChatMessageKind,
    userId: string,
    timestamp = Date.now()
): number {
    ensureSessionAnalytics(session, timestamp)
    session.lastActivity = timestamp
    session.lastMessageAt = timestamp
    session.activeStartedAt ??= timestamp
    session.totalMessageCount = (session.totalMessageCount ?? 0) + 1
    session[messageCountKeyByKind[kind]] = (session[messageCountKeyByKind[kind]] ?? 0) + 1

    const participant = session.participants.get(userId)
    if (participant) {
        participant.messageCount = (participant.messageCount ?? 0) + 1
    }

    return timestamp
}

export function appendSessionHistory(session: Session, message: SessionHistoryMessage): void {
    if (message.type === "dice_roll" && message.rollData.isReroll && message.rollData.rollId) {
        const existingRollIndex = session.history.findIndex(
            (historyMessage): historyMessage is DiceRollReceived =>
                historyMessage.type === "dice_roll" &&
                historyMessage.rollData.rollId === message.rollData.rollId
        )

        if (existingRollIndex !== -1) {
            session.history[existingRollIndex] = message
            return
        }
    }

    session.history.push(message)
    if (session.history.length > MAX_SESSION_HISTORY_MESSAGES) {
        session.history.splice(0, session.history.length - MAX_SESSION_HISTORY_MESSAGES)
    }
}

export function clearSessionHistory(session: Session): void {
    session.history = []
}

export function trackSessionClosed(
    session: Session,
    reason: "empty" | "timeout" | "deleted",
    distinctId = session.creatorUserId
): void {
    if (session.closedTrackedAt) {
        return
    }

    const closedAt = Date.now()
    ensureSessionAnalytics(session, closedAt)
    session.closedTrackedAt = closedAt

    const analyticsStartedAt = session.analyticsStartedAt ?? session.createdAt
    const sessionDurationMs = Math.max(0, closedAt - analyticsStartedAt)
    const activeDurationMs = session.activeStartedAt
        ? Math.max(0, closedAt - session.activeStartedAt)
        : null
    const timeToFirstMessageMs = session.lastMessageAt
        ? Math.max(0, session.lastMessageAt - analyticsStartedAt)
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
            participant_join_count: session.participantJoinCount ?? 0,
            unique_participant_count: session.uniqueParticipantIds?.size ?? 0,
            message_count: session.totalMessageCount ?? 0,
            chat_message_count: session.chatMessageCount ?? 0,
            dice_roll_count: session.diceRollCount ?? 0,
            rouse_check_count: session.rouseCheckCount ?? 0,
            remorse_check_count: session.remorseCheckCount ?? 0,
            analytics_started_at: new Date(analyticsStartedAt).toISOString(),
            active_started_at: session.activeStartedAt
                ? new Date(session.activeStartedAt).toISOString()
                : null,
            last_message_at: session.lastMessageAt
                ? new Date(session.lastMessageAt).toISOString()
                : null,
            chat_session_duration_ms: sessionDurationMs,
            chat_session_duration_seconds: Math.round(sessionDurationMs / 1000),
            chat_active_duration_ms: activeDurationMs,
            chat_active_duration_seconds:
                activeDurationMs === null ? null : Math.round(activeDurationMs / 1000),
            time_to_first_message_ms: timeToFirstMessageMs,
            time_to_first_message_seconds:
                timeToFirstMessageMs === null ? null : Math.round(timeToFirstMessageMs / 1000),
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

export function trackChatMessageSent(
    session: Session,
    userId: string,
    kind: ChatMessageKind,
    properties: Record<string, string | number | boolean | null | undefined> = {}
): void {
    trackEvent(
        "chat-message-sent",
        {
            session_type: session.type,
            session_id: session.id,
            coterie_id: session.coterieId,
            message_kind: kind,
            creator_user_id: session.creatorUserId,
            participant_count: session.participants.size,
            max_participant_count: session.maxParticipantCount,
            participant_join_count: session.participantJoinCount ?? 0,
            message_count: session.totalMessageCount ?? 0,
            chat_message_count: session.chatMessageCount ?? 0,
            dice_roll_count: session.diceRollCount ?? 0,
            rouse_check_count: session.rouseCheckCount ?? 0,
            remorse_check_count: session.remorseCheckCount ?? 0,
            ...properties
        },
        userId
    ).catch((error) => {
        logger.warn("Failed to track chat message sent event", {
            session_id: session.id,
            session_type: session.type,
            message_kind: kind,
            error: error instanceof Error ? error.message : String(error)
        })
    })
}
