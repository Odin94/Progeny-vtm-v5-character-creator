import { MantineProvider } from "@mantine/core"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import AttributePicker from "~/generator/components/AttributePicker"
import SkillsPicker from "~/generator/components/SkillsPicker"
import type { AttributeSetting, SkillsSetting } from "~/generator/creatorDrafts"
import { getBasicTestCharacter } from "./testUtils"

vi.mock("~/generator/components/SkillSpecialtyModal", () => ({
    SpecialtyModal: () => null
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

afterEach(cleanup)

describe("creator picker limits", () => {
    it("prevents extra attribute picks while leaving assigned attributes removable", () => {
        const pickedAttributes: AttributeSetting = {
            strongest: "strength",
            weakest: "charisma",
            medium: ["dexterity", "stamina", "composure"]
        }
        const character = getBasicTestCharacter()
        character.attributes = {
            ...character.attributes,
            strength: 4,
            charisma: 1,
            dexterity: 3,
            stamina: 3,
            composure: 3
        }

        render(
            <MantineProvider>
                <AttributePicker
                    character={character}
                    setCharacter={vi.fn()}
                    nextStep={vi.fn()}
                    pickedAttributes={pickedAttributes}
                    setPickedAttributes={vi.fn()}
                />
            </MantineProvider>
        )

        expect(screen.getByTestId("attribute-intelligence-button")).toBeDisabled()
        expect(screen.getByTestId("attribute-strength-button")).toBeEnabled()
    })

    it("prevents extra skill picks while leaving assigned skills removable", () => {
        const pickedSkills: SkillsSetting = {
            special: [],
            strongest: ["athletics", "brawl", "craft"],
            decent: ["drive", "firearms", "melee", "larceny", "stealth"],
            acceptable: [
                "animal ken",
                "etiquette",
                "insight",
                "intimidation",
                "leadership",
                "performance",
                "survival"
            ]
        }
        const character = getBasicTestCharacter()
        pickedSkills.strongest.forEach((skill) => (character.skills[skill] = 3))
        pickedSkills.decent.forEach((skill) => (character.skills[skill] = 2))
        pickedSkills.acceptable.forEach((skill) => (character.skills[skill] = 1))

        render(
            <MantineProvider>
                <SkillsPicker
                    character={character}
                    setCharacter={vi.fn()}
                    nextStep={vi.fn()}
                    pickedSkills={pickedSkills}
                    setPickedSkills={vi.fn()}
                    pickedDistribution="Balanced"
                    setPickedDistribution={vi.fn()}
                />
            </MantineProvider>
        )

        expect(screen.getByTestId("skill-academics-button")).toBeDisabled()
        expect(screen.getByTestId("skill-athletics-button")).toBeEnabled()
    })

    it("resets confirmed attribute picks without changing the character", () => {
        const character = getBasicTestCharacter()
        character.attributes = {
            ...character.attributes,
            strength: 4,
            charisma: 1,
            dexterity: 3,
            stamina: 3,
            composure: 3
        }
        const setCharacter = vi.fn()
        const setPickedAttributes = vi.fn()

        render(
            <MantineProvider>
                <AttributePicker
                    character={character}
                    setCharacter={setCharacter}
                    nextStep={vi.fn()}
                    pickedAttributes={{
                        strongest: "strength",
                        weakest: "charisma",
                        medium: ["dexterity", "stamina", "composure"]
                    }}
                    setPickedAttributes={setPickedAttributes}
                />
            </MantineProvider>
        )

        fireEvent.click(screen.getByRole("button", { name: "Reset attributes" }))

        expect(setCharacter).not.toHaveBeenCalled()
        expect(setPickedAttributes).toHaveBeenCalledWith({
            strongest: null,
            weakest: null,
            medium: []
        })
    })

    it("resets confirmed skill picks without changing the character", () => {
        const character = getBasicTestCharacter()
        character.skills.athletics = 3
        const setCharacter = vi.fn()
        const setPickedSkills = vi.fn()
        const setPickedDistribution = vi.fn()

        render(
            <MantineProvider>
                <SkillsPicker
                    character={character}
                    setCharacter={setCharacter}
                    nextStep={vi.fn()}
                    pickedSkills={{ special: [], strongest: ["athletics"], decent: [], acceptable: [] }}
                    setPickedSkills={setPickedSkills}
                    pickedDistribution="Balanced"
                    setPickedDistribution={setPickedDistribution}
                />
            </MantineProvider>
        )

        fireEvent.click(screen.getByRole("button", { name: "Reset skills" }))

        expect(setCharacter).not.toHaveBeenCalled()
        expect(setPickedSkills).toHaveBeenCalledWith({
            special: [],
            strongest: [],
            decent: [],
            acceptable: []
        })
        expect(setPickedDistribution).toHaveBeenCalledWith(null)
    })
})
