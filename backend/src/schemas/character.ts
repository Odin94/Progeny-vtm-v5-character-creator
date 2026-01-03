import { z } from "zod"
import { characterDataSchema } from "@progeny/shared/schemas/Character.js"

export const createCharacterSchema = z.object({
    name: z.string().min(1).max(255),
    data: characterDataSchema, // Partial character schema from frontend
    version: z.number().int().positive().optional().default(1),
})

export const updateCharacterSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    data: characterDataSchema.optional(),
    version: z.number().int().positive().optional(),
})

export const characterParamsSchema = z.object({
    id: z.string().min(1),
})

export type CreateCharacterInput = z.infer<typeof createCharacterSchema>
export type UpdateCharacterInput = z.infer<typeof updateCharacterSchema>
