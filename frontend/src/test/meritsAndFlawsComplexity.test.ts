import { describe, expect, it } from "vitest"
import {
    advancedMeritsAndFlaws,
    essentialMeritsAndFlaws,
    filterLoresheetsByComplexity,
    filterMeritsAndFlawsByComplexity,
    getMeritFlawComplexity,
    MeritOrFlaw,
    MeritsAndFlaws
} from "~/data/MeritsAndFlaws"

describe("Merits and flaws complexity", () => {
    it("keeps default catalog items essential and exposes advanced additions", () => {
        const beautiful = essentialMeritsAndFlaws
            .flatMap((category) => category.merits)
            .find((merit) => merit.name === "Beautiful")

        expect(beautiful).toBeDefined()
        expect(getMeritFlawComplexity(beautiful as MeritOrFlaw)).toBe("essential")
        expect(advancedMeritsAndFlaws.flatMap((category) => category.merits)).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ name: "Influence" }),
                expect.objectContaining({ name: "Bond Resistance" }),
                expect.objectContaining({ name: "Laboratory" }),
                expect.objectContaining({ name: "Famous Face" }),
                expect.objectContaining({ name: "City Secrets" }),
                expect.objectContaining({ name: "Minor Boon" }),
                expect.objectContaining({ name: "Tempered Will" })
            ])
        )
        expect(advancedMeritsAndFlaws.flatMap((category) => category.flaws)).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ name: "Vegan" }),
                expect.objectContaining({ name: "Vein Tapper" }),
                expect.objectContaining({ name: "Major Debt" }),
                expect.objectContaining({ name: "Starving Decay" })
            ])
        )
    })

    it("filters category and item level complexity independently", () => {
        const catalog: MeritsAndFlaws[] = [
            {
                title: "Mixed",
                merits: [
                    { name: "Simple Merit", cost: [1], summary: "", excludes: [] },
                    {
                        name: "Advanced Merit",
                        cost: [3],
                        summary: "",
                        excludes: [],
                        complexity: "advanced"
                    }
                ],
                flaws: [
                    { name: "Simple Flaw", cost: [1], summary: "", excludes: [] },
                    {
                        name: "Advanced Flaw",
                        cost: [2],
                        summary: "",
                        excludes: [],
                        complexity: "advanced"
                    }
                ]
            },
            {
                title: "Advanced Category",
                complexity: "advanced",
                merits: [{ name: "Category Merit", cost: [1], summary: "", excludes: [] }],
                flaws: [{ name: "Category Flaw", cost: [1], summary: "", excludes: [] }]
            }
        ]

        expect(filterMeritsAndFlawsByComplexity(catalog, "essential")).toEqual([
            {
                title: "Mixed",
                merits: [{ name: "Simple Merit", cost: [1], summary: "", excludes: [] }],
                flaws: [{ name: "Simple Flaw", cost: [1], summary: "", excludes: [] }]
            }
        ])

        expect(filterMeritsAndFlawsByComplexity(catalog, "advanced")).toEqual([
            {
                title: "Mixed",
                merits: [
                    {
                        name: "Advanced Merit",
                        cost: [3],
                        summary: "",
                        excludes: [],
                        complexity: "advanced"
                    }
                ],
                flaws: [
                    {
                        name: "Advanced Flaw",
                        cost: [2],
                        summary: "",
                        excludes: [],
                        complexity: "advanced"
                    }
                ]
            },
            {
                title: "Advanced Category",
                complexity: "advanced",
                merits: [{ name: "Category Merit", cost: [1], summary: "", excludes: [] }],
                flaws: [{ name: "Category Flaw", cost: [1], summary: "", excludes: [] }]
            }
        ])
    })

    it("filters loresheet merits by complexity", () => {
        const sheets = [
            {
                title: "Example",
                summary: "",
                source: "",
                requirementFunctions: [],
                merits: [
                    { name: "Essential Loresheet Merit", cost: [1], summary: "", excludes: [] },
                    {
                        name: "Advanced Loresheet Merit",
                        cost: [2],
                        summary: "",
                        excludes: [],
                        complexity: "advanced" as const
                    }
                ]
            }
        ]

        expect(filterLoresheetsByComplexity(sheets, "essential")[0].merits).toEqual([
            { name: "Essential Loresheet Merit", cost: [1], summary: "", excludes: [] }
        ])
        expect(filterLoresheetsByComplexity(sheets, "advanced")[0].merits).toEqual([
            {
                name: "Advanced Loresheet Merit",
                cost: [2],
                summary: "",
                excludes: [],
                complexity: "advanced"
            }
        ])
    })
})
