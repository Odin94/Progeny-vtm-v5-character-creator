import { FastifyInstance } from "fastify"
import { trackEvent } from "../../utils/tracker.js"
import {
  type Session,
  type DiceRollMessage,
  type DiceRollReceived,
} from "../sessionChatTypes.js"
import { sendErrorAndTrack, checkRateLimit, broadcastToSession } from "../sessionChatUtils.js"

export async function handleDiceRoll(
  data: DiceRollMessage,
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
      { message_type: "dice_roll" }
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
      { message_type: "dice_roll", session_id: currentSession.id }
    )
    return currentSession
  }

  const rateLimitResult = checkRateLimit(userId, "dice_roll")
  if (!rateLimitResult.allowed) {
    trackEvent("chat-rate-limit-exceeded", {
      rate_limit_type: "dice_roll",
      session_type: currentSession.type,
      session_id: currentSession.id,
    }, userId).catch(() => {
      // Ignore tracking errors
    })
    fastify.log.warn({
      userId,
      errorType: "rate_limit_exceeded",
      rate_limit_type: "dice_roll",
      session_type: currentSession.type,
      session_id: currentSession.id,
    }, "Chat rate limit exceeded")
    socket.send(JSON.stringify({ type: "error", message: "Rate limit exceeded. Please slow down." }))
    return currentSession
  }

  const message: DiceRollReceived = {
    type: "dice_roll",
    userName: participant.userName,
    characterName: participant.characterName,
    rollData: data.rollData,
    timestamp: Date.now(),
  }

  currentSession.lastActivity = Date.now()
  broadcastToSession(currentSession, message, userId)
  socket.send(JSON.stringify(message))
  return currentSession
}
