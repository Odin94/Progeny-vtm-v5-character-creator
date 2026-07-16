import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const captureMock = vi.fn()

vi.mock("posthog-js", () => ({
    default: {
        capture: (...args: unknown[]) => captureMock(...args)
    }
}))

vi.mock("~/utils/api", () => ({
    API_URL: "http://localhost:3000"
}))

// Minimal controllable WebSocket stand-in so we can drive the connection
// lifecycle deterministically from the tests.
class FakeWebSocket {
    static instances: FakeWebSocket[] = []
    static OPEN = 1
    static CONNECTING = 0
    static CLOSING = 2
    static CLOSED = 3

    url: string
    readyState = FakeWebSocket.CONNECTING
    sent: string[] = []
    onopen: (() => void) | null = null
    onmessage: ((event: { data: string }) => void) | null = null
    onerror: (() => void) | null = null
    onclose: (() => void) | null = null

    constructor(url: string) {
        this.url = url
        FakeWebSocket.instances.push(this)
    }

    send(data: string) {
        this.sent.push(data)
    }

    close() {
        this.readyState = FakeWebSocket.CLOSED
        this.onclose?.()
    }

    // Test helpers
    open() {
        this.readyState = FakeWebSocket.OPEN
        this.onopen?.()
    }

    receive(message: object) {
        this.onmessage?.({ data: JSON.stringify(message) })
    }
}

vi.stubGlobal("WebSocket", FakeWebSocket as unknown as typeof WebSocket)

const joinMessagesOf = (ws: FakeWebSocket) =>
    ws.sent.map((raw) => JSON.parse(raw)).filter((m) => m.type === "join_session")

const joinAttemptCaptures = () =>
    captureMock.mock.calls.filter((call) => call[0] === "chat-session-join-attempt")

// Import after mocks/stubs are in place.
const { useSessionChatStore } = await import("~/character_sheet/stores/sessionChatStore")

const resetStore = () => {
    const store = useSessionChatStore.getState()
    store.disconnect()
    useSessionChatStore.setState({
        connectionStatus: "disconnected",
        sessionId: null,
        sessionType: null,
        participants: [],
        messages: [],
        ws: null,
        reconnectTimeout: null,
        reconnectAttempts: 0,
        messageQueue: [],
        isManualDisconnect: false,
        lastJoinOptions: null
    })
}

describe("sessionChatStore joinSession", () => {
    beforeEach(() => {
        captureMock.mockClear()
        FakeWebSocket.instances = []
        localStorage.clear()
        resetStore()
    })

    afterEach(() => {
        resetStore()
        vi.clearAllTimers()
        vi.useRealTimers()
    })

    it("joins a coterie once and sends a single join over the socket", () => {
        const store = useSessionChatStore.getState()
        store.connect()
        store.joinSession({ coterieId: "coterie-1" })

        const ws = FakeWebSocket.instances[0]
        ws.open()

        expect(joinMessagesOf(ws)).toHaveLength(1)
        expect(joinAttemptCaptures()).toHaveLength(1)
    })

    it("does not re-join or re-fire analytics when already in the same coterie", () => {
        const store = useSessionChatStore.getState()
        store.connect()
        store.joinSession({ coterieId: "coterie-1" })

        const ws = FakeWebSocket.instances[0]
        ws.open()
        // Backend confirms the join. For coteries the session id equals the coterie id.
        ws.receive({
            type: "session_joined",
            sessionId: "coterie-1",
            sessionType: "coterie",
            coterieId: "coterie-1",
            participants: []
        })

        const joinsBefore = joinMessagesOf(ws).length
        const capturesBefore = joinAttemptCaptures().length

        // A re-rendering caller hammering joinSession must be a no-op here.
        useSessionChatStore.getState().joinSession({ coterieId: "coterie-1" })
        useSessionChatStore.getState().joinSession({ coterieId: "coterie-1" })
        useSessionChatStore.getState().joinSession({ coterieId: "coterie-1" })

        expect(joinMessagesOf(ws).length).toBe(joinsBefore)
        expect(joinAttemptCaptures().length).toBe(capturesBefore)
    })

    it("still allows switching to a different coterie while connected", () => {
        const store = useSessionChatStore.getState()
        store.connect()
        store.joinSession({ coterieId: "coterie-1" })

        const ws = FakeWebSocket.instances[0]
        ws.open()
        ws.receive({
            type: "session_joined",
            sessionId: "coterie-1",
            sessionType: "coterie",
            coterieId: "coterie-1",
            participants: []
        })

        useSessionChatStore.getState().joinSession({ coterieId: "coterie-2" })

        const joins = joinMessagesOf(ws)
        expect(joins[joins.length - 1].coterieId).toBe("coterie-2")
    })

    it("updates participants and existing messages when a name tag changes", () => {
        const store = useSessionChatStore.getState()
        store.connect()
        const ws = FakeWebSocket.instances[0]
        ws.open()
        ws.receive({
            type: "session_joined",
            sessionId: "session-1",
            sessionType: "temporary",
            participants: [{ userId: "user-1", userName: "Player", showNameTag: false }],
            history: [
                {
                    type: "chat_message",
                    userId: "user-1",
                    userName: "Player",
                    showNameTag: false,
                    message: "Hello",
                    timestamp: 1
                }
            ]
        })

        ws.receive({
            type: "user_identity_updated",
            userId: "user-1",
            showNameTag: true
        })

        expect(useSessionChatStore.getState().participants[0]?.showNameTag).toBe(true)
        expect(useSessionChatStore.getState().messages[0]).toMatchObject({ showNameTag: true })
    })

    it("starts a new coterie reconnect cycle after a longer timeout", () => {
        vi.useFakeTimers()
        const store = useSessionChatStore.getState()
        store.connect()
        store.joinSession({ coterieId: "coterie-1" })

        for (let attempt = 0; attempt < 5; attempt += 1) {
            FakeWebSocket.instances.at(-1)?.close()
            vi.runOnlyPendingTimers()
        }

        FakeWebSocket.instances.at(-1)?.close()
        const instancesAfterFastRetries = FakeWebSocket.instances.length

        vi.advanceTimersByTime(59999)
        expect(FakeWebSocket.instances).toHaveLength(instancesAfterFastRetries)

        vi.advanceTimersByTime(1)
        expect(FakeWebSocket.instances).toHaveLength(instancesAfterFastRetries + 1)

        const retrySocket = FakeWebSocket.instances.at(-1)!
        retrySocket.open()
        expect(joinMessagesOf(retrySocket)).toEqual([
            expect.objectContaining({ coterieId: "coterie-1" })
        ])
    })
})
