import { beforeEach, describe, expect, it, vi } from "vitest"
import { renderHook } from "@testing-library/react"
import posthog from "posthog-js"
import { characterSchema, getEmptyCharacter } from "~/data/Character"
import {
    reportCharacterValidationError,
    trackCharacterRepair
} from "~/utils/characterRecoveryAnalytics"
import { previewCharacterRepair } from "~/utils/repairCharacter"
import { useCharacterLocalStorage } from "~/hooks/useCharacterLocalStorage"
import { characterApiResponseSchema } from "~/utils/characterApi"
import { loadCharacterFromJson } from "~/components/LoadModal"

vi.mock("posthog-js", () => ({ default: { capture: vi.fn(), captureException: vi.fn() } }))
let sequence = 0
const invalid = () => ({
    ...getEmptyCharacter(),
    id: `telemetry-${++sequence}`,
    humanity: -1,
    notes: "Private chronicle notes must not be sent"
})

beforeEach(() => {
    vi.resetAllMocks()
    localStorage.clear()
})

describe("character recovery telemetry", () => {
    it("reports final local validation failures as actual exceptions with field paths", () => {
        const character = invalid()
        localStorage.setItem("character", JSON.stringify(character))
        const { result } = renderHook(() => useCharacterLocalStorage())
        expect(result.current[0]).toEqual(getEmptyCharacter())
        expect(posthog.captureException).toHaveBeenCalledOnce()
        const [error, properties] = vi.mocked(posthog.captureException).mock.calls[0]
        expect(error).toBeInstanceOf(Error)
        expect(error).toMatchObject({ name: "CharacterValidationError" })
        expect(properties).toMatchObject({
            character_id: character.id,
            validation_source: "local-storage",
            validation_issues: [{ path: "humanity", code: "too_small" }]
        })
        expect(JSON.stringify(properties)).not.toContain(character.notes)
    })

    it("names the underlying fault and fingerprints it stably on compatibility failures", () => {
        const cause = new Error("primitive predator type")
        const underlying = new TypeError("Cannot create property 'x' on string 'y'", { cause })
        reportCharacterValidationError(underlying, "local-storage", "compatibility", {
            id: "compat-1",
            version: 5
        })
        expect(posthog.captureException).toHaveBeenCalledOnce()
        const [exception, properties] = vi.mocked(posthog.captureException).mock.calls[0]
        expect((exception as Error).cause).toBe(underlying)
        expect(properties).toMatchObject({
            validation_phase: "compatibility",
            error_name: "TypeError",
            error_message: underlying.message,
            error_cause: "Error: primitive predator type",
            $exception_fingerprint: "CharacterValidationError:local-storage:compatibility:TypeError"
        })
    })

    it("reports API character validation errors", () => {
        const character = invalid()
        expect(
            characterApiResponseSchema.safeParse({
                id: character.id,
                name: "Test",
                data: character,
                version: 10,
                characterVersion: 0,
                createdAt: "now",
                updatedAt: "now"
            }).success
        ).toBe(false)
        expect(posthog.captureException).toHaveBeenCalledWith(
            expect.any(Error),
            expect.objectContaining({ validation_source: "api", character_id: character.id })
        )
    })

    it("reports JSON import errors without swallowing the failure", async () => {
        const character = invalid()
        await expect(loadCharacterFromJson(JSON.stringify(character))).rejects.toThrow()
        expect(posthog.captureException).toHaveBeenCalledWith(
            expect.any(Error),
            expect.objectContaining({
                validation_source: "json-import",
                character_id: character.id
            })
        )
    })

    it("does not report valid data or a successful legacy migration as an error", () => {
        for (const character of [
            getEmptyCharacter(),
            { ...getEmptyCharacter(), version: 8, disciplineLevels: undefined }
        ]) {
            localStorage.setItem("character", JSON.stringify(character))
            const { result, unmount } = renderHook(() => useCharacterLocalStorage())
            expect(result.current[0].attributes.strength).toBe(1)
            unmount()
        }
        expect(posthog.captureException).not.toHaveBeenCalled()
    })

    it("deduplicates repeat render failures but allows a later occurrence", () => {
        const character = invalid()
        const error = characterSchema.safeParse(character)
        if (error.success) throw new Error("Expected invalid fixture")
        const time = vi.spyOn(Date, "now").mockReturnValue(100_000)
        try {
            reportCharacterValidationError(error.error, "local-storage", "schema", character)
            reportCharacterValidationError(error.error, "local-storage", "schema", character)
            expect(posthog.captureException).toHaveBeenCalledOnce()
            time.mockReturnValue(161_000)
            reportCharacterValidationError(error.error, "local-storage", "schema", character)
            expect(posthog.captureException).toHaveBeenCalledTimes(2)
        } finally {
            time.mockRestore()
        }
    })

    it("correlates exact suggested and applied fixes without sending free-text contents", () => {
        const preview = previewCharacterRepair(
            JSON.stringify({
                ...invalid(),
                notes: { privateText: "secret" },
                flaws: [
                    {
                        name: "Broken flaw",
                        level: -1,
                        type: "flaw",
                        summary: "secret description",
                        excludes: []
                    }
                ]
            })
        )
        if (!preview.success) throw new Error(preview.error)
        trackCharacterRepair("suggested", "repair-123", preview.changes, preview.character)
        trackCharacterRepair("applied", "repair-123", preview.changes, preview.character)
        for (const [name, properties] of vi.mocked(posthog.capture).mock.calls) {
            expect(name).toMatch(/^character_repair_(suggested|applied)$/)
            expect(properties).toMatchObject({ repair_id: "repair-123", change_count: 3 })
            expect(properties?.changes).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: "flaws.0",
                        action: "remove",
                        item_name: "Broken flaw"
                    }),
                    expect.objectContaining({ path: "humanity", action: "reset", replacement: 0 }),
                    expect.objectContaining({ path: "notes", action: "reset", replacement: "" })
                ])
            )
            expect(JSON.stringify(properties)).not.toContain("secret")
        }
    })

    it("keeps recovery working when PostHog throws", () => {
        vi.mocked(posthog.captureException).mockImplementation(() => {
            throw new Error("SDK unavailable")
        })
        vi.mocked(posthog.capture).mockImplementation(() => {
            throw new Error("SDK unavailable")
        })
        const character = invalid()
        localStorage.setItem("character", JSON.stringify(character))
        expect(() => renderHook(() => useCharacterLocalStorage())).not.toThrow()
        expect(() =>
            trackCharacterRepair("applied", "repair-failed-sdk", [], character)
        ).not.toThrow()
        expect(localStorage.getItem("character_broken_save")).toContain(character.id)
    })
})
