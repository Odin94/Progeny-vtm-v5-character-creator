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

it("pairs attempt outcomes once and tolerates SDK failures", async () => {
    const { beginSaveAndStartNewAttempt } = await import("~/utils/characterOperationAnalytics")
    vi.mocked(posthog.capture).mockClear()
    const finish = beginSaveAndStartNewAttempt()
    finish("cancelled", "interrupted")
    finish("success")
    const calls = vi.mocked(posthog.capture).mock.calls
    expect(calls).toHaveLength(2)
    expect(calls[0][1]!.operation_id).toBe(calls[1][1]!.operation_id)
    expect(calls[1][1]).toMatchObject({ outcome: "cancelled", reason: "interrupted" })
    vi.mocked(posthog.capture).mockImplementationOnce(() => {
        throw new Error("SDK unavailable")
    })
    expect(() => beginSaveAndStartNewAttempt()("success")).not.toThrow()
})

it.each([
    ["save", "version_conflict"],
    ["save-before-load", "version_conflict"],
    ["save-before-load", "not_found"],
    ["save-before-import", "request_failed"],
    ["restore-deleted-draft", "not_found"],
    ["storage-write", "storage_failed"]
] as const)("keeps at-risk %s/%s in error tracking despite warning UI", (operation, reason) => {
    reportCharacterOperationFailure(operation, undefined, { severity: "warning", reason })
    expect(posthog.capture).not.toHaveBeenCalled()
    expect(posthog.captureException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
            operation,
            failure_reason: reason,
            severity: "error",
            data_loss_risk: true
        })
    )
})

it("keeps a load version confirmation as a normal event", () => {
    reportCharacterOperationFailure("load", undefined, {
        severity: "warning",
        reason: "version_conflict"
    })
    expect(posthog.captureException).not.toHaveBeenCalled()
    expect(posthog.capture).toHaveBeenCalledWith(
        "character_operation_warning",
        expect.objectContaining({ data_loss_risk: false })
    )
})

it("reports recovery-copy storage failure without exposing draft contents or interrupting the caller", async () => {
    const { preserveCharacterDraft } = await import("~/utils/characterDraft")
    const write = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new DOMException("Private draft contents", "QuotaExceededError")
    })
    try {
        expect(() =>
            preserveCharacterDraft(
                { ...getEmptyCharacter(), notes: "Private notes" },
                "Private reason"
            )
        ).not.toThrow()
        expect(posthog.captureException).toHaveBeenCalledWith(
            expect.any(Error),
            expect.objectContaining({
                operation: "preserve-draft",
                data_loss_risk: true,
                severity: "error"
            })
        )
        expect(JSON.stringify(vi.mocked(posthog.captureException).mock.calls)).not.toContain(
            "Private"
        )
    } finally {
        write.mockRestore()
    }
})

it.each(["save", "save-before-load", "autosave"] as const)(
    "reports modal-resolvable %s conflicts as ordinary events with full metadata",
    (operation) => {
        const error = Object.assign(new Error("Private character contents"), { status: 409 })
        reportCharacterOperationFailure(operation, error, {
            resolution: "modal",
            characterId: "modal-conflict",
            localVersion: 4,
            remoteVersion: 85,
            hasConfirmedBase: true
        })
        expect(posthog.captureException).not.toHaveBeenCalled()
        expect(posthog.capture).toHaveBeenCalledWith(
            "character_operation_warning",
            expect.objectContaining({
                operation,
                failure_reason: "version_conflict",
                severity: "warning",
                http_status: 409,
                character_id: "modal-conflict",
                local_version: 4,
                remote_version: 85,
                has_confirmed_base: true,
                data_loss_risk: true,
                resolution: "modal"
            })
        )
        expect(JSON.stringify(vi.mocked(posthog.capture).mock.calls)).not.toContain("Private")
    }
)

it("does not suppress a new autosave conflict revision within the throttle window", () => {
    reportCharacterOperationFailure("autosave", undefined, {
        reason: "version_conflict",
        resolution: "modal",
        characterId: "changed-revision",
        localVersion: 4,
        remoteVersion: 85
    })
    reportCharacterOperationFailure("autosave", undefined, {
        reason: "version_conflict",
        resolution: "modal",
        characterId: "changed-revision",
        localVersion: 4,
        remoteVersion: 86
    })
    expect(posthog.capture).toHaveBeenCalledTimes(2)
})

it("keeps actual storage failures in error tracking even when a modal is offered", () => {
    reportCharacterOperationFailure("save", undefined, {
        reason: "storage_failed",
        severity: "warning",
        resolution: "modal"
    })
    expect(posthog.captureException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({ failure_reason: "storage_failed", severity: "error" })
    )
    expect(posthog.capture).not.toHaveBeenCalled()
})
