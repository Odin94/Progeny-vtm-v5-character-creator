import { describe, expect, it } from "vitest"
import { getEmptyCharacter } from "~/data/Character"
import {
    createCharacterIntake,
    CHARACTER_RECOVERY_KEY,
    BROKEN_SAVE_KEY
} from "~/modules/characterIntake"

const storageAdapter = () => {
    const values = new Map<string, string>()
    const writes: string[] = []
    let failKey = ""
    return {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => {
            if (key === failKey) throw new Error("Storage full")
            writes.push(key)
            values.set(key, value)
        },
        fail: (key: string) => {
            failKey = key
        },
        writes
    }
}
const broken = () =>
    JSON.stringify({
        ...getEmptyCharacter(),
        name: "Keep me",
        attributes: { ...getEmptyCharacter().attributes, strength: "broken" }
    })

describe("character intake contract", () => {
    it.each(["local-storage", "json-import", "api"] as const)(
        "preserves %s originals, with no lossy repair before approval",
        (source) => {
            const storage = storageAdapter()
            const intake = createCharacterIntake(() => storage)
            const original = broken()
            expect(intake.read(original, source).success).toBe(false)
            expect(storage.getItem("character")).toBeNull()
            expect(intake.preview(original).success).toBe(true)
            expect(storage.getItem("character")).toBeNull()
            if (source === "local-storage")
                expect(JSON.parse(storage.getItem(BROKEN_SAVE_KEY)!)).toBe(original)
            else expect(JSON.parse(storage.getItem(CHARACTER_RECOVERY_KEY)!)[0].data).toBe(original)
            const repaired = intake.applyApprovedRepair(original, "bad strength")
            expect(repaired.name).toBe("Keep me")
            expect(repaired.attributes.strength).toBe(1)
            expect(storage.writes.indexOf(CHARACTER_RECOVERY_KEY)).toBeLessThan(
                storage.writes.indexOf("character")
            )
        }
    )
    it("keeps the current draft and pending original when archiving fails", () => {
        const storage = storageAdapter()
        const intake = createCharacterIntake(() => storage)
        const original = broken()
        intake.read(original, "local-storage")
        storage.fail(CHARACTER_RECOVERY_KEY)
        expect(() => intake.persist(getEmptyCharacter())).toThrow("Storage full")
        expect(() => intake.applyApprovedRepair(original, "error")).toThrow("Storage full")
        expect(storage.getItem("character")).toBeNull()
        expect(JSON.parse(storage.getItem(BROKEN_SAVE_KEY)!)).toBe(original)
    })
    it("archives the previous rejected save before preserving a second one", () => {
        const storage = storageAdapter()
        const intake = createCharacterIntake(() => storage)
        intake.read("first invalid JSON", "local-storage")
        intake.read("second invalid JSON", "local-storage")
        expect(JSON.parse(storage.getItem(CHARACTER_RECOVERY_KEY)!)[0].data).toBe(
            "first invalid JSON"
        )
        expect(JSON.parse(storage.getItem(BROKEN_SAVE_KEY)!)).toBe("second invalid JSON")
    })
    it("clones remote objects before compatibility patches", () => {
        const storage = storageAdapter()
        const intake = createCharacterIntake(() => storage)
        const original = { ...getEmptyCharacter(), version: 1 }
        const before = JSON.stringify(original)
        expect(intake.read(original, "api").success).toBe(true)
        expect(JSON.stringify(original)).toBe(before)
    })
    it("requires a fresh review if the pending original changed after preview", () => {
        const storage = storageAdapter()
        const intake = createCharacterIntake(() => storage)
        const original = broken()
        intake.read(original, "local-storage")
        intake.read("a different broken save", "local-storage")
        expect(() => intake.applyApprovedRepair(original, "error")).toThrow("recovery save changed")
        expect(storage.getItem("character")).toBeNull()
        expect(JSON.parse(storage.getItem(BROKEN_SAVE_KEY)!)).toBe("a different broken save")
    })
})
