import { advancedMeritsAndFlaws } from "./MeritsAndFlawsAdvanced"
import {
    essentialMeritsAndFlaws,
    loresheets,
    thinbloodMeritsAndFlaws
} from "./MeritsAndFlawsEssentials"
import { Character } from "./Character"

export type MeritFlawComplexity = "essential" | "advanced"

export type MeritOrFlaw = {
    name: string
    cost: number[]
    summary: string
    excludes: string[]
    complexity?: MeritFlawComplexity
}

export type MeritsAndFlaws = {
    title: string
    merits: MeritOrFlaw[]
    flaws: MeritOrFlaw[]
    complexity?: MeritFlawComplexity
}

export type RequirementFunction = (character: Character) => boolean

export type Loresheet = {
    title: string
    summary: string
    source: string
    requirementFunctions: RequirementFunction[]
    merits: MeritOrFlaw[]
}

export const defaultMeritFlawComplexity: MeritFlawComplexity = "essential"

export const getMeritFlawComplexity = (
    meritOrFlaw: MeritOrFlaw,
    category?: Pick<MeritsAndFlaws, "complexity">
): MeritFlawComplexity =>
    meritOrFlaw.complexity ?? category?.complexity ?? defaultMeritFlawComplexity

export const filterMeritsAndFlawsByComplexity = (
    categories: MeritsAndFlaws[],
    complexity: MeritFlawComplexity
): MeritsAndFlaws[] =>
    categories.flatMap((category) => {
        const merits = category.merits.filter(
            (merit) => getMeritFlawComplexity(merit, category) === complexity
        )
        const flaws = category.flaws.filter(
            (flaw) => getMeritFlawComplexity(flaw, category) === complexity
        )

        if (merits.length === 0 && flaws.length === 0) return []

        return [{ ...category, merits, flaws }]
    })

export const filterLoresheetsByComplexity = (
    sheets: Loresheet[],
    complexity: MeritFlawComplexity
): Loresheet[] =>
    sheets.flatMap((sheet) => {
        const merits = sheet.merits.filter((merit) => getMeritFlawComplexity(merit) === complexity)

        if (merits.length === 0) return []

        return [{ ...sheet, merits }]
    })

const _thinbloodMeritNames = new Set(thinbloodMeritsAndFlaws.merits.map((m) => m.name))
const _thinbloodFlawNames = new Set(thinbloodMeritsAndFlaws.flaws.map((f) => f.name))
export const isThinbloodMerit = (m: string) => _thinbloodMeritNames.has(m)
export const isThinbloodFlaw = (f: string) => _thinbloodFlawNames.has(f)
export const isThinbloodMeritOrFlaw = (mf: string) => isThinbloodMerit(mf) || isThinbloodFlaw(mf)

export { advancedMeritsAndFlaws, essentialMeritsAndFlaws, loresheets, thinbloodMeritsAndFlaws }

export const meritsAndFlaws: MeritsAndFlaws[] = [
    ...essentialMeritsAndFlaws,
    ...advancedMeritsAndFlaws
]

export const essentialThinbloodMeritsAndFlaws = filterMeritsAndFlawsByComplexity(
    [thinbloodMeritsAndFlaws],
    "essential"
)[0] ?? { ...thinbloodMeritsAndFlaws, merits: [], flaws: [] }

export const advancedThinbloodMeritsAndFlaws = filterMeritsAndFlawsByComplexity(
    [thinbloodMeritsAndFlaws],
    "advanced"
)[0] ?? { ...thinbloodMeritsAndFlaws, merits: [], flaws: [] }

export const essentialLoresheets = filterLoresheetsByComplexity(loresheets, "essential")

export const advancedLoresheets = filterLoresheetsByComplexity(loresheets, "advanced")

export const getAllKnownMeritsAndFlaws = (): Map<string, MeritOrFlaw> => {
    const map = new Map<string, MeritOrFlaw>()

    const addMeritsAndFlaws = (merits: MeritOrFlaw[], flaws: MeritOrFlaw[]) => {
        merits.forEach((merit) => map.set(merit.name, merit))
        flaws.forEach((flaw) => map.set(flaw.name, flaw))
    }

    addMeritsAndFlaws(thinbloodMeritsAndFlaws.merits, thinbloodMeritsAndFlaws.flaws)

    meritsAndFlaws.forEach((category) => {
        addMeritsAndFlaws(category.merits, category.flaws)
    })

    loresheets.forEach((loresheet) => {
        loresheet.merits.forEach((merit) => map.set(merit.name, merit))
    })

    return map
}
