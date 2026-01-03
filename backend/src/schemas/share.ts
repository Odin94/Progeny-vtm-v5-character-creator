import { z } from "zod"

export const shareCharacterSchema = z.object({
  sharedWithUserEmail: z.string().email(),
})

export const shareParamsSchema = z.object({
  characterId: z.string().min(1),
})

export type ShareCharacterInput = z.infer<typeof shareCharacterSchema>
