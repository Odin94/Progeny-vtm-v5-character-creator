import { z } from "zod"
import { characterDataSchema } from "./CharacterSchema.js"

export const createCharacterSchema = z.object({
    name: z.string().min(1).max(255),
    data: characterDataSchema, // Partial character schema from frontend
    version: z.number().int().positive().optional().default(1)
})

export const updateCharacterSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    data: characterDataSchema.optional(),
    version: z.number().int().positive().optional()
})

export const updateCharacterVitalsSchema = z.object({
    maxHealth: z.number().min(0).max(10).int().optional(),
    willpower: z.number().min(0).max(10).int(),
    humanity: z.number().min(0).max(10).int(),
    ephemeral: z.object({
        superficialDamage: z.number().min(0).max(10).int().optional(),
        aggravatedDamage: z.number().min(0).max(10).int().optional(),
        hunger: z.number().min(0).max(5).int(),
        superficialWillpowerDamage: z.number().min(0).max(10).int(),
        aggravatedWillpowerDamage: z.number().min(0).max(10).int(),
        humanityStains: z.number().min(0).max(10).int()
    })
})

export const characterParamsSchema = z.object({
    id: z.string().min(1)
})

export const characterNoteVersionParamsSchema = characterParamsSchema.extend({
    versionId: z.string().min(1)
})

export const characterNoteSchema = z.object({
    content: z.string()
})

export type CreateCharacterInput = z.infer<typeof createCharacterSchema>
export type UpdateCharacterInput = z.infer<typeof updateCharacterSchema>
export type UpdateCharacterVitalsInput = z.infer<typeof updateCharacterVitalsSchema>
export type CharacterParams = z.infer<typeof characterParamsSchema>
export type CharacterNoteVersionParams = z.infer<typeof characterNoteVersionParamsSchema>
export type CharacterNoteInput = z.infer<typeof characterNoteSchema>
