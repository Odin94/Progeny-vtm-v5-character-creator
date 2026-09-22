import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import posthog from "posthog-js"
import {
    handleAssetPreloadError,
    installAssetPreloadRecovery,
    getAssetReloadState,
    reportAssetPreloadRecovery
} from "~/utils/assetPreloadRecovery"

vi.mock("posthog-js", () => ({
    default: {
        capture: vi.fn()
    }
}))

const RELOAD_TIMESTAMP_KEY = "asset-preload-reload-at"

const originalLocation = window.location

// This follows Vite's preload helper: it only rethrows the failed import when
// no listener has cancelled its event.
const dispatchVitePreloadError = (error: Error) => {
    const event = Object.assign(new Event("vite:preloadError", { cancelable: true }), {
        payload: error
    })
    window.dispatchEvent(event)
    if (!event.defaultPrevented) {
        throw error
    }
}

describe("handleAssetPreloadError", () => {
    let reload: ReturnType<typeof vi.fn>
    let now = Date.now()

    beforeEach(() => {
        vi.clearAllMocks()
        vi.useFakeTimers()
        now += 60_000
        vi.setSystemTime(now)
        window.sessionStorage.clear()
        reload = vi.fn()
        delete (window as { location?: Location }).location
        ;(window as unknown as { location: unknown }).location = {
            pathname: "/sheet",
            reload
        }
    })

    afterEach(() => {
        vi.useRealTimers()
        vi.restoreAllMocks()
        window.removeEventListener("vite:preloadError", handleAssetPreloadError)
        delete (window as { location?: Location }).location
        ;(window as unknown as { location: Location }).location = originalLocation
    })

    it("records a reload timestamp and reloads on the first preload failure", () => {
        handleAssetPreloadError()

        expect(getAssetReloadState()).toBe("reload-requested")
        expect(reload).toHaveBeenCalledOnce()
        expect(window.sessionStorage.getItem(RELOAD_TIMESTAMP_KEY)).not.toBeNull()
    })

    it("does not reload again while a recent reload is within the guard window", () => {
        window.sessionStorage.setItem(RELOAD_TIMESTAMP_KEY, String(Date.now()))

        handleAssetPreloadError()

        expect(getAssetReloadState()).toBe("reload-blocked")
        expect(reload).not.toHaveBeenCalled()
    })

    it("reloads again once the guard window has elapsed", () => {
        window.sessionStorage.setItem(RELOAD_TIMESTAMP_KEY, String(Date.now() - 60_000))

        handleAssetPreloadError()

        expect(getAssetReloadState()).toBe("reload-requested")
        expect(reload).toHaveBeenCalledOnce()
    })

    it("marks storage failures as blocked instead of recovered", () => {
        vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
            throw new Error("denied")
        })
        handleAssetPreloadError()
        expect(reload).not.toHaveBeenCalled()
        expect(getAssetReloadState()).toBe("reload-blocked")
    })

    it("does not classify an unrelated later failure using an old reload attempt", () => {
        handleAssetPreloadError()
        vi.advanceTimersByTime(30_001)
        expect(getAssetReloadState()).toBe("unattempted")
        handleAssetPreloadError()
        expect(getAssetReloadState()).toBe("reload-requested")
    })

    it("keeps duplicate failures during an in-flight reload in the same group", () => {
        handleAssetPreloadError()
        handleAssetPreloadError()
        expect(reload).toHaveBeenCalledOnce()
        expect(getAssetReloadState()).toBe("reload-requested")
    })

    it("reloads while leaving the preload failure for the error boundary", () => {
        installAssetPreloadRecovery()
        const error = new Error("Failed to fetch dynamically imported module")

        expect(() => dispatchVitePreloadError(error)).toThrow(error)

        expect(getAssetReloadState()).toBe("reload-requested")
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
