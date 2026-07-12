import { MantineProvider } from "@mantine/core"
import { act, fireEvent, render, renderHook, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import type { SheetOptions } from "~/character_sheet/CharacterSheet"
import { getEmptyCharacter, type Character } from "~/data/Character"
import { useCharacterLocalStorage, type SetCharacter } from "~/hooks/useCharacterLocalStorage"

// Count how many times the Touchstones section actually renders by instrumenting its
// editor after opening it. When the memo comparator bails out, the child is not
// re-invoked, so the counter stays flat.
const touchstoneModalRenders = { count: 0 }
vi.mock("~/character_sheet/components/TouchstoneModal", () => ({
    default: () => {
        touchstoneModalRenders.count += 1
        return null
    }
}))

// Import after the mock is registered.
import Touchstones from "~/character_sheet/sections/Touchstones"

Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
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

const makeOptions = (character: Character, setCharacter: SetCharacter): SheetOptions => ({
    mode: "free",
    primaryColor: "grape",
    character,
    setCharacter,
    canEdit: true,
    editDisabledReason: undefined,
    preferences: {},
    onUpdatePreferences: vi.fn()
})

describe("sheet section memoization", () => {
    it("keeps the real setCharacter callback stable across character updates", () => {
        localStorage.clear()
        const { result } = renderHook(() => useCharacterLocalStorage())
        const initialSetCharacter = result.current[1]

        act(() => {
            result.current[1]((current) => ({ ...current, name: "Nosferatu Bob" }))
        })

        expect(result.current[0].name).toBe("Nosferatu Bob")
        expect(result.current[1]).toBe(initialSetCharacter)
    })

    it("does not re-render Touchstones when an unrelated character slice changes", () => {
        const setCharacter = vi.fn()
        const character = getEmptyCharacter()
        const options = makeOptions(character, setCharacter)

        const { rerender } = render(
            <MantineProvider>
                <Touchstones options={options} />
            </MantineProvider>
        )
        fireEvent.click(screen.getByRole("button"))
        const rendersAfterMount = touchstoneModalRenders.count
        expect(rendersAfterMount).toBeGreaterThan(0)

        // A new character object where only an unread field (name) changed, wrapped in a
        // brand-new options object — exactly what CharacterSheet produces on every edit.
        const editedCharacter = { ...character, name: "Nosferatu Bob" }
        rerender(
            <MantineProvider>
                <Touchstones options={makeOptions(editedCharacter, setCharacter)} />
            </MantineProvider>
        )

        // The memo comparator only reads `touchstones` (plus options scalars), so the
        // name change must not re-render the section.
        expect(touchstoneModalRenders.count).toBe(rendersAfterMount)
    })

    it("does re-render Touchstones when its own slice (touchstones) changes", () => {
        const setCharacter = vi.fn()
        const character = getEmptyCharacter()

        const { rerender } = render(
            <MantineProvider>
                <Touchstones options={makeOptions(character, setCharacter)} />
            </MantineProvider>
        )
        fireEvent.click(screen.getByRole("button"))
        const rendersAfterMount = touchstoneModalRenders.count

        const editedCharacter = {
            ...character,
            touchstones: [{ name: "Sister", description: "", conviction: "Protect family" }]
        }
        rerender(
            <MantineProvider>
                <Touchstones options={makeOptions(editedCharacter, setCharacter)} />
            </MantineProvider>
        )

        expect(touchstoneModalRenders.count).toBeGreaterThan(rendersAfterMount)
    })
})

// A minimal store that mirrors useCharacterLocalStorage's support for both a value and a
// functional updater. This lets us prove that a section's write, after being converted to
// the functional form, merges into the freshest character instead of a stale closure.
const makeStore = (initial: Character) => {
    let current = initial
    const setCharacter: SetCharacter = (update) => {
        current = typeof update === "function" ? update(current) : update
    }
    return {
        setCharacter,
        get: () => current
    }
}

describe("functional setCharacter prevents clobbering concurrent edits", () => {
    it("a touchstone deletion keeps a concurrent name edit made after the section last rendered", () => {
        const start = {
            ...getEmptyCharacter(),
            touchstones: [
                { name: "Sister", description: "", conviction: "Protect family" },
                { name: "Mentor", description: "", conviction: "Repay debt" }
            ]
        }
        const store = makeStore(start)

        // Simulate the memoized-section delete handler, which now uses the functional form
        // and closes over the touchstone to remove (as the real confirmDelete does).
        const touchstoneToDelete = start.touchstones[0]
        const deleteTouchstone = () =>
            store.setCharacter((cur) => ({
                ...cur,
                touchstones: cur.touchstones.filter(
                    (t) =>
                        !(
                            t.name === touchstoneToDelete.name &&
                            t.description === touchstoneToDelete.description &&
                            t.conviction === touchstoneToDelete.conviction
                        )
                )
            }))

        // Another surface (e.g. TopData) commits a name edit AFTER this section last read
        // the character. With a stale-closure write this change would be reverted.
        store.setCharacter((cur) => ({ ...cur, name: "Renamed" }))

        deleteTouchstone()

        const result = store.get()
        expect(result.name).toBe("Renamed")
        expect(result.touchstones.map((t) => t.name)).toEqual(["Mentor"])
    })
})
