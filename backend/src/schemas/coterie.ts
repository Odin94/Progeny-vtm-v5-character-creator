import { z } from "zod"

export const createCoterieSchema = z.object({
    name: z.string().min(1).max(255)
})

export const updateCoterieSchema = z.object({
    name: z.string().min(1).max(255).optional()
})

export const addCharacterToCoterieSchema = z.object({
    characterId: z.string().min(1)
})

export const coterieParamsSchema = z.object({
    id: z.string().min(1)
})

export const coterieInviteParamsSchema = coterieParamsSchema.extend({
    inviteId: z.string().min(1)
})

export const coteriePlayerParamsSchema = coterieParamsSchema.extend({
    membershipId: z.string().min(1)
})

export const coterieNoteVersionParamsSchema = coterieParamsSchema.extend({
    versionId: z.string().min(1)
})

export const acceptCoterieInviteParamsSchema = z.object({
    token: z
        .string()
        .min(32)
        .max(128)
        .regex(/^[a-zA-Z0-9_-]+$/)
})

export const coterieNoteSchema = z.object({
    content: z.string()
})

export type CreateCoterieInput = z.infer<typeof createCoterieSchema>
export type UpdateCoterieInput = z.infer<typeof updateCoterieSchema>
export type AddCharacterToCoterieInput = z.infer<typeof addCharacterToCoterieSchema>
export type CoterieParams = z.infer<typeof coterieParamsSchema>
export type CoterieInviteParams = z.infer<typeof coterieInviteParamsSchema>
export type CoteriePlayerParams = z.infer<typeof coteriePlayerParamsSchema>
export type CoterieNoteVersionParams = z.infer<typeof coterieNoteVersionParamsSchema>
export type AcceptCoterieInviteParams = z.infer<typeof acceptCoterieInviteParamsSchema>
export type CoterieNoteInput = z.infer<typeof coterieNoteSchema>
