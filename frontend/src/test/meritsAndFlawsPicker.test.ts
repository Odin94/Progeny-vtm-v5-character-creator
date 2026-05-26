import { describe, expect, it } from "vitest"
import {
    adjustPickedMeritsAndFlawsForPredatorTypeChange,
    getMeritFlawPointCost,
    getPredatorTypeMeritsByName,
    getResolvedMeritsAndFlaws
} from "~/data/meritsAndFlawsResolution"
import { getBasicTestCharacter } from "./testUtils"

describe("MeritsAndFlawsPicker predator type merits and flaws", () => {
    it("maps selectable Osiris merits and flaws to the catalog picker names", () => {
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

        const predatorTypeMeritsByName = getPredatorTypeMeritsByName(character)

        expect(predatorTypeMeritsByName.get("Fame")).toMatchObject({
            name: "Fame",
            level: 3
        })
        expect(predatorTypeMeritsByName.get("Enemy")).toMatchObject({
            name: "Enemies",
            level: 2
        })
    })

    it("maps automatic predator type plural names to the catalog picker names", () => {
        const character = {
            ...getBasicTestCharacter(),
            predatorType: {
                ...getBasicTestCharacter().predatorType,
                name: "Montero" as const,
                pickedMeritsAndFlaws: []
            }
        }

        expect(getPredatorTypeMeritsByName(character).get("Retainer")).toMatchObject({
            name: "Retainers",
            level: 2
        })
    })

    it("charges only the upgrade delta for predator type merits", () => {
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

        const predatorTypeMeritsByName = getPredatorTypeMeritsByName(character)

        expect(getMeritFlawPointCost(character.merits[0], predatorTypeMeritsByName)).toBe(2)
        expect(getResolvedMeritsAndFlaws(character).merits).toEqual([
            {
                meritFlaw: character.merits[0],
                isFromPredatorType: true,
                isUpgradedFromPredatorType: true
            }
        ])
    })

    it("adds predator type grants together before applying later upgrades", () => {
        const character = {
            ...getBasicTestCharacter(),
            predatorType: {
                name: "Trapdoor" as const,
                pickedDiscipline: "obfuscate",
                pickedSpecialties: [],
                pickedMeritsAndFlaws: [
                    {
                        name: "Haven",
                        level: 1,
                        summary: "A secure apartment",
                        type: "merit" as const,
                        excludes: ["No Haven"]
                    }
                ]
            },
            merits: [],
            flaws: []
        }

        expect(getResolvedMeritsAndFlaws(character).merits).toEqual([
            {
                meritFlaw: {
                    name: "Haven",
                    level: 2,
                    summary: "Secure Apartment",
                    type: "merit",
                    excludes: ["No Haven"]
                },
                isFromPredatorType: true,
                isUpgradedFromPredatorType: false
            }
        ])
    })

    it("downgrades upgraded merits when changing away from their predator type grant", () => {
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

        expect(
            adjustPickedMeritsAndFlawsForPredatorTypeChange(character, {
                name: "Sandman",
                pickedDiscipline: "auspex",
                pickedSpecialties: [],
                pickedMeritsAndFlaws: []
            })
        ).toEqual({
            merits: [
                {
                    ...character.merits[0],
                    level: 2
                }
            ],
            flaws: []
        })
    })

    it("removes fully predator-covered picks when that predator type grant is lost", () => {
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
                    level: 3,
                    summary: "1 - a select subculture loves you",
                    type: "merit" as const,
                    excludes: []
                }
            ],
            flaws: []
        }

        expect(
            adjustPickedMeritsAndFlawsForPredatorTypeChange(character, {
                name: "Sandman",
                pickedDiscipline: "auspex",
                pickedSpecialties: [],
                pickedMeritsAndFlaws: []
            })
        ).toEqual({
            merits: [],
            flaws: []
        })
    })

    it("keeps upgraded merits unchanged when the same predator type grant remains", () => {
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

        expect(
            adjustPickedMeritsAndFlawsForPredatorTypeChange(character, {
                ...character.predatorType,
                pickedSpecialties: [
                    {
                        skill: "performance",
                        name: "Sermons"
                    }
                ]
            })
        ).toEqual({
            merits: character.merits,
            flaws: []
        })
    })
})
