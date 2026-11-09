import { MantineProvider } from "@mantine/core"
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { SheetOptions } from "~/character_sheet/CharacterSheet"
import TheBlood from "~/character_sheet/sections/TheBlood"
import { getEmptyCharacter, type Character } from "~/data/Character"
import { getClanBaneText, getClanCompulsionText } from "~/data/VariantClanBanes"

vi.mock("~/character_sheet/components/Pips", () => ({ default: () => null }))

Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
    }))
})

afterEach(cleanup)

const setCharacter = vi.fn()
const options = (character: Character): SheetOptions => ({
    character,
    setCharacter,
    mode: "free",
    primaryColor: "grape",
    canEdit: true,
    preferences: { colorTheme: null, backgroundImage: null },
    onUpdatePreferences: vi.fn()
})
const view = (character: Character) => (
    <MantineProvider>
        <TheBlood options={options(character)} />
    </MantineProvider>
)

// Page translators replace React's text nodes with their own elements.
const translateText = (text: string) => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    let node: Node | null
    while ((node = walker.nextNode())) {
        if (node.textContent === text) {
            const translated = document.createElement("font")
            translated.textContent = `Translated: ${text}`
            node.parentNode!.replaceChild(translated, node)
            return
        }
    }
    throw new Error("Trait text not found")
}

describe("translated sheet clan traits", () => {
    it("can clear and restore clan traits after translation without crashing the sheet", () => {
        const character: Character = { ...getEmptyCharacter(), clan: "Brujah", bloodPotency: 1 }
        const bane = getClanBaneText(character, 2)
        const compulsion = getClanCompulsionText(character)
        const { rerender } = render(view(character))
        translateText(bane)
        translateText(compulsion)

        expect(() => rerender(view({ ...character, clan: "" }))).not.toThrow()
        expect(screen.queryByText(`Translated: ${bane}`)).not.toBeInTheDocument()
        expect(screen.queryByText(`Translated: ${compulsion}`)).not.toBeInTheDocument()

        rerender(view(character))
        expect(screen.getByText(bane)).toBeInTheDocument()
        expect(screen.getByText(compulsion)).toBeInTheDocument()
    })
})
