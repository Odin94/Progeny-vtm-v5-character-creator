import { MantineProvider } from "@mantine/core"
import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import posthog from "posthog-js"
import type { SheetOptions } from "~/character_sheet/CharacterSheet"
import Disciplines from "~/character_sheet/sections/Disciplines"
import { getBasicTestCharacter } from "./testUtils"

vi.mock("posthog-js", () => ({ default: { capture: vi.fn() } }))

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

afterEach(() => {
    cleanup()
    vi.clearAllMocks()
})

const getXpOptions = (): SheetOptions => {
    const character = getBasicTestCharacter()
    character.experience = 0
    return {
        mode: "xp",
        primaryColor: "grape",
        character,
        setCharacter: vi.fn(),
        canEdit: true,
        editDisabledReason: undefined,
        preferences: { colorTheme: "grape", backgroundImage: "" },
        onUpdatePreferences: vi.fn()
    }
}

describe("blocked discipline purchase feedback", () => {
    it("keeps an unaffordable power add clickable and explains the block", async () => {
        const user = userEvent.setup()

        render(
            <MantineProvider>
                <Disciplines options={getXpOptions()} />
            </MantineProvider>
        )

        const addPowerButton = screen.getAllByRole("button", { name: "Add power" })[0]
        expect(addPowerButton).not.toBeDisabled()

        await user.click(addPowerButton)

        expect(await screen.findByRole("status")).toHaveTextContent("Insufficient XP")
        expect(posthog.capture).toHaveBeenCalledWith(
            "sheet-power-pick-blocked",
            expect.objectContaining({ mode: "xp", discipline: "potence" })
        )
    })
})
