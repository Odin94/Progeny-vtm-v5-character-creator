import { Character } from "./Character"
import { PredatorTypes } from "./PredatorType"

export type BloodPotencyEffect = {
    surge: number
    mend: string
    discBonus: string
    discRouse: string
    bane: number
    penalty: string
}

export const potencyEffects: Record<number, BloodPotencyEffect> = {
    0: { surge: 1, mend: "1 superficial", discBonus: "-", discRouse: "-", bane: 0, penalty: "-" },
    1: { surge: 2, mend: "1 superficial", discBonus: "-", discRouse: "Lvl 1", bane: 2, penalty: "-" },
    2: {
        surge: 2,
        mend: "2 superficial",
        discBonus: "Add 1 die",
        discRouse: "Lvl 1",
        bane: 2,
        penalty: "Animal and bagged blood slake half Hunger",
    },
    3: {
        surge: 3,
        mend: "2 superficial",
        discBonus: "Add 1 die",
        discRouse: "Lvl 2 and below",
        bane: 3,
        penalty: "Animal and bagged blood slake no Hunger",
    },
    4: {
        surge: 3,
        mend: "3 superficial",
        discBonus: "Add 2 dice",
        discRouse: "Lvl 2 and below",
        bane: 3,
        penalty: "Animal and bagged blood slake no Hunger,\nSlake 1 less Hunger per human",
    },
    5: {
        surge: 4,
        mend: "3 superficial",
        discBonus: "Add 2 dice",
        discRouse: "Lvl 3 and below",
        bane: 4,
        penalty:
            "Animal and bagged blood slake no Hunger,\nSlake 1 less Hunger per human,\nMust drain and kill a human to reduce Hunger below 2",
    },
}

export const calculateBloodPotency = (character: Character): number => {
    let bloodPotency = (() => {
        switch (character.generation) {
            case 16:
            case 15:
            case 14:
                return 0
            case 13:
            case 12:
                return 1
            case 11:
            case 10:
                return 2
            default:
                return 1
        }
    })()
    bloodPotency += PredatorTypes[character.predatorType.name].bloodPotencyChange
    return bloodPotency
}
