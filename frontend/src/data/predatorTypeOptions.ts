import type { Character } from "./Character"
import { PredatorTypes, type PredatorType } from "./PredatorType"
import type { HomebrewCollection } from "./Homebrew"
import { predatorDisciplineKey } from "./PredatorTypeRules"

export const getCharacterPredatorType = (
    character: Pick<Character, "predatorType">
): PredatorType =>
    character.predatorType?.homebrew ??
    PredatorTypes[character.predatorType?.name ?? ""] ??
    PredatorTypes[""]

export const getPredatorTypeKey = (predator: PredatorType) =>
    predator.homebrewSource
        ? `homebrew:${predator.homebrewSource.collectionId}:${predator.homebrewSource.itemId}`
        : predator.name

export const getCharacterPredatorTypeKey = (character: Character) =>
    character.predatorType.homebrew
        ? getPredatorTypeKey(character.predatorType.homebrew)
        : character.predatorType.name

export const getPredatorTypeOptions = (
    collections: HomebrewCollection[],
    character: Character
): Record<string, PredatorType> => {
    const options = { ...PredatorTypes }
    for (const collection of collections)
        for (const item of collection.items) {
            if (item.kind !== "predatorType") continue
            const predator = {
                ...item,
                homebrewSource: {
                    itemId: item.id,
                    collectionId: collection.id,
                    collectionName: collection.name
                }
            }
            options[getPredatorTypeKey(predator)] = predator
        }
    // A saved character keeps its rules even if its source collection is unavailable or edited.
    if (character.predatorType.homebrew)
        options[getPredatorTypeKey(character.predatorType.homebrew)] =
            character.predatorType.homebrew
    return options
}

export const getPredatorDisciplineKey = (character: Character) =>
    character.predatorType.pickedDisciplineRef
        ? predatorDisciplineKey(character.predatorType.pickedDisciplineRef)
        : character.predatorType.pickedDiscipline

export const getSkillsWithoutPredatorBonuses = (character: Character) => {
    const skills = { ...character.skills }
    for (const grant of character.predatorType.appliedSkillBonuses ?? [])
        skills[grant.skill] = Math.max(0, skills[grant.skill] - grant.dots)
    return skills
}

export const getPredatorDisciplineIdentity = (character: Character) => {
    const reference = character.predatorType.pickedDisciplineRef
    return reference?.type === "homebrew" && character.predatorType.homebrew
        ? `homebrew:${character.predatorType.homebrew.homebrewSource.collectionId}:${reference.itemId}`
        : `official:${character.predatorType.pickedDiscipline}`
}

// Store only dots actually applied, so replacing a type reverses capped grants exactly once.
export const replacePredatorSkillBonuses = (
    character: Character,
    next: Character["predatorType"]
) => {
    const skills = getSkillsWithoutPredatorBonuses(character)
    const appliedSkillBonuses = (next.homebrew?.skillBonuses ?? []).map(({ skill, dots }) => {
        const applied = Math.min(dots, 5 - skills[skill])
        skills[skill] += applied
        return { skill, dots: applied }
    })
    return {
        skills,
        predatorType: {
            ...next,
            ...(appliedSkillBonuses.length
                ? { appliedSkillBonuses }
                : { appliedSkillBonuses: undefined })
        }
    }
}
