import { MantineProvider, ScrollArea } from "@mantine/core"
import { render } from "@testing-library/react"
import { afterEach, beforeEach, expect, test, vi } from "vitest"

// Reproduces the React 19.2 #440 crash. Mantine's ScrollArea hands a
// useEffectEvent wrapper to a ResizeObserver -> requestAnimationFrame callback.
// In a real browser that callback can fire while React is rendering another
// component; a useEffectEvent wrapper called during render throws #440, while a
// useCallbackRef wrapper does not. The test captures the wrapper and calls it
// during a render to reproduce that interleaving deterministically.

const observerCallbacks: Array<() => void> = []
const rafCallbacks: Array<() => void> = []

Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn()
    }))
})

Object.defineProperty(document, "fonts", {
    writable: true,
    value: { addEventListener: vi.fn(), removeEventListener: vi.fn() }
})

beforeEach(() => {
    observerCallbacks.length = 0
    rafCallbacks.length = 0
    vi.stubGlobal(
        "ResizeObserver",
        class {
            constructor(cb: () => void) {
                observerCallbacks.push(cb)
            }
            observe() {}
            unobserve() {}
            disconnect() {}
        }
    )
    vi.stubGlobal("requestAnimationFrame", (cb: () => void) => {
        rafCallbacks.push(cb)
        return rafCallbacks.length
    })
    vi.stubGlobal("cancelAnimationFrame", () => {})
})

afterEach(() => {
    vi.unstubAllGlobals()
})

// Calls the captured ScrollArea callbacks during its own render, so React's
// RenderContext is active when the wrapper runs.
function CallDuringRender() {
    rafCallbacks.forEach((cb) => cb())
    return null
}

test("ScrollArea resize callback called during a render does not crash", async () => {
    const { rerender } = render(
        <MantineProvider>
            <ScrollArea.Autosize onOverflowChange={() => {}}>content</ScrollArea.Autosize>
        </MantineProvider>
    )

    await new Promise((resolve) => setTimeout(resolve, 0))

    // Fire the ResizeObserver, which schedules requestAnimationFrame(handleResize)
    // and captures that wrapper into rafCallbacks.
    observerCallbacks.forEach((cb) => cb())
    expect(rafCallbacks.length).toBeGreaterThan(0)

    expect(() =>
        rerender(
            <MantineProvider>
                <CallDuringRender />
            </MantineProvider>
        )
    ).not.toThrow()
})
