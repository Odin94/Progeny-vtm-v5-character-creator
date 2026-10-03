import { useEffect, useState } from "react"
import posthog from "posthog-js"

export const VAMPIRE_DICE_FEATURE_FLAG = "vampire-3d-dice"

// Never grant this experiment to an anonymous browser or a previous signed-in
// identity. Missing flags (including blocked/offline analytics) fail closed.
export const useVampireDiceFeatureFlag = (userId?: string) => {
    const [resolved, setResolved] = useState({ userId, enabled: false })
    useEffect(() => {
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
    }, [userId])
    return resolved.userId === userId && resolved.enabled
}
