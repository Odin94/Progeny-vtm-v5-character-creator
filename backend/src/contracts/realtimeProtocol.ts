import { z } from "zod"

export const MAX_MESSAGE_LENGTH = 5000
export const MAX_SESSION_HISTORY_MESSAGES = 100

const dieSchema = z.object({
    id: z.number().int(),
    value: z.number().int(),
    isBloodDie: z.boolean()
})

const diceRollPoolInfoSchema = z.object({
    attribute: z.string().optional(),
    skill: z.string().optional(),
    discipline: z.string().optional(),
    diceCount: z.number().int().min(0),
    bloodDiceCount: z.number().int().min(0),
    bloodSurge: z.boolean().optional(),
    specialtyBonus: z.number().int().min(0).optional(),
    disciplinePowerBonus: z.number().int().min(0).optional(),
    meritFlawBonus: z.number().int().optional()
})

const diceRollResultSchema = z.object({ type: z.string(), value: z.number() })

export const diceRollDataSchema = z.object({
    dice: z.array(dieSchema).max(100, "Too many dice (maximum 100)"),
    totalSuccesses: z.number().int(),
    results: z.array(diceRollResultSchema).max(200, "Too many results (maximum 200)"),
    poolInfo: diceRollPoolInfoSchema.optional(),
    rollId: z.string().optional(),
    isReroll: z.boolean().optional()
})

export const messageSchema = z
    .string()
    .min(1, "Message cannot be empty")
    .max(MAX_MESSAGE_LENGTH, `Message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters`)

export const sessionIdSchema = z
    .string()
    .max(100, "Session ID exceeds maximum length of 100 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Session ID contains invalid characters")

const characterNameSchema = z.string().max(200, "Character name exceeds maximum length of 200 characters").optional()

export const joinSessionMessageSchema = z.object({
    type: z.literal("join_session"),
    sessionId: sessionIdSchema.optional(),
    coterieId: sessionIdSchema.optional(),
    characterName: characterNameSchema
})
export const leaveSessionMessageSchema = z.object({ type: z.literal("leave_session") })
export const chatMessageSchema = z.object({
    type: z.literal("chat_message"),
    message: messageSchema,
    characterName: characterNameSchema
})
export const diceRollMessageSchema = z.object({
    type: z.literal("dice_roll"),
    rollData: diceRollDataSchema,
    characterName: characterNameSchema
})
export const rouseCheckMessageSchema = z.object({
    type: z.literal("rouse_check"),
    roll: z.number().int().min(1).max(10),
    success: z.boolean(),
    newHunger: z.number().int().min(0).max(5),
    characterName: characterNameSchema
})
export const remorseCheckMessageSchema = z.object({
    type: z.literal("remorse_check"),
    rolls: z.array(z.number().int().min(1).max(10)).max(10),
    successes: z.number().int().min(0),
    passed: z.boolean(),
    newHumanity: z.number().int().min(0).max(10),
    characterName: characterNameSchema
})

export const clientMessageSchema = z.discriminatedUnion("type", [
    joinSessionMessageSchema,
    leaveSessionMessageSchema,
    chatMessageSchema,
    diceRollMessageSchema,
    rouseCheckMessageSchema,
    remorseCheckMessageSchema
])

const identitySchema = z.object({
    userId: z.string(),
    userName: z.string(),
    showNameTag: z.boolean(),
    characterName: characterNameSchema
})
const timestampSchema = z.number().int()
const chatMessageReceivedSchema = identitySchema.extend({
    type: z.literal("chat_message"), message: messageSchema, timestamp: timestampSchema
})
const diceRollReceivedSchema = identitySchema.extend({
    type: z.literal("dice_roll"), rollData: diceRollDataSchema, timestamp: timestampSchema
})
const rouseCheckReceivedSchema = identitySchema.extend({
    type: z.literal("rouse_check"), roll: z.number().int(), success: z.boolean(), newHunger: z.number().int(), timestamp: timestampSchema
})
const remorseCheckReceivedSchema = identitySchema.extend({
    type: z.literal("remorse_check"), rolls: z.array(z.number().int()), successes: z.number().int(), passed: z.boolean(), newHumanity: z.number().int(), timestamp: timestampSchema
})

export const serverMessageSchema = z.discriminatedUnion("type", [
    z.object({ type: z.literal("session_joined"), sessionId: z.string(), sessionType: z.enum(["temporary", "coterie"]), coterieId: z.string().optional(), participants: z.array(identitySchema), history: z.array(z.union([chatMessageReceivedSchema, diceRollReceivedSchema, rouseCheckReceivedSchema, remorseCheckReceivedSchema])).optional() }),
    identitySchema.extend({ type: z.literal("user_joined") }),
    z.object({ type: z.literal("user_left"), userId: z.string() }),
    z.object({ type: z.literal("user_identity_updated"), userId: z.string(), showNameTag: z.boolean(), userName: z.string().optional() }),
    z.object({ type: z.literal("session_closed"), reason: z.enum(["coterie_deleted", "removed_from_coterie"]), message: z.string() }),
    chatMessageReceivedSchema,
    diceRollReceivedSchema,
    rouseCheckReceivedSchema,
    remorseCheckReceivedSchema,
    z.object({ type: z.literal("error"), message: z.string(), timestamp: timestampSchema.optional() })
])

export type ClientMessage = z.infer<typeof clientMessageSchema>
export type JoinSessionMessage = z.infer<typeof joinSessionMessageSchema>
export type LeaveSessionMessage = z.infer<typeof leaveSessionMessageSchema>
export type ChatMessage = z.infer<typeof chatMessageSchema>
export type DiceRollMessage = z.infer<typeof diceRollMessageSchema>
export type RouseCheckMessage = z.infer<typeof rouseCheckMessageSchema>
export type RemorseCheckMessage = z.infer<typeof remorseCheckMessageSchema>
export type ParticipantIdentity = z.infer<typeof identitySchema>
export type ChatMessageReceived = z.infer<typeof chatMessageReceivedSchema>
export type DiceRollReceived = z.infer<typeof diceRollReceivedSchema>
export type RouseCheckReceived = z.infer<typeof rouseCheckReceivedSchema>
export type RemorseCheckReceived = z.infer<typeof remorseCheckReceivedSchema>
export type SessionHistoryMessage = ChatMessageReceived | DiceRollReceived | RouseCheckReceived | RemorseCheckReceived
export type ServerMessage = z.infer<typeof serverMessageSchema>
export type SessionJoinedMessage = Extract<ServerMessage, { type: "session_joined" }>
export type UserJoinedMessage = Extract<ServerMessage, { type: "user_joined" }>
export type UserLeftMessage = Extract<ServerMessage, { type: "user_left" }>
export type UserIdentityUpdatedMessage = Extract<ServerMessage, { type: "user_identity_updated" }>
export type SessionClosedMessage = Extract<ServerMessage, { type: "session_closed" }>
