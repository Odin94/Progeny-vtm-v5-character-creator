import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { Character } from "~/data/Character"
import { createWoD5EVttJson } from "~/generator/foundryWoDJsonCreator"
import { downloadCharacterSheet, testTemplate } from "~/generator/pdfCreator"
import { getBasicTestCharacter } from "./testUtils"

// Mock the notifications module
vi.mock("@mantine/notifications", () => ({
    notifications: {
        show: vi.fn()
    }
}))

// Mock the PDF-lib and fontkit modules
vi.mock("pdf-lib", () => ({
    PDFDocument: {
        load: vi.fn()
    },
    PDFBool: {
        True: true
    },
    PDFFont: {},
    PDFForm: {},
    PDFName: {
        of: vi.fn((name: string) => name)
    }
}))

vi.mock("@pdf-lib/fontkit", () => ({
    default: vi.fn()
}))

// Mock fetch for font loading
global.fetch = vi.fn()

// Mock window.atob for base64 decoding
Object.defineProperty(window, "atob", {
    writable: true,
    value: vi.fn((str: string) => Buffer.from(str, "base64").toString("binary"))
})

// Mock anchor element for download
const mockAnchor = {
    href: "",
    download: "",
    click: vi.fn()
}

const createMockPdfForm = () => ({
    acroForm: {
        dict: {
            set: vi.fn()
        }
    },
    getButton: vi.fn().mockReturnValue({
        acroField: {
            getWidgets: () => []
        }
    }),
    getCheckBox: vi.fn().mockReturnValue({
        check: vi.fn()
    }),
    getTextField: vi.fn().mockReturnValue({
        disableRichFormatting: vi.fn(),
        setText: vi.fn()
    }),
    updateFieldAppearances: vi.fn()
})

const createMockPdfDoc = (mockForm = createMockPdfForm()) => ({
    embedFont: vi.fn().mockResolvedValue({}),
    embedPng: vi.fn().mockResolvedValue({}),
    getForm: vi.fn().mockReturnValue(mockForm),
    getPages: vi.fn().mockReturnValue([]),
    registerFontkit: vi.fn(),
    save: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4, 5]))
})

Object.defineProperty(document, "createElement", {
    writable: true,
    value: vi.fn(() => mockAnchor)
})

describe("Download Conversion Logic", () => {
    let mockCharacter: Character

    beforeEach(() => {
        vi.clearAllMocks()
        mockAnchor.href = ""
        mockAnchor.download = ""

        mockCharacter = getBasicTestCharacter()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe("JSON Download Conversion", () => {
        it("should create valid WoD5E VTT JSON from character", () => {
            const result = createWoD5EVttJson(mockCharacter)

            expect(result).toHaveProperty("json")
            expect(result).toHaveProperty("validationErrors")
            expect(Array.isArray(result.validationErrors)).toBe(true)

            const { json } = result

            // Test basic structure
            expect(json.name).toBe("Test Vampire")
            expect(json.type).toBe("vampire")
            expect(json.system).toBeDefined()
            expect(Array.isArray(json.items)).toBe(true)

            // Test system properties
            expect(json.system.locked).toBe(false)
            expect(json.system.hasSkillAttributeData).toBe(true)
            expect(json.system.headers.concept).toBe("A test vampire character")
            expect(json.system.headers.ambition).toBe("Test ambition")
            expect(json.system.headers.desire).toBe("Test desire")
            expect(json.system.headers.touchstones).toBe("Test Touchstone (Test conviction)")
            expect(json.system.headers.sire).toBe("Test Sire")
            expect(json.system.headers.generation).toBe("13")

            // Test attributes
            expect(json.system.attributes.strength.value).toBe(3)
            expect(json.system.attributes.dexterity.value).toBe(2)
            expect(json.system.attributes.charisma.value).toBe(2)

            // Test skills
            expect(json.system.skills.athletics.value).toBe(2)
            expect(json.system.skills.brawl.value).toBe(1)
            expect(json.system.skills.intimidation.value).toBe(2)

            // Test disciplines
            expect(json.system.disciplines.potence.value).toBe(1)
            expect(json.system.disciplines.potence.powers).toContain("Prowess")

            // Test items
            expect(json.items.length).toBeGreaterThan(0)

            const clanItem = json.items.find((item: any) => item.type === "clan")
            expect(clanItem).toBeDefined()
            expect(clanItem?.name).toBe("Brujah")

            const predatorItem = json.items.find((item: any) => item.type === "predatorType")
            expect(predatorItem).toBeDefined()
            expect(predatorItem?.name).toBe("Sandman")

            const powerItem = json.items.find((item: any) => item.type === "power")
            expect(powerItem).toBeDefined()
            expect(powerItem?.name).toBe("Prowess")
        })

        it("should handle character with empty optional fields", () => {
            const minimalCharacter: Character = {
                ...mockCharacter,
                description: "",
                ambition: "",
                desire: "",
                touchstones: [],
                sire: "",
                generation: 0,
                experience: 0,
                humanity: 0,
                bloodPotency: 0,
                maxHealth: 0,
                willpower: 0
            }

            const result = createWoD5EVttJson(minimalCharacter)

            expect(result).toHaveProperty("json")
            expect(result.validationErrors).toEqual([])

            const { json } = result
            expect(json.system.headers.concept).toBe("")
            expect(json.system.headers.ambition).toBe("")
            expect(json.system.headers.desire).toBe("")
            expect(json.system.headers.touchstones).toBe("")
            expect(json.system.headers.sire).toBe("")
            expect(json.system.headers.generation).toBe("0")
            expect(json.system.exp.value).toBe(0)
            expect(json.system.humanity.value).toBe(0)
            expect(json.system.blood.potency).toBe(0)
        })

        it("should return validation errors for invalid data", () => {
            const invalidCharacter = {
                ...mockCharacter,
                attributes: {
                    ...mockCharacter.attributes,
                    strength: -1 // Invalid negative value
                }
            } as Character

            const result = createWoD5EVttJson(invalidCharacter)

            expect(result).toHaveProperty("json")
            expect(result).toHaveProperty("validationErrors")
            expect(Array.isArray(result.validationErrors)).toBe(true)
        })
    })

    describe("PDF Download Conversion", () => {
        it("should handle PDF creation without errors", async () => {
            const { PDFDocument } = await import("pdf-lib")
            vi.mocked(PDFDocument.load).mockResolvedValue(createMockPdfDoc() as any)

            vi.mocked(fetch).mockResolvedValue({
                arrayBuffer: () => Promise.resolve(new ArrayBuffer(8))
            } as Response)

            await downloadCharacterSheet(mockCharacter)

            expect(mockAnchor.click).toHaveBeenCalled()
            expect(mockAnchor.download).toBe("progeny_Test Vampire.pdf")
        })

        it("should handle testTemplate function", async () => {
            const { PDFDocument } = await import("pdf-lib")
            vi.mocked(PDFDocument.load).mockResolvedValue(createMockPdfDoc() as any)

            vi.mocked(fetch).mockResolvedValue({
                arrayBuffer: () => Promise.resolve(new ArrayBuffer(8))
            } as Response)

            const result = await testTemplate("mock-base64-pdf-data")

            // The function should return either success or error
            expect(result).toHaveProperty("success")
            expect(typeof result.success).toBe("boolean")
        })

        it("should handle PDF form field operations", async () => {
            const mockForm = createMockPdfForm()

            const { PDFDocument } = await import("pdf-lib")
            vi.mocked(PDFDocument.load).mockResolvedValue(createMockPdfDoc(mockForm) as any)

            vi.mocked(fetch).mockResolvedValue({
                arrayBuffer: () => Promise.resolve(new ArrayBuffer(8))
            } as Response)

            await downloadCharacterSheet(mockCharacter)

            expect(mockForm.getCheckBox).toHaveBeenCalled()
            expect(mockForm.getTextField).toHaveBeenCalled()
            expect(mockForm.getButton).toHaveBeenCalled()
        })
    })

    describe("Error Handling", () => {
        it("should handle PDF creation errors gracefully", async () => {
            // Mock PDF creation to throw an error
            const { PDFDocument } = await import("pdf-lib")
            vi.mocked(PDFDocument.load).mockRejectedValue(new Error("PDF load failed"))

            await expect(downloadCharacterSheet(mockCharacter)).rejects.toThrow("PDF load failed")
        })

        it("should handle font loading errors", async () => {
            // Mock fetch to reject
            vi.mocked(fetch).mockRejectedValue(new Error("Font load failed"))

            const { PDFDocument } = await import("pdf-lib")
            vi.mocked(PDFDocument.load).mockResolvedValue(createMockPdfDoc() as any)

            await expect(downloadCharacterSheet(mockCharacter)).rejects.toThrow("Font load failed")
        })

        it("should handle invalid base64 data", async () => {
            // Mock window.atob to throw an error
            const mockAtob = vi.fn().mockImplementation(() => {
                throw new Error("Invalid base64")
            })
            Object.defineProperty(window, "atob", {
                writable: true,
                value: mockAtob
            })

            const result = await testTemplate("invalid-base64-data")

            expect(result.success).toBe(false)
            expect(result.error).toBeInstanceOf(Error)
        })
    })
})
