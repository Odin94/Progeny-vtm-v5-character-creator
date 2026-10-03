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
    { name: "Attributes", Section: Attributes, upgradeIndex: 1, cost: 10 },
    { name: "Skills", Section: Skills, upgradeIndex: 0, cost: 3 }
])("$name memoization", ({ Section, upgradeIndex, cost }) => {
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
        const buttons = screen
            .getAllByRole("button")
            .filter((button) => button.classList.contains("mantine-ActionIcon-root"))
        expect(buttons[upgradeIndex]).toBeDisabled()
        const nextSetter = vi.fn()
        rerender(tree({ ...options, setCharacter: nextSetter }))
        const refreshedButtons = screen
            .getAllByRole("button")
            .filter((button) => button.classList.contains("mantine-ActionIcon-root"))
        fireEvent.click(refreshedButtons[upgradeIndex])
        expect(nextSetter).toHaveBeenCalledOnce()
        expect(options.setCharacter).not.toHaveBeenCalled()
    })

    it("refreshes affordability while in XP mode", () => {
        const options = { ...makeOptions(), mode: "xp" as const }
        const { rerender } = render(tree(options))
        fireEvent.click(screen.getAllByRole("button")[upgradeIndex])
        expect(options.setCharacter).not.toHaveBeenCalled()
        rerender(tree({ ...options, character: { ...options.character, experience: cost } }))
        fireEvent.click(screen.getAllByRole("button")[upgradeIndex])
        expect(options.setCharacter).toHaveBeenCalledOnce()
    })
})
