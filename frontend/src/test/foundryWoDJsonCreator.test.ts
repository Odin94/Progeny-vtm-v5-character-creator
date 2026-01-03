import { describe, it, expect } from "vitest"
import { createWoD5EVttJson } from "~/generator/foundryWoDJsonCreator"
import { Character } from "~/data/Character"
import { getBasicTestCharacter } from "./testUtils"

describe("createWoD5EVttJson", () => {
    it("should create a valid WoD5E VTT JSON for a basic character (happy path)", () => {
        const basicCharacter = getBasicTestCharacter()

        const result = createWoD5EVttJson(basicCharacter)

        // Check that the function returns the expected structure
        expect(result).toHaveProperty("json")
        expect(result).toHaveProperty("validationErrors")
        expect(Array.isArray(result.validationErrors)).toBe(true)
        expect(result.validationErrors).toHaveLength(0)

        const { json } = result

        // Test basic character properties
        expect(json.name).toBe("Test Vampire")
        expect(json.type).toBe("vampire")

        // Test system properties
        expect(json.system.locked).toBe(false)
        expect(json.system.hasSkillAttributeData).toBe(true)
        expect(json.system.bio.age.trueage).toBe("")
        expect(json.system.bio.age.apparent).toBe("")
        expect(json.system.headers.concept).toBe("A test vampire character")
        expect(json.system.headers.ambition).toBe("Test ambition")
        expect(json.system.headers.desire).toBe("Test desire")
        expect(json.system.headers.touchstones).toBe("Test Touchstone (Test conviction)")
        expect(json.system.headers.sire).toBe("Test Sire")
        expect(json.system.headers.generation).toBe("13")

        // Test attributes
        expect(json.system.attributes.strength.value).toBe(3)
        expect(json.system.attributes.dexterity.value).toBe(2)
        expect(json.system.attributes.stamina.value).toBe(2)
        expect(json.system.attributes.charisma.value).toBe(2)
        expect(json.system.attributes.manipulation.value).toBe(1)
        expect(json.system.attributes.composure.value).toBe(2)
        expect(json.system.attributes.intelligence.value).toBe(2)
        expect(json.system.attributes.wits.value).toBe(2)
        expect(json.system.attributes.resolve.value).toBe(2)

        // Test skills
        expect(json.system.skills.athletics.value).toBe(2)
        expect(json.system.skills.brawl.value).toBe(1)
        expect(json.system.skills.intimidation.value).toBe(2)
        expect(json.system.skills.streetwise.value).toBe(2)
        expect(json.system.skills.medicine.value).toBe(0)
        expect(json.system.skills.animalken.value).toBe(1)

        // Test skill specialties
        expect(json.system.skills.intimidation.bonuses).toHaveLength(1)
        expect(json.system.skills.intimidation.bonuses[0].source).toBe("Direct Specialty")
        expect(json.system.skills.intimidation.bonuses[0].value).toBe(1)

        // Test disciplines
        expect(json.system.disciplines.potence.value).toBe(1)
        expect(json.system.disciplines.potence.powers).toContain("Prowess")
        expect(json.system.disciplines.animalism.value).toBe(0)
        expect(json.system.disciplines.auspex.value).toBe(0)

        // Test health and willpower
        expect(json.system.health.max).toBe(5)
        expect(json.system.health.value).toBe(5)
        expect(json.system.willpower.max).toBe(4)
        expect(json.system.willpower.value).toBe(4)

        // Test blood potency and humanity
        expect(json.system.blood.potency).toBe(1)
        expect(json.system.humanity.value).toBe(7)

        // Test experience
        expect(json.system.exp.value).toBe(15)

        // Test items array
        expect(Array.isArray(json.items)).toBe(true)

        // Should have clan item
        const clanItem = json.items.find((item: any) => item.type === "clan")
        expect(clanItem).toBeDefined()
        expect(clanItem?.name).toBe("Brujah")

        // Should have predator type item
        const predatorItem = json.items.find((item: any) => item.type === "predatorType")
        expect(predatorItem).toBeDefined()
        expect(predatorItem?.name).toBe("Sandman")

        // Should have discipline power item
        const powerItem = json.items.find((item: any) => item.type === "power")
        expect(powerItem).toBeDefined()
        expect(powerItem?.name).toBe("Prowess")
        expect((powerItem?.system as any).discipline).toBe("potence")
        expect((powerItem?.system as any).level).toBe(1)

        // Should have ritual item
        const ritualItem = json.items.find((item: any) => item.type === "power" && (item.system as any).discipline === "rituals")
        expect(ritualItem).toBeDefined()
        expect(ritualItem?.name).toBe("Test Ritual")
        expect((ritualItem?.system as any).cost).toBe("1 Rouse Check")

        // Should have merit items
        const meritItems = json.items.filter((item: any) => item.type === "feature" && item.system.featuretype === "merit")
        expect(meritItems.length).toBeGreaterThan(0)
        expect(meritItems.some((item: any) => item.name === "Direct Merit")).toBe(true)
        expect(meritItems.some((item: any) => item.name === "Resources")).toBe(true)

        // Should have flaw items
        const flawItems = json.items.filter((item: any) => item.type === "feature" && item.system.featuretype === "flaw")
        expect(flawItems.length).toBeGreaterThan(0)
        expect(flawItems.some((item: any) => item.name === "Direct Flaw")).toBe(true)
    })

    it("should return validation errors for invalid data", () => {
        // @ts-expect-error - This is invalid data
        const invalidCharacter = {
            name: "Invalid Test",
            description: "A character with invalid data",
            sire: "Test Sire",
            clan: "Invalid Clan", // This might cause validation issues
            predatorType: {
                name: "Invalid Predator",
                pickedDiscipline: "invalid discipline",
                pickedSpecialties: [],
                pickedMeritsAndFlaws: [],
            },
            touchstones: [],
            ambition: "",
            desire: "",
            attributes: {
                strength: -1, // Invalid negative value
                dexterity: 1,
                stamina: 1,
                charisma: 1,
                manipulation: 1,
                composure: 1,
                intelligence: 1,
                wits: 1,
                resolve: 1,
            },
            skills: {
                athletics: 0,
                brawl: 0,
                craft: 0,
                drive: 0,
                firearms: 0,
                melee: 0,
                larceny: 0,
                stealth: 0,
                survival: 0,
                "animal ken": 0,
                etiquette: 0,
                insight: 0,
                intimidation: 0,
                leadership: 0,
                performance: 0,
                persuasion: 0,
                streetwise: 0,
                subterfuge: 0,
                academics: 0,
                awareness: 0,
                finance: 0,
                investigation: 0,
                medicine: 0,
                occult: 0,
                politics: 0,
                science: 0,
                technology: 0,
            },
            skillSpecialties: [],
            availableDisciplineNames: [],
            disciplines: [],
            rituals: [],
            bloodPotency: 0,
            generation: 13,
            maxHealth: 5,
            willpower: 5,
            experience: 0,
            humanity: 7,
            merits: [],
            flaws: [],
        } as Character

        const result = createWoD5EVttJson(invalidCharacter)

        // The function should still return a result, but with validation errors
        expect(result).toHaveProperty("json")
        expect(result).toHaveProperty("validationErrors")
        expect(Array.isArray(result.validationErrors)).toBe(true)
    })
})
