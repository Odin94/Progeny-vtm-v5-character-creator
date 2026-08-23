import { MantineProvider } from "@mantine/core"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import { describe, expect, it, vi } from "vitest"
import Pips from "~/character_sheet/components/Pips"
import Disciplines from "~/character_sheet/sections/Disciplines"
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

    it("re-renders the sheet pips after changing a discipline level in Free Edit", async () => {
        const user = userEvent.setup()

        const FreeEditDisciplines = () => {
            const [character, setCharacter] = useState(() => {
                const initialCharacter = getEmptyCharacter()
                initialCharacter.disciplineLevels = { "official:celerity": 1 }
                return initialCharacter
            })
            const sheetOptions: SheetOptions = {
                ...options,
                character,
                setCharacter
            }

            return <Disciplines options={sheetOptions} />
        }

        render(
            <MantineProvider>
                <FreeEditDisciplines />
            </MantineProvider>
        )

        const pips = screen.getAllByRole("button").slice(0, 5)
        await user.click(pips[2])

        await waitFor(() =>
            expect(pips[2].querySelector("span")).toHaveStyle({ opacity: "1" })
        )
    })
})
