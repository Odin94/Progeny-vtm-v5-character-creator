import { MantineProvider } from "@mantine/core"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import {
    CHARACTER_OWNERSHIP_EDIT_REASON,
    type SheetOptions
} from "~/character_sheet/CharacterSheet"
import DamagePips from "~/character_sheet/components/DamagePips"
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

const getReadOnlyOptions = (setCharacter: SheetOptions["setCharacter"]): SheetOptions => ({
    mode: "play",
    primaryColor: "grape",
    character: getEmptyCharacter(),
    setCharacter,
    canEdit: false,
    editDisabledReason: CHARACTER_OWNERSHIP_EDIT_REASON,
    preferences: {},
    onUpdatePreferences: vi.fn()
})

describe("read-only character sheet controls", () => {
    it("disables rating pips and explains that only owners can edit", async () => {
        const user = userEvent.setup()
        const setCharacter = vi.fn()

        render(
            <MantineProvider>
                <Pips
                    level={2}
                    maxLevel={5}
                    options={getReadOnlyOptions(setCharacter)}
                    field="attributes.strength"
                />
            </MantineProvider>
        )

        const pips = screen.getAllByRole("button")
        expect(pips).toHaveLength(5)
        pips.forEach((pip) => expect(pip).toBeDisabled())

        await user.click(pips[0])
        expect(setCharacter).not.toHaveBeenCalled()

        await user.hover(pips[0])
        expect(await screen.findByText(CHARACTER_OWNERSHIP_EDIT_REASON)).toBeInTheDocument()
    })

    it("disables damage pips with the same ownership tooltip", async () => {
        const user = userEvent.setup()
        const onChange = vi.fn()

        render(
            <MantineProvider>
                <DamagePips
                    maxValue={5}
                    superficial={2}
                    aggravated={1}
                    onChange={onChange}
                    disabledReason={CHARACTER_OWNERSHIP_EDIT_REASON}
                />
            </MantineProvider>
        )

        const pips = screen.getAllByRole("button")
        pips.forEach((pip) => expect(pip).toBeDisabled())

        await user.click(pips[0])
        expect(onChange).not.toHaveBeenCalled()

        await user.hover(pips[0])
        expect(await screen.findByText(CHARACTER_OWNERSHIP_EDIT_REASON)).toBeInTheDocument()
    })
})
