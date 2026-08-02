import { describe, expect, it } from "vitest"
import type { Character } from "../schemas/CharacterSchema.js"
import { getHomebrewCharacterUsage } from "./homebrewAnalytics.js"

describe("getHomebrewCharacterUsage", () => {
    it("counts unique Homebrew collections and references without exposing their identifiers", () => {
        const sourceA = { collectionId: "collection-a", itemId: "item-a", collectionName: "A" }
        const sourceB = { collectionId: "collection-b", itemId: "item-b", collectionName: "B" }
        const character = {
            homebrewClan: { homebrewSource: sourceA },
            disciplines: [{ homebrewSource: sourceA, disciplineHomebrewSource: sourceB }],
            rituals: [{ homebrewSource: sourceB }],
            customDisciplines: { custom: { homebrewSource: sourceA } },
            merits: [{ homebrewSource: sourceB }]
        } as Partial<Character>

        expect(getHomebrewCharacterUsage(character)).toEqual({
            hasHomebrew: true,
            homebrewCollectionCount: 2,
            homebrewReferenceCount: 2
        })
    })

    it("reports no usage for characters without Homebrew references", () => {
        expect(getHomebrewCharacterUsage({})).toEqual({
            hasHomebrew: false,
            homebrewCollectionCount: 0,
            homebrewReferenceCount: 0
        })
    })
})
