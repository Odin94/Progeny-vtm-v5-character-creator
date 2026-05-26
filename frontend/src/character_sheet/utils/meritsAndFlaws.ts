import type { Character, MeritFlaw } from "~/data/Character"
import { getResolvedMeritsAndFlaws } from "~/data/meritsAndFlawsResolution"

export type SheetMeritFlaw = {
    meritFlaw: MeritFlaw
    isFromPredatorType: boolean
    isUpgradedFromPredatorType: boolean
}

export const getSheetMeritsAndFlaws = (
    character: Character
): {
    merits: SheetMeritFlaw[]
    flaws: SheetMeritFlaw[]
} => {
    return getResolvedMeritsAndFlaws(character)
}

export const hasSheetMeritsAndFlaws = (character: Character) => {
    const { merits, flaws } = getSheetMeritsAndFlaws(character)
    return merits.length > 0 || flaws.length > 0
}
