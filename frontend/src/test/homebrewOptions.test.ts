import { describe, expect, it } from "vitest"
import type { HomebrewCollection } from "~/data/Homebrew"
import {
    getHomebrewDisciplineOptions,
    homebrewMeritFlawToCharacter,
    homebrewPowerToCharacterPower
} from "~/utils/homebrewOptions"

const collection: HomebrewCollection = {
    id: "collection-1",
    name: "Night Arts",
    shortDescription: "",
    description: "",
    tags: [],
    contentWarning: "",
    sourceLibraryEntryId: null,
    sourcePublicationId: null,
    rootSourceLibraryEntryId: null,
    createdAt: "2026-07-30T00:00:00.000Z",
    updatedAt: "2026-07-30T00:00:00.000Z",
    items: [
        {
            id: "discipline-1",
            kind: "discipline",
            name: "Noctis",
            summary: "Shape the dark.",
            description: "",
            logo: ""
        },
        {
            id: "power-1",
            kind: "power",
            name: "Drink the Moon",
            summary: "Draw strength from moonlight.",
            description: "",
            discipline: "Noctis",
            level: 1,
            dicePool: "Resolve + Noctis",
            rouseChecks: 1,
            amalgamPrerequisites: []
        },
        {
            id: "auspex-power",
            kind: "power",
            name: "Read the Ashes",
            summary: "Read memories left in ash.",
            description: "",
            discipline: "auspex",
            level: 1,
            dicePool: "Wits + Auspex",
            rouseChecks: 0,
            amalgamPrerequisites: []
        },
        {
            id: "merit-1",
            kind: "merit",
            name: "Moon-Kissed",
            summary: "Favored by moonlight.",
            description: "Full text.",
            costs: [2],
            excludes: []
        }
    ]
}

describe("Homebrew character options", () => {
    it("combines Homebrew Disciplines and Powers with official Disciplines", () => {
        const options = getHomebrewDisciplineOptions([collection], ["Noctis", "auspex"])

        expect(options.Noctis.powers.map((power) => power.name)).toContain("Drink the Moon")
        expect(options.auspex.powers.map((power) => power.name)).toContain("Read the Ashes")
        expect(options.auspex.powers.map((power) => power.name)).toContain("Heightened Senses")
    })

    it("embeds immutable provenance in selected content", () => {
        const powerItem = collection.items[1]
        const meritItem = collection.items[3]
        if (powerItem.kind !== "power" || meritItem.kind !== "merit") {
            throw new Error("Invalid fixture")
        }

        const power = homebrewPowerToCharacterPower(powerItem, collection)
        const merit = homebrewMeritFlawToCharacter(meritItem, 2, collection)

        expect(power.homebrewSource).toEqual({
            itemId: "power-1",
            collectionId: "collection-1",
            collectionName: "Night Arts"
        })
        expect(merit).toMatchObject({
            name: "Moon-Kissed",
            level: 2,
            text: "Full text.",
            homebrewSource: { collectionName: "Night Arts" }
        })
    })
})
