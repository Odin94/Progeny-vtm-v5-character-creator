import { z } from "zod"

export const MAX_MESSAGE_LENGTH = 5000

export type Participant = {
  userId: string
  userName: string
  characterName?: string
  socket: any
}

export type Session = {
  id: string
  type: "temporary" | "coterie"
  coterieId?: string
  participants: Map<string, Participant>
  createdAt: number
  lastActivity: number
}

export type JoinSessionMessage = {
  type: "join_session"
  sessionId?: string
  coterieId?: string
}

export type LeaveSessionMessage = {
  type: "leave_session"
}

export type ChatMessage = {
  type: "chat_message"
  message: string
}

export type DiceRollMessage = {
  type: "dice_roll"
  rollData: {
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
  }
}

export type RouseCheckMessage = {
  type: "rouse_check"
  roll: number
  success: boolean
  newHunger: number
}

export type ClientMessage = JoinSessionMessage | LeaveSessionMessage | ChatMessage | DiceRollMessage | RouseCheckMessage

export type SessionJoinedMessage = {
  type: "session_joined"
  sessionId: string
  sessionType: "temporary" | "coterie"
  participants: Array<{ userId: string; userName: string; characterName?: string }>
}

export type UserJoinedMessage = {
  type: "user_joined"
  userId: string
  userName: string
  characterName?: string
}

export type UserLeftMessage = {
  type: "user_left"
  userId: string
}

export type ChatMessageReceived = {
  type: "chat_message"
  userName: string
  characterName?: string
  message: string
  timestamp: number
}

export type DiceRollReceived = {
  type: "dice_roll"
  userName: string
  characterName?: string
  rollData: {
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
  }
  timestamp: number
}

export type RouseCheckReceived = {
  type: "rouse_check"
  userName: string
  characterName?: string
  roll: number
  success: boolean
  newHunger: number
  timestamp: number
}

export type ServerMessage =
  | SessionJoinedMessage
  | UserJoinedMessage
  | UserLeftMessage
  | ChatMessageReceived
  | DiceRollReceived
  | RouseCheckReceived
  | { type: "error"; message: string }

export type RateLimitEntry = {
  count: number
  resetTime: number
}

const dieSchema = z.object({
  id: z.number().int(),
  value: z.number().int(),
  isBloodDie: z.boolean(),
})

const diceRollPoolInfoSchema = z.object({
  attribute: z.string().optional(),
  skill: z.string().optional(),
  discipline: z.string().optional(),
  diceCount: z.number().int().min(0),
  bloodDiceCount: z.number().int().min(0),
  bloodSurge: z.boolean().optional(),
})

const diceRollResultSchema = z.object({
  type: z.string(),
  value: z.number(),
})

const diceRollDataSchema = z.object({
  dice: z.array(dieSchema).max(100, "Too many dice (maximum 100)"),
  totalSuccesses: z.number().int(),
  results: z.array(diceRollResultSchema).max(200, "Too many results (maximum 200)"),
  poolInfo: diceRollPoolInfoSchema.optional(),
  rollId: z.string().optional(),
  isReroll: z.boolean().optional(),
})

export const messageSchema = z
  .string()
  .min(1, "Message cannot be empty")
  .max(MAX_MESSAGE_LENGTH, `Message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters`)

export const sessionIdSchema = z
  .string()
  .max(100, "Session ID exceeds maximum length of 100 characters")
  .regex(/^[a-zA-Z0-9_-]+$/, "Session ID contains invalid characters")

export const joinSessionMessageSchema = z.object({
  type: z.literal("join_session"),
  sessionId: sessionIdSchema.optional(),
  coterieId: sessionIdSchema.optional(),
})

export const leaveSessionMessageSchema = z.object({
  type: z.literal("leave_session"),
})

export const chatMessageSchema = z.object({
  type: z.literal("chat_message"),
  message: messageSchema,
})

export const diceRollMessageSchema = z.object({
  type: z.literal("dice_roll"),
  rollData: diceRollDataSchema,
})

export const rouseCheckMessageSchema = z.object({
  type: z.literal("rouse_check"),
  roll: z.number().int().min(1).max(10),
  success: z.boolean(),
  newHunger: z.number().int().min(0).max(5),
})

export const clientMessageSchema = z.discriminatedUnion("type", [
  joinSessionMessageSchema,
  leaveSessionMessageSchema,
  chatMessageSchema,
  diceRollMessageSchema,
  rouseCheckMessageSchema,
])
