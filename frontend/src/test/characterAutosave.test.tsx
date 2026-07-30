import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook } from "@testing-library/react"
import type { PropsWithChildren } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { getEmptyCharacter, type Character } from "~/data/Character"
import {
    CHARACTER_AUTOSAVE_DELAY_MS,
    CHARACTER_AUTOSAVE_RETRY_DELAY_MS,
    isOwnedSavedCharacter,
    useAutosaveCharacter
} from "~/hooks/useAutosaveCharacter"

const apiMocks = vi.hoisted(() => ({
    updateCharacter: vi.fn()
}))

vi.mock("~/utils/api", () => ({
    api: {
        updateCharacter: apiMocks.updateCharacter
    }
}))

const makeCharacter = (overrides: Partial<Character> = {}): Character => ({
    ...getEmptyCharacter(),
    id: "character-1",
    name: "Avery",
    ...overrides
})

const makeWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false }
        }
    })

    return ({ children }: PropsWithChildren) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
}

const finishPendingPromises = async () => {
    await Promise.resolve()
    await Promise.resolve()
}

describe("useAutosaveCharacter", () => {
    beforeEach(() => {
        vi.useFakeTimers()
        apiMocks.updateCharacter.mockReset()
        apiMocks.updateCharacter.mockResolvedValue({
            id: "character-1",
            characterVersion: 2,
            data: { characterVersion: 2 }
        })
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it("treats the initially loaded character as the saved baseline", () => {
        const character = makeCharacter()

        renderHook(() => useAutosaveCharacter(character, vi.fn(), true), {
            wrapper: makeWrapper()
        })

        act(() => vi.advanceTimersByTime(CHARACTER_AUTOSAVE_DELAY_MS * 2))

        expect(apiMocks.updateCharacter).not.toHaveBeenCalled()
    })

    it.each([
        { label: "ownership is not confirmed", enabled: false, id: "character-1" },
        { label: "the character has not been saved", enabled: true, id: "" }
    ])("does not save when $label", ({ enabled, id }) => {
        const initialCharacter = makeCharacter({ id })
        const { rerender } = renderHook(
            ({ character }) => useAutosaveCharacter(character, vi.fn(), enabled),
            {
                initialProps: { character: initialCharacter },
                wrapper: makeWrapper()
            }
        )

        rerender({ character: { ...initialCharacter, description: "Changed locally" } })
        act(() => vi.advanceTimersByTime(CHARACTER_AUTOSAVE_DELAY_MS * 2))

        expect(apiMocks.updateCharacter).not.toHaveBeenCalled()
    })

    it("debounces rapid changes and saves the complete latest character", async () => {
        const setCharacter = vi.fn()
        const initialCharacter = makeCharacter()
        const { rerender } = renderHook(
            ({ character }) => useAutosaveCharacter(character, setCharacter, true),
            {
                initialProps: { character: initialCharacter },
                wrapper: makeWrapper()
            }
        )

        rerender({ character: { ...initialCharacter, description: "First edit" } })
        act(() => vi.advanceTimersByTime(CHARACTER_AUTOSAVE_DELAY_MS / 2))

        const latestCharacter = { ...initialCharacter, description: "Latest edit" }
        rerender({ character: latestCharacter })
        act(() => vi.advanceTimersByTime(CHARACTER_AUTOSAVE_DELAY_MS - 1))
        expect(apiMocks.updateCharacter).not.toHaveBeenCalled()

        await act(async () => {
            vi.advanceTimersByTime(1)
            await finishPendingPromises()
        })

        expect(apiMocks.updateCharacter).toHaveBeenCalledTimes(1)
        expect(apiMocks.updateCharacter).toHaveBeenCalledWith("character-1", {
            name: latestCharacter.name,
            data: latestCharacter,
            version: latestCharacter.version
        })
        expect(setCharacter).toHaveBeenCalledWith(expect.any(Function))

        const applySavedVersion = setCharacter.mock.calls[0][0] as (
            character: Character
        ) => Character
        expect(applySavedVersion(latestCharacter).characterVersion).toBe(2)
    })

    it("queues changes made while a save is in flight", async () => {
        let resolveFirstSave: ((value: unknown) => void) | undefined
        apiMocks.updateCharacter
            .mockImplementationOnce(
                () =>
                    new Promise((resolve) => {
                        resolveFirstSave = resolve
                    })
            )
            .mockResolvedValueOnce({
                id: "character-1",
                characterVersion: 3,
                data: { characterVersion: 3 }
            })

        const initialCharacter = makeCharacter()
        const { rerender } = renderHook(
            ({ character }) => useAutosaveCharacter(character, vi.fn(), true),
            {
                initialProps: { character: initialCharacter },
                wrapper: makeWrapper()
            }
        )

        rerender({ character: { ...initialCharacter, description: "First edit" } })
        await act(async () => {
            vi.advanceTimersByTime(CHARACTER_AUTOSAVE_DELAY_MS)
            await finishPendingPromises()
        })
        expect(apiMocks.updateCharacter).toHaveBeenCalledTimes(1)

        const latestCharacter = { ...initialCharacter, description: "Edit during save" }
        rerender({ character: latestCharacter })
        await act(async () => {
            vi.advanceTimersByTime(CHARACTER_AUTOSAVE_DELAY_MS)
            await finishPendingPromises()
        })
        expect(apiMocks.updateCharacter).toHaveBeenCalledTimes(1)

        await act(async () => {
            resolveFirstSave?.({
                id: "character-1",
                characterVersion: 2,
                data: { characterVersion: 2 }
            })
            await finishPendingPromises()
            vi.advanceTimersByTime(CHARACTER_AUTOSAVE_DELAY_MS)
            await finishPendingPromises()
        })

        expect(apiMocks.updateCharacter).toHaveBeenCalledTimes(2)
        expect(apiMocks.updateCharacter.mock.calls[1][1].data).toEqual(latestCharacter)
    })

    it("cancels a pending save when a different character is loaded", () => {
        const initialCharacter = makeCharacter()
        const { rerender } = renderHook(
            ({ character }) => useAutosaveCharacter(character, vi.fn(), true),
            {
                initialProps: { character: initialCharacter },
                wrapper: makeWrapper()
            }
        )

        rerender({ character: { ...initialCharacter, description: "Pending edit" } })
        rerender({ character: makeCharacter({ id: "character-2", name: "Bea" }) })
        act(() => vi.advanceTimersByTime(CHARACTER_AUTOSAVE_DELAY_MS * 2))

        expect(apiMocks.updateCharacter).not.toHaveBeenCalled()
    })

    it("retries transient failures after the retry delay", async () => {
        const transientError = Object.assign(new Error("Unavailable"), { status: 503 })
        apiMocks.updateCharacter.mockRejectedValueOnce(transientError).mockResolvedValueOnce({
            id: "character-1",
            characterVersion: 2,
            data: { characterVersion: 2 }
        })
        const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined)
        const initialCharacter = makeCharacter()
        const { rerender } = renderHook(
            ({ character }) => useAutosaveCharacter(character, vi.fn(), true),
            {
                initialProps: { character: initialCharacter },
                wrapper: makeWrapper()
            }
        )

        rerender({ character: { ...initialCharacter, description: "Retry me" } })
        await act(async () => {
            vi.advanceTimersByTime(CHARACTER_AUTOSAVE_DELAY_MS)
            await finishPendingPromises()
        })
        expect(apiMocks.updateCharacter).toHaveBeenCalledTimes(1)

        act(() => vi.advanceTimersByTime(CHARACTER_AUTOSAVE_RETRY_DELAY_MS - 1))
        expect(apiMocks.updateCharacter).toHaveBeenCalledTimes(1)

        await act(async () => {
            vi.advanceTimersByTime(1)
            await finishPendingPromises()
        })

        expect(apiMocks.updateCharacter).toHaveBeenCalledTimes(2)
        warn.mockRestore()
    })
})

describe("isOwnedSavedCharacter", () => {
    const characters = [
        { id: "owned", shared: false },
        { id: "shared", shared: true }
    ]

    it("accepts a character owned by the current user", () => {
        expect(isOwnedSavedCharacter("owned", characters)).toBe(true)
    })

    it.each(["shared", "missing", ""])("rejects the ineligible character %s", (id) => {
        expect(isOwnedSavedCharacter(id, characters)).toBe(false)
    })
})
