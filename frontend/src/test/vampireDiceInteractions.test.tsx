import { MantineProvider } from "@mantine/core"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, expect, it, vi } from "vitest"
import { useRef, useState } from "react"
import ThreeDice from "~/character_sheet/components/diceRollModal/threeDice/ThreeDice"
import { DEFAULT_VAMPIRE_THROW } from "~/character_sheet/components/diceRollModal/threeDice/settings"
import type { DieResult } from "~/character_sheet/components/diceRollModal/parts/DiceContainer"

const engine = vi.hoisted(() => ({
    context: (_id: number, _position: { x: number; y: number }) => {},
    roll: vi.fn(async () => {}),
    clear: vi.fn()
}))
vi.mock("~/character_sheet/components/diceRollModal/threeDice/page-dice-renderer", () => ({
    PageDiceRenderer: class {
        constructor(_host: HTMLElement, _click: unknown, context: typeof engine.context) {
            engine.context = context
        }
        roll = engine.roll
        clear = engine.clear
        select() {}
        setControlsBounds() {}
        dispose() {}
    }
}))
vi.stubGlobal(
    "ResizeObserver",
    class {
        observe() {}
        disconnect() {}
    }
)
Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
    }))
})

beforeEach(() => {
    vi.clearAllMocks()
})

it("opens a context menu for hunger and regular dice and clears the renderer after the last removal", async () => {
    const removed = vi.fn()
    const initial: DieResult[] = [
        { id: 1, value: 1, isBloodDie: true, isRolling: false },
        { id: 2, value: 10, isBloodDie: false, isRolling: false }
    ]
    function Harness() {
        const controls = useRef<HTMLDivElement>(null)
        const [dice, setDice] = useState(initial)
        return (
            <>
                <div ref={controls} />
                <ThreeDice
                    dice={dice}
                    style="default"
                    settings={DEFAULT_VAMPIRE_THROW}
                    controls={controls}
                    isMobile={false}
                    selectedDiceIds={new Set()}
                    canSelect={false}
                    onDieClick={vi.fn()}
                    onComplete={vi.fn()}
                    onUnavailable={vi.fn()}
                    onRemoveDie={(id) => {
                        removed(id)
                        setDice((previous) => previous.filter((die) => die.id !== id))
                    }}
                />
            </>
        )
    }
    render(
        <MantineProvider env="test">
            <Harness />
        </MantineProvider>
    )
    act(() => engine.context(1, { x: 120, y: 100 }))
    expect(await screen.findByRole("menu", { name: "Die actions" })).toBeInTheDocument()
    fireEvent.click(await screen.findByRole("menuitem", { name: "Remove die" }))
    expect(removed).toHaveBeenLastCalledWith(1)
    await waitFor(() =>
        expect(engine.roll).toHaveBeenLastCalledWith(
            [initial[1]],
            "default",
            DEFAULT_VAMPIRE_THROW,
            expect.any(Function)
        )
    )
    act(() => engine.context(2, { x: 180, y: 100 }))
    fireEvent.click(await screen.findByRole("menuitem", { name: "Remove die" }))
    expect(removed).toHaveBeenLastCalledWith(2)
    expect(engine.clear).toHaveBeenCalledOnce()
})

it("ignores context-menu requests during a roll", () => {
    const controls = { current: document.createElement("div") }
    render(
        <MantineProvider env="test">
            <ThreeDice
                dice={[{ id: 1, value: 0, isBloodDie: false, isRolling: true }]}
                style="default"
                settings={DEFAULT_VAMPIRE_THROW}
                controls={controls}
                isMobile={false}
                selectedDiceIds={new Set()}
                canSelect
                onDieClick={vi.fn()}
                onComplete={vi.fn()}
                onUnavailable={vi.fn()}
                onRemoveDie={vi.fn()}
            />
        </MantineProvider>
    )
    act(() => engine.context(1, { x: 120, y: 100 }))
    expect(screen.queryByRole("menuitem", { name: "Remove die" })).not.toBeInTheDocument()
})
