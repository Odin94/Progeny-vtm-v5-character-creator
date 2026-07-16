import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import type { FastifyInstance } from "fastify"
import { eq, sql } from "drizzle-orm"
import { trackEvent } from "../utils/tracker.js"
import { db, schema } from "../db/index.js"
import {
    recordSessionJoin,
    recordSessionMessage,
    trackSessionClosed
} from "./sessionChatLifecycle.js"
import { type Participant, type Session } from "./sessionChatTypes.js"
import { temporarySessions, updateSessionNameTag } from "./sessionChat.js"
import { handleJoinSession } from "./chatMessageHandlers/handleJoinSession.js"
import { handleLeaveSession } from "./chatMessageHandlers/handleLeaveSession.js"

vi.mock("../utils/tracker.js", () => ({
    trackEvent: vi.fn(() => Promise.resolve())
}))

const trackEventMock = vi.mocked(trackEvent)

function createParticipant(userId: string): Participant {
    return {
        userId,
        userName: userId,
        showNameTag: false,
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
    beforeAll(async () => {
        await db.run(
            sql.raw(`CREATE TABLE IF NOT EXISTS users (
                id text PRIMARY KEY NOT NULL,
                email text NOT NULL UNIQUE,
                first_name text,
                last_name text,
                nickname text UNIQUE,
                preferences text,
                is_superadmin integer DEFAULT false NOT NULL,
                name_tag_enabled integer DEFAULT false NOT NULL,
                name_tag_visible integer DEFAULT false NOT NULL,
                created_at integer DEFAULT (unixepoch()) NOT NULL,
                updated_at integer DEFAULT (unixepoch()) NOT NULL
            )`)
        )
    })

    afterAll(async () => {
        await db.delete(schema.users).where(eq(schema.users.id, "rejoin-user"))
    })

    beforeEach(async () => {
        trackEventMock.mockClear()
        temporarySessions.clear()
        await db.delete(schema.users).where(eq(schema.users.id, "rejoin-user"))
    })

    it("updates active participants and history when name-tag visibility changes", () => {
        const session = createSession()
        const send = vi.fn()
        session.participants.get("creator-1")!.socket = { readyState: 1, send }
        session.history.push({
            type: "chat_message",
            userId: "creator-1",
            userName: "Creator",
            showNameTag: false,
            message: "Hello",
            timestamp: 1
        })
        temporarySessions.set(session.id, session)

        updateSessionNameTag("creator-1", true)
        expect(session.participants.get("creator-1")?.showNameTag).toBe(true)
        expect(session.history[0]?.showNameTag).toBe(true)
        expect(JSON.parse(send.mock.calls[0][0])).toMatchObject({
            type: "user_identity_updated",
            userId: "creator-1",
            showNameTag: true
        })

        updateSessionNameTag("creator-1", false)
        expect(session.participants.get("creator-1")?.showNameTag).toBe(false)
        expect(session.history[0]?.showNameTag).toBe(false)
        expect(JSON.parse(send.mock.calls[1][0])).toMatchObject({
            type: "user_identity_updated",
            showNameTag: false
        })
    })

    it("resolves current name-tag access when the same socket rejoins", async () => {
        await db.insert(schema.users).values({
            id: "rejoin-user",
            email: "rejoin-user@progeny.invalid",
            nameTagEnabled: true,
            nameTagVisible: true
        })

        const observer = createParticipant("observer")
        const firstSession = createSession()
        firstSession.id = "first-session"
        firstSession.participants = new Map([[observer.userId, observer]])
        const secondSession = createSession()
        secondSession.id = "second-session"
        secondSession.participants = new Map([[observer.userId, observer]])
        temporarySessions.set(firstSession.id, firstSession)
        temporarySessions.set(secondSession.id, secondSession)

        const socket = { readyState: 1, send: vi.fn() }
        const fastify = {} as FastifyInstance
        const joinedFirst = await handleJoinSession(
            { type: "join_session", sessionId: firstSession.id },
            socket,
            fastify,
            "rejoin-user",
            "Rejoin User",
            null
        )
        expect(joinedFirst?.participants.get("rejoin-user")?.showNameTag).toBe(true)

        handleLeaveSession("rejoin-user", joinedFirst)
        await db
            .update(schema.users)
            .set({ nameTagEnabled: false, nameTagVisible: false })
            .where(eq(schema.users.id, "rejoin-user"))

        const joinedSecond = await handleJoinSession(
            { type: "join_session", sessionId: secondSession.id },
            socket,
            fastify,
            "rejoin-user",
            "Rejoin User",
            null
        )

        expect(joinedSecond?.participants.get("rejoin-user")?.showNameTag).toBe(false)
        const lastPayload = JSON.parse(socket.send.mock.calls.at(-1)?.[0] ?? "{}")
        expect(lastPayload).toMatchObject({
            type: "session_joined",
            participants: expect.arrayContaining([
                expect.objectContaining({ userId: "rejoin-user", showNameTag: false })
            ])
        })
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
