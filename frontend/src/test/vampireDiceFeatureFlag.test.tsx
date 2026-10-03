import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useVampireDiceFeatureFlag } from "~/hooks/useVampireDiceFeatureFlag"

const flags = vi.hoisted(() => ({
    identity: "user-a",
    enabled: false,
    refresh: () => {},
    unsubscribe: vi.fn()
}))
vi.mock("posthog-js", () => ({
    default: {
        get_distinct_id: () => flags.identity,
        isFeatureEnabled: () => flags.enabled,
        onFeatureFlags: (refresh: () => void) => {
            flags.refresh = refresh
            return flags.unsubscribe
        }
    }
}))
describe("per-user vampire dice rollout", () => {
    beforeEach(() => {
        flags.identity = "user-a"
        flags.enabled = false
        flags.unsubscribe.mockClear()
    })
    it("defaults to legacy and responds to flag updates for the identified user", () => {
        const hook = renderHook(() => useVampireDiceFeatureFlag("user-a"))
        expect(hook.result.current).toBe(false)
        act(() => {
            flags.enabled = true
            flags.refresh()
        })
        expect(hook.result.current).toBe(true)
        act(() => {
            flags.enabled = false
            flags.refresh()
        })
        expect(hook.result.current).toBe(false)
        hook.unmount()
        expect(flags.unsubscribe).toHaveBeenCalledOnce()
    })
    it("never transfers an enabled flag to anonymous or different users", () => {
        flags.enabled = true
        const hook = renderHook(({ userId }) => useVampireDiceFeatureFlag(userId), {
            initialProps: { userId: "user-a" as string | undefined }
        })
        expect(hook.result.current).toBe(true)
        hook.rerender({ userId: "user-b" })
        expect(hook.result.current).toBe(false)
        hook.rerender({ userId: undefined })
        expect(hook.result.current).toBe(false)
    })
})
