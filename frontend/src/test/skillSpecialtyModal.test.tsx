import { MantineProvider } from "@mantine/core"
import { cleanup, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { SpecialtyModal } from "~/generator/components/SkillSpecialtyModal"
import { emptySkills } from "~/data/Skills"
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
        removeEventListener: vi.fn()
    }))
})

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
        expect(screen.getByRole("textbox", { name: "Academics specialty" })).toHaveValue(
            "history"
        )
        expect(screen.getByRole("textbox", { name: "Performance specialty" })).toHaveValue("")
        expect(screen.queryByRole("textbox", { name: "Craft specialty" })).not.toBeInTheDocument()
    })
})
