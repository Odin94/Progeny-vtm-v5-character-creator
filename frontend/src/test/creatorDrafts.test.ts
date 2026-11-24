import { describe, expect, it } from "vitest"
import { getEmptyCharacter } from "~/data/Character"
import { getPowerIdentity, getRitualIdentity } from "~/utils/homebrewOptions"
import { Rituals } from "~/data/Rituals"
import { disciplines } from "~/data/Disciplines"
import {
    getAttributeSetting,
    getDisciplineDraft,
    getSkillDistribution,
    getSkillsSetting,
    updateFreeGrimoireChoice
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

    it("restores the exact predator award after learning another power in the same Discipline", () => {
        const [first, predator, learned] = disciplines.animalism.powers
        const character = getEmptyCharacter()
        character.predatorType = {
            ...character.predatorType,
            name: "Farmer",
            pickedDiscipline: "animalism",
            pickedPowerId: getPowerIdentity(predator)
        }
        character.disciplines = [first, predator, learned]
        const draft = getDisciplineDraft(character)

        expect(draft.clanPowers).toEqual([first, learned])
        expect(draft.predatorPower).toEqual(predator)
    })

    it("replaces only the free entry and preserves learned entries", () => {
        const [learned, first, replacement] = Rituals
        const chosen = updateFreeGrimoireChoice([learned], undefined, first)
        const same = updateFreeGrimoireChoice(chosen.entries, chosen.choice, first)
        expect(same).toEqual(chosen)

        const swapped = updateFreeGrimoireChoice(same.entries, same.choice, replacement)
        expect(swapped.entries).toEqual([learned, replacement])
        expect(swapped.choice).toEqual({
            identity: getRitualIdentity(replacement),
            addedByCreator: true
        })
        expect(updateFreeGrimoireChoice(swapped.entries, swapped.choice).entries).toEqual([learned])
    })

    it("preserves entries already learned, including when they become the selected free choice", () => {
        const [learned, other] = Rituals
        const chosen = updateFreeGrimoireChoice([learned], undefined, learned)
        expect(chosen.entries).toEqual([learned])
        expect(chosen.choice).toEqual({
            identity: getRitualIdentity(learned),
            addedByCreator: false
        })
        expect(updateFreeGrimoireChoice(chosen.entries, chosen.choice, other).entries).toEqual([
            learned,
            other
        ])
    })
})
