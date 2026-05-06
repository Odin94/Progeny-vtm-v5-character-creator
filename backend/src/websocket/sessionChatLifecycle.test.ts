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

        const timestamp = recordSessionMessage(session, 2_500)

        expect(timestamp).toBe(2_500)
        expect(session.lastActivity).toBe(2_500)
        expect(session.lastMessageAt).toBe(2_500)
    })

    it("tracks closed sessions with active duration through the last message", () => {
        const session = createSession()
        session.participants.set("player-2", createParticipant("player-2"))
        session.maxParticipantCount = 2
        session.activeStartedAt = 1_000
        session.lastMessageAt = 4_500

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
                active_started_at: new Date(1_000).toISOString(),
                last_message_at: new Date(4_500).toISOString(),
                chat_active_duration_ms: 3_500,
                chat_active_duration_seconds: 4
            }),
            "player-2"
        )
    })
})
