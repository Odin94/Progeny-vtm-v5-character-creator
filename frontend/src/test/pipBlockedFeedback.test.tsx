import { MantineProvider } from "@mantine/core"
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { type SheetOptions } from "~/character_sheet/CharacterSheet"
import Pips from "~/character_sheet/components/Pips"
import { getEmptyCharacter } from "~/data/Character"

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

const getXpOptions = (setCharacter: SheetOptions["setCharacter"]): SheetOptions => ({
    mode: "xp",
    primaryColor: "grape",
    character: getEmptyCharacter(), // 0 experience => every upgrade is unaffordable
    setCharacter,
    canEdit: true,
    editDisabledReason: undefined,
    preferences: {},
    onUpdatePreferences: vi.fn()
})

afterEach(() => {
    cleanup()
    vi.useRealTimers()
})

describe("blocked pip click feedback", () => {
    it("shows the insufficient-XP reason on click, without a hover, and stays clickable", async () => {
        const user = userEvent.setup()
        const setCharacter = vi.fn()

        render(
            <MantineProvider>
                <Pips
                    level={0}
                    maxLevel={5}
                    options={getXpOptions(setCharacter)}
                    field="skills.brawl"
                />
            </MantineProvider>
        )

        const pips = screen.getAllByRole("button")
        // The pip must remain clickable so the click can surface the reason; a truly
        // disabled button would swallow the click and only reveal the reason on hover.
        expect(pips[0]).not.toBeDisabled()
        expect(screen.queryByText(/Insufficient XP/)).not.toBeInTheDocument()

        await user.click(pips[0])

        expect(setCharacter).not.toHaveBeenCalled()
        // The reason must render as body text (a <p>), not only inside a hover tooltip.
        const matches = await screen.findAllByText(/Insufficient XP/)
        expect(matches.some((element) => element.tagName === "P")).toBe(true)
    })

    it("removes the blocked warning after a short delay", async () => {
        vi.useFakeTimers()
        const setCharacter = vi.fn()

        render(
            <MantineProvider>
                <Pips
                    level={0}
                    maxLevel={5}
                    options={getXpOptions(setCharacter)}
                    field="skills.brawl"
                />
            </MantineProvider>
        )

        fireEvent.click(screen.getAllByRole("button")[0])
        expect(screen.getByText(/Insufficient XP/)).toBeInTheDocument()

        act(() => vi.advanceTimersByTime(2_500))

        expect(screen.queryByText(/Insufficient XP/)).not.toBeInTheDocument()
    })

    it("lowers a trait in XP mode and refunds the spent XP instead of blocking", async () => {
        const user = userEvent.setup()
        const setCharacter = vi.fn()
        const character = getEmptyCharacter()
        character.experience = 100
        character.ephemeral.experienceSpent = 30
        character.skills.brawl = 2

        render(
            <MantineProvider>
                <Pips
                    level={2}
                    maxLevel={5}
                    options={{ ...getXpOptions(setCharacter), character }}
                    field="skills.brawl"
                />
            </MantineProvider>
        )

        const pips = screen.getAllByRole("button")
        // Clicking the top filled pip steps Brawl down from 2 to 1.
        await user.click(pips[1])

        expect(screen.queryByText("Cannot decrease in XP mode")).not.toBeInTheDocument()
        expect(setCharacter).toHaveBeenCalledTimes(1)

        const updater = setCharacter.mock.calls[0][0]
        const updated = updater(character)
        expect(updated.skills.brawl).toBe(1)
        // getSkillCost(2) = 6 comes back, so 30 spent drops to 24.
        expect(updated.ephemeral.experienceSpent).toBe(24)
    })

    it("does not let an XP refund push spent experience below zero", () => {
        const setCharacter = vi.fn()
        const character = getEmptyCharacter()
        character.experience = 100
        character.ephemeral.experienceSpent = 2
        character.skills.brawl = 2

        render(
            <MantineProvider>
                <Pips
                    level={2}
                    maxLevel={5}
                    options={{ ...getXpOptions(setCharacter), character }}
                    field="skills.brawl"
                />
            </MantineProvider>
        )

        fireEvent.click(screen.getAllByRole("button")[1])

        const updater = setCharacter.mock.calls[0][0]
        const updated = updater(character)
        expect(updated.ephemeral.experienceSpent).toBe(0)
    })
})
