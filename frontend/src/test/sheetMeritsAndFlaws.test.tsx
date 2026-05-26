import { MantineProvider } from "@mantine/core"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import MeritsAndFlaws from "~/character_sheet/sections/MeritsAndFlaws"
import { getSheetMeritsAndFlaws } from "~/character_sheet/utils/meritsAndFlaws"
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

describe("sheet merits and flaws", () => {
    it("includes picked Osiris merits and flaws as predator type entries", () => {
        const character = {
            ...getBasicTestCharacter(),
            predatorType: {
                name: "Osiris" as const,
                pickedDiscipline: "presence",
                pickedSpecialties: [],
                pickedMeritsAndFlaws: [
                    {
                        name: "Fame",
                        level: 3,
                        summary: "",
                        type: "merit" as const,
                        excludes: []
                    },
                    {
                        name: "Enemies",
                        level: 2,
                        summary: "group of mortals that want to harm you",
                        type: "flaw" as const,
                        excludes: []
                    }
                ]
            },
            merits: [],
            flaws: []
        }

        const { merits, flaws } = getSheetMeritsAndFlaws(character)

        expect(merits).toEqual([
            {
                meritFlaw: character.predatorType.pickedMeritsAndFlaws[0],
                isFromPredatorType: true,
                isUpgradedFromPredatorType: false
            }
        ])
        expect(flaws).toEqual([
            {
                meritFlaw: character.predatorType.pickedMeritsAndFlaws[1],
                isFromPredatorType: true,
                isUpgradedFromPredatorType: false
            }
        ])
    })

    it("marks picked predator type entries in the sheet UI", () => {
        const character = {
            ...getBasicTestCharacter(),
            predatorType: {
                name: "Osiris" as const,
                pickedDiscipline: "presence",
                pickedSpecialties: [],
                pickedMeritsAndFlaws: [
                    {
                        name: "Fame",
                        level: 3,
                        summary: "",
                        type: "merit" as const,
                        excludes: []
                    },
                    {
                        name: "Enemies",
                        level: 2,
                        summary: "group of mortals that want to harm you",
                        type: "flaw" as const,
                        excludes: []
                    }
                ]
            },
            merits: [],
            flaws: []
        }

        render(
            <MantineProvider>
                <MeritsAndFlaws
                    options={{
                        mode: "play",
                        primaryColor: "red",
                        character,
                        setCharacter: vi.fn(),
                        diceModalOpened: false,
                        preferences: {
                            colorTheme: null,
                            backgroundImage: null
                        },
                        onUpdatePreferences: vi.fn()
                    }}
                />
            </MantineProvider>
        )

        expect(screen.getByText("Fame")).toBeInTheDocument()
        expect(screen.getByText("Enemies")).toBeInTheDocument()
        expect(screen.getAllByText("From predator type")).toHaveLength(2)
    })

    it("shows predator type upgrades as one effective sheet entry", () => {
        const character = {
            ...getBasicTestCharacter(),
            predatorType: {
                name: "Osiris" as const,
                pickedDiscipline: "presence",
                pickedSpecialties: [],
                pickedMeritsAndFlaws: [
                    {
                        name: "Fame",
                        level: 3,
                        summary: "",
                        type: "merit" as const,
                        excludes: []
                    }
                ]
            },
            merits: [
                {
                    name: "Fame",
                    level: 5,
                    summary: "1 - a select subculture loves you, 5 - you are well known globally",
                    type: "merit" as const,
                    excludes: []
                }
            ],
            flaws: []
        }

        const { merits } = getSheetMeritsAndFlaws(character)

        expect(merits).toEqual([
            {
                meritFlaw: character.merits[0],
                isFromPredatorType: true,
                isUpgradedFromPredatorType: true
            }
        ])
    })
})
