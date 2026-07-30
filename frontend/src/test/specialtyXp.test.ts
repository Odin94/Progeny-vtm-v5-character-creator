import { describe, expect, it } from "vitest"
import { removeSkillSpecialty } from "~/character_sheet/utils/specialties"
import { getEmptyCharacter } from "~/data/Character"

describe("specialty XP cancellation", () => {
    it("refunds XP when an unfinished XP specialty is removed", () => {
        const character = getEmptyCharacter()
        character.skillSpecialties = [{ skill: "academics", name: "" }]
        character.ephemeral.experienceSpent = 8

        const updated = removeSkillSpecialty(character, "academics", 0, true)

        expect(updated.skillSpecialties).toEqual([])
        expect(updated.ephemeral.experienceSpent).toBe(5)
    })

    it("does not refund an established specialty", () => {
        const character = getEmptyCharacter()
        character.skillSpecialties = [{ skill: "academics", name: "History" }]
        character.ephemeral.experienceSpent = 8

        const updated = removeSkillSpecialty(character, "academics", 0, true)

        expect(updated.skillSpecialties).toEqual([])
        expect(updated.ephemeral.experienceSpent).toBe(8)
    })

    it("does not change XP when an unfinished specialty is removed in free mode", () => {
        const character = getEmptyCharacter()
        character.skillSpecialties = [{ skill: "academics", name: "" }]
        character.ephemeral.experienceSpent = 8

        const updated = removeSkillSpecialty(character, "academics", 0, false)

        expect(updated.skillSpecialties).toEqual([])
        expect(updated.ephemeral.experienceSpent).toBe(8)
    })
})
