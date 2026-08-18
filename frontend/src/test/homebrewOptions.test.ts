import { describe, expect, it } from "vitest"
import type { HomebrewCollection } from "~/data/Homebrew"
import { containsBloodSorcery, containsOblivion } from "~/data/Character"
import { characterHasCeremonyPrerequisite } from "~/data/Ceremonies"
import {
    getDisciplineDefinitionIdentity,
    getHomebrewDisciplineOptions,
    getMeritFlawIdentity,
    getPowerDisciplineIdentity,
    getPowerIdentity,
    homebrewMeritFlawToCharacter,
    homebrewPowerToCeremony,
    homebrewPowerToCharacterPower
} from "~/utils/homebrewOptions"
import { getMeritFlawDisplayName } from "~/data/meritsAndFlawsResolution"

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
            disciplineRef: { type: "homebrew", name: "Noctis", itemId: "discipline-1" },
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
            disciplineRef: { type: "official", name: "auspex" },
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
        const noctis = Object.values(options).find(
            (option) => option.homebrewSource?.itemId === "discipline-1"
        )

        expect(noctis?.label).toBe("Noctis — Night Arts")
        expect(noctis?.powers.map((power) => power.name)).toContain("Drink the Moon")
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
        const formula = homebrewPowerToCharacterPower(
            {
                ...powerItem,
                id: "formula-1",
                kind: "formula",
                discipline: "thin-blood alchemy",
                disciplineRef: { type: "official", name: "thin-blood alchemy" },
                requiredTime: "One night",
                ingredients: "Moonlit vitae"
            },
            collection
        )
        const merit = homebrewMeritFlawToCharacter(meritItem, 2, collection)

        expect(power.homebrewSource).toEqual({
            itemId: "power-1",
            collectionId: "collection-1",
            collectionName: "Night Arts"
        })
        expect(power.disciplineHomebrewSource).toMatchObject({ itemId: "discipline-1" })
        expect(formula).toMatchObject({
            requiredTime: "One night",
            ingredients: "Moonlit vitae"
        })
        expect(
            homebrewPowerToCeremony(
                {
                    ...powerItem,
                    id: "ceremony-1",
                    kind: "ceremony",
                    discipline: "oblivion",
                    disciplineRef: { type: "official", name: "oblivion" },
                    prerequisitePowers: ["Ashes to Ashes"]
                },
                collection
            ).prerequisitePowers
        ).toEqual(["Ashes to Ashes"])
        expect(merit).toMatchObject({
            name: "Moon-Kissed",
            level: 2,
            summary: "Favored by moonlight.",
            homebrewSource: { collectionName: "Night Arts" }
        })
        expect(merit.text).toBeUndefined()
        expect(getMeritFlawDisplayName(merit)).toBe("Moon-Kissed")
    })

    it("keeps same-named Homebrew Disciplines and Powers distinct by provenance", () => {
        const secondCollection: HomebrewCollection = {
            ...collection,
            id: "collection-2",
            name: "Other Night Arts",
            items: collection.items.map((item) => ({
                ...item,
                id: `${item.id}-other`,
                ...(item.kind === "power" && item.disciplineRef?.type === "homebrew"
                    ? {
                          disciplineRef: {
                              ...item.disciplineRef,
                              itemId: `${item.disciplineRef.itemId}-other`
                          }
                      }
                    : {})
            }))
        }
        const options = getHomebrewDisciplineOptions([collection, secondCollection], ["Noctis"])
        const noctisOptions = Object.values(options).filter((option) => option.name === "Noctis")

        expect(noctisOptions.map((option) => option.label)).toEqual([
            "Noctis — Night Arts",
            "Noctis — Other Night Arts"
        ])
        expect(noctisOptions.map((option) => getPowerIdentity(option.powers[0]))).toEqual([
            "homebrew:collection-1:power-1",
            "homebrew:collection-2:power-1-other"
        ])
    })

    it("keeps an explicit official target separate from a same-named Homebrew Discipline", () => {
        const officialAuspexPower = {
            ...collection.items[2],
            id: "official-auspex-power",
            disciplineRef: { type: "official" as const, name: "auspex" }
        }
        const collisionCollection: HomebrewCollection = {
            ...collection,
            items: [
                {
                    id: "homebrew-auspex",
                    kind: "discipline",
                    name: "auspex",
                    summary: "An alternate Auspex.",
                    description: "",
                    logo: ""
                },
                officialAuspexPower
            ]
        }

        const options = getHomebrewDisciplineOptions([collisionCollection], ["auspex"])
        const homebrewOption = Object.values(options).find(
            (option) => option.homebrewSource?.itemId === "homebrew-auspex"
        )

        expect(options.auspex.powers.map((power) => power.name)).toContain("Read the Ashes")
        expect(homebrewOption?.powers.map((power) => power.name)).not.toContain("Read the Ashes")
    })

    it("does not expose an official Discipline for an explicit same-named Homebrew target", () => {
        const collisionCollection: HomebrewCollection = {
            ...collection,
            items: [
                {
                    id: "homebrew-auspex",
                    kind: "discipline",
                    name: "auspex",
                    summary: "An alternate Auspex.",
                    description: "",
                    logo: ""
                }
            ]
        }

        const options = getHomebrewDisciplineOptions(
            [collisionCollection],
            [{ type: "homebrew", name: "auspex", itemId: "homebrew-auspex" }]
        )

        expect(options.auspex).toBeUndefined()
        expect(Object.values(options)).toHaveLength(1)
        expect(Object.values(options)[0].homebrewSource?.itemId).toBe("homebrew-auspex")
    })

    it("keeps Discipline and Merit identities distinct by provenance", () => {
        const source = {
            itemId: "discipline-1",
            collectionId: "collection-1",
            collectionName: "Night Arts"
        }
        expect(
            getDisciplineDefinitionIdentity({
                name: "auspex",
                homebrewSource: source
            })
        ).toBe("homebrew:collection-1:discipline-1")
        expect(getMeritFlawIdentity({ name: "Beautiful" }, "merit")).toBe(
            "official:merit:Beautiful"
        )
        expect(getMeritFlawIdentity({ name: "Beautiful", homebrewSource: source }, "merit")).toBe(
            "homebrew:merit:collection-1:discipline-1:Beautiful"
        )
    })

    it("does not unlock official rituals or ceremonies with same-named Homebrew Disciplines", () => {
        const source = {
            itemId: "homebrew-oblivion",
            collectionId: "collection-1",
            collectionName: "Night Arts"
        }
        const homebrewOblivion = {
            name: "Ashes to Ashes",
            summary: "",
            description: "",
            discipline: "oblivion",
            level: 1,
            dicePool: "",
            rouseChecks: 0,
            amalgamPrerequisites: [],
            disciplineHomebrewSource: source
        }
        const homebrewBloodSorcery = {
            ...homebrewOblivion,
            name: "Corrosive Vitae",
            discipline: "blood sorcery"
        }

        expect(getPowerDisciplineIdentity(homebrewOblivion)).toBe(
            "homebrew:collection-1:homebrew-oblivion"
        )
        expect(containsOblivion([homebrewOblivion])).toBe(false)
        expect(containsBloodSorcery([homebrewBloodSorcery])).toBe(false)
        expect(
            characterHasCeremonyPrerequisite(
                { disciplines: [homebrewOblivion] },
                {
                    name: "A Ceremony",
                    summary: "",
                    discipline: "oblivion",
                    level: 1,
                    dicePool: "",
                    rouseChecks: 1,
                    requiredTime: "",
                    ingredients: "",
                    prerequisitePowers: ["Ashes to Ashes"]
                }
            )
        ).toBe(false)

        expect(
            containsOblivion([{ ...homebrewOblivion, disciplineHomebrewSource: undefined }])
        ).toBe(true)
    })
})
