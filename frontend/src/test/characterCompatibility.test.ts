import { describe, expect, it } from "vitest"
import {
    applyCharacterCompatibilityPatches,
    getCharacterExcludedPredatorTypes,
    getEmptyCharacter,
    schemaVersion
} from "~/data/Character"

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

    it("sets the default clan bane on pre-v7 characters", () => {
        const parsed: Record<string, unknown> = {
            version: 6,
            rituals: [],
            ceremonies: [],
            availableDisciplineNames: [],
            predatorType: {
                pickedMeritsAndFlaws: []
            }
        }

        applyCharacterCompatibilityPatches(parsed)

        expect(parsed.clanBane).toBe("default")
        expect(parsed.version).toBe(schemaVersion)
    })

    it("upgrades pre-v8 characters without inventing a Homebrew clan source", () => {
        const parsed: Record<string, unknown> = {
            version: 7,
            rituals: [],
            ceremonies: [],
            availableDisciplineNames: [],
            predatorType: { pickedMeritsAndFlaws: [] }
        }

        applyCharacterCompatibilityPatches(parsed)

        expect(parsed.homebrewClan).toBeUndefined()
        expect(parsed.version).toBe(schemaVersion)
    })

    it("uses Homebrew clan predator-type exclusions", () => {
        const character = getEmptyCharacter()
        character.homebrewClan = {
            name: "Moonborn",
            summary: "",
            description: "",
            logo: "",
            bane: "Moonlight",
            compulsion: "Wander",
            nativeDisciplines: ["auspex"],
            excludedPredatorTypes: ["Alleycat"],
            excludedMeritsAndFlaws: [],
            homebrewSource: {
                itemId: "clan-1",
                collectionId: "collection-1",
                collectionName: "Night Arts"
            }
        }

        expect(getCharacterExcludedPredatorTypes(character)).toEqual(["Alleycat"])
    })
})
