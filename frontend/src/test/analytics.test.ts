import { beforeEach, describe, expect, it, vi } from "vitest"
import posthog from "posthog-js"
import {
    removeUtmParametersFromCurrentUrl,
    resetPostHogIdentity,
    trackFeatureGuideNavigationSelected,
    trackFeatureGuideOpened
} from "~/utils/analytics"

vi.mock("posthog-js", () => ({
    default: {
        capture: vi.fn(),
        get_explicit_consent_status: vi.fn(),
        opt_in_capturing: vi.fn(),
        opt_out_capturing: vi.fn(),
        reset: vi.fn()
    }
}))

describe("resetPostHogIdentity", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("restores granted consent after resetting identity", () => {
        vi.mocked(posthog.get_explicit_consent_status).mockReturnValue("granted")

        resetPostHogIdentity()

        expect(posthog.reset).toHaveBeenCalledOnce()
        expect(posthog.opt_in_capturing).toHaveBeenCalledWith({ captureEventName: false })
        expect(posthog.opt_out_capturing).not.toHaveBeenCalled()
    })

    it("restores denied consent after resetting identity", () => {
        vi.mocked(posthog.get_explicit_consent_status).mockReturnValue("denied")

        resetPostHogIdentity()

        expect(posthog.reset).toHaveBeenCalledOnce()
        expect(posthog.opt_out_capturing).toHaveBeenCalledOnce()
        expect(posthog.opt_in_capturing).not.toHaveBeenCalled()
    })

    it("keeps pending consent pending after resetting identity", () => {
        vi.mocked(posthog.get_explicit_consent_status).mockReturnValue("pending")

        resetPostHogIdentity()

        expect(posthog.reset).toHaveBeenCalledOnce()
        expect(posthog.opt_in_capturing).not.toHaveBeenCalled()
        expect(posthog.opt_out_capturing).not.toHaveBeenCalled()
    })

    it("captures a feature guide entry point without user data", () => {
        trackFeatureGuideOpened("account-page")

        expect(posthog.capture).toHaveBeenCalledWith("feature_guide_opened", {
            entry_point: "account-page"
        })
    })

    it("captures the selected guide page and optional section", () => {
        trackFeatureGuideNavigationSelected({ page: "character-sheet", section: "rolling-dice" })

        expect(posthog.capture).toHaveBeenCalledWith("feature_guide_navigation_selected", {
            page: "character-sheet",
            section: "rolling-dice"
        })
    })
})

describe("removeUtmParametersFromCurrentUrl", () => {
    beforeEach(() => {
        window.history.replaceState(null, "", "/")
    })

    it("removes UTM parameters without affecting the route, other query parameters, or hash", () => {
        window.history.replaceState(
            null,
            "",
            "/features/character-creation?utm_source=reddit&utm_medium=3.4&utm_campaign=vtm&tab=overview#details"
        )

        expect(removeUtmParametersFromCurrentUrl()).toBe(true)

        expect(window.location.pathname).toBe("/features/character-creation")
        expect(window.location.search).toBe("?tab=overview")
        expect(window.location.hash).toBe("#details")
    })

    it("does not update the URL when it has no UTM parameters", () => {
        window.history.replaceState(null, "", "/features/character-creation?tab=overview#details")
        const replaceState = vi.spyOn(window.history, "replaceState")

        expect(removeUtmParametersFromCurrentUrl()).toBe(false)
        expect(replaceState).not.toHaveBeenCalled()
    })
})
