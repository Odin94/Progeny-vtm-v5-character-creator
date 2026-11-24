import type { Character } from "./Character"

export const getGenerationBonusXp = (generation: number) => {
    if (generation === 13 || generation === 12) return 15
    if (generation === 11 || generation === 10) return 35
    return 0
}

export const getGenerationExperience = (
    character: Pick<Character, "experience" | "generation" | "generationBonusXp">,
    generation: number
): Pick<Character, "experience" | "generationBonusXp"> => {
    if (generation === character.generation) {
        return { experience: character.experience, generationBonusXp: character.generationBonusXp }
    }
    const previousBonus = Math.min(character.experience, character.generationBonusXp ?? 0)
    const generationBonusXp = getGenerationBonusXp(generation)
    return {
        experience: character.experience - previousBonus + generationBonusXp,
        generationBonusXp
    }
}
