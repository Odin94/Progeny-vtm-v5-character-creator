import type { Character } from "~/data/Character"

export type CharacterVitals = {
    characterId?: string
    coterieId?: string
    hunger: number
    willpower: number
    currentWillpower: number
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
    hunger: character.ephemeral?.hunger ?? 0,
    willpower: character.willpower,
    currentWillpower: getCurrentWillpower(character),
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
        typeof vitals.hunger === "number" &&
        typeof vitals.willpower === "number" &&
        typeof vitals.currentWillpower === "number" &&
        typeof vitals.humanity === "number" &&
        typeof vitals.humanityStains === "number"
    )
}
