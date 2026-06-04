import { describe, expect, it } from "vitest"
import { getApplicableDisciplinePowers } from "~/character_sheet/utils/disciplinePowerMatcher"
import { disciplines } from "~/data/Disciplines"
import { getBasicTestCharacter } from "./testUtils"

const weaving = disciplines.celerity.powers.find((power) => power.name === "Weaving")!

describe("discipline power dice pool modifiers", () => {
    it("offers owned Weaving for Dexterity + Athletics", () => {
        const character = getBasicTestCharacter()
        character.disciplines = [weaving]

        const powers = getApplicableDisciplinePowers(character, "dexterity", "athletics")

        expect(powers.map(({ power }) => power.name)).toContain("Weaving")
    })

    it("does not offer Weaving for other pools", () => {
        const character = getBasicTestCharacter()
        character.disciplines = [weaving]

        expect(getApplicableDisciplinePowers(character, "dexterity", null)).toEqual([])
        expect(getApplicableDisciplinePowers(character, "strength", "athletics")).toEqual([])
    })
})
