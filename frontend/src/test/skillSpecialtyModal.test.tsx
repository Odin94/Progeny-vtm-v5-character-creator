import { MantineProvider } from "@mantine/core"
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { SpecialtyModal } from "~/generator/components/SkillSpecialtyModal"
import { emptySkills } from "~/data/Skills"
import { getBasicTestCharacter } from "./testUtils"

vi.mock("~/utils/analytics", () => ({ trackEvent: vi.fn() }))

Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
    }))
})

vi.stubGlobal(
    "ResizeObserver",
    class {
        observe() {}
        unobserve() {}
        disconnect() {}
    }
)

afterEach(cleanup)

describe("SkillSpecialtyModal", () => {
    it("preserves the free specialty and only restores eligible bonus specialties", async () => {
        const character = getBasicTestCharacter()
        character.skillSpecialties = [
            { skill: "athletics", name: "climbing" },
            { skill: "academics", name: "history" },
            { skill: "craft", name: "sculpture" }
        ]

        render(
            <MantineProvider>
                <SpecialtyModal
                    modalOpened
                    closeModal={vi.fn()}
                    onBack={vi.fn()}
                    character={character}
                    pickedSkillNames={["academics", "performance"]}
                    skills={emptySkills}
                    setCharacter={vi.fn()}
                    nextStep={vi.fn()}
                />
            </MantineProvider>
        )

        await waitFor(() => {
            expect(screen.getByRole("textbox", { name: "Free specialty name" })).toHaveValue(
                "climbing"
            )
        })
        expect(screen.getByRole("combobox", { name: "Free specialty skill" })).toHaveValue(
            "Athletics"
        )
        expect(screen.getByRole("textbox", { name: "Academics specialty" })).toHaveValue("history")
        expect(screen.getByRole("textbox", { name: "Performance specialty" })).toHaveValue("")
        expect(screen.queryByRole("textbox", { name: "Craft specialty" })).not.toBeInTheDocument()
    })

    it("keeps edits across parent renders and restores saved values when reopened", async () => {
        const user = userEvent.setup()
        const character = getBasicTestCharacter()
        character.skillSpecialties = []
        const setCharacter = vi.fn()
        const modal = (opened: boolean) => (
            <MantineProvider env="test">
                <SpecialtyModal
                    modalOpened={opened}
                    closeModal={vi.fn()}
                    onBack={vi.fn()}
                    character={{ ...character, skillSpecialties: [...character.skillSpecialties] }}
                    pickedSkillNames={["athletics", "brawl", "academics"]}
                    skills={emptySkills}
                    setCharacter={setCharacter}
                    nextStep={vi.fn()}
                />
            </MantineProvider>
        )
        const { rerender } = render(modal(true))
        await user.click(screen.getByRole("combobox", { name: "Free specialty skill" }))
        await user.click(await screen.findByRole("option", { name: "Athletics" }))
        await user.type(screen.getByRole("textbox", { name: "Free specialty name" }), "Climbing")
        await user.type(screen.getByRole("textbox", { name: "Academics specialty" }), "History")

        rerender(modal(true))
        expect(screen.getByRole("combobox", { name: "Free specialty skill" })).toHaveValue(
            "Athletics"
        )
        expect(screen.getByRole("textbox", { name: "Free specialty name" })).toHaveValue("Climbing")
        expect(screen.getByRole("textbox", { name: "Academics specialty" })).toHaveValue("History")
        await user.click(screen.getByTestId("skill-specialty-confirm-button"))
        expect(setCharacter).toHaveBeenCalledWith(
            expect.objectContaining({
                skillSpecialties: [
                    { skill: "athletics", name: "climbing" },
                    { skill: "academics", name: "history" }
                ]
            })
        )

        character.skillSpecialties = [{ skill: "brawl", name: "grappling" }]
        rerender(modal(false))
        rerender(modal(true))
        expect(screen.getByRole("combobox", { name: "Free specialty skill" })).toHaveValue("Brawl")
        expect(screen.getByRole("textbox", { name: "Free specialty name" })).toHaveValue(
            "grappling"
        )
        expect(screen.getByRole("textbox", { name: "Academics specialty" })).toHaveValue("")
    })

    it("keeps the modal open when the overlay is tapped, so the pick is not reverted", async () => {
        const closeModal = vi.fn()

        const { baseElement } = render(
            <MantineProvider>
                <SpecialtyModal
                    modalOpened
                    closeModal={closeModal}
                    onBack={closeModal}
                    character={getBasicTestCharacter()}
                    pickedSkillNames={["athletics"]}
                    skills={emptySkills}
                    setCharacter={vi.fn()}
                    nextStep={vi.fn()}
                />
            </MantineProvider>
        )

        const overlay = baseElement.querySelector(".mantine-Overlay-root")
        expect(overlay).not.toBeNull()
        fireEvent.click(overlay!)

        expect(closeModal).not.toHaveBeenCalled()
    })

    it("closes and reverts the pick when the Back button is pressed", async () => {
        const closeModal = vi.fn()

        render(
            <MantineProvider>
                <SpecialtyModal
                    modalOpened
                    closeModal={closeModal}
                    onBack={closeModal}
                    character={getBasicTestCharacter()}
                    pickedSkillNames={["athletics"]}
                    skills={emptySkills}
                    setCharacter={vi.fn()}
                    nextStep={vi.fn()}
                />
            </MantineProvider>
        )

        fireEvent.click(screen.getByRole("button", { name: "Back" }))

        expect(closeModal).toHaveBeenCalledTimes(1)
    })
})
