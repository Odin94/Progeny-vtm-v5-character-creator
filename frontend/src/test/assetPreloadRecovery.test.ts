import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import posthog from "posthog-js"
import { handleAssetPreloadError, reportAssetPreloadRecovery } from "~/utils/assetPreloadRecovery"

vi.mock("posthog-js", () => ({
    default: {
        capture: vi.fn()
    }
}))

const RELOAD_TIMESTAMP_KEY = "asset-preload-reload-at"

const originalLocation = window.location

describe("handleAssetPreloadError", () => {
    let reload: ReturnType<typeof vi.fn>

    beforeEach(() => {
        vi.clearAllMocks()
        window.sessionStorage.clear()
        reload = vi.fn()
        delete (window as { location?: Location }).location
        ;(window as unknown as { location: unknown }).location = {
            pathname: "/sheet",
            reload
        }
    })

    afterEach(() => {
        delete (window as { location?: Location }).location
        ;(window as unknown as { location: Location }).location = originalLocation
    })

    it("records a reload timestamp and reloads on the first preload failure", () => {
        const event = new Event("vite:preloadError", { cancelable: true })

        handleAssetPreloadError(event)

        expect(reload).toHaveBeenCalledOnce()
        expect(event.defaultPrevented).toBe(true)
        expect(window.sessionStorage.getItem(RELOAD_TIMESTAMP_KEY)).not.toBeNull()
    })

    it("does not reload again while a recent reload is within the guard window", () => {
        window.sessionStorage.setItem(RELOAD_TIMESTAMP_KEY, String(Date.now()))
        const event = new Event("vite:preloadError", { cancelable: true })

        handleAssetPreloadError(event)

        expect(reload).not.toHaveBeenCalled()
        expect(event.defaultPrevented).toBe(false)
    })

    it("reloads again once the guard window has elapsed", () => {
        window.sessionStorage.setItem(RELOAD_TIMESTAMP_KEY, String(Date.now() - 60_000))
        const event = new Event("vite:preloadError", { cancelable: true })

        handleAssetPreloadError(event)

        expect(reload).toHaveBeenCalledOnce()
    })
})

describe("reportAssetPreloadRecovery", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        window.sessionStorage.clear()
        window.history.replaceState(null, "", "/sheet")
    })

    it("captures a recovery event after a recent preload-triggered reload", () => {
        window.sessionStorage.setItem(RELOAD_TIMESTAMP_KEY, String(Date.now()))

        reportAssetPreloadRecovery()

        expect(posthog.capture).toHaveBeenCalledWith("asset-preload-recovered", { page: "/sheet" })
    })

    it("does not capture a recovery event on a normal load", () => {
        reportAssetPreloadRecovery()

        expect(posthog.capture).not.toHaveBeenCalled()
    })

    it("does not capture a recovery event for a stale reload outside the guard window", () => {
        window.sessionStorage.setItem(RELOAD_TIMESTAMP_KEY, String(Date.now() - 60_000))

        reportAssetPreloadRecovery()

        expect(posthog.capture).not.toHaveBeenCalled()
    })
})
