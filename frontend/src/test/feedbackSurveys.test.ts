import { beforeEach, describe, expect, it, vi } from "vitest"
import {
    getFeedbackSurveyCount,
    getFeedbackSurveyStorageKey,
    incrementFeedbackSurveyCount,
    triggerFeedbackSurveyEligibilityOnce
} from "~/utils/feedbackSurveys"

describe("feedback survey progress", () => {
    beforeEach(() => {
        localStorage.clear()
    })

    it("increments a persistent counter and repairs invalid values", () => {
        localStorage.setItem("count", "not-a-number")

        expect(incrementFeedbackSurveyCount(localStorage, "count")).toBe(1)
        expect(incrementFeedbackSurveyCount(localStorage, "count")).toBe(2)
        expect(getFeedbackSurveyCount(localStorage, "count")).toBe(2)
    })

    it("scopes progress to the current analytics identity", () => {
        expect(getFeedbackSurveyStorageKey("count", "user/a@example.com")).toBe(
            "count:user%2Fa%40example.com"
        )
    })

    it("captures eligibility only once", () => {
        const captureEligibility = vi.fn()

        expect(
            triggerFeedbackSurveyEligibilityOnce(localStorage, "eligible", captureEligibility)
        ).toBe(true)
        expect(
            triggerFeedbackSurveyEligibilityOnce(localStorage, "eligible", captureEligibility)
        ).toBe(false)
        expect(captureEligibility).toHaveBeenCalledOnce()
    })

    it("does not mark eligibility if capture fails", () => {
        const captureEligibility = vi.fn(() => {
            throw new Error("PostHog unavailable")
        })

        expect(
            triggerFeedbackSurveyEligibilityOnce(localStorage, "eligible", captureEligibility)
        ).toBe(false)
        expect(localStorage.getItem("eligible")).toBeNull()
    })
})
