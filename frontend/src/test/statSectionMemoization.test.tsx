import { MantineProvider } from "@mantine/core"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import Attributes from "~/character_sheet/sections/Attributes"
import Skills from "~/character_sheet/sections/Skills"
import type { SheetOptions } from "~/character_sheet/CharacterSheet"
import { getEmptyCharacter } from "~/data/Character"

Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn(() => ({
        matches: false,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
    }))
})
afterEach(cleanup)

describe.each([
    { name: "Attributes", Section: Attributes, upgrade: "Strength 2", cost: 10 },
    { name: "Skills", Section: Skills, upgrade: "Athletics 1", cost: 3 }
])("$name memoization", ({ Section, upgrade, cost }) => {
    const upgradeButton = () => screen.getByRole("button", { name: upgrade })
    const makeOptions = (): SheetOptions => ({
        character: getEmptyCharacter(),
        setCharacter: vi.fn(),
        mode: "free",
        primaryColor: "grape",
        canEdit: true,
        preferences: { colorTheme: null, backgroundImage: null },
        onUpdatePreferences: vi.fn()
    })
    const tree = (options: SheetOptions) => (
        <MantineProvider>
            <Section options={options} />
        </MantineProvider>
    )

    it("refreshes editing permissions and the setter without changing character slices", () => {
        const options = makeOptions()
        const { rerender } = render(tree(options))
        rerender(tree({ ...options, canEdit: false, editDisabledReason: "Shared character" }))
        expect(upgradeButton()).toBeDisabled()
        const nextSetter = vi.fn()
        rerender(tree({ ...options, setCharacter: nextSetter }))
        fireEvent.click(upgradeButton())
        expect(nextSetter).toHaveBeenCalledOnce()
        expect(options.setCharacter).not.toHaveBeenCalled()
    })

    it("refreshes affordability while in XP mode", () => {
        const options = { ...makeOptions(), mode: "xp" as const }
        const { rerender } = render(tree(options))
        fireEvent.click(upgradeButton())
        expect(options.setCharacter).not.toHaveBeenCalled()
        rerender(tree({ ...options, character: { ...options.character, experience: cost } }))
        fireEvent.click(upgradeButton())
        expect(options.setCharacter).toHaveBeenCalledOnce()
    })
})
