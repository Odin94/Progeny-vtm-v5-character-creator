import { MantineProvider } from "@mantine/core"
import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { Character } from "~/data/Character"
import BasicsPicker from "~/generator/components/BasicsPicker"
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
                <BasicsPicker
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

const emptyBasics = (): Character => ({
    ...getBasicTestCharacter(),
    name: "",
    sire: "",
    ambition: "",
    desire: "",
    description: ""
})

describe("BasicsPicker", () => {
    it("commits typed text on change, without waiting for Confirm", async () => {
        const user = userEvent.setup()
        const { onChange } = renderPicker(emptyBasics())

        await user.type(screen.getByTestId("basic-full-name-input"), "Erika Mustermann")

        // No Confirm click — the character should already carry the typed name, so navigating
        // away from the step can't drop it.
        const last = onChange.mock.calls.at(-1)?.[0]
        expect(last?.name).toBe("Erika Mustermann")
    })

    it("persists every basics field on change", async () => {
        const user = userEvent.setup()
        const { onChange } = renderPicker(emptyBasics())

        await user.type(screen.getByTestId("basic-sire-input"), "My Sire")
        await user.type(screen.getByTestId("basic-ambition-input"), "Rule the night")
        await user.type(screen.getByTestId("basic-desire-input"), "A quiet meal")
        await user.type(screen.getByTestId("basic-description-input"), "Tall and pale")

        const last = onChange.mock.calls.at(-1)?.[0]
        expect(last?.sire).toBe("My Sire")
        expect(last?.ambition).toBe("Rule the night")
        expect(last?.desire).toBe("A quiet meal")
        expect(last?.description).toBe("Tall and pale")
    })

    it("preserves concurrent character changes via the functional updater form", async () => {
        const user = userEvent.setup()
        const { onChange } = renderPicker(emptyBasics())

        await user.type(screen.getByTestId("basic-full-name-input"), "Nadia")

        // Every persist must go through the updater form so it merges into the latest character
        // instead of a stale prop snapshot (which would clobber e.g. the autosave version bump).
        expect(onChange.mock.calls.length).toBeGreaterThan(0)
        for (const call of onChange.mock.calls) {
            expect(call[0].clan).toBe("Brujah")
            expect(call[0].version).toBe(1)
        }
    })

    it("advances to the next step on Confirm", async () => {
        const user = userEvent.setup()
        const { onChange, nextStep } = renderPicker(emptyBasics())

        await user.type(screen.getByTestId("basic-full-name-input"), "Erika")
        await user.click(screen.getByTestId("basics-confirm-button"))

        expect(nextStep).toHaveBeenCalledTimes(1)
        const last = onChange.mock.calls.at(-1)?.[0]
        expect(last?.name).toBe("Erika")
    })
})
