import { useEffect, useRef } from "react"
import posthog from "posthog-js"

export const RECENT_CHANGE_MINIMUM_VISIBLE_DURATION_MS = 2_000

type Options = {
    changeId: string | undefined
    opened: boolean
}

/** Tracks a change only after it has been visible in the active tab long enough to read. */
export const useRecentChangeViewedTracking = ({ changeId, opened }: Options) => {
    const trackedChangeIds = useRef(new Set<string>())

    useEffect(() => {
        if (!opened || !changeId || trackedChangeIds.current.has(changeId)) return

        let visibleDuration = 0
        let visibleSince = document.visibilityState === "visible" ? Date.now() : null
        let timeoutId: number | undefined

        const clearTimer = () => {
            if (timeoutId !== undefined) window.clearTimeout(timeoutId)
            timeoutId = undefined
        }

        const capture = () => {
            if (trackedChangeIds.current.has(changeId) || document.visibilityState !== "visible")
                return
            trackedChangeIds.current.add(changeId)
            try {
                posthog.capture("recent_change_viewed", {
                    recent_change_id: changeId,
                    minimum_visible_duration_ms: RECENT_CHANGE_MINIMUM_VISIBLE_DURATION_MS
                })
            } catch (error) {
                console.warn("PostHog recent change view tracking failed:", error)
            }
        }

        const scheduleCapture = () => {
            clearTimer()
            if (visibleSince === null) return
            const remaining = RECENT_CHANGE_MINIMUM_VISIBLE_DURATION_MS - visibleDuration
            timeoutId = window.setTimeout(capture, Math.max(0, remaining))
        }

        const onVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                visibleSince = Date.now()
                scheduleCapture()
                return
            }

            if (visibleSince !== null) visibleDuration += Date.now() - visibleSince
            visibleSince = null
            clearTimer()
        }

        scheduleCapture()
        document.addEventListener("visibilitychange", onVisibilityChange)
        return () => {
            document.removeEventListener("visibilitychange", onVisibilityChange)
            clearTimer()
        }
    }, [changeId, opened])
}
