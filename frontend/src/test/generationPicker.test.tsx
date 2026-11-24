import { MantineProvider } from "@mantine/core"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { getEmptyCharacter } from "~/data/Character"
import { getCharacterWithGeneration } from "~/generator/generation"
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
    it("sets Thin-bloods to generation 14 when an earlier generation is stored", () => {
        const character = {
            ...getBasicTestCharacter(),
            clan: "Thin-blood" as const,
            generation: 13
        }
        const setCharacter = vi.fn()
        render(
            <MantineProvider>
                <GenerationPicker
                    character={character}
                    setCharacter={setCharacter}
                    nextStep={vi.fn()}
                />
            </MantineProvider>
        )
        expect(screen.getByRole("combobox")).toHaveValue("14th Gen - Childer")
        expect(setCharacter).toHaveBeenCalledWith(
            expect.objectContaining({ generation: 14, bloodPotency: 0 })
        )
    })

    it("shows the displayed default in the Select", () => {
        const character = getBasicTestCharacter()
        character.generation = 0

        render(
            <MantineProvider>
                <GenerationPicker character={character} setCharacter={vi.fn()} nextStep={vi.fn()} />
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
                />
            </MantineProvider>
        )

        expect(setCharacter).toHaveBeenCalledWith(
            expect.objectContaining({ generation: 13, experience: 15 })
        )
    })

    it("replaces the generation budget after the Neonate XP was spent", () => {
        const character = getCharacterWithGeneration(getEmptyCharacter(), 13)
        character.ephemeral.experienceSpent = 15

        const updated = getCharacterWithGeneration(character, 10)

        expect(updated.generation).toBe(10)
        expect(updated.experience).toBe(35)
        expect(updated.ephemeral.experienceSpent).toBe(15)
    })

    it("replaces starting XP without subtracting earned or spent XP", () => {
        const character = getCharacterWithGeneration(getEmptyCharacter(), 10)
        character.experience += 7
        character.ephemeral.experienceSpent = 21

        const updated = getCharacterWithGeneration(character, 13)
        expect(updated).toMatchObject({ generation: 13, generationBonusXp: 15, experience: 22 })
        expect(updated.ephemeral.experienceSpent).toBe(21)
        expect(getCharacterWithGeneration(updated, 10).experience).toBe(42)
        expect(getCharacterWithGeneration(updated, 13)).toBe(updated)
    })

    it("does not subtract XP with no recorded grant", () => {
        const character = { ...getEmptyCharacter(), generation: 10, experience: 7 }

        expect(getCharacterWithGeneration(character, 10).experience).toBe(7)
        expect(getCharacterWithGeneration(character, 13).experience).toBe(22)
    })
})
