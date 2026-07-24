import { describe, expect, it } from "vitest"
import { createInconnuCommandExport } from "~/generator/inconnuCommandCreator"
import { createInconnuJson } from "~/generator/inconnuJsonCreator"
import { getBasicTestCharacter } from "./testUtils"

describe("createInconnuCommandExport", () => {
    it("creates setup commands from the Inconnu wizard export", () => {
        const result = createInconnuCommandExport(createInconnuJson(getBasicTestCharacter()))

        expect(result).toContain("/character wizard")
        expect(result).toContain("/character create has been removed")
        expect(result).toContain(
            "/character update parameters:health=5 willpower=4 humanity=7 potency=1 character:Test Vampire"
        )
        expect(result).toContain("/traits update traits:Strength=3 Dexterity=2")
        expect(result).toContain("/disciplines add disciplines:Potence=1 BloodSorcery=1")
        expect(result).toContain("/traits add traits:Direct_Merit=3 Direct_Flaw=2 Resources=1")
        expect(result).toContain("/specialties add specialties:Intimidation=Direct_Specialty")
        expect(result).toContain("/powers add powers:Potence=Prowess BloodSorcery=Corrosive_Vitae,Test_Ritual")
    })

    it("splits long trait lists into individually usable commands", () => {
        const character = createInconnuJson(getBasicTestCharacter())
        character.traits = Array.from({ length: 13 }, (_, index) => ({
            name: `Trait_${index}`,
            rating: 1,
            type: "custom" as const,
            subtraits: []
        }))

        const result = createInconnuCommandExport(character)
        expect(result.match(/\/traits add/g)).toHaveLength(2)
    })
})
