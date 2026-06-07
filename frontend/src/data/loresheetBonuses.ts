import type { Character, MeritFlaw } from "./Character"
import { loresheets } from "./MeritsAndFlaws"

const selectedLoresheetMeritNames = (character: Character): Set<string> =>
    new Set((character.merits ?? []).map((merit) => merit.name))

export const getSelectedLoresheetMeritBonuses = (character: Character) => {
    const selectedNames = selectedLoresheetMeritNames(character)

    return loresheets
        .flatMap((loresheet) => loresheet.merits)
        .filter((merit) => selectedNames.has(merit.name))
        .map((merit) => merit.bonuses)
        .filter((bonuses) => bonuses !== undefined)
}

export const getLoresheetBonusMeritsAndFlaws = (character: Character): MeritFlaw[] =>
    getSelectedLoresheetMeritBonuses(character).flatMap((bonuses) => bonuses.meritsOrFlaws ?? [])
