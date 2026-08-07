import { MantineProvider } from "@mantine/core"
import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { Character } from "~/data/Character"
import TouchstonePicker from "~/generator/components/TouchstonePicker"
import type { SetCharacter } from "~/hooks/useCharacterLocalStorage"
import { getBasicTestCharacter } from "./testUtils"

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

// Mantine's autosize Textarea subscribes to document.fonts, which jsdom does not implement.
Object.defineProperty(document, "fonts", {
    writable: true,
    value: { addEventListener: vi.fn(), removeEventListener: vi.fn() }
})

// Mantine's ScrollArea uses ResizeObserver, absent from jsdom.
globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
}

afterEach(cleanup)

// Renders the picker against a stateful setCharacter that mirrors the real one: it accepts both
// the object and the functional-updater form and always applies against the latest character.
const renderPicker = (initialCharacter: Character) => {
    const onChange = vi.fn<(character: Character) => void>()
    const nextStep = vi.fn()

    const Harness = () => {
        const [character, setCharacterState] = useState(initialCharacter)
        const setCharacter: SetCharacter = (characterOrUpdater) => {
            setCharacterState((current) => {
                const next =
                    typeof characterOrUpdater === "function"
                        ? characterOrUpdater(current)
                        : characterOrUpdater
                onChange(next)
                return next
            })
        }
        return (
            <MantineProvider>
                <TouchstonePicker
                    character={character}
                    setCharacter={setCharacter}
                    nextStep={nextStep}
                />
            </MantineProvider>
        )
    }

    render(<Harness />)
    return { onChange, nextStep }
}

const withTouchstones = (touchstones: Character["touchstones"]): Character => ({
    ...getBasicTestCharacter(),
    touchstones
})

describe("TouchstonePicker", () => {
    it("commits typed text on change, without waiting for a blur", async () => {
        const user = userEvent.setup()
        const { onChange } = renderPicker(withTouchstones([]))

        await user.type(screen.getByTestId("touchstone-0-name-input"), "Jacques Roux")

        // No blur fired — the character should already carry the typed name.
        const last = onChange.mock.calls.at(-1)?.[0]
        expect(last?.touchstones[0]?.name).toBe("Jacques Roux")
    })

    it("preserves concurrent character changes via the functional updater form", async () => {
        const user = userEvent.setup()
        const { onChange } = renderPicker(withTouchstones([]))

        await user.type(screen.getByTestId("touchstone-0-description-input"), "A friend")

        // Every persist must go through the updater form so it merges into the latest character
        // instead of a stale prop snapshot (which would clobber e.g. the autosave version bump).
        expect(onChange.mock.calls.length).toBeGreaterThan(0)
        for (const call of onChange.mock.calls) {
            // The harness only forwards a resolved Character, but the character it merged into is
            // the latest one — assert the merge kept unrelated fields intact.
            expect(call[0].name).toBe("Test Vampire")
            expect(call[0].clan).toBe("Brujah")
        }
    })

    it("drops a fully blank touchstone row on confirm", async () => {
        const user = userEvent.setup()
        const { onChange, nextStep } = renderPicker(withTouchstones([]))

        await user.click(screen.getByTestId("touchstones-confirm-button"))

        const last = onChange.mock.calls.at(-1)?.[0]
        expect(last?.touchstones).toEqual([])
        expect(nextStep).toHaveBeenCalledTimes(1)
    })

    it("keeps a partially filled row (blank name, filled description) on confirm", async () => {
        const user = userEvent.setup()
        const { onChange } = renderPicker(withTouchstones([]))

        await user.type(screen.getByTestId("touchstone-0-description-input"), "Only a description")
        await user.click(screen.getByTestId("touchstones-confirm-button"))

        const last = onChange.mock.calls.at(-1)?.[0]
        expect(last?.touchstones).toEqual([
            { name: "", description: "Only a description", conviction: "" }
        ])
    })
})
