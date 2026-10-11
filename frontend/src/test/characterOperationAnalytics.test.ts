import { characterApiResponseSchema } from "~/utils/characterApi"
import { beforeEach, expect, it, vi } from "vitest"
import posthog from "posthog-js"
import { reportCharacterOperationFailure } from "~/utils/characterOperationAnalytics"
import { CharacterOperationError } from "~/utils/characterOperationError"
import { createCharacterIntake } from "~/modules/characterIntake"
import { getEmptyCharacter } from "~/data/Character"
import { reportCharacterValidationError } from "~/utils/characterRecoveryAnalytics"

vi.mock("posthog-js", () => ({ default: { capture: vi.fn(), captureException: vi.fn() } }))
beforeEach(() => vi.resetAllMocks())

it.each([
    [404, "not_found"],
    [403, "forbidden"],
    [409, "version_conflict"],
    [500, "request_failed"]
])("reports a blocking HTTP %s as a sanitized exception", (status, reason) => {
    const error = Object.assign(
        new Error("Private character name and server body", {
            cause: new Error("Private notes")
        }),
        { status }
    )
    reportCharacterOperationFailure("save-before-load", error, { characterId: "saved-id" })
    expect(posthog.captureException).toHaveBeenCalledWith(
        expect.objectContaining({ name: "CharacterOperationError" }),
        expect.objectContaining({
            operation: "save-before-load",
            failure_reason: reason,
            severity: "error",
            http_status: status
        })
    )
    const [exception, properties] = vi.mocked(posthog.captureException).mock.calls[0]
    expect((exception as Error).cause).toBeUndefined()
    expect((exception as Error).message).not.toContain("Private")
    expect(JSON.stringify(properties)).not.toContain("Private")
    expect(posthog.capture).not.toHaveBeenCalled()
})

it.each(["account_changed", "characters_unavailable", "name_required"] as const)(
    "reports recoverable %s as a warning",
    (reason) => {
        reportCharacterOperationFailure("save", new CharacterOperationError(reason, "Private name"))
        expect(posthog.capture).toHaveBeenCalledWith(
            "character_operation_warning",
            expect.objectContaining({ failure_reason: reason, severity: "warning" })
        )
        expect(posthog.captureException).not.toHaveBeenCalled()
    }
)

it("does not duplicate an exception already reported by validation", () => {
    const error = new SyntaxError("Private draft JSON")
    reportCharacterValidationError(error, "json-import", "json")
    reportCharacterOperationFailure("import", error)
    expect(posthog.captureException).toHaveBeenCalledTimes(1)
})

it("reports a failed storage write once while preserving the exception and original data", () => {
    const original = new DOMException("Private storage contents", "QuotaExceededError")
    const intake = createCharacterIntake(() => ({
        getItem: () => null,
        setItem: () => {
            throw original
        }
    }))
    expect(() => intake.persist(getEmptyCharacter())).toThrow(original)
    reportCharacterOperationFailure("save-and-start-new", original)
    expect(posthog.captureException).toHaveBeenCalledTimes(1)
    expect(posthog.captureException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
            operation: "storage-write",
            failure_reason: "storage_failed",
            error_type: "QuotaExceededError"
        })
    )
})

it("throttles automatic retry warnings but permits later warnings and blocking failures", () => {
    const clock = vi.spyOn(Date, "now").mockReturnValue(1_000)
    try {
        for (let i = 0; i < 3; i++)
            reportCharacterOperationFailure(
                "autosave",
                Object.assign(new Error("Unavailable"), { status: 503 }),
                { severity: "warning", characterId: "throttled" }
            )
        expect(posthog.capture).toHaveBeenCalledTimes(1)
        clock.mockReturnValue(61_001)
        reportCharacterOperationFailure(
            "autosave",
            Object.assign(new Error("Unavailable"), { status: 503 }),
            { severity: "warning", characterId: "throttled" }
        )
        expect(posthog.capture).toHaveBeenCalledTimes(2)
        reportCharacterOperationFailure(
            "autosave",
            Object.assign(new Error("Conflict"), { status: 409 }),
            { characterId: "throttled" }
        )
        expect(posthog.captureException).toHaveBeenCalledTimes(1)
    } finally {
        clock.mockRestore()
    }
})

it("does not change control flow when the analytics SDK throws", () => {
    vi.mocked(posthog.captureException).mockImplementation(() => {
        throw new Error("SDK unavailable")
    })
    vi.mocked(posthog.capture).mockImplementation(() => {
        throw new Error("SDK unavailable")
    })
    expect(() => reportCharacterOperationFailure("save", new Error("Failed"))).not.toThrow()
    expect(() =>
        reportCharacterOperationFailure("transition", undefined, { reason: "busy" })
    ).not.toThrow()
})

it("does not duplicate validation wrapped in a new API response error", () => {
    const result = characterApiResponseSchema.safeParse({
        id: "invalid-api-envelope",
        name: "Private name",
        data: { ...getEmptyCharacter(), id: "invalid-api-envelope", humanity: -1 },
        version: 11,
        characterVersion: 1,
        createdAt: "now",
        updatedAt: "now"
    })
    if (result.success) throw new Error("Expected invalid API data")
    reportCharacterOperationFailure("load", result.error)
    expect(posthog.captureException).toHaveBeenCalledTimes(1)
    expect(posthog.captureException).toHaveBeenCalledWith(
        expect.objectContaining({ name: "CharacterValidationError" }),
        expect.objectContaining({ validation_source: "api" })
    )
})

it("still reports an invalid API envelope that intake has not validated", () => {
    const result = characterApiResponseSchema.safeParse({
        id: "bad-envelope",
        name: "Private name",
        data: getEmptyCharacter(),
        version: 11,
        characterVersion: 1,
        createdAt: 123,
        updatedAt: "now"
    })
    if (result.success) throw new Error("Expected invalid envelope")
    reportCharacterOperationFailure("load", result.error)
    expect(posthog.captureException).toHaveBeenCalledTimes(1)
})

it("reports failed storage reads without swallowing the original error", () => {
    const original = new DOMException("Storage inaccessible", "SecurityError")
    const intake = createCharacterIntake(() => ({
        getItem: () => {
            throw original
        },
        setItem: vi.fn()
    }))
    expect(() => intake.persist(getEmptyCharacter())).toThrow(original)
    expect(posthog.captureException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({ operation: "storage-read", error_type: "SecurityError" })
    )
})
