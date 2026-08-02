import { act, renderHook } from "@testing-library/react"
import posthog from "posthog-js"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
    RECENT_CHANGE_MINIMUM_VISIBLE_DURATION_MS,
    useRecentChangeViewedTracking
} from "~/hooks/useRecentChangeViewedTracking"

vi.mock("posthog-js", () => ({
    default: { capture: vi.fn() }
}))

const setVisibility = (visibilityState: DocumentVisibilityState) => {
    Object.defineProperty(document, "visibilityState", {
        configurable: true,
        value: visibilityState
    })
    document.dispatchEvent(new Event("visibilitychange"))
}

describe("useRecentChangeViewedTracking", () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.mocked(posthog.capture).mockReset()
        setVisibility("visible")
    })

    afterEach(() => {
        vi.useRealTimers()
        setVisibility("visible")
    })

    it("tracks an announcement after it has been visible long enough", () => {
        renderHook(() => useRecentChangeViewedTracking({ changeId: "change-1", opened: true }))

        act(() => vi.advanceTimersByTime(RECENT_CHANGE_MINIMUM_VISIBLE_DURATION_MS - 1))
        expect(posthog.capture).not.toHaveBeenCalled()

        act(() => vi.advanceTimersByTime(1))
        expect(posthog.capture).toHaveBeenCalledWith("recent_change_viewed", {
            recent_change_id: "change-1",
            minimum_visible_duration_ms: RECENT_CHANGE_MINIMUM_VISIBLE_DURATION_MS
        })
    })

    it("does not count time while the tab is hidden", () => {
        renderHook(() => useRecentChangeViewedTracking({ changeId: "change-1", opened: true }))

        act(() => vi.advanceTimersByTime(1_000))
        act(() => setVisibility("hidden"))
        act(() => vi.advanceTimersByTime(10_000))
        expect(posthog.capture).not.toHaveBeenCalled()

        act(() => setVisibility("visible"))
        act(() => vi.advanceTimersByTime(999))
        expect(posthog.capture).not.toHaveBeenCalled()
        act(() => vi.advanceTimersByTime(1))
        expect(posthog.capture).toHaveBeenCalledOnce()
    })
})
