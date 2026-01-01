import { Character } from "~/data/Character"
import { DisciplineName } from "~/data/NameSchemas"

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

export const getDisciplineCost = (character: Character, disciplineName: DisciplineName): number => {
    const newLevel = character.disciplines.filter((p) => p.discipline === disciplineName).length + 1

    if (character.clan === "Caitiff") {
        return newLevel * 6
    }

    if (character.availableDisciplineNames.includes(disciplineName) || character.predatorType.pickedDiscipline === disciplineName) {
        return newLevel * 5
    } else {
        return newLevel * 7
    }
}

export const getMeritCost = (level: number, previousLevel: number): number => {
    return (level - previousLevel) * 3
}

export const canAffordUpgrade = (availableXP: number, cost: number): boolean => {
    return availableXP >= cost
}

export const costFunctionByFieldName: Partial<Record<keyof Character, (newLevel: number) => number>> = {
    bloodPotency: getBloodPotencyCost,
    attributes: getAttributeCost,
    skills: getSkillCost,
    skillSpecialties: getSpecialtyCost,
}

// Rituals & formulas cost 3 x level
