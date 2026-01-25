import { FastifyInstance } from "fastify"
import { trackEvent } from "../utils/tracker.js"
import {
  type Session,
  type ServerMessage,
  type RateLimitEntry,
} from "./sessionChatTypes.js"

export const MAX_WEBSOCKET_MESSAGE_SIZE = 100 * 1024
export const MAX_JSON_SIZE = 50 * 1024
export const MAX_MESSAGES_PER_MINUTE = 60
export const MAX_DICE_ROLLS_PER_MINUTE = 60

export const messageRateLimits = new Map<string, RateLimitEntry>()
export const diceRollRateLimits = new Map<string, RateLimitEntry>()

export const LIMIT_CHECK_INTERVAL_MS = 60 * 60 * 1000

export const updateRateLimits = () => {
  const now = Date.now()
  for (const [userId, entry] of messageRateLimits.entries()) {
    if (now > entry.resetTime) {
      messageRateLimits.delete(userId)
    }
  }
  for (const [userId, entry] of diceRollRateLimits.entries()) {
    if (now > entry.resetTime) {
      diceRollRateLimits.delete(userId)
    }
  }
}
setInterval(updateRateLimits, LIMIT_CHECK_INTERVAL_MS)

export function sanitizeString(input: string, maxLength: number): string {
  if (typeof input !== "string") {
    return ""
  }
  return input.slice(0, maxLength).trim()
}

export function checkRateLimit(userId: string, type: "message" | "dice_roll"): { allowed: boolean; remaining?: number } {
  const now = Date.now()
  const limits = type === "message" ? messageRateLimits : diceRollRateLimits
  const maxCount = type === "message" ? MAX_MESSAGES_PER_MINUTE : MAX_DICE_ROLLS_PER_MINUTE

  const entry = limits.get(userId)
  if (!entry || now > entry.resetTime) {
    limits.set(userId, {
      count: 1,
      resetTime: now + 60000,
    })
    return { allowed: true, remaining: maxCount - 1 }
  }

  if (entry.count >= maxCount) {
    return { allowed: false }
  }

  entry.count++
  return { allowed: true, remaining: maxCount - entry.count }
}

export function parseJsonSafely(buffer: Buffer, maxSize: number): { success: boolean; data?: unknown; error?: string } {
  const size = buffer.length
  if (size > maxSize) {
    return { success: false, error: `Message size ${size} exceeds maximum ${maxSize} bytes` }
  }

  try {
    const text = buffer.toString("utf-8")
    const data = JSON.parse(text)
    return { success: true, data }
  } catch (error) {
    return { success: false, error: "Invalid JSON format" }
  }
}

export function broadcastToSession(session: Session, message: ServerMessage, excludeUserId?: string) {
  const messageStr = JSON.stringify(message)
  session.participants.forEach((participant) => {
    if (participant.userId !== excludeUserId && participant.socket.readyState === 1) {
      try {
        participant.socket.send(messageStr)
      } catch (error) {
        console.error("Error broadcasting message:", error)
      }
    }
  })
}

export function sendErrorAndTrack(
  socket: any,
  fastify: FastifyInstance,
  userId: string,
  errorMessage: string,
  errorType: string,
  additionalProps?: Record<string, string | number | boolean>
) {
  socket.send(JSON.stringify({ type: "error", message: errorMessage }))
  fastify.log.warn({
    userId,
    errorType,
    errorMessage,
    ...additionalProps,
  }, "Chat error occurred")
  trackEvent("chat-error", {
    error_type: errorType,
    error_message: errorMessage,
    ...additionalProps,
  }, userId)
}

export function validateWebSocketMessageSize(
  message: Buffer,
  socket: any,
  fastify: FastifyInstance,
  userId: string
): boolean {
  if (message.length > MAX_WEBSOCKET_MESSAGE_SIZE) {
    sendErrorAndTrack(
      socket,
      fastify,
      userId,
      `Message size exceeds maximum of ${MAX_WEBSOCKET_MESSAGE_SIZE} bytes`,
      "message_size_exceeded",
      { message_size: message.length }
    )
    return false
  }
  return true
}

export function parseJsonSafelyWithTracking(
  buffer: Buffer,
  maxSize: number,
  socket: any,
  fastify: FastifyInstance,
  userId: string
): { success: boolean; data?: unknown } {
  const parseResult = parseJsonSafely(buffer, maxSize)
  if (!parseResult.success) {
    sendErrorAndTrack(
      socket,
      fastify,
      userId,
      parseResult.error || "Invalid message format",
      "invalid_json_format"
    )
    return { success: false }
  }
  return { success: true, data: parseResult.data }
}
