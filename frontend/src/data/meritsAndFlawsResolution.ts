import type { Character, MeritFlaw } from "./Character"
import { PredatorTypes } from "./PredatorType"

export type ResolvedMeritFlaw = {
    meritFlaw: MeritFlaw
    isFromPredatorType: boolean
    isUpgradedFromPredatorType: boolean
}

const predatorTypeMeritFlawCatalogNameAliases = new Map<string, string>([
    ["Contact", "Contacts"],
    ["Enemies", "Enemy"],
    ["Prey Exclusion (another scene)", "Prey Exclusion"],
    ["Retainers", "Retainer"]
])

export const getCatalogMeritFlawName = (name: string) =>
    predatorTypeMeritFlawCatalogNameAliases.get(name) ?? name

const getMeritFlawKey = (meritFlaw: Pick<MeritFlaw, "name" | "type">) =>
    `${meritFlaw.type}:${getCatalogMeritFlawName(meritFlaw.name)}`

const mergeMeritFlawDetails = (base: MeritFlaw, incoming: MeritFlaw): MeritFlaw => ({
    ...base,
    level: base.level + incoming.level,
    summary: base.summary || incoming.summary,
    excludes: Array.from(new Set([...base.excludes, ...incoming.excludes]))
})

const mergeDuplicateMeritFlawDetails = (base: MeritFlaw, incoming: MeritFlaw): MeritFlaw => ({
    ...(incoming.level > base.level ? incoming : base),
    level: Math.max(base.level, incoming.level),
    excludes: Array.from(new Set([...base.excludes, ...incoming.excludes]))
})

export const getPredatorTypeMeritsByName = (character: Character): Map<string, MeritFlaw> => {
    const predatorType = PredatorTypes[character.predatorType?.name ?? ""]
    const pickedPredatorTypeMeritsAndFlaws = character.predatorType?.pickedMeritsAndFlaws ?? []
    const selectableKeys = new Set(
        predatorType?.selectableMeritsAndFlaws.flatMap(({ options }) =>
            options.map((option) => getMeritFlawKey(option))
        ) ?? []
    )

    const byKey = new Map<string, MeritFlaw>()

    predatorType?.meritsAndFlaws.forEach((meritFlaw) => {
        const key = getMeritFlawKey(meritFlaw)
        const existing = byKey.get(key)
        byKey.set(key, existing ? mergeMeritFlawDetails(existing, meritFlaw) : { ...meritFlaw })
    })

    pickedPredatorTypeMeritsAndFlaws.forEach((meritFlaw) => {
        const key = getMeritFlawKey(meritFlaw)
        const existing = byKey.get(key)
        if (!existing) {
            byKey.set(key, { ...meritFlaw })
            return
        }

        byKey.set(
            key,
            selectableKeys.has(key)
                ? mergeMeritFlawDetails(existing, meritFlaw)
                : mergeDuplicateMeritFlawDetails(existing, meritFlaw)
        )
    })

    const byName = new Map<string, MeritFlaw>()
    byKey.forEach((meritFlaw) => {
        byName.set(meritFlaw.name, meritFlaw)
        byName.set(getCatalogMeritFlawName(meritFlaw.name), meritFlaw)
    })

    return byName
}

export const getMeritFlawPointCost = (
    meritFlaw: MeritFlaw,
    predatorTypeMeritsByName: Map<string, MeritFlaw>
): number => {
    const predatorTypeMeritFlaw = predatorTypeMeritsByName.get(
        getCatalogMeritFlawName(meritFlaw.name)
    )
    return Math.max(0, meritFlaw.level - (predatorTypeMeritFlaw?.level ?? 0))
}

export const adjustPickedMeritsAndFlawsForPredatorTypeChange = (
    character: Character,
    nextPredatorType: Character["predatorType"]
): Pick<Character, "merits" | "flaws"> => {
    const previousPredatorTypeMeritsByName = getPredatorTypeMeritsByName(character)
    const nextPredatorTypeMeritsByName = getPredatorTypeMeritsByName({
        ...character,
        predatorType: nextPredatorType
    })

    const adjustMeritFlaw = (meritFlaw: MeritFlaw): MeritFlaw | null => {
        const previousPredatorTypeMeritFlaw = previousPredatorTypeMeritsByName.get(
            getCatalogMeritFlawName(meritFlaw.name)
        )
        if (!previousPredatorTypeMeritFlaw || previousPredatorTypeMeritFlaw.type !== meritFlaw.type)
            return meritFlaw

        const nextPredatorTypeMeritFlaw = nextPredatorTypeMeritsByName.get(
            getCatalogMeritFlawName(meritFlaw.name)
        )
        if (
            nextPredatorTypeMeritFlaw?.type === meritFlaw.type &&
            nextPredatorTypeMeritFlaw.level === previousPredatorTypeMeritFlaw.level
        ) {
            return meritFlaw
        }

        const nextLevel = meritFlaw.level - previousPredatorTypeMeritFlaw.level
        if (nextLevel <= 0) return null

        return {
            ...meritFlaw,
            level: nextLevel
        }
    }

    return {
        merits: character.merits.map(adjustMeritFlaw).filter((meritFlaw) => meritFlaw !== null),
        flaws: character.flaws.map(adjustMeritFlaw).filter((meritFlaw) => meritFlaw !== null)
    }
}

export const getResolvedMeritFlawList = (character: Character): ResolvedMeritFlaw[] => {
    const predatorTypeMeritsByName = getPredatorTypeMeritsByName(character)
    const regularItems = [...(character.merits ?? []), ...(character.flaws ?? [])]
    const regularByKey = new Map<string, MeritFlaw>()

    regularItems.forEach((meritFlaw) => {
        const key = getMeritFlawKey(meritFlaw)
        const existing = regularByKey.get(key)
        if (!existing || meritFlaw.level > existing.level) {
            regularByKey.set(key, meritFlaw)
        }
    })

    const regularOnlyItems: ResolvedMeritFlaw[] = []
    const predatorTypeItems: ResolvedMeritFlaw[] = []
    const resolvedPredatorKeys = new Set<string>()

    predatorTypeMeritsByName.forEach((predatorTypeMeritFlaw) => {
        const key = getMeritFlawKey(predatorTypeMeritFlaw)
        if (resolvedPredatorKeys.has(key)) return
        resolvedPredatorKeys.add(key)

        const regularItem = regularByKey.get(key)
        if (!regularItem) {
            predatorTypeItems.push({
                meritFlaw: predatorTypeMeritFlaw,
                isFromPredatorType: true,
                isUpgradedFromPredatorType: false
            })
            return
        }

        const effectiveLevel = Math.max(predatorTypeMeritFlaw.level, regularItem.level)
        predatorTypeItems.push({
            meritFlaw: {
                ...(regularItem.level >= predatorTypeMeritFlaw.level
                    ? regularItem
                    : predatorTypeMeritFlaw),
                level: effectiveLevel,
                excludes: Array.from(
                    new Set([...predatorTypeMeritFlaw.excludes, ...regularItem.excludes])
                )
            },
            isFromPredatorType: true,
            isUpgradedFromPredatorType: regularItem.level > predatorTypeMeritFlaw.level
        })
    })

    regularItems.forEach((meritFlaw) => {
        if (resolvedPredatorKeys.has(getMeritFlawKey(meritFlaw))) return
        regularOnlyItems.push({
            meritFlaw,
            isFromPredatorType: false,
            isUpgradedFromPredatorType: false
        })
    })

    const resolvedItems = [...regularOnlyItems, ...predatorTypeItems]

    return resolvedItems
}

export const getResolvedMeritsAndFlaws = (
    character: Character
): {
    merits: ResolvedMeritFlaw[]
    flaws: ResolvedMeritFlaw[]
} => {
    const resolvedItems = getResolvedMeritFlawList(character)
    return {
        merits: resolvedItems.filter(({ meritFlaw }) => meritFlaw.type === "merit"),
        flaws: resolvedItems.filter(({ meritFlaw }) => meritFlaw.type === "flaw")
    }
}
