import type { Character } from "../schemas/CharacterSchema.js"

type HomebrewSource = {
    collectionId: string
    itemId: string
}

export type HomebrewCharacterUsage = {
    hasHomebrew: boolean
    homebrewCollectionCount: number
    homebrewReferenceCount: number
}

const addSource = (sources: Set<string>, source: HomebrewSource | undefined) => {
    if (source) sources.add(`${source.collectionId}:${source.itemId}`)
}

/**
 * Returns only aggregate Homebrew usage. Collection and item identifiers are
 * deliberately not sent to analytics, since they can reveal user-authored content.
 */
export const getHomebrewCharacterUsage = (
    character: Partial<Character> | undefined
): HomebrewCharacterUsage => {
    const sources = new Set<string>()

    addSource(sources, character?.homebrewClan?.homebrewSource)

    for (const item of character?.disciplines ?? []) {
        addSource(sources, item.homebrewSource)
        addSource(sources, item.disciplineHomebrewSource)
    }
    for (const item of character?.rituals ?? []) {
        addSource(sources, item.homebrewSource)
        addSource(sources, item.disciplineHomebrewSource)
    }
    for (const item of character?.ceremonies ?? []) {
        addSource(sources, item.homebrewSource)
        addSource(sources, item.disciplineHomebrewSource)
    }
    for (const item of Object.values(character?.customDisciplines ?? {})) {
        addSource(sources, item.homebrewSource)
    }
    for (const item of character?.merits ?? []) addSource(sources, item.homebrewSource)
    for (const item of character?.flaws ?? []) addSource(sources, item.homebrewSource)
    for (const item of character?.predatorType?.pickedMeritsAndFlaws ?? []) {
        addSource(sources, item.homebrewSource)
    }

    const collectionIds = new Set(
        [...sources].map((source) => source.slice(0, source.indexOf(":")))
    )

    return {
        hasHomebrew: sources.size > 0,
        homebrewCollectionCount: collectionIds.size,
        homebrewReferenceCount: sources.size
    }
}
