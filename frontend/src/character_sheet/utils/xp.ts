import { Character, getDisciplineLevel } from "~/data/Character"
import { DisciplineName } from "~/data/NameSchemas"
import { getPowerDisciplineIdentity } from "~/utils/homebrewOptions"

export const getAvailableXP = (character: Character): number => {
    return character.experience - character.ephemeral.experienceSpent
}

export const getAttributeCost = (newLevel: number): number => {
    return newLevel * 5
}

export const getSkillCost = (newLevel: number): number => {
    return newLevel * 3
}

export const getSpecialtyCost = (): number => {
    return 3
}

export const getBloodPotencyCost = (newLevel: number): number => {
    return newLevel * 10
}

export const getDisciplineCost = (
    character: Character,
    disciplineName: DisciplineName,
    disciplineIdentity = `official:${disciplineName}`
): number => {
    const newLevel = getDisciplineLevel(character, disciplineIdentity) + 1

    if (character.clan === "Caitiff") {
        return newLevel * 6
    }

    if (
        character.availableDisciplineNames.includes(disciplineName) ||
        character.homebrewClan?.nativeDisciplineRefs?.some((reference) =>
            reference.type === "homebrew"
                ? `homebrew:${character.homebrewClan?.homebrewSource.collectionId}:${reference.itemId}` ===
                  disciplineIdentity
                : `official:${reference.name}` === disciplineIdentity
        ) ||
        character.predatorType.pickedDiscipline === disciplineName
    ) {
        return newLevel * 5
    } else {
        return newLevel * 7
    }
}

export const getRitualCost = (level: number): number => {
    return level * 3
}

export const getMeritCost = (level: number, previousLevel: number): number => {
    return (level - previousLevel) * 3
}

export const canAffordUpgrade = (availableXP: number, cost: number): boolean => {
    return availableXP >= cost
}

export const costFunctionByFieldName: Partial<
    Record<keyof Character, (newLevel: number) => number>
> = {
    bloodPotency: getBloodPotencyCost,
    attributes: getAttributeCost,
    skills: getSkillCost,
    skillSpecialties: getSpecialtyCost
}
