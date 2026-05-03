import { describe, expect, it } from "vitest"
import {
    getApplicableMeritFlawModifiers,
    getSelectedMeritFlawModifierBonus
} from "~/character_sheet/utils/meritFlawMatcher"
import { getBasicTestCharacter } from "./testUtils"

describe("merit/flaw dice pool modifiers", () => {
    it("offers looks bonuses and flaws for social attributes", () => {
        const character = getBasicTestCharacter()
        character.merits = [
            {
                name: "Beautiful",
                level: 2,
                summary: "+1 die in Social rolls",
                type: "merit",
                excludes: []
            }
        ]
        character.flaws = [
            {
                name: "Ugly",
                level: 1,
                summary: "-1 die in Social rolls",
                type: "flaw",
                excludes: []
            }
        ]

        const modifiers = getApplicableMeritFlawModifiers(character, "charisma", null)

        expect(modifiers.map((modifier) => modifier.meritFlaw.name)).toEqual([
            "Beautiful",
            "Ugly"
        ])
        expect(getSelectedMeritFlawModifierBonus(character, "charisma", null, ["merit-Beautiful"]))
            .toBe(1)
        expect(getSelectedMeritFlawModifierBonus(character, "charisma", null, ["flaw-Ugly"])).toBe(
            -1
        )
    })

    it("offers looks bonuses for social skills paired with physical attributes", () => {
        const character = getBasicTestCharacter()
        character.merits = [
            {
                name: "Stunning",
                level: 4,
                summary: "+2 dice in Social rolls",
                type: "merit",
                excludes: []
            }
        ]

        const modifiers = getApplicableMeritFlawModifiers(character, "strength", "persuasion")

        expect(modifiers.map((modifier) => modifier.meritFlaw.name)).toContain("Stunning")
        expect(
            getSelectedMeritFlawModifierBonus(character, "strength", "persuasion", [
                "merit-Stunning"
            ])
        ).toBe(2)
    })

    it("offers looks bonuses when only a social skill is selected", () => {
        const character = getBasicTestCharacter()
        character.merits = [
            {
                name: "Beautiful",
                level: 2,
                summary: "+1 die in Social rolls",
                type: "merit",
                excludes: []
            }
        ]

        const modifiers = getApplicableMeritFlawModifiers(character, null, "persuasion")

        expect(modifiers.map((modifier) => modifier.meritFlaw.name)).toContain("Beautiful")
    })

    it("does not offer social modifiers on non-social pools", () => {
        const character = getBasicTestCharacter()
        character.merits = [
            {
                name: "Beautiful",
                level: 2,
                summary: "+1 die in Social rolls",
                type: "merit",
                excludes: []
            }
        ]

        expect(getApplicableMeritFlawModifiers(character, "strength", "brawl")).toEqual([])
    })
})
