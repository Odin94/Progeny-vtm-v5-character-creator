import { MantineProvider } from "@mantine/core"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import DiceRollModal from "~/character_sheet/components/diceRollModal/DiceRollModal"
import { calculateDicePoolValues } from "~/character_sheet/components/DisciplinePowerCard"
import SelectedDicePoolDisplay from "~/character_sheet/components/diceRollModal/parts/SelectedDicePoolDisplay"
import { useCharacterSheetStore } from "~/character_sheet/stores/characterSheetStore"
import { useDiceRollModalStore } from "~/character_sheet/stores/diceRollModalStore"
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

describe("SelectedDicePoolDisplay", () => {
    beforeEach(() => {
        useCharacterSheetStore.getState().resetSelectedDicePool()
        useDiceRollModalStore.getState().reset()
    })

    it("shows selected pool badges and dice bonus controls in the expanded card", () => {
        const character = getBasicTestCharacter()
        useCharacterSheetStore.getState().updateSelectedDicePool({
            attribute: "strength",
            skill: "brawl"
        })

        render(
            <MantineProvider>
                <SelectedDicePoolDisplay
                    character={character}
                    primaryColor="red"
                    skillSpecialties={[]}
                />
            </MantineProvider>
        )

        expect(
            screen.getAllByText((_, element) => element?.textContent === "Strength: 3").length
        ).toBeGreaterThan(0)
        expect(
            screen.getAllByText((_, element) => element?.textContent === "Brawl: 1").length
        ).toBeGreaterThan(0)
        expect(screen.getByLabelText("Blood Surge (+2 dice)")).toBeInTheDocument()
    })

    it("opens the dice-pool guidance tooltip when its info button is tapped", async () => {
        const user = userEvent.setup()

        render(
            <MantineProvider>
                <SelectedDicePoolDisplay
                    character={getBasicTestCharacter()}
                    primaryColor="red"
                    skillSpecialties={[]}
                />
            </MantineProvider>
        )

        await user.click(screen.getByRole("button", { name: "How to select a dice pool" }))

        expect(
            await screen.findByText(
                "You can click Attributes, Skills, or Disciplines on the character sheet to determine your dice pool"
            )
        ).toBeInTheDocument()
    })

    it("shows blood potency discipline bonus on selected discipline badges", async () => {
        const character = {
            ...getBasicTestCharacter(),
            bloodPotency: 7,
            disciplines: [
                {
                    name: "Cloud Memory",
                    discipline: "dominate" as const,
                    level: 1,
                    summary: "",
                    description: "",
                    dicePool: "",
                    rouseChecks: 0,
                    amalgamPrerequisites: []
                },
                {
                    name: "Mesmerize",
                    discipline: "dominate" as const,
                    level: 2,
                    summary: "",
                    description: "",
                    dicePool: "",
                    rouseChecks: 0,
                    amalgamPrerequisites: []
                }
            ],
            disciplineLevels: { "official:dominate": 2 }
        }
        useCharacterSheetStore.getState().updateSelectedDicePool({
            attribute: "strength",
            discipline: "dominate"
        })

        render(
            <MantineProvider>
                <SelectedDicePoolDisplay
                    character={character}
                    primaryColor="red"
                    skillSpecialties={[]}
                />
            </MantineProvider>
        )

        const disciplineBadge = screen.getAllByText(
            (_, element) => element?.textContent === "Dominate: 2 (+2)"
        )[0]

        expect(disciplineBadge).toBeInTheDocument()

        await userEvent.hover(disciplineBadge)

        expect(await screen.findByText("+2 from blood potency")).toBeInTheDocument()
    })

    it("adds blood potency discipline bonus to selected discipline roll totals", () => {
        const character = {
            ...getBasicTestCharacter(),
            bloodPotency: 7,
            attributes: {
                ...getBasicTestCharacter().attributes,
                strength: 2
            },
            disciplines: [
                {
                    name: "Cloud Memory",
                    discipline: "dominate" as const,
                    level: 1,
                    summary: "",
                    description: "",
                    dicePool: "",
                    rouseChecks: 0,
                    amalgamPrerequisites: []
                },
                {
                    name: "Mesmerize",
                    discipline: "dominate" as const,
                    level: 2,
                    summary: "",
                    description: "",
                    dicePool: "",
                    rouseChecks: 0,
                    amalgamPrerequisites: []
                }
            ],
            disciplineLevels: { "official:dominate": 2 }
        }
        useCharacterSheetStore.getState().updateSelectedDicePool({
            attribute: "strength",
            discipline: "dominate"
        })
        useDiceRollModalStore.getState().openSelectedPool()

        render(
            <MantineProvider>
                <DiceRollModal primaryColor="red" character={character} />
            </MantineProvider>
        )

        expect(screen.getByRole("button", { name: "Roll 6 dice" })).toBeInTheDocument()
    })

    it("resolves Homebrew discipline ratings by name in power cards and selected rolls", () => {
        const character = {
            ...getBasicTestCharacter(),
            attributes: {
                ...getBasicTestCharacter().attributes,
                strength: 2
            },
            disciplines: [
                {
                    name: "Ancient Whispers",
                    discipline: "Heartsong" as never,
                    level: 1,
                    summary: "",
                    description: "",
                    dicePool: "Resolve + Heartsong",
                    rouseChecks: 0,
                    amalgamPrerequisites: []
                },
                {
                    name: "Mutated Flesh",
                    discipline: "Heartsong" as never,
                    level: 2,
                    summary: "",
                    description: "",
                    dicePool: "Strength + Heartsong",
                    rouseChecks: 0,
                    amalgamPrerequisites: []
                }
            ],
            disciplineLevels: { "official:Heartsong": 2 }
        }
        useCharacterSheetStore.getState().updateSelectedDicePool({
            attribute: "strength",
            discipline: "heartsong" as never
        })
        useDiceRollModalStore.getState().openSelectedPool()

        expect(calculateDicePoolValues("Resolve + Heartsong", character)).toBe("2 + 2")

        render(
            <MantineProvider>
                <DiceRollModal primaryColor="red" character={character} />
            </MantineProvider>
        )

        expect(screen.getByRole("button", { name: "Roll 4 dice" })).toBeInTheDocument()
    })
})
