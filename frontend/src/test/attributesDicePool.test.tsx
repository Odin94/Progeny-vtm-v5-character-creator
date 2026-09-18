import { MantineProvider } from "@mantine/core"
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { SheetOptions } from "~/character_sheet/CharacterSheet"
import Attributes from "~/character_sheet/sections/Attributes"
import { useCharacterSheetStore } from "~/character_sheet/stores/characterSheetStore"
import { useDiceRollModalStore } from "~/character_sheet/stores/diceRollModalStore"
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

const makeOptions = (): SheetOptions => ({
    mode: "play",
    primaryColor: "grape",
    character: getBasicTestCharacter(),
    setCharacter: vi.fn(),
    canEdit: false,
    editDisabledReason: undefined,
    preferences: { colorTheme: null, backgroundImage: null },
    onUpdatePreferences: vi.fn()
})

const renderAttributes = () =>
    render(
        <MantineProvider>
            <Attributes options={makeOptions()} />
        </MantineProvider>
    )

describe("Attributes dice pool selection", () => {
    beforeEach(() => {
        useCharacterSheetStore.getState().resetSelectedDicePool()
        useDiceRollModalStore.getState().reset()
    })

    it("pairs the same attribute instead of deselecting it on a second click", () => {
        renderAttributes()

        // First click fills the primary slot and opens the pool.
        fireEvent.click(screen.getByText("Strength"))
        expect(useCharacterSheetStore.getState().selectedDicePool.attribute).toBe("strength")
        expect(useDiceRollModalStore.getState().opened).toBe(true)

        // Second click on the same attribute fills the companion slot.
        fireEvent.click(screen.getByText("Strength"))
        const pool = useCharacterSheetStore.getState().selectedDicePool
        expect(pool.attribute).toBe("strength")
        expect(pool.secondAttribute).toBe("strength")
    })

    it("fills the companion slot with a different second attribute", () => {
        renderAttributes()

        fireEvent.click(screen.getByText("Wits"))
        fireEvent.click(screen.getByText("Resolve"))

        const pool = useCharacterSheetStore.getState().selectedDicePool
        expect(pool.attribute).toBe("wits")
        expect(pool.secondAttribute).toBe("resolve")

        // Clicking the second attribute again clears just that slot.
        fireEvent.click(screen.getByText("Resolve"))
        expect(useCharacterSheetStore.getState().selectedDicePool.secondAttribute).toBeNull()
    })
})
