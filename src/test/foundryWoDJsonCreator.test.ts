import { describe, it, expect } from "vitest"
import { createWoD5EVttJson } from "~/generator/foundryWoDJsonCreator"
import { Character } from "~/data/Character"

describe("createWoD5EVttJson", () => {
    it("should create a valid WoD5E VTT JSON for a basic character", () => {
        const basicCharacter: Character = {
            name: "Test Vampire",
            description: "A test vampire character",
            sire: "Test Sire",
            clan: "Brujah",
            predatorType: {
                name: "Alleycat",
                pickedDiscipline: "potence",
                pickedSpecialties: [],
                pickedMeritsAndFlaws: [],
            },
            touchstones: [
                {
                    name: "Test Touchstone",
                    description: "A test touchstone",
                    conviction: "Test conviction",
                },
            ],
            ambition: "Test ambition",
            desire: "Test desire",
            attributes: {
                strength: 3,
                dexterity: 2,
                stamina: 2,
                charisma: 2,
                manipulation: 1,
                composure: 2,
                intelligence: 2,
                wits: 2,
                resolve: 2,
            },
            skills: {
                athletics: 2,
                brawl: 1,
                craft: 0,
                drive: 1,
                firearms: 0,
                melee: 1,
                larceny: 0,
                stealth: 1,
                survival: 0,
                "animal ken": 0,
                etiquette: 0,
                insight: 1,
                intimidation: 2,
                leadership: 0,
                performance: 0,
                persuasion: 1,
                streetwise: 2,
                subterfuge: 0,
                academics: 1,
                awareness: 2,
                finance: 0,
                investigation: 1,
                medicine: 0,
                occult: 0,
                politics: 0,
                science: 0,
                technology: 1,
            },
            skillSpecialties: [],
            availableDisciplineNames: ["potence"],
            disciplines: [
                {
                    name: "Prowess",
                    discipline: "potence",
                    level: 1,
                    summary: "Test prowess power",
                    description: "A test prowess power description",
                    dicePool: "Strength + Brawl",
                    rouseChecks: 1,
                    amalgamPrerequisites: [],
                },
            ],
            rituals: [],
            bloodPotency: 1,
            generation: 12,
            maxHealth: 5,
            willpower: 5,
            experience: 0,
            humanity: 7,
            merits: [],
            flaws: [],
        }

        const result = createWoD5EVttJson(basicCharacter)

        // Check that the function returns the expected structure
        expect(result).toHaveProperty("json")
        expect(result).toHaveProperty("validationErrors")
        expect(Array.isArray(result.validationErrors)).toBe(true)

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
        expect(json.system.headers.touchstones).toBe("Test Touchstone")
        expect(json.system.headers.sire).toBe("Test Sire")
        expect(json.system.headers.generation).toBe("12")

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

        // Test disciplines
        expect(json.system.disciplines.potence.value).toBe(1)
        expect(json.system.disciplines.potence.powers).toContain("Prowess")
        expect(json.system.disciplines.animalism.value).toBe(0)
        expect(json.system.disciplines.auspex.value).toBe(0)

        // Test health and willpower
        expect(json.system.health.max).toBe(5)
        expect(json.system.health.value).toBe(5)
        expect(json.system.willpower.max).toBe(5)
        expect(json.system.willpower.value).toBe(5)

        // Test blood potency and humanity
        expect(json.system.blood.potency).toBe(1)
        expect(json.system.humanity.value).toBe(7)

        // Test items array
        expect(Array.isArray(json.items)).toBe(true)

        // Should have clan item
        const clanItem = json.items.find((item: any) => item.type === "clan")
        expect(clanItem).toBeDefined()
        expect(clanItem?.name).toBe("Brujah")

        // Should have predator type item
        const predatorItem = json.items.find((item: any) => item.type === "predatorType")
        expect(predatorItem).toBeDefined()
        expect(predatorItem?.name).toBe("Alleycat")

        // Should have discipline power item
        const powerItem = json.items.find((item: any) => item.type === "power")
        expect(powerItem).toBeDefined()
        expect(powerItem?.name).toBe("Prowess")
        expect((powerItem?.system as any).discipline).toBe("potence")
        expect((powerItem?.system as any).level).toBe(1)
    })

    it("should handle character with merits and flaws", () => {
        const characterWithMeritsFlaws: Character = {
            name: "Merit Flaw Test",
            description: "A character with merits and flaws",
            sire: "Test Sire",
            clan: "Toreador",
            predatorType: {
                name: "Consensualist",
                pickedDiscipline: "presence",
                pickedSpecialties: [],
                pickedMeritsAndFlaws: [
                    {
                        name: "Test Merit",
                        level: 2,
                        summary: "A test merit",
                        type: "merit",
                    },
                    {
                        name: "Test Flaw",
                        level: 1,
                        summary: "A test flaw",
                        type: "flaw",
                    },
                ],
            },
            touchstones: [],
            ambition: "",
            desire: "",
            attributes: {
                strength: 1,
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
            availableDisciplineNames: ["presence"],
            disciplines: [],
            rituals: [],
            bloodPotency: 0,
            generation: 13,
            maxHealth: 5,
            willpower: 5,
            experience: 0,
            humanity: 7,
            merits: [
                {
                    name: "Direct Merit",
                    level: 3,
                    summary: "A direct merit",
                    type: "merit",
                },
            ],
            flaws: [
                {
                    name: "Direct Flaw",
                    level: 2,
                    summary: "A direct flaw",
                    type: "flaw",
                },
            ],
        }

        const result = createWoD5EVttJson(characterWithMeritsFlaws)
        const { json } = result

        // Should have merit items
        const meritItems = json.items.filter((item: any) => item.type === "feature" && item.system.featuretype === "merit")
        expect(meritItems).toHaveLength(2) // One from predator type, one direct
        expect(meritItems.some((item: any) => item.name === "Test Merit")).toBe(true)
        expect(meritItems.some((item: any) => item.name === "Direct Merit")).toBe(true)

        // Should have flaw items
        const flawItems = json.items.filter((item: any) => item.type === "feature" && item.system.featuretype === "flaw")
        expect(flawItems).toHaveLength(2) // One from predator type, one direct
        expect(flawItems.some((item: any) => item.name === "Test Flaw")).toBe(true)
        expect(flawItems.some((item: any) => item.name === "Direct Flaw")).toBe(true)
    })

    it("should handle character with rituals", () => {
        const characterWithRituals: Character = {
            name: "Ritual Test",
            description: "A character with rituals",
            sire: "Test Sire",
            clan: "Tremere",
            predatorType: {
                name: "Sandman",
                pickedDiscipline: "blood sorcery",
                pickedSpecialties: [],
                pickedMeritsAndFlaws: [],
            },
            touchstones: [],
            ambition: "",
            desire: "",
            attributes: {
                strength: 1,
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
            availableDisciplineNames: ["blood sorcery"],
            disciplines: [],
            rituals: [
                {
                    name: "Test Ritual",
                    level: 1,
                    summary: "A test ritual",
                    rouseChecks: 1,
                    dicePool: "Intelligence + Blood Sorcery",
                    requiredTime: "1 hour",
                    ingredients: "Blood of the subject",
                },
                {
                    name: "Free Ritual",
                    level: 2,
                    summary: "A free ritual",
                    rouseChecks: 0,
                    dicePool: "Intelligence + Blood Sorcery",
                    requiredTime: "1 hour",
                    ingredients: "Blood of the subject",
                },
            ],
            bloodPotency: 0,
            generation: 13,
            maxHealth: 5,
            willpower: 5,
            experience: 0,
            humanity: 7,
            merits: [],
            flaws: [],
        }

        const result = createWoD5EVttJson(characterWithRituals)
        const { json } = result

        const ritualItems = json.items.filter((item: any) => item.type === "power" && item.system.discipline === "rituals")
        expect(ritualItems).toHaveLength(2)

        const testRitual = ritualItems.find((item: any) => item.name === "Test Ritual")
        expect(testRitual).toBeDefined()
        expect((testRitual?.system as any).cost).toBe("1 Rouse Check")

        const freeRitual = ritualItems.find((item: any) => item.name === "Free Ritual")
        expect(freeRitual).toBeDefined()
        expect((freeRitual?.system as any).cost).toBe("Free")
    })

    it("should handle character with skill specialties", () => {
        const characterWithSpecialties: Character = {
            name: "Specialty Test",
            description: "A character with skill specialties",
            sire: "Test Sire",
            clan: "Ventrue",
            predatorType: {
                name: "Scene Queen",
                pickedDiscipline: "dominate",
                pickedSpecialties: [
                    {
                        skill: "persuasion",
                        name: "Test Specialty",
                    },
                ],
                pickedMeritsAndFlaws: [],
            },
            touchstones: [],
            ambition: "",
            desire: "",
            attributes: {
                strength: 1,
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
                persuasion: 2,
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
            skillSpecialties: [
                {
                    skill: "intimidation",
                    name: "Direct Specialty",
                },
            ],
            availableDisciplineNames: ["dominate"],
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
        }

        const result = createWoD5EVttJson(characterWithSpecialties)
        const { json } = result

        // Check that skill specialties are added as bonuses
        expect(json.system.skills.persuasion.bonuses).toHaveLength(1)
        expect(json.system.skills.persuasion.bonuses[0].source).toBe("Test Specialty")
        expect(json.system.skills.persuasion.bonuses[0].value).toBe(1)
        expect(json.system.skills.persuasion.bonuses[0].paths).toEqual(["skills.persuasion"])

        expect(json.system.skills.intimidation.bonuses).toHaveLength(1)
        expect(json.system.skills.intimidation.bonuses[0].source).toBe("Direct Specialty")
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
