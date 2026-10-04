import { act, cleanup, renderHook } from "@testing-library/react"
import { useState } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useDescriptionUndo } from "~/character_sheet/hooks/useDescriptionUndo"

const useHarness = (
    identity = "A",
    initialValue = "Original description\n\nFull appearance — 🦇."
) => {
    const [value, setValue] = useState(initialValue)
    return { value, setValue, ...useDescriptionUndo({ identity, value, onChange: setValue }) }
}

describe("description undo history", () => {
    beforeEach(() => vi.useFakeTimers())
    afterEach(() => {
        cleanup()
        vi.useRealTimers()
    })

    it("recovers a complete deletion immediately, before the history debounce", () => {
        const { result } = renderHook(() => useHarness())
        const original = result.current.value
        act(() => result.current.onChange(""))
        expect(result.current.canUndo).toBe(true)
        act(() => result.current.undo())
        expect(result.current.value).toBe(original)
        expect(result.current.canUndo).toBe(false)
        act(() => vi.advanceTimersByTime(2000))
        expect(result.current.canUndo).toBe(false)
    })

    it("groups ongoing typing and starts another undo step after a one-second pause", () => {
        const { result } = renderHook(() => useHarness())
        const original = result.current.value
        act(() => result.current.onChange("First"))
        act(() => vi.advanceTimersByTime(600))
        act(() => result.current.onChange("First edit"))
        act(() => vi.advanceTimersByTime(600))
        act(() => result.current.onChange("First editing burst"))
        act(() => vi.advanceTimersByTime(1001))
        act(() => result.current.onChange("Second edit"))
        act(() => result.current.undo())
        expect(result.current.value).toBe("First editing burst")
        act(() => result.current.undo())
        expect(result.current.value).toBe(original)
        expect(result.current.canUndo).toBe(false)
    })

    it("ignores unchanged values and a burst that returns to its starting text", () => {
        const { result } = renderHook(() => useHarness())
        const original = result.current.value
        act(() => result.current.onChange(original))
        expect(result.current.canUndo).toBe(false)
        act(() => result.current.onChange("Temporary edit"))
        act(() => result.current.onChange(original))
        act(() => vi.advanceTimersByTime(1001))
        expect(result.current.canUndo).toBe(false)
        act(() => result.current.onChange("Real edit"))
        act(() => result.current.undo())
        expect(result.current.value).toBe(original)
        expect(result.current.canUndo).toBe(false)
    })

    it("does not carry undo entries into another character, even with identical text", () => {
        const { result, rerender } = renderHook(({ identity }) => useHarness(identity), {
            initialProps: { identity: "A" }
        })
        act(() => result.current.onChange("Edited A"))
        rerender({ identity: "B" })
        expect(result.current.canUndo).toBe(false)
        act(() => vi.advanceTimersByTime(2000))
        act(() => result.current.undo())
        expect(result.current.value).toBe("Edited A")
    })

    it("clears stale undo entries when an external description replaces the local text", () => {
        const { result } = renderHook(() => useHarness())
        act(() => result.current.onChange("Local edit"))
        act(() => result.current.setValue("Updated elsewhere"))
        expect(result.current.canUndo).toBe(false)
        act(() => result.current.undo())
        expect(result.current.value).toBe("Updated elsewhere")
    })

    it("keeps the most recent twenty edit groups", () => {
        const { result } = renderHook(() => useHarness("A", "Version 0"))
        for (let version = 1; version <= 25; version++) {
            act(() => result.current.onChange(`Version ${version}`))
            act(() => vi.advanceTimersByTime(1001))
        }
        for (let step = 0; step < 20; step++) act(() => result.current.undo())
        expect(result.current.value).toBe("Version 5")
        expect(result.current.canUndo).toBe(false)
    })
})
