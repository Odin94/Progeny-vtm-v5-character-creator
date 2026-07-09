import { describe, expect, it } from "vitest"
import {
    isFramelessSyntheticNoise,
    isRrwebRecursionNoise,
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

describe("isRrwebRecursionNoise", () => {
    it("drops Firefox's 'too much recursion' thrown inside bundled rrweb", () => {
        const entry: ExceptionListEntry = {
            type: "InternalError",
            value: "too much recursion",
            stacktrace: {
                frames: [
                    { function: "O.getId", filename: "../../rrweb/record/dist/rrweb-record.js" }
                ] as never
            }
        }

        expect(isRrwebRecursionNoise(entry)).toBe(true)
    })

    it("drops the Chromium 'Maximum call stack size exceeded' rrweb variant", () => {
        const entry: ExceptionListEntry = {
            type: "RangeError",
            value: "Maximum call stack size exceeded",
            stacktrace: {
                frames: [{ abs_path: "https://cdn.example.com/rrweb-record.js" }] as never
            }
        }

        expect(isRrwebRecursionNoise(entry)).toBe(true)
    })

    it("keeps stack overflows that do not originate in rrweb", () => {
        const entry: ExceptionListEntry = {
            type: "RangeError",
            value: "Maximum call stack size exceeded",
            stacktrace: {
                frames: [{ filename: "src/utils/character.ts", in_app: true }] as never
            }
        }

        expect(isRrwebRecursionNoise(entry)).toBe(false)
    })

    it("keeps non-recursion errors that merely touch rrweb frames", () => {
        const entry: ExceptionListEntry = {
            type: "TypeError",
            value: "n is undefined",
            stacktrace: {
                frames: [{ filename: "../../rrweb/record/dist/rrweb-record.js" }] as never
            }
        }

        expect(isRrwebRecursionNoise(entry)).toBe(false)
    })

    it("keeps a recursion error with no stack frames", () => {
        const entry: ExceptionListEntry = {
            type: "InternalError",
            value: "too much recursion"
        }

        expect(isRrwebRecursionNoise(entry)).toBe(false)
    })

    it("handles a missing entry", () => {
        expect(isRrwebRecursionNoise(undefined)).toBe(false)
    })
})
