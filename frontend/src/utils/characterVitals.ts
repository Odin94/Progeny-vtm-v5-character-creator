import type { Character } from "~/data/Character"

export type CharacterVitals = {
    characterId?: string
    coterieId?: string
    maxHealth: number
    superficialDamage: number
    aggravatedDamage: number
    hunger: number
    willpower: number
    currentWillpower: number
    superficialWillpowerDamage: number
    aggravatedWillpowerDamage: number
    humanity: number
    humanityStains: number
    characterVersion?: number
    updatedAt?: string
}

export const getCurrentWillpower = (character: Character) => {
    const superficialDamage = character.ephemeral?.superficialWillpowerDamage ?? 0
    const aggravatedDamage = character.ephemeral?.aggravatedWillpowerDamage ?? 0

    return Math.max(character.willpower - superficialDamage - aggravatedDamage, 0)
}

export const getCharacterVitals = (character: Character): CharacterVitals => ({
    maxHealth: character.maxHealth,
    superficialDamage: character.ephemeral?.superficialDamage ?? 0,
    aggravatedDamage: character.ephemeral?.aggravatedDamage ?? 0,
    hunger: character.ephemeral?.hunger ?? 0,
    willpower: character.willpower,
    currentWillpower: getCurrentWillpower(character),
    superficialWillpowerDamage: character.ephemeral?.superficialWillpowerDamage ?? 0,
    aggravatedWillpowerDamage: character.ephemeral?.aggravatedWillpowerDamage ?? 0,
    humanity: character.humanity,
    humanityStains: character.ephemeral?.humanityStains ?? 0,
    characterVersion: character.characterVersion
})

export const isCharacterVitals = (
    value: unknown
): value is CharacterVitals & {
    characterId: string
    coterieId: string
} => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false

    const vitals = value as Partial<CharacterVitals>
    return (
        typeof vitals.characterId === "string" &&
        typeof vitals.coterieId === "string" &&
        typeof vitals.maxHealth === "number" &&
        typeof vitals.superficialDamage === "number" &&
        typeof vitals.aggravatedDamage === "number" &&
        typeof vitals.hunger === "number" &&
        typeof vitals.willpower === "number" &&
        typeof vitals.currentWillpower === "number" &&
        typeof vitals.superficialWillpowerDamage === "number" &&
        typeof vitals.aggravatedWillpowerDamage === "number" &&
        typeof vitals.humanity === "number" &&
        typeof vitals.humanityStains === "number"
    )
}
