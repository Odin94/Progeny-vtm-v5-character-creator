import { z } from "zod"

export const shareCharacterSchema = z.object({
    sharedWithUserNickname: z.string().min(1),
})

export const shareParamsSchema = z.object({
    characterId: z.string().min(1),
})

export type ShareCharacterInput = z.infer<typeof shareCharacterSchema>
export type ShareParams = z.infer<typeof shareParamsSchema>
