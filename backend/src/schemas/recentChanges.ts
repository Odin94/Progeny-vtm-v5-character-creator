import { z } from "zod"

export const recentChangeParamsSchema = z.object({
    id: z.string().min(1)
})

export const recentChangeDraftSchema = z.object({
    title: z.string().trim().min(1).max(160),
    body: z.string().trim().min(1).max(10_000),
    linkText: z.string().trim().max(160).nullable().optional(),
    linkUrl: z.string().trim().url().max(2_048).nullable().optional()
}).refine(
    ({ linkText, linkUrl }) => Boolean(linkText) === Boolean(linkUrl),
    {
        message: "Link text and URL must be provided together",
        path: ["linkUrl"]
    }
)

export type RecentChangeParams = z.infer<typeof recentChangeParamsSchema>
export type RecentChangeDraftInput = z.infer<typeof recentChangeDraftSchema>
