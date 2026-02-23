import { FastifyInstance } from "fastify"
import {
  type Session,
  type RemorseCheckMessage,
  type RemorseCheckReceived,
} from "../sessionChatTypes.js"
import { sendErrorAndTrack, broadcastToSession } from "../sessionChatUtils.js"

export async function handleRemorseCheck(
  data: RemorseCheckMessage,
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
      { message_type: "remorse_check" }
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
      { message_type: "remorse_check", session_id: currentSession.id }
    )
    return currentSession
  }

  const message: RemorseCheckReceived = {
    type: "remorse_check",
    userName: participant.userName,
    characterName: data.characterName ?? participant.characterName,
    rolls: data.rolls,
    successes: data.successes,
    passed: data.passed,
    newHumanity: data.newHumanity,
    timestamp: Date.now(),
  }

  currentSession.lastActivity = Date.now()
  broadcastToSession(currentSession, message, userId)
  socket.send(JSON.stringify(message))
  return currentSession
}
