import { StrictMode } from "react"
import { MantineProvider } from "@mantine/core"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import DiceRollModal from "~/character_sheet/components/diceRollModal/DiceRollModal"
import type { DieResult } from "~/character_sheet/components/diceRollModal/parts/DiceContainer"
import QuickRollHotkeys from "~/character_sheet/components/diceRollModal/threeDice/QuickRollHotkeys"
import {
    parseQuickRoll,
    readThrowSettings,
    DEFAULT_VAMPIRE_THROW
} from "~/character_sheet/components/diceRollModal/threeDice/settings"
import { useDiceRollModalStore } from "~/character_sheet/stores/diceRollModalStore"
import { useCharacterSheetStore } from "~/character_sheet/stores/characterSheetStore"
import { getBasicTestCharacter } from "./testUtils"

const engine = vi.hoisted(() => ({ values: [1, 6, 8, 10], unavailable: false }))
vi.mock("posthog-js", () => ({ default: { capture: vi.fn(), get_distinct_id: () => "test-user" } }))
vi.mock("~/character_sheet/components/diceRollModal/threeDice/ThreeDice", () => ({
    default: (props: {
        dice: DieResult[]
        onComplete: (dice: DieResult[]) => void
        onUnavailable: () => void
        onDieClick: (id: number, blood: boolean) => void
    }) => (
        <div>
            <button
                onClick={() =>
                    props.onComplete(
                        props.dice.map((die, index) =>
                            die.isRolling
                                ? { ...die, isRolling: false, value: engine.values[index] }
                                : die
                        )
                    )
                }
            >
                Land 3D dice
            </button>
            <button onClick={props.onUnavailable}>Lose WebGL</button>
            {props.dice.map((die) => (
                <button key={die.id} onClick={() => props.onDieClick(die.id, die.isBloodDie)}>
                    {die.isBloodDie ? "Hunger" : "Regular"} 3D die {die.id}
                </button>
            ))}
        </div>
    )
}))
class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
}
vi.stubGlobal("ResizeObserver", ResizeObserverStub)
Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockImplementation((query) => ({
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

describe("vampire dice integration", () => {
    beforeEach(() => {
        vi.useRealTimers()
        localStorage.clear()
        useDiceRollModalStore.getState().reset()
        useCharacterSheetStore.getState().resetSelectedDicePool()
        engine.values = [1, 6, 8, 10]
    })
    it("parses the shorthand and legacy d10 notation, rejecting other dice and invalid pools", () => {
        for (const input of ["4", "r 4", "r4", "r 4 d 10", "4d10"])
            expect(parseQuickRoll(input)).toBe(4)
        for (const input of ["0", "-1", "1.5", "101", "4d6", "4+2", "", "wat"])
            expect(parseQuickRoll(input)).toBeNull()
        expect(readThrowSettings("broken")).toEqual(DEFAULT_VAMPIRE_THROW)
        expect(readThrowSettings('{"intensity":999,"startX":-999}')).toMatchObject({
            intensity: 10,
            startX: -150,
            dropHeight: DEFAULT_VAMPIRE_THROW.dropHeight
        })
    })
    it("opens the keyboard command, edits it, and leaves ordinary text entry alone", () => {
        render(
            <MantineProvider>
                <QuickRollHotkeys />
                <input aria-label="Notes" />
            </MantineProvider>
        )
        fireEvent.keyDown(screen.getByRole("textbox", { name: "Notes" }), { key: "r" })
        expect(
            screen.queryByRole("textbox", { name: "Quick roll dice count" })
        ).not.toBeInTheDocument()
        fireEvent.keyDown(window, { key: "r" })
        const input = screen.getByRole("textbox", { name: "Quick roll dice count" })
        fireEvent.change(input, { target: { value: "4 d 10" } })
        fireEvent.keyDown(input, { key: "Enter" })
        expect(useDiceRollModalStore.getState()).toMatchObject({
            opened: true,
            diceCount: 4,
            activeTab: "custom",
            quickRollSequence: 1
        })
        expect(
            screen.queryByRole("textbox", { name: "Quick roll dice count" })
        ).not.toBeInTheDocument()
    })
    it("uses real completion values and automatically replaces one die with hunger for r 4", async () => {
        const character = getBasicTestCharacter()
        character.ephemeral.hunger = 1
        useDiceRollModalStore.getState().requestQuickRoll(4)
        render(
            <StrictMode>
                <MantineProvider>
                    <DiceRollModal
                        primaryColor="red"
                        use3dDice
                        character={character}
                        setCharacter={vi.fn()}
                    />
                </MantineProvider>
            </StrictMode>
        )
        await screen.findByRole("button", { name: "Land 3D dice" })
        expect(useDiceRollModalStore.getState().dice.filter((die) => die.isBloodDie)).toHaveLength(
            1
        )
        expect(
            useDiceRollModalStore.getState().dice.every((die) => die.isRolling && die.value === 0)
        ).toBe(true)
        fireEvent.click(screen.getByRole("button", { name: "Land 3D dice" }))
        expect(useDiceRollModalStore.getState().dice.map((die) => die.value)).toEqual([1, 6, 8, 10])
        expect(useDiceRollModalStore.getState().dice.every((die) => !die.isRolling)).toBe(true)
        expect(screen.getByText("Total Successes: 3")).toBeInTheDocument()
    })
    it("rerolls selected regular dice for one willpower while preserving hunger and other results", async () => {
        const character = getBasicTestCharacter()
        character.ephemeral.superficialWillpowerDamage = 0
        character.ephemeral.aggravatedWillpowerDamage = 0
        const setCharacter = vi.fn()
        const dice: DieResult[] = [1, 2, 3, 4].map((value, index) => ({
            id: index + 1,
            value,
            isBloodDie: index === 0,
            isRolling: false
        }))
        useDiceRollModalStore.getState().open()
        useDiceRollModalStore.getState().setDice(dice)
        render(
            <MantineProvider>
                <DiceRollModal
                    primaryColor="red"
                    use3dDice
                    character={character}
                    setCharacter={setCharacter}
                />
            </MantineProvider>
        )
        await screen.findByRole("button", { name: "Land 3D dice" })
        fireEvent.click(screen.getByRole("button", { name: "Hunger 3D die 1" }))
        expect(
            screen.getByRole("button", { name: "Reroll selected dice with willpower" })
        ).toBeDisabled()
        fireEvent.click(screen.getByRole("button", { name: "Regular 3D die 2" }))
        fireEvent.click(screen.getByRole("button", { name: "Reroll selected dice with willpower" }))
        expect(setCharacter).toHaveBeenCalledOnce()
        expect(setCharacter.mock.calls[0][0].ephemeral.superficialWillpowerDamage).toBe(1)
        expect(useDiceRollModalStore.getState().dice.map((die) => die.isRolling)).toEqual([
            false,
            true,
            false,
            false
        ])
        engine.values = [10, 9, 10, 10]
        fireEvent.click(screen.getByRole("button", { name: "Land 3D dice" }))
        expect(useDiceRollModalStore.getState().dice.map((die) => die.value)).toEqual([1, 9, 3, 4])
    })
    it("falls back when WebGL fails, and clears pending rolls on unmount", async () => {
        useDiceRollModalStore.getState().requestQuickRoll(4)
        const view = render(
            <MantineProvider>
                <DiceRollModal primaryColor="red" use3dDice character={getBasicTestCharacter()} />
            </MantineProvider>
        )
        await screen.findByRole("button", { name: "Lose WebGL" })
        fireEvent.click(screen.getByRole("button", { name: "Lose WebGL" }))
        await waitFor(() =>
            expect(screen.queryByTestId("vampire-dice-controls")).not.toBeInTheDocument()
        )
        expect(
            useDiceRollModalStore
                .getState()
                .dice.every((die) => !die.isRolling && die.value >= 1 && die.value <= 10)
        ).toBe(true)
        await act(async () => {
            view.unmount()
            await Promise.resolve()
        })
        expect(useDiceRollModalStore.getState().dice).toEqual([])
        expect(useDiceRollModalStore.getState().opened).toBe(false)
    })
})
