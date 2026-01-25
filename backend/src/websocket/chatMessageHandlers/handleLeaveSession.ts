import {
  type Session,
  type UserLeftMessage,
} from "../sessionChatTypes.js"
import { temporarySessions, coterieSessions } from "../sessionChat.js"
import { broadcastToSession } from "../sessionChatUtils.js"

export function handleLeaveSession(
  userId: string,
  currentSession: Session | null
): Session | null {
  if (currentSession) {
    currentSession.participants.delete(userId)
    currentSession.lastActivity = Date.now()

    if (currentSession.participants.size === 0) {
      if (currentSession.type === "temporary") {
        temporarySessions.delete(currentSession.id)
      } else {
        coterieSessions.delete(currentSession.id)
      }
    } else {
      broadcastToSession(
        currentSession,
        {
          type: "user_left",
          userId,
        } as UserLeftMessage
      )
    }

    return null
  }
  return currentSession
}
