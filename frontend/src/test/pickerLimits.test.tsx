import { MantineProvider } from "@mantine/core"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import AttributePicker from "~/generator/components/AttributePicker"
import SkillsPicker from "~/generator/components/SkillsPicker"
import type { AttributeSetting, SkillsSetting } from "~/generator/creatorDrafts"
import { getBasicTestCharacter } from "./testUtils"

const { renderSpecialtyModal } = vi.hoisted(() => ({ renderSpecialtyModal: vi.fn() }))

vi.mock("~/generator/components/SkillSpecialtyModal", () => ({
    SpecialtyModal: (props: { modalOpened: boolean }) => {
        renderSpecialtyModal(props)
        return null
    }
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
    it("opens the specialty dialog when confirming edited skills", () => {
        const nextStep = vi.fn()
        const character = getBasicTestCharacter()

        render(
            <MantineProvider>
                <SkillsPicker
                    character={character}
                    setCharacter={vi.fn()}
                    nextStep={nextStep}
                    pickedSkills={{
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
                    }}
                    setPickedSkills={vi.fn()}
                    pickedDistribution="Balanced"
                    setPickedDistribution={vi.fn()}
                />
            </MantineProvider>
        )

        fireEvent.click(screen.getByTestId("skills-confirm-button"))

        expect(renderSpecialtyModal).toHaveBeenLastCalledWith(
            expect.objectContaining({ modalOpened: true })
        )
        expect(nextStep).not.toHaveBeenCalled()
    })

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

    it("resets confirmed attributes on the character and clears the draft", () => {
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

        const { rerender } = render(
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

        expect(setPickedAttributes).toHaveBeenCalledWith({
            strongest: null,
            weakest: null,
            medium: []
        })
        expect(setCharacter).toHaveBeenCalledWith(
            expect.objectContaining({
                attributes: {
                    strength: 1,
                    dexterity: 1,
                    stamina: 1,
                    charisma: 1,
                    manipulation: 1,
                    composure: 1,
                    intelligence: 1,
                    wits: 1,
                    resolve: 1
                },
                maxHealth: 4,
                willpower: 2
            })
        )

        rerender(
            <MantineProvider>
                <AttributePicker
                    character={setCharacter.mock.calls[0][0]}
                    setCharacter={setCharacter}
                    nextStep={vi.fn()}
                    pickedAttributes={{ strongest: null, weakest: null, medium: [] }}
                    setPickedAttributes={setPickedAttributes}
                />
            </MantineProvider>
        )

        expect(screen.queryByRole("button", { name: "Reset attributes" })).not.toBeInTheDocument()
        expect(screen.queryByTestId("attributes-confirm-button")).not.toBeInTheDocument()
    })

    it("resets confirmed skills on the character and clears the draft", () => {
        const character = getBasicTestCharacter()
        character.skills.athletics = 3
        const setCharacter = vi.fn()
        const setPickedSkills = vi.fn()
        const setPickedDistribution = vi.fn()

        const { rerender } = render(
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

        expect(setPickedSkills).toHaveBeenCalledWith({
            special: [],
            strongest: [],
            decent: [],
            acceptable: []
        })
        expect(setPickedDistribution).toHaveBeenCalledWith(null)
        expect(setCharacter).toHaveBeenCalledWith(
            expect.objectContaining({
                skillSpecialties: [],
                skills: expect.objectContaining({ athletics: 0 })
            })
        )
        const resetCharacter = setCharacter.mock.calls[0][0]
        expect(Object.values(resetCharacter.skills)).toSatisfy((skills) =>
            skills.every((level: number) => level === 0)
        )

        rerender(
            <MantineProvider>
                <SkillsPicker
                    character={resetCharacter}
                    setCharacter={setCharacter}
                    nextStep={vi.fn()}
                    pickedSkills={{ special: [], strongest: [], decent: [], acceptable: [] }}
                    setPickedSkills={setPickedSkills}
                    pickedDistribution={null}
                    setPickedDistribution={setPickedDistribution}
                />
            </MantineProvider>
        )

        expect(screen.queryByRole("button", { name: "Reset skills" })).not.toBeInTheDocument()
        expect(screen.queryByTestId("skills-confirm-button")).not.toBeInTheDocument()
    })
})
