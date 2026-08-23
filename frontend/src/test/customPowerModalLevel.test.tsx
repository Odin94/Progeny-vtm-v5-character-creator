import { MantineProvider } from "@mantine/core"
import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import CustomPowerModal from "~/character_sheet/components/CustomPowerModal"
import type { SheetOptions } from "~/character_sheet/CharacterSheet"
import { getBasicTestCharacter } from "./testUtils"

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

afterEach(cleanup)

const renderModal = (setCharacter = vi.fn()) => {
    const character = getBasicTestCharacter()
    character.disciplineLevels = { "official:celerity": 1 }
    const options = {
        mode: "free",
        primaryColor: "grape",
        character,
        setCharacter
    } as unknown as SheetOptions

    render(
        <MantineProvider>
            <CustomPowerModal
                opened
                onClose={vi.fn()}
                options={options}
                disciplineName="celerity"
            />
        </MantineProvider>
    )

    return { character, setCharacter }
}

describe("CustomPowerModal discipline levels", () => {
    it("rejects a new custom power more than one level above the rating", async () => {
        const user = userEvent.setup()
        const { setCharacter } = renderModal()

        await user.type(screen.getByLabelText(/Power Name/), "Time Stop")
        await user.clear(screen.getByLabelText(/Level/))
        await user.type(screen.getByLabelText(/Level/), "5")
        await user.click(screen.getByRole("button", { name: "Save" }))

        expect(screen.getByText("New powers can be at most Level 2")).toBeInTheDocument()
        expect(setCharacter).not.toHaveBeenCalled()
    })

    it("raises the stored rating by exactly one for a new custom power", async () => {
        const user = userEvent.setup()
        const { character, setCharacter } = renderModal()

        await user.type(screen.getByLabelText(/Power Name/), "Quick Step")
        await user.click(screen.getByRole("button", { name: "Save" }))

        const update = setCharacter.mock.calls[0]?.[0]
        expect(typeof update).toBe("function")
        expect(update(character).disciplineLevels).toEqual({ "official:celerity": 2 })
    })
})
