import { MantineProvider } from "@mantine/core"
import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import SelectedDicePoolDisplay from "~/character_sheet/components/diceRollModal/parts/SelectedDicePoolDisplay"
import { useCharacterSheetStore } from "~/character_sheet/stores/characterSheetStore"
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

describe("SelectedDicePoolDisplay", () => {
    beforeEach(() => {
        useCharacterSheetStore.getState().resetSelectedDicePool()
    })

    it("shows selected pool badges and dice bonus controls in the expanded card", () => {
        const character = getBasicTestCharacter()
        useCharacterSheetStore.getState().updateSelectedDicePool({
            attribute: "strength",
            skill: "brawl"
        })

        render(
            <MantineProvider>
                <SelectedDicePoolDisplay
                    character={character}
                    primaryColor="red"
                    skillSpecialties={[]}
                />
            </MantineProvider>
        )

        expect(
            screen.getAllByText((_, element) => element?.textContent === "Strength: 3").length
        ).toBeGreaterThan(0)
        expect(
            screen.getAllByText((_, element) => element?.textContent === "Brawl: 1").length
        ).toBeGreaterThan(0)
        expect(screen.getByLabelText("Blood Surge (+2 dice)")).toBeInTheDocument()
    })
})
