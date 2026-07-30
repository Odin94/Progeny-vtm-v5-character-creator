import type { MeritFlaw } from "~/data/Character"
import type { Discipline, Power, Ritual } from "~/data/Disciplines"
import { disciplines } from "~/data/Disciplines"
import type {
    HomebrewCollection,
    HomebrewDiscipline,
    HomebrewDisciplineReference,
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
): Power => {
    const disciplineItem = collection.items.find(
        (candidate): candidate is HomebrewDiscipline & { id: string } =>
            candidate.kind === "discipline" &&
            (item.disciplineRef?.type === "homebrew"
                ? candidate.id === item.disciplineRef.itemId
                : !item.disciplineRef &&
                  candidate.name.toLowerCase() === item.discipline.toLowerCase())
    )
    return {
        name: item.name,
        summary: item.summary,
        description: item.description,
        discipline: item.discipline,
        level: item.level,
        dicePool: item.dicePool,
        rouseChecks: item.rouseChecks,
        amalgamPrerequisites: item.amalgamPrerequisites,
        requiredTime: item.requiredTime,
        ingredients: item.ingredients,
        isCustom: false,
        homebrewSource: getHomebrewSource(item, collection),
        ...(disciplineItem && {
            disciplineHomebrewSource: getHomebrewSource(disciplineItem, collection)
        })
    }
}

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

export const getPowerIdentity = (power: Pick<Power, "name" | "discipline" | "homebrewSource">) =>
    power.homebrewSource
        ? `homebrew:${power.homebrewSource.collectionId}:${power.homebrewSource.itemId}`
        : `official:${power.discipline}:${power.name}`

export const getRitualIdentity = (ritual: Pick<Ritual, "name" | "discipline" | "homebrewSource">) =>
    ritual.homebrewSource
        ? `homebrew:${ritual.homebrewSource.collectionId}:${ritual.homebrewSource.itemId}`
        : `official:${ritual.discipline ?? ""}:${ritual.name}`

export const getPowerDisciplineIdentity = (
    power: Pick<Power, "discipline" | "disciplineHomebrewSource">
) =>
    power.disciplineHomebrewSource
        ? `homebrew:${power.disciplineHomebrewSource.collectionId}:${power.disciplineHomebrewSource.itemId}`
        : `official:${power.discipline}`

export type HomebrewDisciplineOption = Discipline & {
    optionKey: string
    name: string
    label: string
    homebrewSource?: HomebrewSource
}

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
    availableDisciplines: Array<string | HomebrewDisciplineReference>
): Record<string, HomebrewDisciplineOption> => {
    const result: Record<string, HomebrewDisciplineOption> = {}
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

    const explicitReferences = availableDisciplines.filter(
        (reference): reference is HomebrewDisciplineReference => typeof reference !== "string"
    )
    const availableNames = availableDisciplines.map((reference) =>
        typeof reference === "string" ? reference : reference.name
    )
    const allowedHomebrewIds = new Set(
        explicitReferences.flatMap((reference) =>
            reference.type === "homebrew" && reference.itemId ? [reference.itemId] : []
        )
    )

    for (const name of new Set(availableNames)) {
        const official = disciplines[name]
        if (official) {
            result[name] = {
                ...official,
                optionKey: name,
                name,
                label: name,
                powers: [
                    ...official.powers,
                    ...powerItems
                        .filter(({ item, collection }) => {
                            if (item.discipline.toLowerCase() !== name.toLowerCase()) return false
                            if (item.disciplineRef?.type === "homebrew") return false
                            if (item.disciplineRef?.type === "official") return true
                            return !collection.items.some(
                                (candidate) =>
                                    candidate.kind === "discipline" &&
                                    candidate.name.toLowerCase() === name.toLowerCase()
                            )
                        })
                        .map(({ item, collection }) =>
                            homebrewPowerToCharacterPower(item, collection)
                        )
                ]
            }
        }

        for (const homebrew of disciplineItems.filter(
            ({ item }) =>
                item.name.toLowerCase() === name.toLowerCase() &&
                (explicitReferences.length === 0 || allowedHomebrewIds.has(item.id))
        )) {
            const source = getHomebrewSource(homebrew.item, homebrew.collection)
            const optionKey = `homebrew:${source.collectionId}:${source.itemId}`
            result[optionKey] = {
                clans: [],
                summary: homebrew.item.summary,
                logo: homebrew.item.logo,
                powers: powerItems
                    .filter(
                        ({ item, collection }) =>
                            collection.id === homebrew.collection.id &&
                            item.discipline.toLowerCase() === name.toLowerCase() &&
                            (item.disciplineRef?.type === "homebrew"
                                ? item.disciplineRef.itemId === homebrew.item.id
                                : !item.disciplineRef)
                    )
                    .map(({ item, collection }) => homebrewPowerToCharacterPower(item, collection)),
                isCustom: true,
                optionKey,
                name: homebrew.item.name,
                label: `${homebrew.item.name} — ${homebrew.collection.name}`,
                homebrewSource: source
            }
        }
    }

    return result
}
