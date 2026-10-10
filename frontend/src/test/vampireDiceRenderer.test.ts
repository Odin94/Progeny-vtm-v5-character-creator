import { afterEach, beforeEach, expect, it, vi } from "vitest"
import { PageDiceRenderer } from "~/character_sheet/components/diceRollModal/threeDice/page-dice-renderer"
import { DEFAULT_VAMPIRE_THROW } from "~/character_sheet/components/diceRollModal/threeDice/settings"
import type { PageDicePhysics } from "~/character_sheet/components/diceRollModal/threeDice/page-dice-physics"
import type { DieResult } from "~/character_sheet/components/diceRollModal/parts/DiceContainer"

vi.mock("three", async (importOriginal) => {
    const original = await importOriginal<typeof import("three")>()
    return {
        ...original,
        WebGLRenderer: class {
            domElement = document.createElement("canvas")
            shadowMap = {}
            setClearColor() {}
            setPixelRatio() {}
            setSize() {}
            render() {}
            clear() {}
            dispose() {}
        },
        PMREMGenerator: class {
            fromScene() {
                return new original.WebGLRenderTarget(1, 1)
            }
            dispose() {}
        }
    }
})
vi.mock("three/addons/loaders/GLTFLoader.js", async () => {
    const { Group } = await import("three")
    return {
        GLTFLoader: class {
            async parseAsync() {
                return { scene: new Group() }
            }
        }
    }
})
vi.mock("~/character_sheet/components/diceRollModal/threeDice/liquid-renderer.js", () => ({
    createLiquidRenderer: () => ({
        setRoots() {},
        render(draw: () => void) {
            draw()
        },
        dispose() {}
    })
}))

let renderer: PageDiceRenderer
let frames: Map<number, FrameRequestCallback>
let frameId: number
const flushFrame = () => {
    const pending = [...frames.values()]
    frames.clear()
    for (const callback of pending) callback(performance.now())
}
const dice: DieResult[] = [
    { id: 1, value: 10, isBloodDie: true, isRolling: false },
    { id: 2, value: 2, isBloodDie: false, isRolling: false },
    { id: 3, value: 6, isBloodDie: false, isRolling: false }
]

beforeEach(() => {
    frames = new Map()
    frameId = 0
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
        frames.set(++frameId, callback)
        return frameId
    })
    vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id))
    vi.stubGlobal(
        "ResizeObserver",
        class {
            observe() {}
            disconnect() {}
        }
    )
    vi.stubGlobal(
        "fetch",
        vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) }))
    )
    vi.stubGlobal("matchMedia", () => ({ matches: false }))
    const host = document.createElement("div")
    Object.defineProperties(host, { clientWidth: { value: 1264 }, clientHeight: { value: 784 } })
    renderer = new PageDiceRenderer(host, vi.fn())
})
afterEach(() => {
    renderer.dispose()
    vi.unstubAllGlobals()
})

it("leaves rerolled dice where they land until another explicit sort", async () => {
    await renderer.roll(dice, "default", DEFAULT_VAMPIRE_THROW, vi.fn())
    const physics = (renderer as unknown as { physics: PageDicePhysics }).physics
    const arrange = vi.spyOn(physics, "sort")
    renderer.sort()
    const fixed = physics.dice[0].body.translation()
    const done = vi.fn()
    await renderer.roll(
        dice.map((die) => ({ ...die, isRolling: die.id === 2 })),
        "default",
        DEFAULT_VAMPIRE_THROW,
        done
    )
    expect(arrange).toHaveBeenCalledOnce()
    physics.settleImmediately()
    flushFrame()
    expect(done).toHaveBeenCalledOnce()
    const landed = done.mock.calls[0][0] as DieResult[]
    await renderer.roll(landed, "default", DEFAULT_VAMPIRE_THROW, done)
    renderer.setControlsBounds(undefined)
    flushFrame()
    expect(arrange).toHaveBeenCalledOnce()
    expect(physics.dice[0].body.translation()).toEqual(fixed)
    renderer.sort()
    expect(arrange).toHaveBeenCalledTimes(2)
    expect(done).toHaveBeenCalledOnce()
})

it("sorts an in-flight reroll immediately, keeping held results and completing once", async () => {
    await renderer.roll(dice, "default", DEFAULT_VAMPIRE_THROW, vi.fn())
    renderer.sort()
    const done = vi.fn()
    await renderer.roll(
        dice.map((die) => ({ ...die, isRolling: die.id === 2 })),
        "default",
        DEFAULT_VAMPIRE_THROW,
        done
    )
    const physics = (renderer as unknown as { physics: PageDicePhysics }).physics
    expect(physics.settled).toBe(false)
    const faces = physics.results().map((result) => result.value)
    renderer.sort()
    expect(physics.settled).toBe(true)
    expect(done).toHaveBeenCalledOnce()
    const landed = done.mock.calls[0][0] as DieResult[]
    expect(landed.map((die) => die.value)).toEqual([dice[0].value, faces[1], dice[2].value])
    expect(landed.every((die) => !die.isRolling)).toBe(true)
    flushFrame()
    expect(done).toHaveBeenCalledOnce()
})

it("honors a sort requested while the roll is still preparing", async () => {
    const done = vi.fn()
    const preparing = renderer.roll(
        dice.map((die) => ({ ...die, isRolling: true })),
        "default",
        DEFAULT_VAMPIRE_THROW,
        done
    )
    renderer.sort()
    await preparing
    expect(done).toHaveBeenCalledOnce()
    expect(done.mock.calls[0][0].every((die: DieResult) => !die.isRolling)).toBe(true)
})
