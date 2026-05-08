import { z } from "zod"

export const adminUsersQuerySchema = z.object({
    query: z.string().max(255).optional()
})

export const adminUserParamsSchema = z.object({
    id: z.string().min(1)
})

export const updateSuperadminSchema = z.object({
    isSuperadmin: z.boolean()
})

export const startImpersonationSchema = z.object({
    userId: z.string().min(1)
})

export type AdminUsersQuery = z.infer<typeof adminUsersQuerySchema>
export type AdminUserParams = z.infer<typeof adminUserParamsSchema>
export type UpdateSuperadminInput = z.infer<typeof updateSuperadminSchema>
export type StartImpersonationInput = z.infer<typeof startImpersonationSchema>
