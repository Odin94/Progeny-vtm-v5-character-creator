import { create } from "zustand"
import { API_URL } from "~/utils/api"
import posthog from "posthog-js"

type Participant = {
    userId: string
    userName: string
    showNameTag: boolean
    characterName?: string
}

type ChatMessage = {
    type: "chat_message"
    userId: string
    userName: string
    showNameTag: boolean
    characterName?: string
    message: string
    timestamp: number
}

export type RollData = {
    dice: Array<{ id: number; value: number; isBloodDie: boolean }>
    totalSuccesses: number
    results: Array<{ type: string; value: number }>
    poolInfo?: {
        attribute?: string | null
        skill?: string | null
        discipline?: string | null
        diceCount: number
        bloodDiceCount: number
        bloodSurge?: boolean
        specialtyBonus?: number
        disciplinePowerBonus?: number
        meritFlawBonus?: number
    }
    rollId?: string | null
    isReroll?: boolean
}

export type DiceRollMessage = {
    type: "dice_roll"
    userId: string
    userName: string
    showNameTag: boolean
    characterName?: string
    rollData: RollData
    timestamp: number
}

type RouseCheckMessage = {
    type: "rouse_check"
    userId: string
    userName: string
    showNameTag: boolean
    characterName?: string
    roll: number
    success: boolean
    newHunger: number
    timestamp: number
}

type RemorseCheckMessage = {
    type: "remorse_check"
    userId: string
    userName: string
    showNameTag: boolean
    characterName?: string
    rolls: number[]
    successes: number
    passed: boolean
    newHumanity: number
    timestamp: number
}

type SessionJoinedMessage = {
    type: "session_joined"
    sessionId: string
    sessionType: "temporary" | "coterie"
    coterieId?: string
    participants: Participant[]
    history?: Array<ChatMessage | DiceRollMessage | RouseCheckMessage | RemorseCheckMessage>
}

type UserJoinedMessage = {
    type: "user_joined"
    userId: string
    userName: string
    showNameTag: boolean
    characterName?: string
}

type UserLeftMessage = {
    type: "user_left"
    userId: string
}

type UserIdentityUpdatedMessage = {
    type: "user_identity_updated"
    userId: string
    showNameTag: boolean
}

type SessionClosedMessage = {
    type: "session_closed"
    reason: "coterie_deleted" | "removed_from_coterie"
    message: string
}

type ErrorMessage = {
    type: "error"
    message: string
    timestamp: number
}

type ServerMessage =
    | SessionJoinedMessage
    | UserJoinedMessage
    | UserLeftMessage
    | UserIdentityUpdatedMessage
    | SessionClosedMessage
    | ChatMessage
    | DiceRollMessage
    | RouseCheckMessage
    | RemorseCheckMessage
    | ErrorMessage

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error"

const getWebSocketUrl = (): string => {
    const apiUrl = API_URL
    if (apiUrl.startsWith("http://")) {
        return apiUrl.replace("http://", "ws://") + "/ws/sessions"
    }
    if (apiUrl.startsWith("https://")) {
        return apiUrl.replace("https://", "wss://") + "/ws/sessions"
    }
    if (apiUrl.startsWith("/")) {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
        return `${protocol}//${window.location.host}${apiUrl}/ws/sessions`
    }
    return `ws://${apiUrl}/ws/sessions`
}

const STORAGE_KEY = "sessionChat_lastJoinOptions"
const MAX_RECONNECT_ATTEMPTS = 5
const RECONNECT_BASE_DELAY_MS = 1000
const RECONNECT_MAX_DELAY_MS = 30000
const COTERIE_RETRY_DELAY_MS = 60000

const getReconnectDelay = (attempts: number) => {
    const cappedDelay = Math.min(
        RECONNECT_BASE_DELAY_MS * Math.pow(2, attempts),
        RECONNECT_MAX_DELAY_MS
    )
    const jitterFloor = cappedDelay / 2
    return Math.round(jitterFloor + Math.random() * jitterFloor)
}

type JoinOptions = {
    sessionId?: string
    coterieId?: string
    characterName?: string
}

type SessionChatStore = {
    connectionStatus: ConnectionStatus
    sessionId: string | null
    sessionType: "temporary" | "coterie" | null
    participants: Participant[]
    messages: Array<
        ChatMessage | DiceRollMessage | RouseCheckMessage | RemorseCheckMessage | ErrorMessage
    >
    ws: WebSocket | null
    reconnectTimeout: NodeJS.Timeout | null
    reconnectAttempts: number
    messageQueue: Array<{ type: string; [key: string]: unknown }>
    isManualDisconnect: boolean
    lastJoinOptions: JoinOptions | null
    connect: () => void
    disconnect: () => void
    joinSession: (options?: JoinOptions) => void
    restoreLastSession: (characterName?: string) => void
    leaveSession: () => void
    sendChatMessage: (message: string, characterName?: string) => void
    sendDiceRoll: (
        rollData: {
            dice: Array<{ id: number; value: number; isBloodDie: boolean }>
            totalSuccesses: number
            results: Array<{ type: string; value: number }>
            poolInfo?: {
                attribute?: string | null
                skill?: string | null
                discipline?: string | null
                diceCount: number
                bloodDiceCount: number
                bloodSurge?: boolean
                specialtyBonus?: number
                disciplinePowerBonus?: number
                meritFlawBonus?: number
            }
            rollId?: string | null
            isReroll?: boolean
        },
        characterName?: string
    ) => void
    sendRouseCheck: (
        roll: number,
        success: boolean,
        newHunger: number,
        characterName?: string
    ) => void
    sendRemorseCheck: (
        rolls: number[],
        successes: number,
        passed: boolean,
        newHumanity: number,
        characterName?: string
    ) => void
}

export const useSessionChatStore = create<SessionChatStore>((set, get) => {
    const loadLastJoinOptions = (): JoinOptions | null => {
        if (typeof window === "undefined") return null
        try {
            const stored = localStorage.getItem(STORAGE_KEY)
            return stored ? JSON.parse(stored) : null
        } catch {
            return null
        }
    }

    const saveLastJoinOptions = (options: JoinOptions | null) => {
        if (typeof window === "undefined") return
        try {
            if (options) {
                localStorage.setItem(
                    STORAGE_KEY,
                    JSON.stringify({
                        sessionId: options.sessionId,
                        coterieId: options.coterieId
                    })
                )
            } else {
                localStorage.removeItem(STORAGE_KEY)
            }
        } catch {
            // Ignore storage errors
        }
    }

    const sendMessage = (message: { type: string; [key: string]: unknown }) => {
        const state = get()
        if (state.ws?.readyState === WebSocket.OPEN) {
            state.ws.send(JSON.stringify(message))
        } else {
            set((s) => ({ messageQueue: [...s.messageQueue, message] }))
            if (state.connectionStatus === "disconnected") {
                connect()
            }
        }
    }

    const connect = () => {
        const state = get()
        if (
            state.ws?.readyState === WebSocket.OPEN ||
            state.ws?.readyState === WebSocket.CONNECTING
        ) {
            return
        }

        if (state.isManualDisconnect) {
            return
        }

        set({ isManualDisconnect: false, connectionStatus: "connecting" })
        const wsUrl = getWebSocketUrl()
        const ws = new WebSocket(wsUrl)

        ws.onopen = () => {
            const currentState = get()
            set({ connectionStatus: "connected", reconnectAttempts: 0 })

            if (currentState.isManualDisconnect) {
                const queue = [...currentState.messageQueue]
                set({ messageQueue: [] })
                queue.forEach((queuedMessage) => {
                    if (queuedMessage.type !== "join_session" && ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify(queuedMessage))
                    }
                })
                return
            }

            const lastJoinOptions = currentState.lastJoinOptions || loadLastJoinOptions()
            if (lastJoinOptions) {
                const joinMessage = {
                    type: "join_session",
                    ...lastJoinOptions
                }
                ws.send(JSON.stringify(joinMessage))
            }

            const queue = [...currentState.messageQueue]
            set({ messageQueue: [] })
            queue.forEach((queuedMessage) => {
                if (queuedMessage.type !== "join_session" && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify(queuedMessage))
                }
            })
        }

        ws.onmessage = (event) => {
            try {
                const data: ServerMessage = JSON.parse(event.data)
                const currentState = get()

                switch (data.type) {
                    case "session_joined": {
                        if (data.sessionType === "coterie") {
                            const options = { coterieId: data.coterieId ?? data.sessionId }
                            saveLastJoinOptions(options)
                            set({
                                sessionId: data.sessionId,
                                sessionType: data.sessionType,
                                participants: data.participants,
                                messages: data.history ?? [],
                                lastJoinOptions: options
                            })
                        } else {
                            const options = { sessionId: data.sessionId }
                            saveLastJoinOptions(options)
                            set({
                                sessionId: data.sessionId,
                                sessionType: data.sessionType,
                                participants: data.participants,
                                messages: data.history ?? [],
                                lastJoinOptions: options
                            })
                        }
                        break
                    }

                    case "user_joined": {
                        const currentParticipants = currentState.participants
                        if (!currentParticipants.some((p) => p.userId === data.userId)) {
                            set({
                                participants: [
                                    ...currentParticipants,
                                    {
                                        userId: data.userId,
                                        userName: data.userName,
                                        showNameTag: data.showNameTag,
                                        characterName: data.characterName
                                    }
                                ]
                            })
                        }
                        break
                    }

                    case "user_left": {
                        const currentParticipants = currentState.participants
                        set({
                            participants: currentParticipants.filter(
                                (p) => p.userId !== data.userId
                            )
                        })
                        break
                    }

                    case "user_identity_updated":
                        set((state) => ({
                            participants: state.participants.map((participant) =>
                                participant.userId === data.userId
                                    ? { ...participant, showNameTag: data.showNameTag }
                                    : participant
                            ),
                            messages: state.messages.map((message) =>
                                "userId" in message && message.userId === data.userId
                                    ? { ...message, showNameTag: data.showNameTag }
                                    : message
                            )
                        }))
                        break

                    case "chat_message":
                        set((state) => ({ messages: [...state.messages, data] }))
                        break

                    case "dice_roll": {
                        const rollData = data.rollData
                        if (rollData.rollId) {
                            set((state) => ({
                                messages: (() => {
                                    const existingRollIndex = state.messages.findIndex(
                                        (msg) =>
                                            msg.type === "dice_roll" &&
                                            msg.rollData.rollId === rollData.rollId
                                    )

                                    if (existingRollIndex === -1) {
                                        return [...state.messages, data]
                                    }

                                    if (!rollData.isReroll) {
                                        return state.messages
                                    }

                                    return state.messages.map((msg, index) =>
                                        index === existingRollIndex ? data : msg
                                    )
                                })()
                            }))
                        } else {
                            set((state) => ({ messages: [...state.messages, data] }))
                        }
                        break
                    }

                    case "rouse_check":
                        set((state) => ({ messages: [...state.messages, data] }))
                        break

                    case "remorse_check":
                        set((state) => ({ messages: [...state.messages, data] }))
                        break

                    case "session_closed": {
                        console.warn("Chat session closed:", data.message)
                        saveLastJoinOptions(null)
                        if (currentState.reconnectTimeout) {
                            clearTimeout(currentState.reconnectTimeout)
                        }
                        set((state) => ({
                            isManualDisconnect: true,
                            reconnectTimeout: null,
                            reconnectAttempts: 0,
                            ws: null,
                            connectionStatus: "disconnected",
                            sessionId: null,
                            sessionType: null,
                            participants: [],
                            lastJoinOptions: null,
                            messageQueue: state.messageQueue.filter(
                                (message) => message.type !== "join_session"
                            ),
                            messages: [
                                ...state.messages,
                                {
                                    type: "error",
                                    message: data.message,
                                    timestamp: Date.now()
                                }
                            ]
                        }))
                        currentState.ws?.close()
                        break
                    }

                    case "error":
                        console.error("WebSocket error:", data.message)
                        set((state) => ({
                            messages: [
                                ...state.messages,
                                {
                                    type: "error",
                                    message: data.message,
                                    timestamp: Date.now()
                                }
                            ]
                        }))
                        break
                }
            } catch (error) {
                console.error("Error parsing WebSocket message:", error)
            }
        }

        ws.onerror = () => {
            set({ connectionStatus: "error" })
        }

        ws.onclose = () => {
            const currentState = get()
            set({ connectionStatus: "disconnected" })

            if (
                !currentState.isManualDisconnect &&
                currentState.reconnectAttempts < MAX_RECONNECT_ATTEMPTS
            ) {
                const attempts = currentState.reconnectAttempts + 1
                const delay = getReconnectDelay(attempts)
                const timeout = setTimeout(() => {
                    get().connect()
                }, delay)
                set({ reconnectAttempts: attempts, reconnectTimeout: timeout })
            } else {
                const shouldRetryCoterie =
                    !currentState.isManualDisconnect &&
                    Boolean(currentState.lastJoinOptions?.coterieId)
                const reconnectTimeout = shouldRetryCoterie
                    ? setTimeout(() => {
                          set({ reconnectTimeout: null })
                          get().connect()
                      }, COTERIE_RETRY_DELAY_MS)
                    : null

                set({
                    reconnectAttempts: 0,
                    isManualDisconnect: false,
                    reconnectTimeout,
                    sessionId: null,
                    sessionType: null,
                    participants: []
                })
            }
        }

        set({ ws })
    }

    const disconnect = () => {
        const state = get()

        if (state.reconnectTimeout) {
            clearTimeout(state.reconnectTimeout)
        }

        if (state.ws) {
            state.ws.close()
        }

        saveLastJoinOptions(null)
        set({
            isManualDisconnect: true,
            reconnectTimeout: null,
            reconnectAttempts: 0,
            ws: null,
            connectionStatus: "disconnected" as const,
            sessionId: null,
            sessionType: null,
            participants: [],
            messages: [],
            lastJoinOptions: null
        })
    }

    const joinSession = (options?: JoinOptions) => {
        const joinOptions = options
            ? { sessionId: options.sessionId, coterieId: options.coterieId }
            : null

        // Skip redundant re-joins to the session we're already connected to, so a
        // re-rendering caller can't spam join attempts (and analytics events) at
        // an already-active session. For coteries the session id equals the
        // coterie id, so a single check covers both session types.
        const targetSessionId = options?.coterieId ?? options?.sessionId
        if (
            targetSessionId &&
            get().connectionStatus === "connected" &&
            get().sessionId === targetSessionId
        ) {
            return
        }

        saveLastJoinOptions(joinOptions)
        set((state) => ({
            lastJoinOptions: joinOptions,
            isManualDisconnect: false,
            messageQueue: state.messageQueue.filter((message) => message.type !== "join_session")
        }))

        try {
            const isCreating = !options || (!options.sessionId && !options.coterieId)
            const sessionType = options?.coterieId ? "coterie" : "temporary"

            if (isCreating) {
                posthog.capture("chat-session-create-attempt", {
                    session_type: sessionType
                })
            } else {
                posthog.capture("chat-session-join-attempt", {
                    session_type: sessionType,
                    session_id: options.sessionId || options.coterieId
                })
            }
        } catch (error) {
            console.warn("PostHog chat tracking failed:", error)
        }

        const joinMessage = {
            type: "join_session",
            sessionId: options?.sessionId,
            coterieId: options?.coterieId,
            characterName: options?.characterName
        }

        const state = get()
        if (state.ws?.readyState === WebSocket.OPEN) {
            state.ws.send(JSON.stringify(joinMessage))
        } else if (
            state.connectionStatus === "disconnected" ||
            state.connectionStatus === "error"
        ) {
            connect()
        }
    }

    const optionalString = (value: string | null | undefined): string | undefined => {
        if (typeof value !== "string") {
            return undefined
        }

        const trimmed = value.trim()
        return trimmed.length > 0 ? trimmed : undefined
    }

    const restoreLastSession = (characterName?: string) => {
        const options = get().lastJoinOptions || loadLastJoinOptions()
        if (!options?.sessionId && !options?.coterieId) {
            return
        }

        joinSession({
            ...options,
            characterName
        })
    }

    const leaveSession = () => {
        const state = get()
        if (state.ws?.readyState === WebSocket.OPEN) {
            sendMessage({ type: "leave_session" })
        }
        disconnect()
    }

    const sendChatMessage = (message: string, characterName?: string) => {
        const state = get()
        if (!state.sessionId) {
            console.warn("Cannot send chat message: not in a session")
            return
        }
        if (typeof message !== "string" || message.length === 0) {
            console.warn("Cannot send empty or invalid message")
            return
        }
        if (message.length > 5000) {
            console.warn("Message exceeds maximum length of 5000 characters")
            return
        }
        sendMessage({
            type: "chat_message",
            message: message.trim(),
            characterName
        })
    }

    const sendDiceRoll = (
        rollData: {
            dice: Array<{ id: number; value: number; isBloodDie: boolean }>
            totalSuccesses: number
            results: Array<{ type: string; value: number }>
            poolInfo?: {
                attribute?: string | null
                skill?: string | null
                discipline?: string | null
                diceCount: number
                bloodDiceCount: number
                bloodSurge?: boolean
                specialtyBonus?: number
                disciplinePowerBonus?: number
                meritFlawBonus?: number
            }
            rollId?: string | null
            isReroll?: boolean
        },
        characterName?: string
    ) => {
        const state = get()
        if (!state.sessionId) {
            console.warn("Cannot send dice roll: not in a session")
            return
        }

        const poolInfo = rollData.poolInfo
            ? {
                  attribute: optionalString(rollData.poolInfo.attribute),
                  skill: optionalString(rollData.poolInfo.skill),
                  discipline: optionalString(rollData.poolInfo.discipline),
                  diceCount: rollData.poolInfo.diceCount,
                  bloodDiceCount: rollData.poolInfo.bloodDiceCount,
                  bloodSurge: rollData.poolInfo.bloodSurge,
                  specialtyBonus: rollData.poolInfo.specialtyBonus,
                  disciplinePowerBonus: rollData.poolInfo.disciplinePowerBonus,
                  meritFlawBonus: rollData.poolInfo.meritFlawBonus
              }
            : undefined

        sendMessage({
            type: "dice_roll",
            rollData: {
                dice: rollData.dice,
                totalSuccesses: rollData.totalSuccesses,
                results: rollData.results,
                poolInfo,
                rollId: optionalString(rollData.rollId),
                isReroll: rollData.isReroll
            },
            characterName: optionalString(characterName)
        })
    }

    const sendRouseCheck = (
        roll: number,
        success: boolean,
        newHunger: number,
        characterName?: string
    ) => {
        const state = get()
        if (!state.sessionId) {
            console.warn("Cannot send rouse check: not in a session")
            return
        }
        if (typeof roll !== "number" || roll < 1 || roll > 10) {
            console.warn("Invalid rouse check roll value")
            return
        }
        if (typeof newHunger !== "number" || newHunger < 0 || newHunger > 5) {
            console.warn("Invalid hunger value")
            return
        }
        sendMessage({
            type: "rouse_check",
            roll,
            success,
            newHunger,
            characterName
        })
    }

    const sendRemorseCheck = (
        rolls: number[],
        successes: number,
        passed: boolean,
        newHumanity: number,
        characterName?: string
    ) => {
        const state = get()
        if (!state.sessionId) {
            console.warn("Cannot send remorse check: not in a session")
            return
        }
        sendMessage({
            type: "remorse_check",
            rolls,
            successes,
            passed,
            newHumanity,
            characterName
        })
    }

    return {
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
        lastJoinOptions: loadLastJoinOptions(),
        connect,
        disconnect,
        joinSession,
        restoreLastSession,
        leaveSession,
        sendChatMessage,
        sendDiceRoll,
        sendRouseCheck,
        sendRemorseCheck
    }
})
