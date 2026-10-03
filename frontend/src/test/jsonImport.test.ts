import { readFileSync } from "fs"
import { fileURLToPath } from "url"
import { resolve } from "path"
import { describe, expect, it } from "vitest"
import { loadCharacterFromFile, loadCharacterFromJson } from "~/components/LoadModal"
import { characterSchema, getEmptyCharacter } from "~/data/Character"

const __filename = fileURLToPath(import.meta.url)
const __dirname = resolve(__filename, "..")

const jsonFiles = ["progeny_1.0.0.json", "v3.json"]

describe("JSON Import", () => {
    it("decodes UTF-8 files without corrupting accented text, CJK, emoji or combining marks", async () => {
        const character = {
            ...getEmptyCharacter(),
            name: "Élodie 李华 🦇",
            description: "Grüße e\u0301"
        }
        const file = new File([JSON.stringify(character)], "unicode.json", {
            type: "application/json"
        })
        const loaded = await loadCharacterFromFile(file)
        expect(loaded.name).toBe(character.name)
        expect(loaded.description).toBe(character.description)
    })

    for (const jsonFile of jsonFiles) {
        it(`should successfully load and parse ${jsonFile}`, async () => {
            const filePath = resolve(__dirname, "jsonExports", jsonFile)
            const fileContent = readFileSync(filePath, "utf-8")

            const character = await loadCharacterFromJson(fileContent)

            expect(character).toBeDefined()
            expect(characterSchema.parse(character)).toEqual(character)
        })

        it(`should correctly populate excludes for Stunning merit in ${jsonFile}`, async () => {
            const filePath = resolve(__dirname, "jsonExports", jsonFile)
            const fileContent = readFileSync(filePath, "utf-8")

            const character = await loadCharacterFromJson(fileContent)

            const stunningMerit = character.merits.find((m) => m.name === "Stunning")
            expect(stunningMerit).toBeDefined()
            expect(stunningMerit?.excludes).toEqual(["Beautiful", "Ugly", "Repulsive"])
        })

        it(`should correctly populate characterVersion`, async () => {
            const filePath = resolve(__dirname, "jsonExports", jsonFile)
            const fileContent = readFileSync(filePath, "utf-8")

            const character = await loadCharacterFromJson(fileContent)

            expect(character.characterVersion).toEqual(0)
        })
    }
})
