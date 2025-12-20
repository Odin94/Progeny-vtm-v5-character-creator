import { describe, expect, it, vi } from "vitest"
import { createPdf_nerdbert } from "~/generator/pdfCreator"
import { getBasicTestCharacter } from "./testUtils"
import { readFileSync } from "fs"
import { resolve } from "path"
import { fileURLToPath } from "url"
import { PDFDocument, PDFTextField } from "pdf-lib"

const __filename = fileURLToPath(import.meta.url)
const __dirname = resolve(__filename, "..")

const fontPath = resolve(__dirname, "../../public/fonts/Roboto-Regular.ttf")
const imagePath = resolve(__dirname, "../../src/resources/CheckSolid.png")

const fontBuffer = readFileSync(fontPath)
const fontBytes = new Uint8Array(fontBuffer)

const imageBuffer = readFileSync(imagePath)
const imageBytes = new Uint8Array(imageBuffer)

global.fetch = vi.fn((url: string | Request | URL) => {
    if (typeof url === "string") {
        if (url.includes("Roboto-Regular.ttf")) {
            return Promise.resolve({
                arrayBuffer: () => Promise.resolve(fontBytes.buffer),
            } as Response)
        }
        if (url.includes("CheckSolid.png")) {
            return Promise.resolve({
                arrayBuffer: () => Promise.resolve(imageBytes.buffer),
            } as Response)
        }
    }
    return Promise.reject(new Error(`Unexpected fetch: ${url}`))
})

Object.defineProperty(window, "atob", {
    writable: true,
    value: (str: string) => Buffer.from(str, "base64").toString("binary"),
})

describe("createPdf_nerdbert", () => {
    it("should create a PDF with correct character data", async () => {
        const character = getBasicTestCharacter()
        const pdfBytes = await createPdf_nerdbert(character)

        expect(pdfBytes).toBeInstanceOf(Uint8Array)
        expect(pdfBytes.length).toBeGreaterThan(0)

        const pdfDoc = await PDFDocument.load(pdfBytes)
        const form = pdfDoc.getForm()

        expect(form.getTextField("Name").getText()).toBe(character.name)
        expect(form.getTextField("pcDescription").getText()).toBe(character.description)
        expect(form.getTextField("Predator type").getText()).toBe(character.predatorType.name)
        expect(form.getTextField("Ambition").getText()).toBe(character.ambition)
        expect(form.getTextField("Desire").getText()).toBe(character.desire)
        expect(form.getTextField("Clan").getText()).toBe(character.clan)
        expect(form.getTextField("Sire").getText()).toBe(character.sire)
        expect(form.getTextField("Title").getText()).toBe(character.generation.toString())

        const touchstonesText = form.getTextField("Convictions").getText()
        expect(touchstonesText).toContain(character.touchstones[0].name)
        expect(touchstonesText).toContain(character.touchstones[0].conviction)

        const expText = form.getTextField("tEXP").getText()
        expect(expText).toContain(character.experience.toString())

        const disc1Field = form.getTextField("Disc1")
        const disc1Text = disc1Field.getText() || ""
        expect(disc1Text.length).toBeGreaterThan(0)
        expect(disc1Text.toLowerCase()).toContain("potence")

        const disc1Ability1Text = form.getTextField("Disc1_Ability1").getText() || ""
        expect(disc1Ability1Text).toContain(character.disciplines[0].name) // Prowess

        const disc2Field = form.getTextField("Disc2")
        const disc2Text = disc2Field.getText() || ""
        expect(disc2Text.length).toBeGreaterThan(0)
        expect(disc2Text.toLowerCase()).toContain("blood sorcery")

        const disc2Ability1Text = form.getTextField("Disc2_Ability1").getText() || ""
        expect(disc2Ability1Text).toContain("Corrosive Vitae")

        if (character.rituals.length > 0) {
            const bloodSorceryPowers = character.disciplines.filter((d) => d.discipline === "blood sorcery")
            const ritualFieldIndex = bloodSorceryPowers.length + 1 // First ritual appears after all powers
            const ritualField = form.getTextField(`Disc2_Ability${ritualFieldIndex}`)
            const ritualText = ritualField.getText() || ""
            expect(ritualText).toContain(character.rituals[0].name)
        }

        const allMeritFields = form.getFields().filter((field) => {
            const name = field.getName()
            return name.startsWith("Merit") && name.match(/^Merit\d+$/)
        }) as PDFTextField[]

        const meritTexts = allMeritFields.map((field) => field.getText()).join(" ")
        expect(meritTexts).toContain(character.merits[0].name)
        expect(meritTexts).toContain(character.flaws[0].name)
    })
})
