import { MantineProvider } from "@mantine/core"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import Pips from "~/character_sheet/components/Pips"
import { getEmptyCharacter } from "~/data/Character"
import type { SheetOptions } from "~/character_sheet/CharacterSheet"

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

const options: SheetOptions = {
    mode: "free",
    primaryColor: "red",
    character: getEmptyCharacter(),
    setCharacter: vi.fn(),
    canEdit: true,
    preferences: { colorTheme: null, backgroundImage: null },
    onUpdatePreferences: vi.fn()
}

describe("discipline level pips", () => {
    it("changes the independent level through the free-edit callback", async () => {
        const user = userEvent.setup()
        const onLevelChange = vi.fn()

        render(
            <MantineProvider>
                <Pips level={2} options={options} onLevelChange={onLevelChange} />
            </MantineProvider>
        )

        await user.click(screen.getAllByRole("button")[2])

        expect(onLevelChange).toHaveBeenCalledWith(3)
    })
})
