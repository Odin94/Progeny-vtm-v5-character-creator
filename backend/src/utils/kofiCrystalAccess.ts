import { z } from "zod"
import { env } from "../config/env.js"

const flagSchema = z.object({
    key: z.literal("vampire-3d-dice"),
    active: z.literal(true),
    version: z.number().int(),
    filters: z
        .object({
            groups: z.array(
                z
                    .object({
                        properties: z.array(
                            z
                                .object({
                                    key: z.string(),
                                    type: z.string().optional(),
                                    operator: z.string(),
                                    value: z.unknown().optional()
                                })
                                .passthrough()
                        ),
                        rollout_percentage: z.number().optional()
                    })
                    .passthrough()
            )
        })
        .passthrough()
})

// PostHog's version/original_flag precondition protects concurrent donations and
// manual edits. A retry reads the latest flag rather than replacing newer rules.
export async function grantKofiCrystalAccess(email: string): Promise<void> {
    if (!env.POSTHOG_MANAGEMENT_API_KEY) throw new Error("Ko-fi integration not configured")
    const url = `${env.POSTHOG_MANAGEMENT_HOST}/api/projects/${env.POSTHOG_MANAGEMENT_PROJECT_ID}/feature_flags/${env.KO_FI_CRYSTAL_FLAG_ID}/`
    const headers = {
        Authorization: `Bearer ${env.POSTHOG_MANAGEMENT_API_KEY}`,
        "Content-Type": "application/json"
    }
    const escaped = email
        .trim()
        .toLowerCase()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const pattern = `(?i)^${escaped}$`

    for (let attempt = 0; attempt < 3; attempt++) {
        const response = await fetch(url, { headers, signal: AbortSignal.timeout(5000) })
        if (!response.ok) throw new Error("PostHog flag read failed")
        const flag = flagSchema.parse(await response.json())
        const alreadyGranted = flag.filters.groups.some(
            (group) =>
                group.rollout_percentage === 100 &&
                group.properties.length === 1 &&
                group.properties[0].key === "email" &&
                group.properties[0].type === "person" &&
                group.properties[0].operator === "regex" &&
                group.properties[0].value === pattern
        )
        if (alreadyGranted) return

        const filters = {
            ...flag.filters,
            groups: [
                ...flag.filters.groups,
                {
                    properties: [
                        { key: "email", type: "person", operator: "regex", value: pattern }
                    ],
                    rollout_percentage: 100
                }
            ]
        }
        const updated = await fetch(url, {
            method: "PATCH",
            headers,
            signal: AbortSignal.timeout(5000),
            body: JSON.stringify({
                filters,
                version: flag.version,
                original_flag: { filters: flag.filters }
            })
        })
        if (updated.status === 409) continue
        if (!updated.ok) throw new Error("PostHog flag update failed")
        return
    }
    throw new Error("PostHog flag changed repeatedly; retry payment")
}
