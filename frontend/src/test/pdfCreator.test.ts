import { describe, expect, it, vi } from "vitest"
import {
    createPdf_nerdbert,
    setButtonImageOverlay,
    setHumanityTracker
} from "~/generator/pdfCreator"
import { getBasicTestCharacter } from "./testUtils"
import { readFileSync } from "fs"
import { resolve } from "path"
import { fileURLToPath } from "url"
import { PDFDocument, PDFTextField } from "pdf-lib"
import type { Power } from "~/data/Disciplines"
import type { DisciplineName } from "~/data/NameSchemas"

const __filename = fileURLToPath(import.meta.url)
const __dirname = resolve(__filename, "..")

const fontPath = resolve(__dirname, "../../public/fonts/Roboto-Regular.ttf")
const imagePath = resolve(__dirname, "../../src/resources/CheckSolid.png")

let fontBytes: Uint8Array | null = null
let imageBytes: Uint8Array | null = null

const getFontBytes = () => {
    if (!fontBytes) {
        const fontBuffer = readFileSync(fontPath)
        fontBytes = new Uint8Array(fontBuffer)
    }
    return fontBytes
}

const getImageBytes = () => {
    if (!imageBytes) {
        const imageBuffer = readFileSync(imagePath)
        imageBytes = new Uint8Array(imageBuffer)
    }
    return imageBytes
}

const createButtonOverlayHarness = () => {
    const drawImage = vi.fn()
    const pageRef = { id: "page-1" }
    const page = { ref: pageRef, drawImage }
    const widget = {
        P: () => pageRef,
        getRectangle: () => ({ x: 10, y: 20, width: 30, height: 40 })
    }
    const button = {
        acroField: {
            getWidgets: () => [widget]
        }
    }
    const pdfDoc = {
        getPages: () => [page]
    }
    const form = {
        getButton: vi.fn().mockReturnValue(button)
    }
    const image = { id: "image" }

    return { drawImage, form, image, pdfDoc }
}

const createTestPower = (discipline: DisciplineName, index: number): Power => ({
    name: `${discipline} Power ${index}`,
    discipline,
    level: Math.min(index, 5),
    summary: `Test ${discipline} power ${index}`,
    description: "",
    dicePool: "",
    rouseChecks: 0,
    amalgamPrerequisites: []
})

global.fetch = vi.fn((url: string | Request | URL) => {
    if (typeof url === "string") {
        if (url.includes("Roboto-Regular.ttf")) {
            return Promise.resolve({
                arrayBuffer: () => Promise.resolve(getFontBytes().buffer)
            } as Response)
        }
        if (url.includes("CheckSolid.png")) {
            return Promise.resolve({
                arrayBuffer: () => Promise.resolve(getImageBytes().buffer)
            } as Response)
        }
    }
    return Promise.reject(new Error(`Unexpected fetch: ${url}`))
})

Object.defineProperty(window, "atob", {
    writable: true,
    value: (str: string) => Buffer.from(str, "base64").toString("binary")
})

describe("createPdf_nerdbert", () => {
    it("should create a PDF with correct character data", async () => {
        const character = getBasicTestCharacter()
        character.disciplines.push({
            name: "Ashes to Ashes",
            description: "",
            rouseChecks: 1,
            amalgamPrerequisites: [],
            summary: "use your vitae to disintegrate non-vampire corpses",
            dicePool: "Stamina + Oblivion",
            level: 1,
            discipline: "oblivion"
        })
        character.ceremonies = [
            {
                name: "The Gift of False Life",
                level: 1,
                summary: "Animate prepared corpses to carry out one simple command.",
                rouseChecks: 1,
                dicePool: "Resolve + Oblivion",
                requiredTime: "5min",
                ingredients: "Prepared corpses and bodily fluids",
                prerequisitePowers: ["Ashes to Ashes"],
                discipline: "oblivion"
            }
        ]
        character.touchstones.push({ name: " ", description: "", conviction: "" })
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

        const touchstone = character.touchstones[0]
        expect(form.getTextField("Convictions").getText()).toBe(
            `${touchstone.conviction} (${touchstone.name})`
        )
        expect(form.getTextField("touchstoneNotes").getText()).toBe(
            `${touchstone.name}\n${touchstone.description}`
        )

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
            const bloodSorceryPowers = character.disciplines.filter(
                (d) => d.discipline === "blood sorcery"
            )
            const ritualFieldIndex = bloodSorceryPowers.length + 1 // First ritual appears after all powers
            const ritualField = form.getTextField(`Disc2_Ability${ritualFieldIndex}`)
            const ritualText = ritualField.getText() || ""
            expect(ritualText).toContain(character.rituals[0].name)
        }

        const disc3Text = form.getTextField("Disc3").getText() || ""
        expect(disc3Text.toLowerCase()).toContain("oblivion")
        expect(form.getTextField("Disc3_Ability1").getText()).toContain("Ashes to Ashes")

        const ceremoniesText = form.getTextField("Disc6").getText() || ""
        expect(ceremoniesText).toContain("Oblivion Ceremonies")
        expect(form.getTextField("Disc6_Ability1").getText()).toContain("The Gift of False Life")

        const allMeritFields = form.getFields().filter((field) => {
            const name = field.getName()
            return name.startsWith("Merit") && name.match(/^Merit\d+$/)
        }) as PDFTextField[]

        const meritTexts = allMeritFields.map((field) => field.getText()).join(" ")
        expect(meritTexts).toContain(character.merits[0].name)
        expect(meritTexts).toContain(character.flaws[0].name)
    })

    it("writes discipline abilities that overflow a full block into an unclaimed block", async () => {
        const character = getBasicTestCharacter()
        character.disciplines = Array.from({ length: 6 }, (_, index) =>
            createTestPower("potence", index + 1)
        )
        character.rituals = []
        character.ceremonies = []

        const pdfBytes = await createPdf_nerdbert(character)
        const pdfDoc = await PDFDocument.load(pdfBytes)
        const form = pdfDoc.getForm()

        expect(form.getTextField("Disc1_Ability5").getText()).toContain("potence Power 5")
        expect(form.getTextField("Disc2").getText()).toBe("Potence (cont.)")
        expect(form.getTextField("Disc2_Ability1").getText()).toContain("potence Power 6")
    })

    it("appends discipline ability overflow to notes when no unclaimed blocks remain", async () => {
        const character = getBasicTestCharacter()
        character.disciplines = [
            ...Array.from({ length: 6 }, (_, index) => createTestPower("potence", index + 1)),
            createTestPower("animalism", 1),
            createTestPower("auspex", 1),
            createTestPower("celerity", 1),
            createTestPower("dominate", 1),
            createTestPower("fortitude", 1)
        ]
        character.rituals = []
        character.ceremonies = []
        character.notes = "Existing note."

        const pdfBytes = await createPdf_nerdbert(character)
        const pdfDoc = await PDFDocument.load(pdfBytes)
        const form = pdfDoc.getForm()

        const notesText = form.getTextField("PC_Notes").getText() || ""
        expect(notesText).toContain("Existing note.")
        expect(notesText).toContain("Potence: potence Power 6")
        expect(notesText).toContain("Test potence power 6")
    })

    it("writes fixed loresheet merit and flaw bonuses to the PDF", async () => {
        const character = getBasicTestCharacter()
        character.predatorType.pickedMeritsAndFlaws = []
        character.merits = [
            {
                name: "Hand of the Heresy",
                level: 2,
                summary:
                    "Take a total of three dots among Allies, Herd, Mawla or Retainers to represent your role in the city's Heresy group. Also take the Dark Secret (Heresy) flaw.",
                type: "merit",
                excludes: []
            }
        ]
        character.flaws = []

        const pdfBytes = await createPdf_nerdbert(character)
        const pdfDoc = await PDFDocument.load(pdfBytes)
        const form = pdfDoc.getForm()
        const meritTexts = form
            .getFields()
            .filter((field) => field.getName().match(/^Merit\d+$/))
            .map((field) => (field as PDFTextField).getText())
            .join(" ")

        expect(meritTexts).toContain("Hand of the Heresy")
        expect(meritTexts).toContain("Dark Secret (Heresy)")
    })
})

describe("PDF humanity helpers", () => {
    it("draws an image overlay at the matching button widget position", () => {
        const { drawImage, form, image, pdfDoc } = createButtonOverlayHarness()

        setButtonImageOverlay(pdfDoc as any, form as any, "Humanity-1", image as any)

        expect(form.getButton).toHaveBeenCalledWith("Humanity-1")
        expect(drawImage).toHaveBeenCalledWith(image, {
            x: 12.4,
            y: 23.2,
            width: 25.2,
            height: 33.6
        })
    })

    it("draws one humanity mark per filled humanity slot", () => {
        const { drawImage, form, image, pdfDoc } = createButtonOverlayHarness()

        setHumanityTracker(pdfDoc as any, form as any, image as any, 3)

        expect(form.getButton).toHaveBeenNthCalledWith(1, "Humanity-1")
        expect(form.getButton).toHaveBeenNthCalledWith(2, "Humanity-2")
        expect(form.getButton).toHaveBeenNthCalledWith(3, "Humanity-3")
        expect(drawImage).toHaveBeenCalledTimes(3)
    })
})
