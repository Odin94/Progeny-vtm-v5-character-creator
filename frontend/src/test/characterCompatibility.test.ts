import { describe, expect, it } from "vitest"
import {
    applyCharacterCompatibilityPatches,
    getDisciplineLevelsFromPowers,
    getCharacterExcludedMeritsAndFlaws,
    getCharacterExcludedPredatorTypes,
    getEmptyCharacter,
    increaseDisciplineLevelForPower,
    schemaVersion
} from "~/data/Character"
import { disciplines } from "~/data/Disciplines"
import { getClanBaneText, getClanCompulsionText } from "~/data/VariantClanBanes"

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

    it("preserves pre-v9 discipline ratings from their selected power counts", () => {
        const parsed: Record<string, unknown> = {
            ...getEmptyCharacter(),
            version: 8,
            disciplines: [
                disciplines.celerity.powers[0],
                disciplines.celerity.powers[1],
                disciplines.potence.powers[0]
            ],
            disciplineLevels: undefined
        }

        applyCharacterCompatibilityPatches(parsed)

        expect(parsed.disciplineLevels).toEqual({
            "official:celerity": 2,
            "official:potence": 1
        })
        expect(parsed.version).toBe(schemaVersion)
    })

    it("raises a stored discipline rating by one when a power is added", () => {
        const character = getEmptyCharacter()
        character.disciplineLevels = { "official:celerity": 2 }

        expect(
            increaseDisciplineLevelForPower(character, disciplines.celerity.powers[4])
        ).toEqual({ "official:celerity": 3 })
        expect(
            getDisciplineLevelsFromPowers([
                disciplines.celerity.powers[0],
                disciplines.celerity.powers[1]
            ])
        ).toEqual({ "official:celerity": 2 })
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
            excludedMeritsAndFlaws: ["Beautiful"],
            homebrewSource: {
                itemId: "clan-1",
                collectionId: "collection-1",
                collectionName: "Night Arts"
            }
        }

        expect(getCharacterExcludedPredatorTypes(character)).toEqual(["Alleycat"])
        expect(getCharacterExcludedMeritsAndFlaws(character)).toEqual(["Beautiful"])
    })

    it("uses Homebrew clan traits instead of the empty official clan", () => {
        const character = getEmptyCharacter()
        character.homebrewClan = {
            name: "Shadow Flamer",
            summary: "",
            description: "",
            logo: "",
            bane: "Everyone is afraid of your dark aura.",
            compulsion: "Extinguish every source of hope.",
            nativeDisciplines: ["oblivion"],
            excludedPredatorTypes: [],
            excludedMeritsAndFlaws: [],
            homebrewSource: {
                itemId: "clan-1",
                collectionId: "collection-1",
                collectionName: "Night Arts"
            }
        }

        expect(getClanBaneText(character, 2)).toBe("Everyone is afraid of your dark aura.")
        expect(getClanCompulsionText(character)).toBe("Extinguish every source of hope.")
    })
})
