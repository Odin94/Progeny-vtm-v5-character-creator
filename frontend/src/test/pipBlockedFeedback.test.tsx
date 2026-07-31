import { MantineProvider } from "@mantine/core"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { type SheetOptions } from "~/character_sheet/CharacterSheet"
import Pips from "~/character_sheet/components/Pips"
import { getEmptyCharacter } from "~/data/Character"

Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn()
    }))
})

const getXpOptions = (setCharacter: SheetOptions["setCharacter"]): SheetOptions => ({
    mode: "xp",
    primaryColor: "grape",
    character: getEmptyCharacter(), // 0 experience => every upgrade is unaffordable
    setCharacter,
    canEdit: true,
    editDisabledReason: undefined,
    preferences: {},
    onUpdatePreferences: vi.fn()
})

describe("blocked pip clicks explain themselves inline", () => {
    it("shows the insufficient-XP reason on click, without a hover, and stays clickable", async () => {
        const user = userEvent.setup()
        const setCharacter = vi.fn()

        render(
            <MantineProvider>
                <Pips level={0} maxLevel={5} options={getXpOptions(setCharacter)} field="skills.brawl" />
            </MantineProvider>
        )

        const pips = screen.getAllByRole("button")
        // The pip must remain clickable so the click can surface the reason; a truly
        // disabled button would swallow the click and only reveal the reason on hover.
        expect(pips[0]).not.toBeDisabled()
        expect(screen.queryByText(/Insufficient XP/)).not.toBeInTheDocument()

        await user.click(pips[0])

        expect(setCharacter).not.toHaveBeenCalled()
        // The reason must render inline as body text (a <p>), not only inside a hover tooltip.
        const matches = await screen.findAllByText(/Insufficient XP/)
        expect(matches.some((element) => element.tagName === "P")).toBe(true)
    })

    it("explains that a level-1 trait cannot be decreased in XP mode", async () => {
        const user = userEvent.setup()
        const setCharacter = vi.fn()

        render(
            <MantineProvider>
                <Pips level={1} maxLevel={5} options={getXpOptions(setCharacter)} field="skills.brawl" />
            </MantineProvider>
        )

        const pips = screen.getAllByRole("button")
        await user.click(pips[0])

        expect(setCharacter).not.toHaveBeenCalled()
        const matches = await screen.findAllByText("Cannot decrease in XP mode")
        expect(matches.some((element) => element.tagName === "P")).toBe(true)
    })
})
