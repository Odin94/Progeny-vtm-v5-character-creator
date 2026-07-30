import { z } from "zod"
import type { Character } from "~/data/Character"
import { parseCharacterData } from "./characterData"

const apiTimestampSchema = z.string().min(1)

const characterDataResponseSchema = z.unknown().transform((data, context): Character => {
    const character = parseCharacterData(data)

    if (!character) {
        context.addIssue({
            code: "custom",
            message: "Invalid character data returned by the API"
        })
        return z.NEVER
    }

    return character
})

export const characterApiResponseSchema = z.object({
    id: z.string().min(1),
    name: z.string(),
    data: characterDataResponseSchema,
    version: z.number().int().positive(),
    characterVersion: z.number().int().min(0),
    createdAt: apiTimestampSchema,
    updatedAt: apiTimestampSchema,
    shared: z.boolean().optional(),
    sharedBy: z.string().nullable().optional(),
    canEdit: z.boolean().optional()
})

export const characterApiResponseListSchema = z.array(characterApiResponseSchema)

export type CharacterApiResponse = z.infer<typeof characterApiResponseSchema>

export type CreateCharacterPayload = {
    name: string
    data: Character
    version?: number
}

export type UpdateCharacterPayload = {
    name?: string
    data?: Character
    version?: number
}
