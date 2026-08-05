import { describe, expect, it } from "vitest"
import {
    isFramelessSyntheticNoise,
    isResizeObserverLoopNoise,
    type ExceptionListEntry
} from "~/utils/exceptionFilter"

describe("isFramelessSyntheticNoise", () => {
    it("drops the cashback extension noise (unhandled, synthetic, no frames)", () => {
        const entry: ExceptionListEntry = {
            type: "Error",
            value: "'TypeError' captured as exception with message: 'undefined is not an object (evaluating 'response.cashbackReminder')'",
            mechanism: { handled: false, synthetic: true }
        }

        expect(isFramelessSyntheticNoise(entry)).toBe(true)
    })

    it("drops the opaque minified injected-script noise (a.L)", () => {
        const entry: ExceptionListEntry = {
            type: "Error",
            value: "'TypeError' captured as exception with message: 'undefined is not an object (evaluating 'a.L')'",
            mechanism: { handled: false, synthetic: true },
            stacktrace: { frames: [] }
        }

        expect(isFramelessSyntheticNoise(entry)).toBe(true)
    })

    it("keeps synthetic exceptions that carry an in-app frame", () => {
        const entry: ExceptionListEntry = {
            mechanism: { handled: false, synthetic: true },
            stacktrace: {
                frames: [{ in_app: false }, { in_app: true }]
            }
        }

        expect(isFramelessSyntheticNoise(entry)).toBe(false)
    })

    it("keeps handled exceptions even when frameless", () => {
        const entry: ExceptionListEntry = {
            mechanism: { handled: true, synthetic: true }
        }

        expect(isFramelessSyntheticNoise(entry)).toBe(false)
    })

    it("keeps non-synthetic exceptions even when frameless", () => {
        const entry: ExceptionListEntry = {
            mechanism: { handled: false, synthetic: false }
        }

        expect(isFramelessSyntheticNoise(entry)).toBe(false)
    })

    it("keeps exceptions with no mechanism info", () => {
        const entry: ExceptionListEntry = {
            type: "Error",
            value: "something broke"
        }

        expect(isFramelessSyntheticNoise(entry)).toBe(false)
    })

    it("handles a missing entry", () => {
        expect(isFramelessSyntheticNoise(undefined)).toBe(false)
    })
})

describe("isResizeObserverLoopNoise", () => {
    it("drops the 'completed with undelivered notifications' wording", () => {
        expect(
            isResizeObserverLoopNoise(
                "ResizeObserver loop completed with undelivered notifications."
            )
        ).toBe(true)
    })

    it("drops the 'limit exceeded' wording", () => {
        expect(isResizeObserverLoopNoise("ResizeObserver loop limit exceeded")).toBe(true)
    })

    it("matches when the message is wrapped by PostHog's captured-as-exception prefix", () => {
        expect(
            isResizeObserverLoopNoise(
                "'Error' captured as exception with message: 'ResizeObserver loop completed with undelivered notifications.'"
            )
        ).toBe(true)
    })

    it("drops when only one of several candidates matches", () => {
        expect(
            isResizeObserverLoopNoise(
                undefined,
                "ResizeObserver loop completed with undelivered notifications."
            )
        ).toBe(true)
    })

    it("keeps unrelated exception messages", () => {
        expect(isResizeObserverLoopNoise("TypeError: cannot read property of undefined")).toBe(
            false
        )
    })

    it("ignores non-string candidates", () => {
        expect(isResizeObserverLoopNoise(undefined, null, 42, {})).toBe(false)
    })
})
