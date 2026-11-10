import { describe, expect, it } from "vitest"
import {
    applyCharacterCompatibilityPatches,
    characterSchema,
    getEmptyCharacter,
    schemaVersion
} from "~/data/Character"
import {
    getCharacterPredatorType,
    getPredatorTypeOptions,
    replacePredatorSkillBonuses
} from "~/data/predatorTypeOptions"
import {
    getPredatorTypeMeritsByName,
    getMeritFlawPointCost,
    getResolvedMeritsAndFlaws
} from "~/data/meritsAndFlawsResolution"
import { getHomebrewDisciplineOptions } from "~/utils/homebrewOptions"
import { updateHealthAndWillpowerAndBloodPotencyAndHumanity } from "~/generator/utils"
import { createWoD5EVttJson } from "~/generator/foundryWoDJsonCreator"
import { homebrewPredatorTypeSchema } from "~/data/HomebrewPredatorTypeValidation"
import { getBasicTestCharacter } from "./testUtils"
import { customPredator, predatorCollection } from "./fixtures/homebrewPredator"

const withPredator = () => {
    const character = getEmptyCharacter()
    const homebrew = getPredatorTypeOptions([predatorCollection], character)[
        "homebrew:night-arts:night-stalker"
    ]
    return {
        ...character,
        ...replacePredatorSkillBonuses(character, {
            name: homebrew.name,
            homebrew: { ...homebrew, homebrewSource: homebrew.homebrewSource! },
            pickedDiscipline: "auspex",
            pickedSpecialties: [homebrew.specialtyOptions[0]],
            pickedMeritsAndFlaws: [
                {
                    name: "Haven",
                    type: "merit" as const,
                    level: 1,
                    summary: "A quiet refuge",
                    excludes: ["No Haven"]
                }
            ]
        })
    }
}

describe("homebrew predator types", () => {
    it("upgrades v11 official characters without inventing homebrew grants", () => {
        const original = getEmptyCharacter()
        original.predatorType.name = "Farmer"
        const parsed = { ...original, version: 11 }
        applyCharacterCompatibilityPatches(parsed)
        expect(parsed.version).toBe(schemaVersion)
        expect(characterSchema.parse(parsed).predatorType).toEqual(original.predatorType)
    })
    it("persists all custom rules and bonuses independently of the collection", () => {
        const serialized = JSON.parse(JSON.stringify(withPredator()))
        applyCharacterCompatibilityPatches(serialized)
        const character = characterSchema.parse(serialized)
        const options = getPredatorTypeOptions([], character)
        expect(options["homebrew:night-arts:night-stalker"].name).toBe("Night Stalker")
        expect(getCharacterPredatorType(character).meritsAndFlaws[0].excludes).toEqual(["Isolated"])
        expect(character.predatorType.pickedMeritsAndFlaws[0].excludes).toEqual(["No Haven"])
        expect(character.predatorType.pickedSpecialties).toEqual([
            { skill: "stealth", name: "Stalking" }
        ])
        expect(character.skills.stealth).toBe(2)
        updateHealthAndWillpowerAndBloodPotencyAndHumanity(character)
        expect(character.humanity).toBe(6)
        expect(character.bloodPotency).toBe(2)
        const resolved = getResolvedMeritsAndFlaws(character)
        expect(resolved.merits.map(({ meritFlaw }) => meritFlaw.name)).toEqual([
            "Night Contacts",
            "Haven"
        ])
        expect(resolved.flaws[0].meritFlaw.name).toBe("Marked")
        expect(resolved.merits.every((item) => item.isFromPredatorType)).toBe(true)
    })
    it("adds paid merit dots on top of an existing predator grant", () => {
        const character = withPredator()
        character.merits = [{ name: "Haven", type: "merit", level: 3, summary: "", excludes: [] }]
        expect(
            getMeritFlawPointCost(character.merits[0], getPredatorTypeMeritsByName(character))
        ).toBe(2)
        expect(
            getResolvedMeritsAndFlaws(character).merits.find(
                ({ meritFlaw }) => meritFlaw.name === "Haven"
            )?.meritFlaw.level
        ).toBe(3)
    })
    it("caps skill grants, reconfirms without stacking, and removes only applied dots", () => {
        const character = getEmptyCharacter()
        character.skills.stealth = 4
        const next = withPredator().predatorType
        const applied = { ...character, ...replacePredatorSkillBonuses(character, next) }
        expect(applied.skills.stealth).toBe(5)
        expect(applied.predatorType.appliedSkillBonuses).toEqual([{ skill: "stealth", dots: 1 }])
        const reconfirmed = {
            ...applied,
            ...replacePredatorSkillBonuses(applied, applied.predatorType)
        }
        expect(reconfirmed.skills.stealth).toBe(5)
        const skipped = replacePredatorSkillBonuses(reconfirmed, getEmptyCharacter().predatorType)
        expect(skipped.skills.stealth).toBe(4)
        expect(skipped.predatorType.homebrew).toBeUndefined()
    })
    it("keeps same-name official and custom types separate", () => {
        const collection = { ...predatorCollection, items: [{ ...customPredator, name: "Farmer" }] }
        const options = getPredatorTypeOptions([collection], getEmptyCharacter())
        expect(options.Farmer.humanityChange).toBe(1)
        expect(options["homebrew:night-arts:night-stalker"].humanityChange).toBe(-1)
    })
    it("offers custom powers for official and homebrew bonus disciplines", () => {
        const options = getHomebrewDisciplineOptions(
            [predatorCollection],
            customPredator.disciplineOptions.map((option) => ({
                ...option,
                type: option.type ?? "official"
            }))
        )
        expect(options.auspex.powers.some((power) => power.name === "Midnight Echoes")).toBe(true)
        expect(options["homebrew:night-arts:noctis"].powers[0]).toMatchObject({
            name: "Night Sight",
            disciplineHomebrewSource: { itemId: "noctis", collectionId: "night-arts" }
        })
    })
    it("resolves a saved Discipline reference after its source Discipline is renamed", () => {
        const renamed = {
            ...predatorCollection,
            items: predatorCollection.items.map((item) => {
                if (item.id === "noctis") return { ...item, name: "Nightcraft" }
                if (item.kind === "power" && item.disciplineRef?.type === "homebrew")
                    return {
                        ...item,
                        discipline: "Nightcraft",
                        disciplineRef: { ...item.disciplineRef, name: "Nightcraft" }
                    }
                return item
            })
        }
        const options = getHomebrewDisciplineOptions(
            [renamed],
            [{ type: "homebrew", itemId: "noctis", name: "Noctis" }]
        )
        expect(options["homebrew:night-arts:noctis"]?.name).toBe("Nightcraft")
        expect(options["homebrew:night-arts:noctis"]?.powers[0].name).toBe("Night Sight")
    })
    it("supports increases and decreases while clamping Humanity and Blood Potency", () => {
        const character = withPredator()
        character.predatorType.homebrew!.humanityChange = 10
        character.predatorType.homebrew!.bloodPotencyChange = -10
        updateHealthAndWillpowerAndBloodPotencyAndHumanity(character)
        expect(character.humanity).toBe(10)
        expect(character.bloodPotency).toBe(0)
    })
    it("exports custom predator descriptions, specialties, skills, and granted merits", () => {
        const character = {
            ...getBasicTestCharacter(),
            ...withPredator(),
            clan: "Brujah" as const,
            name: "Test Hunter"
        }
        const { json, validationErrors } = createWoD5EVttJson(character)
        expect(validationErrors).toEqual([])
        expect(json.items.find((item) => item.type === "predatorType")).toMatchObject({
            name: "Night Stalker",
            system: { description: customPredator.summary }
        })
        expect(json.system.skills.stealth).toMatchObject({ value: 2 })
        expect(json.items.some((item) => item.name === "Night Contacts")).toBe(true)
    })
    it("rejects exclusive choices whose smaller option cannot cover the budget", () => {
        const group = customPredator.selectableMeritsAndFlaws[0]
        expect(
            homebrewPredatorTypeSchema.safeParse({
                ...customPredator,
                selectableMeritsAndFlaws: [
                    {
                        ...group,
                        totalPoints: 3,
                        options: group.options.map((option, index) => ({
                            ...option,
                            maxLevel: index === 0 ? 3 : 1
                        }))
                    }
                ]
            }).success
        ).toBe(false)
    })
    it("rejects empty choices, invalid skills, unreachable budgets and unsupported disciplines", () => {
        expect(homebrewPredatorTypeSchema.safeParse(customPredator).success).toBe(true)
        expect(
            homebrewPredatorTypeSchema.safeParse({ ...customPredator, specialtyOptions: [] })
                .success
        ).toBe(true)
        for (const override of [
            { disciplineOptions: [] },
            { skillBonuses: [{ skill: "flying", dots: 2 }] },
            { disciplineOptions: [{ type: "official", name: "Unknown" }] },
            {
                selectableMeritsAndFlaws: [
                    { ...customPredator.selectableMeritsAndFlaws[0], totalPoints: 4 }
                ]
            }
        ])
            expect(
                homebrewPredatorTypeSchema.safeParse({ ...customPredator, ...override }).success
            ).toBe(false)
    })
})
