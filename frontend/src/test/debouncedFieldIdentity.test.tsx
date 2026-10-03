import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { rememberCharacterDraft, retainCharacterDraftIdentity } from "~/utils/characterDraft"
import { getEmptyCharacter, type Character } from "~/data/Character"
import {
    useDebouncedUncontrolledNumberField,
    useDebouncedUncontrolledStringField
} from "~/character_sheet/utils/useDebouncedUncontrolledField"

describe("delayed character field identity", () => {
    beforeEach(() => {
        localStorage.clear()
        vi.useFakeTimers()
    })
    afterEach(() => vi.useRealTimers())
    it.each([false, true])(
        "keeps string edits out of another saved/anonymous draft (anonymous=%s)",
        (anonymous) => {
            let current = { ...getEmptyCharacter(), id: anonymous ? "" : "A", name: "A" }
            const setCharacter = (update: Character | ((value: Character) => Character)) => {
                current = typeof update === "function" ? update(current) : update
            }
            const { result, rerender } = renderHook(
                ({ character }) =>
                    useDebouncedUncontrolledStringField({
                        character,
                        setCharacter,
                        field: "description"
                    }),
                { initialProps: { character: current } }
            )
            act(() => result.current.onChange("Private A edit"))
            const previous = current
            current = { ...current, sire: "Another A edit" }
            retainCharacterDraftIdentity(previous, current)
            rerender({ character: current })
            current = { ...getEmptyCharacter(), id: anonymous ? "" : "B", name: "B" }
            rerender({ character: current })
            act(() => vi.advanceTimersByTime(200))
            expect(current.description).toBe("")
            const recovered = JSON.parse(localStorage.getItem("progeny-character-recovery")!)[0]
                .character
            expect(recovered.name).toBe("A")
            expect(recovered.sire).toBe("Another A edit")
            expect(recovered.description).toBe("Private A edit")
        }
    )
    it("guards the functional updater even when a memoized field has not rerendered", () => {
        let current = { ...getEmptyCharacter(), id: "A", name: "A" }
        const { result } = renderHook(() =>
            useDebouncedUncontrolledNumberField({
                character: current,
                setCharacter: (update) => {
                    current = typeof update === "function" ? update(current) : update
                },
                field: "experience"
            })
        )
        act(() => result.current.onChange(7))
        current = { ...getEmptyCharacter(), id: "B", name: "B" }
        act(() => vi.advanceTimersByTime(200))
        expect(current.experience).toBe(0)
        expect(
            JSON.parse(localStorage.getItem("progeny-character-recovery")!)[0].character.experience
        ).toBe(7)
    })
    it("recovers the latest source snapshot when memoization skips unrelated field renders", () => {
        let current = { ...getEmptyCharacter(), id: "memo-source", name: "A" }
        const { result } = renderHook(() =>
            useDebouncedUncontrolledStringField({
                character: current,
                setCharacter: (update) => {
                    current = typeof update === "function" ? update(current) : update
                },
                field: "description"
            })
        )
        act(() => result.current.onChange("Private A edit"))
        rememberCharacterDraft({ ...current, sire: "Latest unrelated A edit" })
        current = { ...getEmptyCharacter(), id: "memo-target", name: "B" }
        act(() => vi.advanceTimersByTime(200))
        const recovered = JSON.parse(localStorage.getItem("progeny-character-recovery")!)[0]
            .character
        expect(recovered.sire).toBe("Latest unrelated A edit")
        expect(recovered.description).toBe("Private A edit")
        expect(current.description).toBe("")
    })

    it("preserves a pending number edit on unmount", () => {
        const character = { ...getEmptyCharacter(), id: "A", name: "A" }
        const { result, unmount } = renderHook(() =>
            useDebouncedUncontrolledNumberField({
                character,
                setCharacter: vi.fn(),
                field: "experience"
            })
        )
        act(() => result.current.onChange(9))
        unmount()
        expect(
            JSON.parse(localStorage.getItem("progeny-character-recovery")!)[0].character.experience
        ).toBe(9)
    })
})
