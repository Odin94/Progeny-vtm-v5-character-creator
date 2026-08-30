import { describe, expect, it } from "vitest"
import { getEmptyCharacter, isCharacterEmpty } from "~/data/Character"

describe("isCharacterEmpty", () => {
    it("treats a fresh empty character as empty", () => {
        expect(isCharacterEmpty(getEmptyCharacter())).toBe(true)
    })

    it("ignores identity and version fields", () => {
        const character = {
            ...getEmptyCharacter(),
            id: "abc",
            name: "Nameless",
            version: 999,
            characterVersion: 7
        }

        expect(isCharacterEmpty(character)).toBe(true)
    })

    it("does not depend on key order", () => {
        const empty = getEmptyCharacter()
        const reordered = Object.fromEntries(
            Object.entries(empty).reverse()
        ) as ReturnType<typeof getEmptyCharacter>

        expect(isCharacterEmpty(reordered)).toBe(true)
    })

    it("reports a character with changes as not empty", () => {
        const character = { ...getEmptyCharacter(), notes: "a note" }

        expect(isCharacterEmpty(character)).toBe(false)
    })
})
