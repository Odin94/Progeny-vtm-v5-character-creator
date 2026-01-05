import { z } from "zod"

export const updateUserSchema = z.object({
    nickname: z.string().max(255).optional().nullable(),
})

export type UpdateUserInput = z.infer<typeof updateUserSchema>
