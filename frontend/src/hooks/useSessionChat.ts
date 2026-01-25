import { useSessionChatStore } from "~/character_sheet/stores/sessionChatStore"
import { useShallow } from "zustand/react/shallow"

export const useSessionChat = () => {
  const {
    connectionStatus,
    sessionId,
    sessionType,
    participants,
    messages,
    connect,
    disconnect,
    joinSession,
    leaveSession,
    sendChatMessage,
    sendDiceRoll,
    sendRouseCheck,
  } = useSessionChatStore(
    useShallow((state) => ({
      connectionStatus: state.connectionStatus,
      sessionId: state.sessionId,
      sessionType: state.sessionType,
      participants: state.participants,
      messages: state.messages,
      connect: state.connect,
      disconnect: state.disconnect,
      joinSession: state.joinSession,
      leaveSession: state.leaveSession,
      sendChatMessage: state.sendChatMessage,
      sendDiceRoll: state.sendDiceRoll,
      sendRouseCheck: state.sendRouseCheck,
    }))
  )

  return {
    connectionStatus,
    sessionId,
    sessionType,
    participants,
    messages,
    connect,
    disconnect,
    joinSession,
    leaveSession,
    sendChatMessage,
    sendDiceRoll,
    sendRouseCheck,
  }
}
