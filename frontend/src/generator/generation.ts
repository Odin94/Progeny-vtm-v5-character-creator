import type { Character } from "~/data/Character"
import { getGenerationExperience } from "~/data/Generation"
import { updateHealthAndWillpowerAndBloodPotencyAndHumanity } from "./utils"

export const getCharacterWithGeneration = (character: Character, generation: number): Character => {
    if (generation === character.generation) return character

    const updated = { ...character, ...getGenerationExperience(character, generation), generation }
    updateHealthAndWillpowerAndBloodPotencyAndHumanity(updated)
    return updated
}
