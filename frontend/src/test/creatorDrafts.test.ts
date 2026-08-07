import { describe, expect, it } from "vitest"
import { getEmptyCharacter } from "~/data/Character"
import { disciplines } from "~/data/Disciplines"
import {
    getAttributeSetting,
    getDisciplineDraft,
    getSkillDistribution,
    getSkillsSetting
} from "~/generator/creatorDrafts"

describe("creator drafts", () => {
    it("rebuilds an already-confirmed attributes selection", () => {
        const character = getEmptyCharacter()
        character.attributes = {
            ...character.attributes,
            strength: 4,
            charisma: 1,
            dexterity: 3,
            stamina: 3,
            composure: 3
        }

        expect(getAttributeSetting(character.attributes)).toEqual({
            strongest: "strength",
            weakest: "charisma",
            medium: ["dexterity", "stamina", "composure"]
        })
    })

    it("restores the matching skill distribution after confirmation", () => {
        const character = getEmptyCharacter()
        ;["athletics", "brawl", "craft"].forEach((skill) => {
            character.skills[skill as keyof typeof character.skills] = 3
        })
        ;["drive", "firearms", "melee", "larceny", "stealth"].forEach((skill) => {
            character.skills[skill as keyof typeof character.skills] = 2
        })
        ;[
            "survival",
            "animal ken",
            "etiquette",
            "insight",
            "intimidation",
            "leadership",
            "performance"
        ].forEach((skill) => {
            character.skills[skill as keyof typeof character.skills] = 1
        })

        expect(getSkillDistribution(getSkillsSetting(character.skills))).toBe("Balanced")
    })

    it("separates the predator power from confirmed clan powers", () => {
        const [first, second, predator] = disciplines.animalism.powers

        const draft = getDisciplineDraft([first, second, predator], "animalism")

        expect(draft.clanPowers).toEqual([first, second])
        expect(draft.predatorPower).toEqual(predator)
    })
})
