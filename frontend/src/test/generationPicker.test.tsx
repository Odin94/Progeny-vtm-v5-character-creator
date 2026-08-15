import { MantineProvider } from "@mantine/core"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import GenerationPicker from "~/generator/components/GenerationPicker"
import { getBasicTestCharacter } from "./testUtils"

vi.mock("~/utils/analytics", () => ({
    trackEvent: vi.fn()
}))

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

globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
}

describe("GenerationPicker", () => {
    it("shows the displayed default in the Select", () => {
        const character = getBasicTestCharacter()
        character.generation = 0

        render(
            <MantineProvider>
                <GenerationPicker
                    character={character}
                    setCharacter={vi.fn()}
                    nextStep={vi.fn()}
                    generation={null}
                    setGeneration={vi.fn()}
                />
            </MantineProvider>
        )

        expect(screen.getByRole("combobox")).toHaveValue("13th Gen - Neonate")
    })

    it("persists the displayed default Neonate generation and its XP bonus", () => {
        const character = getBasicTestCharacter()
        character.generation = 0
        character.experience = 0
        const setCharacter = vi.fn()

        render(
            <MantineProvider>
                <GenerationPicker
                    character={character}
                    setCharacter={setCharacter}
                    nextStep={vi.fn()}
                    generation={null}
                    setGeneration={vi.fn()}
                />
            </MantineProvider>
        )

        expect(setCharacter).toHaveBeenCalledWith(
            expect.objectContaining({ generation: 13, experience: 15 })
        )
    })
})
