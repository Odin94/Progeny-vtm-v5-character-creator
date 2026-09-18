import { describe, expect, it } from "vitest"
import { characterSchema, getEmptyCharacter, schemaVersion } from "~/data/Character"
import { disciplines } from "~/data/Disciplines"
import { previewCharacterRepair } from "~/utils/repairCharacter"

const flaw = (name: string, level = 1) => ({
    name,
    level,
    type: "flaw",
    summary: "Keep this text",
    excludes: []
})
const preview = (value: unknown) => {
    const result = previewCharacterRepair(JSON.stringify(value))
    if (!result.success) throw new Error(result.error)
    expect(characterSchema.safeParse(result.character).success).toBe(true)
    return result
}

describe("character repair preview", () => {
    it("resets only invalid nested fields to empty-character defaults", () => {
        const original = getEmptyCharacter()
        const input = {
            ...original,
            name: "Preserve me",
            attributes: { ...original.attributes, strength: "bad", dexterity: 4 },
            ephemeral: { ...original.ephemeral, hunger: -1 },
            humanity: "bad"
        }
        const result = preview(input)
        expect(result.character.name).toBe("Preserve me")
        expect(result.character.attributes).toEqual({ ...original.attributes, dexterity: 4 })
        expect(result.character.humanity).toBe(original.humanity)
        expect(result.character.ephemeral).toEqual(original.ephemeral)
        expect(result.changes.map((c) => c.path)).toEqual([
            ["attributes", "strength"],
            ["humanity"],
            ["ephemeral", "hunger"]
        ])
        expect(result.changes[0].description).toBe(
            'Attributes → Strength will be reset from "bad" to 1'
        )
        expect(input.attributes.strength).toBe("bad")
    })

    it("removes only offending list entries, naming each, without losing adjacent valid entries", () => {
        const valid = [flaw("Keep first"), flaw("Keep last")]
        const result = preview({
            ...getEmptyCharacter(),
            flaws: [
                valid[0],
                flaw("Ingrained Discipline", -1),
                null,
                flaw("Another invalid", 0.5),
                valid[1]
            ]
        })
        expect(result.character.flaws).toEqual(valid)
        expect(result.changes.map((c) => c.description)).toEqual([
            "Flaw: Ingrained Discipline will be removed",
            "Flaw: entry 3 will be removed",
            "Flaw: Another invalid will be removed"
        ])
    })

    it("does not rewrite valid custom exclusions while repairing an unrelated field", () => {
        const custom = { ...flaw("Custom drawback"), excludes: ["Custom conflict"] }
        const result = preview({ ...getEmptyCharacter(), humanity: -1, flaws: [custom] })
        expect(result.character.flaws).toEqual([custom])
        expect(result.changes.map((c) => c.path)).toEqual([["humanity"]])
    })

    it("preserves a valid zero-dot flaw", () => {
        const result = preview({ ...getEmptyCharacter(), flaws: [flaw("Ingrained Discipline", 0)] })
        expect(result.character.flaws[0].level).toBe(0)
        expect(result.changes).toEqual([])
    })

    it("repairs a nested list without clearing it or deleting the enclosing object", () => {
        const input = getEmptyCharacter()
        const result = preview({
            ...input,
            predatorType: {
                ...input.predatorType,
                name: "Farmer",
                pickedMeritsAndFlaws: [flaw("Good"), flaw("Bad", -1)]
            }
        })
        expect(result.character.predatorType.name).toBe("Farmer")
        expect(result.character.predatorType.pickedMeritsAndFlaws).toEqual([flaw("Good")])
        expect(result.changes[0].description).toBe("Predator merit/flaw: Bad will be removed")
    })

    it("removes offending entries from a list nested inside another list item", () => {
        const power = {
            ...disciplines.celerity.powers[0],
            amalgamPrerequisites: [
                { discipline: "auspex", level: 1 },
                { discipline: "dominate", level: -1 }
            ]
        }
        const result = preview({ ...getEmptyCharacter(), disciplines: [power] })
        expect(result.character.disciplines).toHaveLength(1)
        expect(result.character.disciplines[0].amalgamPrerequisites).toEqual([
            { discipline: "auspex", level: 1 }
        ])
        expect(result.changes).toHaveLength(1)
        expect(result.changes[0].path).toEqual(["disciplines", 0, "amalgamPrerequisites", 1])
    })

    it("drops only invalid dynamic record entries", () => {
        const result = preview({
            ...getEmptyCharacter(),
            disciplineLevels: {
                "official:auspex": 3,
                "official:dominate": "bad",
                "official:celerity": 2
            }
        })
        expect(result.character.disciplineLevels).toEqual({
            "official:auspex": 3,
            "official:celerity": 2
        })
        expect(result.changes[0].description).toBe(
            "Discipline level: official:dominate will be removed"
        )
    })

    it("removes an invalid optional object without clearing other fields", () => {
        const result = preview({
            ...getEmptyCharacter(),
            name: "Keep",
            homebrewClan: { name: "Broken clan" }
        })
        expect(result.character.name).toBe("Keep")
        expect(result.character.homebrewClan).toBeUndefined()
        expect(result.changes[0].description).toBe("Homebrew Clan will be removed")
    })

    it("reports unsupported properties removed by schema parsing", () => {
        const result = preview({ ...getEmptyCharacter(), unsupported: "important old text" })
        expect(result.changes[0]).toMatchObject({
            before: "important old text",
            action: "remove",
            path: ["unsupported"]
        })
    })

    it("applies legacy compatibility before considering entries invalid", () => {
        const input: Record<string, unknown> = {
            ...getEmptyCharacter(),
            version: 8,
            disciplines: [disciplines.celerity.powers[0]],
            flaws: [{ ...flaw("Good"), excludes: undefined }]
        }
        delete input.disciplineLevels
        const result = preview(input)
        expect(result.character.disciplineLevels).toEqual({ "official:celerity": 1 })
        expect(result.character.flaws).toHaveLength(1)
        expect(result.character.version).toBe(schemaVersion)
    })

    it("can repair data that makes compatibility patches throw, then migrate preserved powers", () => {
        const input: Record<string, unknown> = {
            ...getEmptyCharacter(),
            version: 8,
            predatorType: "bad",
            disciplines: [disciplines.celerity.powers[0]]
        }
        delete input.disciplineLevels
        const result = preview(input)
        expect(result.character.predatorType).toEqual(getEmptyCharacter().predatorType)
        expect(result.character.disciplineLevels).toEqual({ "official:celerity": 1 })
        expect(result.character.version).toBe(schemaVersion)
    })

    it("uses defaults for whole fields only when the whole field has an invalid type", () => {
        const result = preview({ ...getEmptyCharacter(), attributes: null, flaws: "not a list" })
        expect(result.character.attributes).toEqual(getEmptyCharacter().attributes)
        expect(result.character.flaws).toEqual([])
        expect(result.changes.some((c) => c.path.join(".") === "attributes")).toBe(true)
    })

    it.each(["not json", "null", "[]", '\"text\"', "42"])(
        "does not replace unreadable input %s with an empty character",
        (raw) => {
            expect(previewCharacterRepair(raw).success).toBe(false)
        }
    )
})
