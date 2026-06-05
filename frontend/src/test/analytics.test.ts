import { beforeEach, describe, expect, it, vi } from "vitest"
import posthog from "posthog-js"
import { resetPostHogIdentity } from "~/utils/analytics"

vi.mock("react-ga4", () => ({
    default: {
        event: vi.fn(),
        send: vi.fn()
    }
}))

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
})
