import type { MeritFlaw } from "~/data/Character"
import type { Discipline, Power, Ritual } from "~/data/Disciplines"
import { disciplines } from "~/data/Disciplines"
import type {
    HomebrewCollection,
    HomebrewDiscipline,
    HomebrewItem,
    HomebrewMeritFlaw,
    HomebrewPower,
    HomebrewSource
} from "~/data/Homebrew"

export const getHomebrewSource = (
    item: HomebrewItem & { id: string },
    collection: Pick<HomebrewCollection, "id" | "name">
): HomebrewSource => ({
    itemId: item.id,
    collectionId: collection.id,
    collectionName: collection.name
})

export const homebrewPowerToCharacterPower = (
    item: HomebrewPower & { id: string },
    collection: HomebrewCollection
): Power => ({
    name: item.name,
    summary: item.summary,
    description: item.description,
    discipline: item.discipline,
    level: item.level,
    dicePool: item.dicePool,
    rouseChecks: item.rouseChecks,
    amalgamPrerequisites: item.amalgamPrerequisites,
    isCustom: false,
    homebrewSource: getHomebrewSource(item, collection)
})

export const homebrewPowerToRitual = (
    item: HomebrewPower & { id: string },
    collection: HomebrewCollection
): Ritual => ({
    name: item.name,
    summary: item.summary,
    discipline: item.discipline,
    level: item.level,
    dicePool: item.dicePool,
    rouseChecks: item.rouseChecks,
    requiredTime: item.requiredTime ?? "",
    ingredients: item.ingredients ?? "",
    isCustom: false,
    homebrewSource: getHomebrewSource(item, collection)
})

export const homebrewMeritFlawToCharacter = (
    item: HomebrewMeritFlaw & { id: string },
    level: number,
    collection: HomebrewCollection
): MeritFlaw => ({
    name: item.name,
    level,
    summary: item.summary,
    text: item.description,
    excludes: item.excludes,
    type: item.kind,
    homebrewSource: getHomebrewSource(item, collection)
})

export const getHomebrewDisciplineOptions = (
    collections: HomebrewCollection[],
    availableNames: string[]
): Record<string, Discipline> => {
    const result: Record<string, Discipline> = {}
    const disciplineItems = collections.flatMap((collection) =>
        collection.items
            .filter(
                (item): item is HomebrewDiscipline & { id: string } => item.kind === "discipline"
            )
            .map((item) => ({ item, collection }))
    )
    const powerItems = collections.flatMap((collection) =>
        collection.items
            .filter(
                (item): item is HomebrewPower & { id: string } =>
                    item.kind === "power" || item.kind === "formula"
            )
            .map((item) => ({ item, collection }))
    )

    for (const name of availableNames) {
        const official = disciplines[name]
        const homebrew = disciplineItems.find(({ item }) => item.name === name)
        if (!official && !homebrew) continue
        const source = homebrew ? getHomebrewSource(homebrew.item, homebrew.collection) : undefined
        result[name] = {
            clans: official?.clans ?? [],
            summary: homebrew?.item.summary ?? official?.summary ?? "",
            logo: homebrew?.item.logo ?? official?.logo ?? "",
            powers: [
                ...(official?.powers ?? []),
                ...powerItems
                    .filter(({ item }) => item.discipline.toLowerCase() === name.toLowerCase())
                    .map(({ item, collection }) => homebrewPowerToCharacterPower(item, collection))
            ],
            isCustom: !!homebrew,
            ...(source && { homebrewSource: source })
        } as Discipline & { homebrewSource?: HomebrewSource }
    }

    return result
}
