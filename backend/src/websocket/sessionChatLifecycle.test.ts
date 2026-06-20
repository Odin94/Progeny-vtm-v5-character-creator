import { beforeEach, describe, expect, it, vi } from "vitest"
import { trackEvent } from "../utils/tracker.js"
import {
    recordSessionJoin,
    recordSessionMessage,
    trackSessionClosed
} from "./sessionChatLifecycle.js"
import { type Participant, type Session } from "./sessionChatTypes.js"

vi.mock("../utils/tracker.js", () => ({
    trackEvent: vi.fn(() => Promise.resolve())
}))

const trackEventMock = vi.mocked(trackEvent)

function createParticipant(userId: string): Participant {
    return {
        userId,
        userName: userId,
        socket: {}
    }
}

function createSession(): Session {
    return {
        id: "session-1",
        type: "temporary",
        creatorUserId: "creator-1",
        participants: new Map([["creator-1", createParticipant("creator-1")]]),
        history: [],
        createdAt: 100,
        lastActivity: 100,
        maxParticipantCount: 1
    }
}

describe("session chat lifecycle tracking", () => {
    beforeEach(() => {
        trackEventMock.mockClear()
    })

    it("starts active duration when a non-creator joins", () => {
        const session = createSession()

        session.participants.set("player-2", createParticipant("player-2"))
        recordSessionJoin(session, "player-2", 1_000)

        expect(session.activeStartedAt).toBe(1_000)
        expect(session.maxParticipantCount).toBe(2)
    })

    it("records chat activity timestamps", () => {
        const session = createSession()

        const timestamp = recordSessionMessage(session, "chat_message", "creator-1", 2_500)

        expect(timestamp).toBe(2_500)
        expect(session.lastActivity).toBe(2_500)
        expect(session.lastMessageAt).toBe(2_500)
        expect(session.totalMessageCount).toBe(1)
        expect(session.chatMessageCount).toBe(1)
        expect(session.participants.get("creator-1")?.messageCount).toBe(1)
    })

    it("tracks closed sessions with usage summary", () => {
        const session = createSession()
        const nowSpy = vi.spyOn(Date, "now").mockReturnValue(5_000)
        session.participants.set("player-2", createParticipant("player-2"))
        session.maxParticipantCount = 2
        session.activeStartedAt = 1_000
        session.lastMessageAt = 4_500
        session.analyticsStartedAt = 100
        session.participantJoinCount = 2
        session.uniqueParticipantIds = new Set(["creator-1", "player-2"])
        session.totalMessageCount = 3
        session.chatMessageCount = 2
        session.diceRollCount = 1

        trackSessionClosed(session, "empty", "player-2")
        trackSessionClosed(session, "empty", "player-2")

        expect(trackEventMock).toHaveBeenCalledTimes(1)
        expect(trackEventMock).toHaveBeenCalledWith(
            "chat-session-closed",
            expect.objectContaining({
                session_type: "temporary",
                session_id: "session-1",
                close_reason: "empty",
                creator_user_id: "creator-1",
                participant_count: 2,
                max_participant_count: 2,
                participant_join_count: 2,
                unique_participant_count: 2,
                message_count: 3,
                chat_message_count: 2,
                dice_roll_count: 1,
                active_started_at: new Date(1_000).toISOString(),
                last_message_at: new Date(4_500).toISOString(),
                chat_session_duration_ms: 4_900,
                chat_session_duration_seconds: 5,
                chat_active_duration_ms: 4_000,
                chat_active_duration_seconds: 4
            }),
            "player-2"
        )
        nowSpy.mockRestore()
    })
})
