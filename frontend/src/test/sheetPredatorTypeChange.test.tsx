import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { MantineProvider } from "@mantine/core"
import { useState } from "react"
import { getEmptyCharacter, type Character } from "~/data/Character"
import { disciplines, type Power } from "~/data/Disciplines"
import { changeSheetPredatorType } from "~/character_sheet/utils/changePredatorType"
import TopData from "~/character_sheet/sections/TopData"
import type { SheetOptions } from "~/character_sheet/CharacterSheet"
vi.stubGlobal(
    "ResizeObserver",
    class {
        observe() {}
        unobserve() {}
        disconnect() {}
    }
)
Element.prototype.scrollIntoView = vi.fn()
vi.mock("~/hooks/useHomebrew", () => ({ useCharacterHomebrew: () => ({ data: [] }) }))
vi.mock("~/utils/analytics", () => ({ trackEvent: vi.fn() }))
Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn(() => ({
        matches: false,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
    }))
})
const power = (
    discipline: string,
    name: string,
    level = 1,
    amalgamPrerequisites: Power["amalgamPrerequisites"] = []
): Power => ({ ...disciplines.auspex.powers[0], discipline, name, level, amalgamPrerequisites })
const nextPredator = {
    name: "Sandman",
    pickedDiscipline: "obfuscate",
    pickedSpecialties: [{ skill: "stealth" as const, name: "Break-ins" }],
    pickedMeritsAndFlaws: []
}
const hunter = (): Character => ({
    ...getEmptyCharacter(),
    clan: "Brujah",
    predatorType: {
        name: "Consensualist",
        pickedDiscipline: "auspex",
        pickedSpecialties: [],
        pickedMeritsAndFlaws: []
    },
    disciplineLevels: {
        "official:auspex": 1,
        "official:potence": 1,
        "official:presence": 1,
        "official:celerity": 1
    },
    disciplines: [
        power("potence", "Independent"),
        power("presence", "Dependent", 1, [{ discipline: "auspex", level: 1 }]),
        power("celerity", "Cascade", 1, [{ discipline: "presence", level: 1 }]),
        power("auspex", "Predator bonus")
    ]
})
describe("sheet predator changes", () => {
    it("preserves unrelated powers and cascades invalid amalgams", () => {
        const result = changeSheetPredatorType(hunter(), nextPredator)
        expect(result.disciplines.map((p) => p.name)).toEqual(["Independent"])
        expect(result.disciplineLevels).toEqual({ "official:potence": 1, "official:obfuscate": 1 })
    })
    it("keeps purchased dots and powers that still meet level requirements", () => {
        const current = hunter()
        current.disciplineLevels["official:auspex"] = 3
        current.disciplines = [
            power("auspex", "Retained"),
            power("auspex", "Now too high", 3),
            power("auspex", "Predator bonus")
        ]
        const result = changeSheetPredatorType(current, nextPredator)
        expect(result.disciplines.map((p) => p.name)).toEqual(["Retained"])
        expect(result.disciplineLevels["official:auspex"]).toBe(2)
    })
    it("does not remove any powers when the bonus discipline stays the same", () => {
        const current = hunter()
        expect(
            changeSheetPredatorType(current, { ...nextPredator, pickedDiscipline: "auspex" })
                .disciplines
        ).toEqual(current.disciplines)
    })
    it("preserves recent skills and sheet Humanity changes", () => {
        const current = hunter()
        current.skills.athletics = 5
        current.skills.stealth = 3
        current.humanity = 5
        const result = changeSheetPredatorType(current, nextPredator)
        expect(result.skills).toEqual(current.skills)
        expect(result.humanity).toBe(4)
    })
    it("uses the latest character when the memoized header has an older snapshot", () => {
        let result = hunter()
        function Harness() {
            const [character, setCharacter] = useState(result)
            result = character
            return (
                <>
                    <button
                        onClick={() =>
                            setCharacter((current) => ({
                                ...current,
                                skills: { ...current.skills, athletics: 5 }
                            }))
                        }
                    >
                        Edit skill
                    </button>
                    <TopData
                        options={
                            {
                                character,
                                setCharacter,
                                mode: "free",
                                primaryColor: "grape",
                                canEdit: true
                            } as SheetOptions
                        }
                    />
                </>
            )
        }
        render(
            <MantineProvider>
                <Harness />
            </MantineProvider>
        )
        fireEvent.click(screen.getByText("Edit skill"))
        fireEvent.click(screen.getByPlaceholderText("Select a predator type"))
        fireEvent.click(screen.getByRole("option", { name: "Sandman" }))
        fireEvent.click(screen.getByTestId("predator-type-confirm-button"))
        expect(result.skills.athletics).toBe(5)
        expect(result.disciplines.some((p) => p.name === "Independent")).toBe(true)
    })
})
