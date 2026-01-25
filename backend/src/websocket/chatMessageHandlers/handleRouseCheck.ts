import { FastifyInstance } from "fastify"
import {
  type Session,
  type RouseCheckMessage,
  type RouseCheckReceived,
} from "../sessionChatTypes.js"
import { sendErrorAndTrack, broadcastToSession } from "../sessionChatUtils.js"

export async function handleRouseCheck(
  data: RouseCheckMessage,
  socket: any,
  fastify: FastifyInstance,
  userId: string,
  currentSession: Session | null
): Promise<Session | null> {
  if (!currentSession) {
    sendErrorAndTrack(
      socket,
      fastify,
      userId,
      "Not in a session",
      "not_in_session",
      { message_type: "rouse_check" }
    )
    return currentSession
  }

  const participant = currentSession.participants.get(userId)
  if (!participant) {
    sendErrorAndTrack(
      socket,
      fastify,
      userId,
      "Not a participant",
      "not_a_participant",
      { message_type: "rouse_check", session_id: currentSession.id }
    )
    return currentSession
  }

  const message: RouseCheckReceived = {
    type: "rouse_check",
    userName: participant.userName,
    characterName: participant.characterName,
    roll: data.roll,
    success: data.success,
    newHunger: data.newHunger,
    timestamp: Date.now(),
  }

  currentSession.lastActivity = Date.now()
  broadcastToSession(currentSession, message, userId)
  socket.send(JSON.stringify(message))
  return currentSession
}
