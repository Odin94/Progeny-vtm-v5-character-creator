import { MantineProvider } from "@mantine/core"
import { act, fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import DiceRollModal from "~/character_sheet/components/diceRollModal/DiceRollModal"
import type { DieResult } from "~/character_sheet/components/diceRollModal/parts/DiceContainer"
import { useCharacterSheetStore } from "~/character_sheet/stores/characterSheetStore"
import { useDiceRollModalStore } from "~/character_sheet/stores/diceRollModalStore"
import { getBasicTestCharacter } from "./testUtils"

const mocks = vi.hoisted(() => ({
    isMobile: true,
    capture: vi.fn()
}))

vi.mock("@mantine/hooks", async (importOriginal) => {
    const actual = await importOriginal<typeof import("@mantine/hooks")>()
    return {
        ...actual,
        useMediaQuery: () => mocks.isMobile
    }
})

vi.mock("posthog-js", () => ({
    default: {
        capture: (...args: unknown[]) => mocks.capture(...args),
        get_distinct_id: () => "test-distinct-id"
    }
}))

class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
}

vi.stubGlobal("ResizeObserver", ResizeObserverStub)

Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
        matches: mocks.isMobile,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn()
    }))
})

const renderModalWithDice = (
    dice: DieResult[],
    character = getBasicTestCharacter(),
    setCharacter = vi.fn()
) => {
    useDiceRollModalStore.getState().open()
    useDiceRollModalStore.getState().setDice(dice)

    render(
        <MantineProvider>
            <DiceRollModal primaryColor="red" character={character} setCharacter={setCharacter} />
        </MantineProvider>
    )

    return { setCharacter }
}

describe("DiceRollModal willpower rerolls", () => {
    beforeEach(() => {
        vi.restoreAllMocks()
        vi.useRealTimers()
        mocks.isMobile = true
        mocks.capture.mockClear()
        vi.spyOn(globalThis.crypto, "getRandomValues").mockImplementation((array) => {
            const values = array as Uint32Array
            values[0] = 0x80000000
            return array
        })
        useCharacterSheetStore.getState().resetSelectedDicePool()
        useDiceRollModalStore.getState().reset()
    })

    it("runs the mobile roll animation before showing the result", async () => {
        renderModalWithDice([])

        fireEvent.click(screen.getByRole("button", { name: "Roll Dice" }))

        expect(useDiceRollModalStore.getState().dice).toEqual([
            expect.objectContaining({ value: 0, isRolling: true })
        ])

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 1550))
        })

        expect(useDiceRollModalStore.getState().dice).toEqual([
            expect.objectContaining({ value: 6, isRolling: false })
        ])
        expect(
            screen.getByRole("button", { name: "Regular die 1 showing 6" })
        ).toBeInTheDocument()
    })

    it("lets mobile players choose and reroll at most three regular dice", async () => {
        const dice: DieResult[] = [1, 2, 3, 4].map((value, index) => ({
            id: index + 1,
            value,
            isRolling: false,
            isBloodDie: false
        }))
        const { setCharacter } = renderModalWithDice(dice)
        const rerollButton = screen.getByRole("button", {
            name: "Reroll selected dice with willpower"
        })

        expect(rerollButton).toBeDisabled()
        expect(screen.getByText("Tap dice")).toBeInTheDocument()

        for (const index of [1, 2, 3, 4]) {
            fireEvent.click(
                screen.getByRole("button", {
                    name: `Regular die ${index} showing ${index}`
                })
            )
        }

        expect(screen.getByText("3/3")).toBeInTheDocument()
        expect(rerollButton).toBeEnabled()

        fireEvent.click(rerollButton)

        expect(useDiceRollModalStore.getState().dice.map((die) => die.isRolling)).toEqual([
            true,
            true,
            true,
            false
        ])

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 1550))
        })

        expect(setCharacter).toHaveBeenCalledWith(
            expect.objectContaining({
                ephemeral: expect.objectContaining({ superficialWillpowerDamage: 1 })
            })
        )
        expect(useDiceRollModalStore.getState().dice.map((die) => die.value)).toEqual([6, 6, 6, 4])
        expect(mocks.capture).toHaveBeenCalledWith("dice-roll-reroll", {
            mode: "custom",
            is_mobile: true,
            reroll_dice_count: 3,
            available_willpower_before: 4
        })
    })

    it("shows the player when no willpower remains", async () => {
        const character = getBasicTestCharacter()
        character.ephemeral.superficialWillpowerDamage = character.willpower

        renderModalWithDice([{ id: 1, value: 3, isRolling: false, isBloodDie: false }], character)

        expect(screen.getByText("No WP left")).toBeInTheDocument()

        const rerollButton = screen.getByRole("button", {
            name: "Reroll selected dice with willpower"
        })
        expect(rerollButton).toBeDisabled()

        fireEvent.mouseEnter(rerollButton.parentElement!)
        expect(await screen.findByText("No willpower left to reroll")).toBeInTheDocument()
    })
})
