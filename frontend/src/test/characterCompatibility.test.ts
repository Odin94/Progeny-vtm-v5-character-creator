import { describe, expect, it } from "vitest"
import { applyCharacterCompatibilityPatches, schemaVersion } from "~/data/Character"

describe("character compatibility patches", () => {
    it("adds ceremonies to pre-v6 characters", () => {
        const parsed: Record<string, unknown> = {
            version: 5,
            rituals: [],
            availableDisciplineNames: [],
            predatorType: {
                pickedMeritsAndFlaws: []
            }
        }

        applyCharacterCompatibilityPatches(parsed)

        expect(parsed.ceremonies).toEqual([])
        expect(parsed.version).toBe(schemaVersion)
    })
})
