import { afterEach, expect, it, vi } from "vitest"
import { scheduleDiceWarmup } from "~/character_sheet/components/diceRollModal/threeDice/warmup"

afterEach(() => vi.unstubAllGlobals())

it("waits for the controls to paint and then warms during browser idle time", () => {
    let frame: FrameRequestCallback = () => {}
    let idle: IdleRequestCallback = () => {}
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
        frame = callback
        return 1
    })
    vi.stubGlobal("cancelAnimationFrame", vi.fn())
    vi.stubGlobal("requestIdleCallback", (callback: IdleRequestCallback) => {
        idle = callback
        return 2
    })
    vi.stubGlobal("cancelIdleCallback", vi.fn())
    const prepare = vi.fn()
    scheduleDiceWarmup(prepare)
    expect(prepare).not.toHaveBeenCalled()
    frame(0)
    expect(prepare).not.toHaveBeenCalled()
    frame(16)
    expect(prepare).not.toHaveBeenCalled()
    idle({ didTimeout: false, timeRemaining: () => 50 })
    expect(prepare).toHaveBeenCalledOnce()
})

it("cancels pending preparation when the roller closes", () => {
    let frame: FrameRequestCallback = () => {}
    let idle: IdleRequestCallback = () => {}
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
        frame = callback
        return 1
    })
    vi.stubGlobal("cancelAnimationFrame", vi.fn())
    vi.stubGlobal("requestIdleCallback", (callback: IdleRequestCallback) => {
        idle = callback
        return 2
    })
    const cancelIdle = vi.fn()
    vi.stubGlobal("cancelIdleCallback", cancelIdle)
    const prepare = vi.fn()
    const cancel = scheduleDiceWarmup(prepare)
    frame(0)
    frame(16)
    cancel()
    idle({ didTimeout: true, timeRemaining: () => 0 })
    expect(cancelIdle).toHaveBeenCalledWith(2)
    expect(prepare).not.toHaveBeenCalled()
})
