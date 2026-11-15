import { createInconnuJson } from "~/generator/inconnuJsonCreator"
import { createInconnuCommandExport } from "~/generator/inconnuCommandCreator"
import { createWoD5EVttJson } from "~/generator/foundryWoDJsonCreator"
import { describe, it, expect } from "vitest"
import { getBasicTestCharacter } from "./testUtils"
import { applyCharacterCompatibilityPatches, characterSchema } from "~/data/Character"
import { getClanBaneText, getClanCompulsionText, getBaneSeverity } from "~/data/VariantClanBanes"

describe("Thin-blood Clan Curse", () => {
    it("has no default bane or compulsion", () => {
        const c = { ...getBasicTestCharacter(), clan: "Thin-blood" as const }
        expect(getClanBaneText(c, 2)).toBe("")
        expect(getClanCompulsionText(c)).toBe("")
        expect(getBaneSeverity(c, 2)).toBe(0)
    })
    it("persists the selected bane and applies severity one without a compulsion", () => {
        const c = characterSchema.parse({
            ...getBasicTestCharacter(),
            clan: "Thin-blood",
            flaws: [
                {
                    name: "Clan Curse",
                    type: "flaw",
                    level: 1,
                    summary: "Existing note",
                    excludes: [],
                    clanCurse: "Brujah"
                }
            ]
        })
        expect(c.flaws[0].clanCurse).toBe("Brujah")
        expect(createInconnuJson(c).biography).toContain("Violent Temper")
        expect(createInconnuCommandExport(createInconnuJson(c))).toContain("Clan_Curse_Brujah")
        expect(JSON.stringify(createWoD5EVttJson(c).json)).toContain("Violent Temper")
        expect(getClanBaneText(c, 0)).toContain("Subtract 1 (bane severity) dice")
        expect(getClanBaneText(c, 0)).toContain("Violent Temper")
        expect(getBaneSeverity(c, 0)).toBe(1)
        expect(getClanCompulsionText(c)).toBe("")
        c.flaws = []
        expect(getClanBaneText(c, 0)).toBe("")
    })
    it("preserves old free text without guessing a clan", () => {
        const c = {
            ...getBasicTestCharacter(),
            version: 12,
            flaws: [
                {
                    name: "Clan Curse",
                    type: "flaw",
                    level: 1,
                    summary: "Brujah curse notes",
                    excludes: []
                }
            ]
        }
        applyCharacterCompatibilityPatches(c)
        expect(c.version).toBe(13)
        expect(c.flaws[0].summary).toBe("Brujah curse notes")
        expect(characterSchema.parse(c).flaws[0].clanCurse).toBeUndefined()
    })
})
