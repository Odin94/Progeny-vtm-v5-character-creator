import { describe, expect, it } from "vitest"
import { getEmptyCharacter } from "~/data/Character"
import { parseCharacterData } from "~/utils/characterData"

describe("parseCharacterData", () => {
    it("accepts character data that arrives as a JSON string", () => {
        const character = { ...getEmptyCharacter(), name: "Pearl Auster" }

        expect(parseCharacterData(JSON.stringify(character))?.name).toBe("Pearl Auster")
    })

    it("accepts character data that arrives as an object", () => {
        const character = { ...getEmptyCharacter(), name: "Melissa Bikube" }

        expect(parseCharacterData(character)?.name).toBe("Melissa Bikube")
    })

    it("returns null for malformed character data instead of throwing", () => {
        expect(parseCharacterData("{nope")).toBeNull()
        expect(parseCharacterData({ name: "Not enough data" })).toBeNull()
    })
})
