import { MantineProvider } from "@mantine/core"
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import SkillsPicker from "~/generator/components/SkillsPicker"
import type { SkillsSetting } from "~/generator/creatorDrafts"
import { getEmptyCharacter } from "~/data/Character"

vi.mock("~/utils/analytics", () => ({ trackEvent: vi.fn() }))
Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
        matches: false,
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

const initialSelection: SkillsSetting = {
    special: ["athletics"],
    strongest: ["brawl", "craft", "drive"],
    decent: ["firearms", "larceny", "melee"],
    acceptable: ["stealth", "survival"]
}

function Harness({ nextStep }: { nextStep: () => void }) {
    const [character, setCharacter] = useState(getEmptyCharacter)
    const [pickedSkills, setPickedSkills] = useState(initialSelection)
    return (
        <MantineProvider env="test">
            <SkillsPicker
                character={character}
                setCharacter={setCharacter}
                nextStep={nextStep}
                pickedSkills={pickedSkills}
                setPickedSkills={setPickedSkills}
                pickedDistribution="Specialist"
                setPickedDistribution={vi.fn()}
            />
            <output data-testid="draft-selection">{JSON.stringify(pickedSkills)}</output>
            <output data-testid="saved-character">{JSON.stringify(character)}</output>
        </MantineProvider>
    )
}

describe("SkillsPicker specialties", () => {
    it("keeps the final pick on outside taps and Confirm, and saves the selected specialty", async () => {
        const user = userEvent.setup()
        const nextStep = vi.fn()
        const { baseElement } = render(<Harness nextStep={nextStep} />)
        await user.click(screen.getByTestId("skill-animal-ken-button"))
        await user.click(screen.getByRole("combobox", { name: "Free specialty skill" }))
        await user.click(await screen.findByRole("option", { name: "Athletics" }))
        await user.type(screen.getByRole("textbox", { name: "Free specialty name" }), "Climbing")
        await user.click(baseElement.querySelector(".mantine-Overlay-root")!)
        expect(screen.getByRole("textbox", { name: "Free specialty name" })).toHaveValue("Climbing")
        expect(screen.getByTestId("draft-selection")).toHaveTextContent("animal ken")

        await user.click(screen.getByTestId("skill-specialty-confirm-button"))
        expect(nextStep).toHaveBeenCalledOnce()
        expect(JSON.parse(screen.getByTestId("draft-selection").textContent!).acceptable).toEqual([
            "stealth",
            "survival",
            "animal ken"
        ])
        const saved = JSON.parse(screen.getByTestId("saved-character").textContent!)
        expect(saved.skills["animal ken"]).toBe(1)
        expect(saved.skillSpecialties).toContainEqual({ skill: "athletics", name: "climbing" })
    })

    it("undoes only the last pick on Back without saving or advancing", async () => {
        const nextStep = vi.fn()
        render(<Harness nextStep={nextStep} />)
        fireEvent.click(screen.getByTestId("skill-animal-ken-button"))
        fireEvent.click(await screen.findByRole("button", { name: "Back" }))
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
        expect(JSON.parse(screen.getByTestId("draft-selection").textContent!)).toEqual(
            initialSelection
        )
        expect(
            JSON.parse(screen.getByTestId("saved-character").textContent!).skills["animal ken"]
        ).toBe(0)
        expect(nextStep).not.toHaveBeenCalled()
    })
})
