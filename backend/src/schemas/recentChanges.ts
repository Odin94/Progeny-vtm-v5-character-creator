import { z } from "zod"

export const recentChangeParamsSchema = z.object({
    id: z.string().min(1)
})

export const recentChangeDraftSchema = z.object({
    title: z.string().trim().min(1).max(160),
    body: z.string().trim().min(1).max(10_000)
})

export type RecentChangeParams = z.infer<typeof recentChangeParamsSchema>
export type RecentChangeDraftInput = z.infer<typeof recentChangeDraftSchema>
