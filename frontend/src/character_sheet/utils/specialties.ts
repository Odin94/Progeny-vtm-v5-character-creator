import type { Character } from "~/data/Character"
import type { SkillsKey } from "~/data/Skills"
import { getSpecialtyCost } from "./xp"

export const removeSkillSpecialty = (
    character: Character,
    skill: SkillsKey,
    index: number,
    refundPendingXp: boolean
): Character => {
    const specialtiesForSkill = character.skillSpecialties.filter(
        (specialty) => specialty.skill === skill
    )
    const specialtyToRemove = specialtiesForSkill[index]

    if (!specialtyToRemove) return character

    const shouldRefund = refundPendingXp && specialtyToRemove.name.trim() === ""

    return {
        ...character,
        skillSpecialties: character.skillSpecialties.filter(
            (specialty) => specialty !== specialtyToRemove
        ),
        ...(shouldRefund
            ? {
                  ephemeral: {
                      ...character.ephemeral,
                      experienceSpent: Math.max(
                          0,
                          character.ephemeral.experienceSpent - getSpecialtyCost()
                      )
                  }
              }
            : {})
    }
}
