import { z } from "zod"

export const adminUsersQuerySchema = z.object({
    query: z.string().max(255).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(25)
})

export const adminUserParamsSchema = z.object({
    id: z.string().min(1)
})

export const updateSuperadminSchema = z.object({
    isSuperadmin: z.boolean()
})

export const updateNameTagSchema = z.object({
    nameTagEnabled: z.boolean()
})

export const startImpersonationSchema = z.object({
    userId: z.string().min(1)
})

export type AdminUsersQuery = z.infer<typeof adminUsersQuerySchema>
export type AdminUserParams = z.infer<typeof adminUserParamsSchema>
export type UpdateSuperadminInput = z.infer<typeof updateSuperadminSchema>
export type UpdateNameTagInput = z.infer<typeof updateNameTagSchema>
export type StartImpersonationInput = z.infer<typeof startImpersonationSchema>
