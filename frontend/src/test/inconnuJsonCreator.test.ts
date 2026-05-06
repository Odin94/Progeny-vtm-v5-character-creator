import { describe, expect, it } from "vitest"
import { createInconnuJson } from "~/generator/inconnuJsonCreator"
import { getBasicTestCharacter } from "./testUtils"

const inconnuIdentifierPattern = /^[A-Za-z_]{1,20}$/

describe("createInconnuJson", () => {
    it("creates an Inconnu wizard creation body", () => {
        const character = getBasicTestCharacter()
        const result = createInconnuJson(character)

        expect(result).toEqual(
            expect.objectContaining({
                name: "Test Vampire",
                splat: "vampire",
                health: 5,
                willpower: 4,
                humanity: 7,
                blood_potency: 1,
                convictions: ["Test conviction"],
                description: "A test vampire character"
            })
        )
        expect(result).not.toHaveProperty("_name")
        expect(result).not.toHaveProperty("_traits")
        expect(result).not.toHaveProperty("profile")
        expect(result).not.toHaveProperty("potency")

        const potence = result.traits.find((trait) => trait.name === "Potence")
        expect(potence).toEqual(
            expect.objectContaining({
                rating: 1,
                type: "discipline",
                subtraits: ["Prowess"]
            })
        )

        const bloodSorcery = result.traits.find((trait) => trait.name === "BloodSorcery")
        expect(bloodSorcery).toEqual(
            expect.objectContaining({
                rating: 1,
                type: "discipline",
                subtraits: ["Corrosive_Vitae", "Test_Ritual"]
            })
        )

        const intimidation = result.traits.find((trait) => trait.name === "Intimidation")
        expect(intimidation?.subtraits).toEqual(["Direct_Specialty"])

        const medicine = result.traits.find((trait) => trait.name === "Medicine")
        expect(medicine).toEqual(
            expect.objectContaining({
                rating: 0,
                type: "skill",
                subtraits: ["Anesthetics"]
            })
        )

        const customTraits = result.traits.filter((trait) => trait.type === "custom")
        expect(customTraits.map((trait) => trait.name)).toEqual([
            "Direct_Merit",
            "Direct_Flaw",
            "Resources"
        ])
    })

    it("normalizes data to satisfy Inconnu validation constraints", () => {
        const character = getBasicTestCharacter()
        character.name = "A name with @ symbols that is much too long for Inconnu"
        character.maxHealth = 2
        character.willpower = 99
        character.humanity = 12
        character.bloodPotency = 14
        character.touchstones = [
            { name: "One", description: "", conviction: "A".repeat(250) },
            { name: "Two", description: "", conviction: "Second" },
            { name: "Three", description: "", conviction: "Third" },
            { name: "Four", description: "", conviction: "Fourth" }
        ]
        character.skillSpecialties = [
            { skill: "brawl", name: "Grappling & Throwing" },
            { skill: "brawl", name: "Grappling & Throwing" }
        ]
        character.merits = [
            {
                name: "Very Long Merit Name With Spaces 123",
                level: 1,
                summary: "",
                type: "merit",
                excludes: []
            },
            {
                name: "Very Long Merit Name With Spaces 123",
                level: 2,
                summary: "",
                type: "merit",
                excludes: []
            },
            {
                name: "Willpower",
                level: 3,
                summary: "",
                type: "merit",
                excludes: []
            },
            {
                name: "current_hunger",
                level: 1,
                summary: "",
                type: "merit",
                excludes: []
            }
        ]
        character.flaws = []
        character.predatorType.pickedMeritsAndFlaws = []

        const result = createInconnuJson(character)

        expect(result.name).toBe("A name with symbols that is mu")
        expect(result.health).toBe(4)
        expect(result.willpower).toBe(10)
        expect(result.humanity).toBe(10)
        expect(result.blood_potency).toBe(10)
        expect(result.convictions).toHaveLength(3)
        expect(result.convictions[0]).toHaveLength(200)

        const traitNames = result.traits.map((trait) => trait.name.toLowerCase())
        expect(new Set(traitNames).size).toBe(traitNames.length)
        expect(result.traits.some((trait) => trait.name === "Willpower_Trait")).toBe(true)
        expect(result.traits.some((trait) => trait.name === "Current_Hunger_Trait")).toBe(true)

        for (const trait of result.traits) {
            expect(trait.name).toMatch(inconnuIdentifierPattern)

            const subtraitNames = trait.subtraits.map((subtrait) => subtrait.toLowerCase())
            expect(new Set(subtraitNames).size).toBe(subtraitNames.length)
            for (const subtrait of trait.subtraits) {
                expect(subtrait).toMatch(inconnuIdentifierPattern)
            }
        }
    })

    it("handles prototype-like custom discipline names and corrupted numeric values", () => {
        const character = getBasicTestCharacter()
        character.maxHealth = Number.NaN
        character.willpower = Number.POSITIVE_INFINITY
        character.humanity = Number.POSITIVE_INFINITY
        character.bloodPotency = Number.NaN
        character.attributes.strength = Number.NaN
        character.skills.brawl = Number.POSITIVE_INFINITY
        character.disciplines = [
            {
                name: "Prototype Power",
                discipline: "toString",
                level: Number.POSITIVE_INFINITY,
                summary: "",
                description: "",
                dicePool: "",
                rouseChecks: 0,
                amalgamPrerequisites: []
            },
            {
                name: "Constructor Power",
                discipline: "constructor",
                level: Number.NaN,
                summary: "",
                description: "",
                dicePool: "",
                rouseChecks: 0,
                amalgamPrerequisites: []
            }
        ]
        character.rituals = []
        character.merits = [
            {
                name: "Broken Number Merit",
                level: Number.NaN,
                summary: "",
                type: "merit",
                excludes: []
            }
        ]
        character.flaws = []
        character.predatorType.pickedMeritsAndFlaws = []

        const result = createInconnuJson(character)

        expect(result.health).toBe(4)
        expect(result.willpower).toBe(10)
        expect(result.humanity).toBe(10)
        expect(result.blood_potency).toBe(0)
        expect(result.traits.find((trait) => trait.name === "Strength")?.rating).toBe(1)
        expect(result.traits.find((trait) => trait.name === "Brawl")?.rating).toBe(5)
        expect(result.traits.find((trait) => trait.name === "ToString")).toEqual(
            expect.objectContaining({
                rating: 5,
                type: "discipline",
                subtraits: ["Prototype_Power"]
            })
        )
        expect(result.traits.find((trait) => trait.name === "Constructor")).toEqual(
            expect.objectContaining({
                rating: 0,
                type: "discipline",
                subtraits: ["Constructor_Power"]
            })
        )
        expect(result.traits.find((trait) => trait.name === "Broken_Number_Merit")?.rating).toBe(0)
        expect(JSON.stringify(result)).not.toContain("null")
    })

    it("does not throw on missing optional arrays from malformed saved data", () => {
        const character = {
            ...getBasicTestCharacter(),
            touchstones: undefined,
            skillSpecialties: undefined,
            disciplines: undefined,
            rituals: undefined,
            merits: undefined,
            flaws: undefined,
            predatorType: undefined
        } as unknown as Parameters<typeof createInconnuJson>[0]

        const result = createInconnuJson(character)

        expect(result.convictions).toEqual([])
        expect(result.biography).toContain("Clan: Brujah")
        expect(result.traits.find((trait) => trait.name === "Strength")).toBeDefined()
        expect(result.traits.some((trait) => trait.type === "discipline")).toBe(false)
        expect(result.traits.some((trait) => trait.type === "custom")).toBe(false)
    })
})
