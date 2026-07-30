import { MantineProvider } from "@mantine/core"
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import DiceRollModal from "~/character_sheet/components/diceRollModal/DiceRollModal"
import { useCharacterSheetStore } from "~/character_sheet/stores/characterSheetStore"
import { useDiceRollModalStore } from "~/character_sheet/stores/diceRollModalStore"
import { getBasicTestCharacter } from "./testUtils"

// SuccessResults observes its container to reflow the success count; jsdom has no
// ResizeObserver, so provide a no-op implementation.
class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
}
vi.stubGlobal("ResizeObserver", ResizeObserverStub)

// Simulate a phone where the media query resolves to mobile: the tappable dice
// grid is not rendered, so the reroll path must stand on its own.
Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
        matches: true,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn()
    }))
})

const renderModalWithRolledDice = (character = getBasicTestCharacter()) => {
    useDiceRollModalStore.getState().open()
    // A settled, non-success, non-blood die – i.e. something a willpower reroll can act on.
    useDiceRollModalStore.getState().setDice([
        { id: 1, value: 3, isRolling: false, isBloodDie: false }
    ])

    return render(
        <MantineProvider>
            <DiceRollModal primaryColor="red" character={character} setCharacter={vi.fn()} />
        </MantineProvider>
    )
}

describe("DiceRollModal willpower reroll on mobile", () => {
    beforeEach(() => {
        useCharacterSheetStore.getState().resetSelectedDicePool()
        useDiceRollModalStore.getState().reset()
    })

    it("enables the reroll on mobile even without a tappable dice grid", () => {
        renderModalWithRolledDice()

        // The mobile layout renders no DiceContainer, so this proves the reroll gate
        // no longer depends on tapping dice into `selectedDiceIds`.
        expect(screen.getByText("1 WP rerollable")).toBeInTheDocument()
        expect(screen.getByRole("button", { name: "Reroll with willpower" })).toBeEnabled()
    })

    it("disables the reroll and explains why once willpower is spent", async () => {
        const character = getBasicTestCharacter()
        const spent = {
            ...character,
            ephemeral: {
                ...character.ephemeral,
                superficialWillpowerDamage: character.willpower
            }
        }

        renderModalWithRolledDice(spent)

        const rerollButton = screen.getByRole("button", { name: "Reroll with willpower" })
        expect(rerollButton).toBeDisabled()

        // The reason is surfaced in the tooltip label instead of a silently dead icon.
        fireEvent.mouseEnter(rerollButton)
        expect(await screen.findByText("No willpower left to reroll")).toBeInTheDocument()
    })
})
