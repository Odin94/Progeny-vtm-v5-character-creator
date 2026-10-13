import { afterEach, beforeEach, expect, it, vi } from "vitest"
import { getEmptyCharacter } from "~/data/Character"
import {
    readBrowserCharacterChangeTime,
    recordBrowserCharacterChange
} from "~/utils/characterChangeTime"
const original = {
    ...getEmptyCharacter(),
    id: "saved-character",
    name: "Test",
    characterVersion: 4
}
beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-10-10T10:00:00Z"))
})
afterEach(() => vi.useRealTimers())
it("leaves historical drafts unknown until their contents change", () => {
    expect(readBrowserCharacterChangeTime(original)).toBeNull()
    recordBrowserCharacterChange(original, original)
    expect(readBrowserCharacterChangeTime(original)).toBeNull()
    const edited = { ...original, notes: "Local edit" }
    recordBrowserCharacterChange(original, edited)
    expect(readBrowserCharacterChangeTime(edited)).toBe("2026-10-10T10:00:00.000Z")
    expect(readBrowserCharacterChangeTime(original)).toBeNull()
})
it("retains the edit date across revision acknowledgements and reloads", () => {
    const edited = { ...original, notes: "Local edit" }
    recordBrowserCharacterChange(original, edited)
    vi.setSystemTime(new Date("2026-10-13T12:00:00Z"))
    const acknowledged = { ...edited, characterVersion: 85 }
    recordBrowserCharacterChange(edited, acknowledged)
    expect(readBrowserCharacterChangeTime(JSON.parse(JSON.stringify(acknowledged)))).toBe(
        "2026-10-10T10:00:00.000Z"
    )
})
it("does not mistake loading a different character for its original edit date", () => {
    const other = { ...original, id: "other-character", notes: "Loaded from backend" }
    recordBrowserCharacterChange(original, other)
    expect(readBrowserCharacterChangeTime(other)).toBeNull()
})
it("tolerates unavailable date storage without interrupting character writes", () => {
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("No storage")
    })
    try {
        expect(() =>
            recordBrowserCharacterChange(original, { ...original, notes: "Edit" })
        ).not.toThrow()
    } finally {
        spy.mockRestore()
    }
})

it("does not label a same-ID historical import as a new edit", async () => {
    const { browserCharacterReplacementTime } = await import("~/utils/characterChangeTime")
    const { createCharacterPersistence } = await import("~/modules/characterPersistence")
    const persistence = createCharacterPersistence(
        { get: vi.fn(), create: vi.fn(), update: vi.fn() },
        vi.fn()
    )
    const anonymous = { ...original, id: "" }
    const imported = persistence.replaceDraft({ ...anonymous, notes: "Historical import" })
    recordBrowserCharacterChange(anonymous, imported, browserCharacterReplacementTime(imported))
    expect(readBrowserCharacterChangeTime(imported)).toBeNull()
})

it("uses the saved source date when keeping a backend version", async () => {
    const { markBrowserCharacterReplacement, browserCharacterReplacementTime } =
        await import("~/utils/characterChangeTime")
    const loaded = markBrowserCharacterReplacement(
        { ...original, notes: "Backend contents", characterVersion: 85 },
        "2026-10-08T12:00:00Z"
    )
    recordBrowserCharacterChange(original, loaded, browserCharacterReplacementTime(loaded))
    expect(readBrowserCharacterChangeTime(loaded)).toBe("2026-10-08T12:00:00Z")
})

it("leaves a changed backend revision unknown if no source date is available", () => {
    const loaded = { ...original, notes: "Backend contents", characterVersion: 85 }
    recordBrowserCharacterChange(original, loaded)
    expect(readBrowserCharacterChangeTime(loaded)).toBeNull()
})
