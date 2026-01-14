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

export type BloodPotencyLimits = {
    min: number
    max: number
}

export const potencyLimitByGeneration: Record<number, BloodPotencyLimits> = {
    4: { min: 5, max: 10 },
    5: { min: 4, max: 9 },
    6: { min: 3, max: 8 },
    7: { min: 3, max: 7 },
    8: { min: 2, max: 6 },
    9: { min: 2, max: 5 },
    10: { min: 1, max: 4 },
    11: { min: 1, max: 4 },
    12: { min: 1, max: 3 },
    13: { min: 1, max: 3 },
    14: { min: 0, max: 0 },
    15: { min: 0, max: 0 },
    16: { min: 0, max: 0 },
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
    6: {
        surge: 4,
        mend: "3 superficial",
        discBonus: "Add 3 dice",
        discRouse: "Lvl 3 and below",
        bane: 4,
        penalty:
            "Animal and bagged blood slake no Hunger,\nSlake 2 less Hunger per human,\nMust drain and kill a human to reduce Hunger below 2",
    },
    7: {
        surge: 5,
        mend: "3 superficial",
        discBonus: "Add 3 dice",
        discRouse: "Lvl 4 and below",
        bane: 5,
        penalty:
            "Animal and bagged blood slake no Hunger,\nSlake 2 less Hunger per human,\nMust drain and kill a human to reduce Hunger below 2",
    },
    8: {
        surge: 5,
        mend: "4 superficial",
        discBonus: "Add 4 dice",
        discRouse: "Lvl 4 and below",
        bane: 5,
        penalty:
            "Animal and bagged blood slake no Hunger,\nSlake 2 less Hunger per human,\nMust drain and kill a human to reduce Hunger below 3",
    },
    9: {
        surge: 6,
        mend: "4 superficial",
        discBonus: "Add 4 dice",
        discRouse: "Lvl 5 and below",
        bane: 6,
        penalty:
            "Animal and bagged blood slake no Hunger,\nSlake 2 less Hunger per human,\nMust drain and kill a human to reduce Hunger below 3",
    },
    10: {
        surge: 6,
        mend: "5 superficial",
        discBonus: "Add 5 dice",
        discRouse: "Lvl 5 and below",
        bane: 6,
        penalty:
            "Animal and bagged blood slake no Hunger,\nSlake 3 less Hunger per human,\nMust drain and kill a human to reduce Hunger below 3",
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
