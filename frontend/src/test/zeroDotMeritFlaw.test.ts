import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"
import {
    applyCharacterCompatibilityPatches,
    characterSchema,
    getEmptyCharacter,
    meritFlawSchema,
    schemaVersion
} from "~/data/Character"
import { meritsAndFlaws, thinbloodMeritsAndFlaws, loresheets } from "~/data/MeritsAndFlaws"
import { useCharacterLocalStorage } from "~/hooks/useCharacterLocalStorage"
import { characterApiResponseListSchema } from "~/utils/characterApi"
import {
    createCharacterSchema,
    updateCharacterSchema
} from "../../../backend/src/schemas/character"

const ingrainedDiscipline = {
    name: "Ingrained Discipline",
    level: 0,
    summary: "Discipline-specific drawback",
    excludes: [],
    type: "flaw" as const
}

const legacyCharacter = () => ({
    ...getEmptyCharacter(),
    name: "Zero-dot flaw regression",
    version: 9,
    flaws: [ingrainedDiscipline]
})

describe("zero-dot merits and flaws", () => {
    beforeEach(() => localStorage.clear())

    it("upgrades a v9 character without removing or increasing its zero-dot flaw", () => {
        const character = legacyCharacter()
        applyCharacterCompatibilityPatches(character)
        expect(characterSchema.parse(character).flaws).toEqual([ingrainedDiscipline])
        expect(character.version).toBe(schemaVersion)
    })

    it("loads the local character without invoking broken-save recovery", () => {
        localStorage.setItem("character", JSON.stringify(legacyCharacter()))
        const { result } = renderHook(() => useCharacterLocalStorage())
        expect(result.current[0].flaws).toEqual([ingrainedDiscipline])
        expect(localStorage.getItem("character_broken_save")).toBeNull()
    })

    it("loads the entire account list when one character has a zero-dot flaw", () => {
        const records = [getEmptyCharacter(), legacyCharacter()].map((data, index) => ({
            id: `character-${index}`,
            name: data.name,
            data,
            version: data.version,
            characterVersion: 1,
            createdAt: "2026-08-24T07:13:00.000Z",
            updatedAt: "2026-08-24T07:13:00.000Z"
        }))
        const parsed = characterApiResponseListSchema.parse(records)
        expect(parsed).toHaveLength(2)
        expect(parsed[1].data.flaws).toEqual([ingrainedDiscipline])
    })

    it("accepts every selectable official cost in both frontend and backend schemas", () => {
        const categories = [
            ...meritsAndFlaws,
            thinbloodMeritsAndFlaws,
            ...loresheets.map((sheet) => ({ merits: sheet.merits, flaws: [] }))
        ]
        for (const category of categories) {
            for (const type of ["merit", "flaw"] as const) {
                for (const option of category[type === "merit" ? "merits" : "flaws"]) {
                    for (const level of option.cost) {
                        const selection = { ...option, type, level }
                        const data = {
                            ...getEmptyCharacter(),
                            [type === "merit" ? "merits" : "flaws"]: [selection]
                        }
                        expect(meritFlawSchema.safeParse(selection).success, option.name).toBe(true)
                        expect(characterSchema.safeParse(data).success, option.name).toBe(true)
                        expect(
                            createCharacterSchema.safeParse({ name: "Test", data }).success,
                            option.name
                        ).toBe(true)
                        expect(updateCharacterSchema.safeParse({ data }).success, option.name).toBe(
                            true
                        )
                    }
                }
            }
        }
    })

    it.each([-1, 0.5, NaN, Infinity])("rejects invalid dot count %s", (level) => {
        expect(meritFlawSchema.safeParse({ ...ingrainedDiscipline, level }).success).toBe(false)
    })
})
