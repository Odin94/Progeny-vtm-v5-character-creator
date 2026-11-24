import { getPredatorDisciplineIdentity } from "~/data/predatorTypeOptions"
import type { AttributeSetting, Character, FreeGrimoireChoice } from "~/data/Character"
import {
    getPowerDisciplineIdentity,
    getPowerIdentity,
    getRitualIdentity
} from "~/utils/homebrewOptions"
import type { Attributes, AttributesKey } from "~/data/Attributes"
import type { Power, Ritual } from "~/data/Disciplines"
import type { Skills, SkillsKey } from "~/data/Skills"

export type SkillsSetting = {
    special: SkillsKey[]
    strongest: SkillsKey[]
    decent: SkillsKey[]
    acceptable: SkillsKey[]
}

export type DistributionKey = "Jack of All Trades" | "Balanced" | "Specialist"

export const emptyAttributeSetting: AttributeSetting = {
    strongest: null,
    weakest: null,
    medium: []
}

export const emptySkillsSetting: SkillsSetting = {
    special: [],
    strongest: [],
    decent: [],
    acceptable: []
}

export const getAttributeSetting = (attributes: Attributes): AttributeSetting => {
    const values = Object.entries(attributes) as [AttributesKey, number][]
    if (values.every(([, value]) => value === 1)) return emptyAttributeSetting

    return {
        strongest: values.find(([, value]) => value === 4)?.[0] ?? null,
        weakest: values.find(([, value]) => value === 1)?.[0] ?? null,
        medium: values.filter(([, value]) => value === 3).map(([key]) => key)
    }
}

export const getSkillsSetting = (skills: Skills): SkillsSetting => {
    const values = Object.entries(skills) as [SkillsKey, number][]
    return {
        special: values.filter(([, value]) => value === 4).map(([key]) => key),
        strongest: values.filter(([, value]) => value === 3).map(([key]) => key),
        decent: values.filter(([, value]) => value === 2).map(([key]) => key),
        acceptable: values.filter(([, value]) => value === 1).map(([key]) => key)
    }
}

export const getSkillDistribution = (setting: SkillsSetting): DistributionKey | null => {
    if (
        setting.special.length === 1 &&
        setting.strongest.length === 3 &&
        setting.decent.length === 3 &&
        setting.acceptable.length === 3
    ) {
        return "Specialist"
    }
    if (
        setting.special.length === 0 &&
        setting.strongest.length === 3 &&
        setting.decent.length === 5 &&
        setting.acceptable.length === 7
    ) {
        return "Balanced"
    }
    if (
        setting.special.length === 0 &&
        setting.strongest.length === 1 &&
        setting.decent.length === 8 &&
        setting.acceptable.length === 10
    ) {
        return "Jack of All Trades"
    }
    return null
}

export const getDisciplineDraft = (
    character: Pick<Character, "disciplines" | "predatorType">
): { clanPowers: Power[]; predatorPower: Power | undefined } => {
    const { disciplines, predatorType } = character
    const disciplineIdentity = getPredatorDisciplineIdentity(character)
    const predatorPower = disciplines.find(
        (power) =>
            getPowerIdentity(power) === predatorType.pickedPowerId &&
            getPowerDisciplineIdentity(power) === disciplineIdentity
    )

    return {
        clanPowers: predatorPower
            ? disciplines.filter((power) => power !== predatorPower)
            : disciplines,
        predatorPower
    }
}

export const updateFreeGrimoireChoice = <T extends Ritual>(
    entries: T[],
    previous: FreeGrimoireChoice | undefined,
    next?: T
): { entries: T[]; choice: FreeGrimoireChoice | undefined } => {
    const nextId = next && getRitualIdentity(next)
    if (
        nextId &&
        nextId === previous?.identity &&
        entries.some((entry) => getRitualIdentity(entry) === nextId)
    ) {
        return { entries, choice: previous }
    }

    const learned = previous?.addedByCreator
        ? entries.filter((entry) => getRitualIdentity(entry) !== previous.identity)
        : entries
    if (!next || !nextId) return { entries: learned, choice: undefined }

    const addedByCreator = !learned.some((entry) => getRitualIdentity(entry) === nextId)
    return {
        entries: addedByCreator ? [...learned, next] : learned,
        choice: { identity: nextId, addedByCreator }
    }
}
