import { z } from "zod"

export const updateUserSchema = z.object({
    nickname: z.string().max(255).optional().nullable(),
    nameTagVisible: z.boolean().optional()
})

export type UpdateUserInput = z.infer<typeof updateUserSchema>
