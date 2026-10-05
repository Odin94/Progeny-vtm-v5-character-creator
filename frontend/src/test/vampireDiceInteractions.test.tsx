import { MantineProvider } from "@mantine/core"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, expect, it, vi } from "vitest"
import { useRef, useState } from "react"
import ThreeDice from "~/character_sheet/components/diceRollModal/threeDice/ThreeDice"
import ThrowControls from "~/character_sheet/components/diceRollModal/threeDice/ThrowControls"
import { DEFAULT_VAMPIRE_THROW } from "~/character_sheet/components/diceRollModal/threeDice/settings"
import type { DieResult } from "~/character_sheet/components/diceRollModal/parts/DiceContainer"

const engine = vi.hoisted(() => ({
    context: (_id: number, _position: { x: number; y: number }) => {},
    roll: vi.fn(async () => {}),
    clear: vi.fn(),
    sort: vi.fn()
}))
vi.mock("~/character_sheet/components/diceRollModal/threeDice/page-dice-renderer", () => ({
    PageDiceRenderer: class {
        constructor(_host: HTMLElement, _click: unknown, context: typeof engine.context) {
            engine.context = context
        }
        roll = engine.roll
        clear = engine.clear
        sort = engine.sort
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

it("offers sorting, removal of all dice, and a gated selected-dice reroll", async () => {
    const removed = vi.fn()
    const reroll = vi.fn()
    const initial: DieResult[] = [
        { id: 1, value: 1, isBloodDie: true, isRolling: false },
        { id: 2, value: 10, isBloodDie: false, isRolling: false }
    ]
    function Harness({ canReroll = false }: { canReroll?: boolean }) {
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
                    selectedDiceIds={new Set([2])}
                    canSelect={false}
                    canReroll={canReroll}
                    onReroll={reroll}
                    onDieClick={vi.fn()}
                    onComplete={vi.fn()}
                    onUnavailable={vi.fn()}
                    onRemoveAllDice={() => {
                        removed()
                        setDice([])
                    }}
                />
            </>
        )
    }
    const view = render(
        <MantineProvider env="test">
            <Harness />
        </MantineProvider>
    )
    act(() => engine.context(1, { x: 120, y: 100 }))
    const menu = await screen.findByRole("menu", { name: "Die actions" })
    expect(
        Array.from(menu.querySelectorAll('[role="menuitem"]')).map((item) => item.textContent)
    ).toEqual(["Sort dice", "Remove all dice", "Reroll selected dice (1 WP)"])
    expect(screen.getByRole("menuitem", { name: "Reroll selected dice (1 WP)" })).toBeDisabled()
    fireEvent.click(screen.getByRole("menuitem", { name: "Sort dice" }))
    expect(engine.sort).toHaveBeenCalledOnce()
    expect(removed).not.toHaveBeenCalled()
    view.rerender(
        <MantineProvider env="test">
            <Harness canReroll />
        </MantineProvider>
    )
    act(() => engine.context(2, { x: 180, y: 100 }))
    fireEvent.click(await screen.findByRole("menuitem", { name: "Reroll selected dice (1 WP)" }))
    expect(reroll).toHaveBeenCalledOnce()
    act(() => engine.context(1, { x: 120, y: 100 }))
    fireEvent.click(await screen.findByRole("menuitem", { name: "Remove all dice" }))
    expect(removed).toHaveBeenCalledOnce()
    await waitFor(() => expect(engine.clear).toHaveBeenCalledOnce())
})

it("allows manual sorting during a roll while keeping removal and reroll disabled", async () => {
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
                canReroll
                onReroll={vi.fn()}
                onDieClick={vi.fn()}
                onComplete={vi.fn()}
                onUnavailable={vi.fn()}
                onRemoveAllDice={vi.fn()}
            />
        </MantineProvider>
    )
    act(() => engine.context(1, { x: 120, y: 100 }))
    expect(await screen.findByRole("menu", { name: "Die actions" })).toBeInTheDocument()
    expect(screen.getByRole("menuitem", { name: "Remove all dice" })).toBeDisabled()
    expect(screen.getByRole("menuitem", { name: "Reroll selected dice (1 WP)" })).toBeDisabled()
    fireEvent.click(screen.getByRole("menuitem", { name: "Sort dice" }))
    expect(engine.sort).toHaveBeenCalledOnce()
})
it("honors the roller's sort button request while dice are preparing", () => {
    render(
        <MantineProvider env="test">
            <ThreeDice
                dice={[{ id: 1, value: 0, isBloodDie: false, isRolling: true }]}
                style="default"
                settings={DEFAULT_VAMPIRE_THROW}
                controls={{ current: document.createElement("div") }}
                isMobile={false}
                selectedDiceIds={new Set()}
                canSelect={false}
                canReroll={false}
                onReroll={vi.fn()}
                onDieClick={vi.fn()}
                onComplete={vi.fn()}
                onUnavailable={vi.fn()}
                onRemoveAllDice={vi.fn()}
                sortRequest={1}
            />
        </MantineProvider>
    )
    expect(engine.sort).toHaveBeenCalledOnce()
})
it("resets changed throw settings to the defaults", async () => {
    const onSettingsChange = vi.fn()
    const renderControls = (settings: typeof DEFAULT_VAMPIRE_THROW) => (
        <MantineProvider env="test">
            <ThrowControls
                style="default"
                onStyleChange={vi.fn()}
                settings={settings}
                onSettingsChange={onSettingsChange}
                disabled={false}
            />
        </MantineProvider>
    )
    const { rerender } = render(renderControls(DEFAULT_VAMPIRE_THROW))
    fireEvent.click(screen.getByRole("button", { name: "Throw settings" }))
    expect(await screen.findByRole("button", { name: "Reset to default" })).toBeDisabled()
    rerender(renderControls({ ...DEFAULT_VAMPIRE_THROW, intensity: 4, spread: 10 }))
    fireEvent.click(screen.getByRole("button", { name: "Reset to default" }))
    expect(onSettingsChange).toHaveBeenCalledWith(DEFAULT_VAMPIRE_THROW)
})
