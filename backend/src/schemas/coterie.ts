import { z } from "zod"

export const createCoterieSchema = z.object({
  name: z.string().min(1).max(255),
})

export const updateCoterieSchema = z.object({
  name: z.string().min(1).max(255).optional(),
})

export const addCharacterToCoterieSchema = z.object({
  characterId: z.string().min(1),
})

export const coterieParamsSchema = z.object({
  id: z.string().min(1),
})

export type CreateCoterieInput = z.infer<typeof createCoterieSchema>
export type UpdateCoterieInput = z.infer<typeof updateCoterieSchema>
export type AddCharacterToCoterieInput = z.infer<typeof addCharacterToCoterieSchema>
