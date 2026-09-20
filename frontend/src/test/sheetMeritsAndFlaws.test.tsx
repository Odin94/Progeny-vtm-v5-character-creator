import { MantineProvider } from "@mantine/core"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import MeritsAndFlaws from "~/character_sheet/sections/MeritsAndFlaws"
import { getSheetMeritsAndFlaws } from "~/character_sheet/utils/meritsAndFlaws"
import { getBasicTestCharacter } from "./testUtils"
import { getMeritFlawCustomTextKey } from "~/utils/customText"
import type { Character } from "~/data/Character"

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

Object.defineProperty(window, "visualViewport", {
    writable: true,
    value: {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
    }
})

Object.defineProperty(document, "fonts", {
    writable: true,
    value: { addEventListener: vi.fn(), removeEventListener: vi.fn() }
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
                        canEdit: true,
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

    it("marks loresheet granted flaws in the sheet UI", () => {
        const character = {
            ...getBasicTestCharacter(),
            predatorType: {
                ...getBasicTestCharacter().predatorType,
                pickedMeritsAndFlaws: []
            },
            merits: [
                {
                    name: "Hand of the Heresy",
                    level: 2,
                    summary:
                        "Take a total of three dots among Allies, Herd, Mawla or Retainers to represent your role in the city's Heresy group. Also take the Dark Secret (Heresy) flaw.",
                    type: "merit" as const,
                    excludes: []
                }
            ],
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
                        canEdit: true,
                        preferences: {
                            colorTheme: null,
                            backgroundImage: null
                        },
                        onUpdatePreferences: vi.fn()
                    }}
                />
            </MantineProvider>
        )

        expect(screen.getByText("Dark Secret (Heresy)")).toBeInTheDocument()
        expect(screen.getByText("From loresheet")).toBeInTheDocument()
    })

    it("adds a custom note to a predator-type merit without changing its rules text", async () => {
        let character: Character = {
            ...getBasicTestCharacter(),
            predatorType: {
                name: "Osiris" as const,
                pickedDiscipline: "presence",
                pickedSpecialties: [],
                pickedMeritsAndFlaws: [
                    {
                        name: "Fame",
                        level: 3,
                        summary: "Known by a select subculture",
                        type: "merit" as const,
                        excludes: []
                    }
                ]
            },
            merits: [],
            flaws: []
        }
        const merit = character.predatorType.pickedMeritsAndFlaws[0]
        const setCharacter = (update: Character | ((current: Character) => Character)) => {
            character = typeof update === "function" ? update(character) : update
        }

        render(
            <MantineProvider>
                <MeritsAndFlaws
                    options={{
                        mode: "free",
                        primaryColor: "red",
                        character,
                        setCharacter,
                        canEdit: true,
                        preferences: { colorTheme: null, backgroundImage: null },
                        onUpdatePreferences: vi.fn()
                    }}
                />
            </MantineProvider>
        )

        fireEvent.change(screen.getByLabelText("Fame custom note"), {
            target: { value: "Known across Berlin" }
        })

        expect(merit.summary).toBe("Known by a select subculture")
        expect(character.customText.meritFlaws[getMeritFlawCustomTextKey(merit)]).toBe(
            "Known across Berlin"
        )
    })
})
