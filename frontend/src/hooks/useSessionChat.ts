import { useSessionChatStore } from "~/character_sheet/stores/sessionChatStore"
import { useShallow } from "zustand/react/shallow"

type SessionChatState = ReturnType<typeof useSessionChatStore.getState>

const selectSessionChat = (state: SessionChatState) => ({
    connectionStatus: state.connectionStatus,
    sessionId: state.sessionId,
    sessionType: state.sessionType,
    participants: state.participants,
    messages: state.messages,
    connect: state.connect,
    disconnect: state.disconnect,
    joinSession: state.joinSession,
    restoreLastSession: state.restoreLastSession,
    leaveSession: state.leaveSession,
    sendChatMessage: state.sendChatMessage,
    sendDiceRoll: state.sendDiceRoll,
    sendRouseCheck: state.sendRouseCheck,
    sendRemorseCheck: state.sendRemorseCheck
})

export function useSessionChat(): ReturnType<typeof selectSessionChat>
export function useSessionChat<T>(selector: (state: SessionChatState) => T): T
export function useSessionChat(selector: (state: SessionChatState) => unknown = selectSessionChat) {
    // Select only the state each consumer renders. Dice controls and account
    // pages should not render again when chat receives a message or participant.
    return useSessionChatStore(useShallow(selector))
}
