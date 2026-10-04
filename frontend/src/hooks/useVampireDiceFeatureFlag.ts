import { useEffect, useState } from "react"
import posthog from "posthog-js"

export const VAMPIRE_DICE_FEATURE_FLAG = "vampire-3d-dice"

// Local development can preview the dice without auth or PostHog. Elsewhere,
// anonymous browsers, stale identities, and unavailable flags fail closed.
export const useVampireDiceFeatureFlag = (userId?: string) => {
    const localPreview =
        import.meta.env.DEV &&
        ["localhost", "127.0.0.1", "[::1]", "::1"].includes(globalThis.location?.hostname)
    const [resolved, setResolved] = useState({ userId, enabled: false })
    useEffect(() => {
        if (localPreview) return
        const refresh = (
            _flags?: string[],
            _variants?: Record<string, string | boolean>,
            context?: { errorsLoading?: boolean }
        ) => {
            let enabled = false
            try {
                enabled =
                    !!userId &&
                    !context?.errorsLoading &&
                    posthog.get_distinct_id?.() === userId &&
                    posthog.isFeatureEnabled?.(VAMPIRE_DICE_FEATURE_FLAG, { fresh: true }) === true
            } catch {
                /* Keep the standard roller when flag evaluation is unavailable. */
            }
            setResolved({ userId, enabled })
        }
        refresh()
        return posthog.onFeatureFlags?.(refresh)
    }, [userId, localPreview])
    return localPreview || (resolved.userId === userId && resolved.enabled)
}
