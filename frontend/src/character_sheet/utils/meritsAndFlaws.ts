import type { Character, MeritFlaw } from "~/data/Character"
import { PredatorTypes } from "~/data/PredatorType"

export type SheetMeritFlaw = {
    meritFlaw: MeritFlaw
    isFromPredatorType: boolean
}

export const getSheetMeritsAndFlaws = (
    character: Character
): {
    merits: SheetMeritFlaw[]
    flaws: SheetMeritFlaw[]
} => {
    const predatorType = PredatorTypes[character.predatorType.name]
    const predatorTypeItems = [
        ...predatorType.meritsAndFlaws,
        ...character.predatorType.pickedMeritsAndFlaws
    ].map((meritFlaw) => ({
        meritFlaw,
        isFromPredatorType: true
    }))

    const regularMerits = character.merits.map((meritFlaw) => ({
        meritFlaw,
        isFromPredatorType: false
    }))
    const regularFlaws = character.flaws.map((meritFlaw) => ({
        meritFlaw,
        isFromPredatorType: false
    }))

    return {
        merits: [
            ...regularMerits,
            ...predatorTypeItems.filter(({ meritFlaw }) => meritFlaw.type === "merit")
        ],
        flaws: [
            ...regularFlaws,
            ...predatorTypeItems.filter(({ meritFlaw }) => meritFlaw.type === "flaw")
        ]
    }
}

export const hasSheetMeritsAndFlaws = (character: Character) => {
    const { merits, flaws } = getSheetMeritsAndFlaws(character)
    return merits.length > 0 || flaws.length > 0
}
