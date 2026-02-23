import { create } from "zustand"
import { API_URL } from "~/utils/api"
import posthog from "posthog-js"

type Participant = {
  userId: string
  userName: string
  characterName?: string
}

type ChatMessage = {
  type: "chat_message"
  userName: string
  characterName?: string
  message: string
  timestamp: number
}

export type RollData = {
    dice: Array<{ id: number; value: number; isBloodDie: boolean }>
    totalSuccesses: number
    results: Array<{ type: string; value: number }>
    poolInfo?: {
      attribute?: string
      skill?: string
      discipline?: string
      diceCount: number
      bloodDiceCount: number
      bloodSurge?: boolean
      specialtyBonus?: number
      disciplinePowerBonus?: number
    }
    rollId?: string
    isReroll?: boolean
}


export type DiceRollMessage = {
  type: "dice_roll"
  userName: string
  characterName?: string
  rollData: RollData
  timestamp: number
}

type RouseCheckMessage = {
  type: "rouse_check"
  userName: string
  characterName?: string
  roll: number
  success: boolean
  newHunger: number
  timestamp: number
}

type RemorseCheckMessage = {
  type: "remorse_check"
  userName: string
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
  participants: Participant[]
}

type UserJoinedMessage = {
  type: "user_joined"
  userId: string
  userName: string
  characterName?: string
}

type UserLeftMessage = {
  type: "user_left"
  userId: string
}

type ErrorMessage = {
  type: "error"
  message: string
  timestamp: number
}

type ServerMessage = SessionJoinedMessage | UserJoinedMessage | UserLeftMessage | ChatMessage | DiceRollMessage | RouseCheckMessage | RemorseCheckMessage | ErrorMessage

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

type SessionChatStore = {
  connectionStatus: ConnectionStatus
  sessionId: string | null
  sessionType: "temporary" | "coterie" | null
  participants: Participant[]
  messages: Array<ChatMessage | DiceRollMessage | RouseCheckMessage | RemorseCheckMessage | ErrorMessage>
  ws: WebSocket | null
  reconnectTimeout: NodeJS.Timeout | null
  reconnectAttempts: number
  messageQueue: Array<{ type: string; [key: string]: unknown }>
  isManualDisconnect: boolean
  lastJoinOptions: { sessionId?: string; coterieId?: string } | null
  connect: () => void
  disconnect: () => void
  joinSession: (options?: { sessionId?: string; coterieId?: string; characterName?: string }) => void
  leaveSession: () => void
  sendChatMessage: (message: string, characterName?: string) => void
  sendDiceRoll: (rollData: {
    dice: Array<{ id: number; value: number; isBloodDie: boolean }>
    totalSuccesses: number
    results: Array<{ type: string; value: number }>
    poolInfo?: {
      attribute?: string
      skill?: string
      discipline?: string
      diceCount: number
      bloodDiceCount: number
    }
  }, characterName?: string) => void
  sendRouseCheck: (roll: number, success: boolean, newHunger: number, characterName?: string) => void
  sendRemorseCheck: (rolls: number[], successes: number, passed: boolean, newHumanity: number, characterName?: string) => void
}

export const useSessionChatStore = create<SessionChatStore>((set, get) => {
  const loadLastJoinOptions = (): { sessionId?: string; coterieId?: string } | null => {
    if (typeof window === "undefined") return null
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  }

  const saveLastJoinOptions = (options: { sessionId?: string; coterieId?: string } | null) => {
    if (typeof window === "undefined") return
    try {
      if (options) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(options))
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
    if (state.ws?.readyState === WebSocket.OPEN) {
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
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(queuedMessage))
          }
        })
        return
      }

      const lastJoinOptions = currentState.lastJoinOptions || loadLastJoinOptions()
      if (lastJoinOptions) {
        const joinMessage = {
          type: "join_session",
          ...lastJoinOptions,
        }
        ws.send(JSON.stringify(joinMessage))
      }

      const queue = [...currentState.messageQueue]
      set({ messageQueue: [] })
      queue.forEach((queuedMessage) => {
        if (ws.readyState === WebSocket.OPEN) {
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
              const options = { coterieId: data.sessionId }
              saveLastJoinOptions(options)
              set({
                sessionId: data.sessionId,
                sessionType: data.sessionType,
                participants: data.participants,
                messages: [],
                lastJoinOptions: options,
              })
            } else {
              const options = { sessionId: data.sessionId }
              saveLastJoinOptions(options)
              set({
                sessionId: data.sessionId,
                sessionType: data.sessionType,
                participants: data.participants,
                messages: [],
                lastJoinOptions: options,
              })
            }

            try {
              const lastJoinOptions = currentState.lastJoinOptions
              const isNewSession = !lastJoinOptions || (!lastJoinOptions.sessionId && !lastJoinOptions.coterieId)
              
              posthog.capture("chat-session-joined", {
                session_type: data.sessionType,
                session_id: data.sessionId,
                participant_count: data.participants.length,
                is_new_session: isNewSession,
              })
            } catch (error) {
              console.warn("PostHog chat-session-joined tracking failed:", error)
            }
            break
          }

          case "user_joined": {
            const currentParticipants = currentState.participants
            if (!currentParticipants.some((p) => p.userId === data.userId)) {
              set({
                participants: [
                  ...currentParticipants,
                  { userId: data.userId, userName: data.userName, characterName: data.characterName },
                ],
              })
            }
            break
          }

          case "user_left": {
            const currentParticipants = currentState.participants
            set({
              participants: currentParticipants.filter((p) => p.userId !== data.userId),
            })
            break
          }

          case "chat_message":
            set((state) => ({ messages: [...state.messages, data] }))
            break

          case "dice_roll": {
            const rollData = data.rollData
            if (rollData.isReroll && rollData.rollId) {
              set((state) => ({
                messages: state.messages.map((msg) => {
                  if (msg.type === "dice_roll" && msg.rollData.rollId === rollData.rollId) {
                    return data
                  }
                  return msg
                }),
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

          case "error":
            console.error("WebSocket error:", data.message)
            set((state) => ({
              messages: [
                ...state.messages,
                {
                  type: "error",
                  message: data.message,
                  timestamp: Date.now(),
                },
              ],
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

      if (!currentState.isManualDisconnect && currentState.reconnectAttempts < 5) {
        const attempts = currentState.reconnectAttempts + 1
        const delay = Math.min(1000 * Math.pow(2, attempts), 30000)
        const timeout = setTimeout(() => {
          get().connect()
        }, delay)
        set({ reconnectAttempts: attempts, reconnectTimeout: timeout })
      } else {
        set({ 
          reconnectAttempts: 0, 
          isManualDisconnect: false,
          sessionId: null,
          sessionType: null,
          participants: [],
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
      lastJoinOptions: null,
    })
  }

  const joinSession = (options?: { sessionId?: string; coterieId?: string; characterName?: string }) => {
    const joinOptions = options ? { sessionId: options.sessionId, coterieId: options.coterieId } : null
    saveLastJoinOptions(joinOptions)
    set({ lastJoinOptions: joinOptions })

    try {
      const isCreating = !options || (!options.sessionId && !options.coterieId)
      const sessionType = options?.coterieId ? "coterie" : "temporary"
      
      if (isCreating) {
        posthog.capture("chat-session-create-attempt", {
          session_type: sessionType,
        })
      } else {
        posthog.capture("chat-session-join-attempt", {
          session_type: sessionType,
          session_id: options.sessionId || options.coterieId,
        })
      }
    } catch (error) {
      console.warn("PostHog chat tracking failed:", error)
    }

    sendMessage({
      type: "join_session",
      sessionId: options?.sessionId,
      coterieId: options?.coterieId,
      characterName: options?.characterName,
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
      characterName,
    })
  }

  const sendDiceRoll = (rollData: {
    dice: Array<{ id: number; value: number; isBloodDie: boolean }>
    totalSuccesses: number
    results: Array<{ type: string; value: number }>
    poolInfo?: {
      attribute?: string
      skill?: string
      discipline?: string
      diceCount: number
      bloodDiceCount: number
      bloodSurge?: boolean
    }
    rollId?: string
    isReroll?: boolean
  }, characterName?: string) => {
    const state = get()
    if (!state.sessionId) {
      console.warn("Cannot send dice roll: not in a session")
      return
    }
    sendMessage({
      type: "dice_roll",
      rollData,
      characterName,
    })
  }

  const sendRouseCheck = (roll: number, success: boolean, newHunger: number, characterName?: string) => {
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
      characterName,
    })
  }

  const sendRemorseCheck = (rolls: number[], successes: number, passed: boolean, newHumanity: number, characterName?: string) => {
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
      characterName,
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
    leaveSession,
    sendChatMessage,
    sendDiceRoll,
    sendRouseCheck,
    sendRemorseCheck,
  }
})
