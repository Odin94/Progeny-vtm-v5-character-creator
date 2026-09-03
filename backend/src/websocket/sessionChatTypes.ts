import type {
    ParticipantIdentity,
    SessionHistoryMessage
} from "../contracts/realtimeProtocol.js"

export {
    clientMessageSchema,
    MAX_MESSAGE_LENGTH,
    MAX_SESSION_HISTORY_MESSAGES,
    messageSchema
} from "../contracts/realtimeProtocol.js"
export type {
    ChatMessage,
    ChatMessageReceived,
    ClientMessage,
    DiceRollMessage,
    DiceRollReceived,
    JoinSessionMessage,
    LeaveSessionMessage,
    RemorseCheckMessage,
    RemorseCheckReceived,
    RouseCheckMessage,
    RouseCheckReceived,
    ServerMessage,
    SessionHistoryMessage
    ,SessionJoinedMessage,
    UserJoinedMessage,
    UserLeftMessage,
    UserIdentityUpdatedMessage,
    SessionClosedMessage
} from "../contracts/realtimeProtocol.js"

export type Participant = ParticipantIdentity & {
    socket: any
    joinedAt?: number
    messageCount?: number
}

export type Session = {
    id: string
    type: "temporary" | "coterie"
    coterieId?: string
    creatorUserId: string
    participants: Map<string, Participant>
    history: SessionHistoryMessage[]
    createdAt: number
    lastActivity: number
    emptySince?: number
    activeStartedAt?: number
    lastMessageAt?: number
    maxParticipantCount: number
    analyticsStartedAt?: number
    participantJoinCount?: number
    uniqueParticipantIds?: Set<string>
    totalMessageCount?: number
    chatMessageCount?: number
    diceRollCount?: number
    rouseCheckCount?: number
    remorseCheckCount?: number
    closedTrackedAt?: number
}

export type RateLimitEntry = { count: number; resetTime: number }
