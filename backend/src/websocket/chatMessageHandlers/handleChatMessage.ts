import { FastifyInstance } from "fastify"
import { trackEvent } from "../../utils/tracker.js"
import {
  type Session,
  type ChatMessage,
  type ChatMessageReceived,
  MAX_MESSAGE_LENGTH,
} from "../sessionChatTypes.js"
import { sendErrorAndTrack, checkRateLimit, sanitizeString, broadcastToSession } from "../sessionChatUtils.js"

export async function handleChatMessage(
  data: ChatMessage,
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
      { message_type: "chat_message" }
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
      { message_type: "chat_message", session_id: currentSession.id }
    )
    return currentSession
  }

  const rateLimitResult = checkRateLimit(userId, "message")
  if (!rateLimitResult.allowed) {
    trackEvent("chat-rate-limit-exceeded", {
      rate_limit_type: "message",
      session_type: currentSession.type,
      session_id: currentSession.id,
    }, userId).catch(() => {
      // Ignore tracking errors
    })
    fastify.log.warn({
      userId,
      errorType: "rate_limit_exceeded",
      rate_limit_type: "message",
      session_type: currentSession.type,
      session_id: currentSession.id,
    }, "Chat rate limit exceeded")
    socket.send(JSON.stringify({ type: "error", message: "Rate limit exceeded. Please slow down." }))
    return currentSession
  }

  const sanitizedMessage = sanitizeString(data.message, MAX_MESSAGE_LENGTH)

  const message: ChatMessageReceived = {
    type: "chat_message",
    userName: participant.userName,
    characterName: participant.characterName,
    message: sanitizedMessage,
    timestamp: Date.now(),
  }

  currentSession.lastActivity = Date.now()
  broadcastToSession(currentSession, message, userId)
  socket.send(JSON.stringify(message))
  return currentSession
}
