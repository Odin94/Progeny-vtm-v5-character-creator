import { MantineProvider } from "@mantine/core"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import Disciplines from "~/character_sheet/sections/Disciplines"
import Skills from "~/character_sheet/sections/Skills"
import { getDisciplinePowerCustomTextKey, getSkillSpecialtyCustomTextKey } from "~/utils/customText"
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

const freeOptions = (character: ReturnType<typeof getBasicTestCharacter>, setCharacter: any) => ({
    mode: "free" as const,
    primaryColor: "grape",
    character,
    setCharacter,
    canEdit: true,
    preferences: { colorTheme: null, backgroundImage: null },
    onUpdatePreferences: vi.fn()
})

describe("static text notes", () => {
    it("adds a custom note to a predator-type specialty without renaming it", async () => {
        let character = getBasicTestCharacter()
        const specialty = character.predatorType.pickedSpecialties[0]
        const setCharacter = (update: typeof character | ((current: typeof character) => typeof character)) => {
            character = typeof update === "function" ? update(character) : update
        }

        const { rerender } = render(
            <MantineProvider>
                <Skills options={freeOptions(character, setCharacter)} />
            </MantineProvider>
        )

        expect(screen.queryByLabelText("Medicine Anesthetics custom note")).not.toBeInTheDocument()
        fireEvent.click(screen.getByText("Anesthetics"))
        expect(screen.getByLabelText("Medicine Anesthetics custom note")).toBeInTheDocument()
        fireEvent.change(screen.getByLabelText("Medicine Anesthetics custom note"), {
            target: { value: "Only works in a prepared clinic" }
        })
        rerender(
            <MantineProvider>
                <Skills options={freeOptions(character, setCharacter)} />
            </MantineProvider>
        )
        fireEvent.click(screen.getByText("Anesthetics"))
        expect(screen.queryByLabelText("Medicine Anesthetics custom note")).not.toBeInTheDocument()
        fireEvent.click(screen.getByText("Anesthetics"))
        expect(screen.getByLabelText("Medicine Anesthetics custom note")).toBeInTheDocument()
        fireEvent.keyDown(screen.getByLabelText("Medicine Anesthetics custom note"), {
            key: "Enter"
        })

        expect(specialty.name).toBe("Anesthetics")
        expect(
            character.customText.skillSpecialties[getSkillSpecialtyCustomTextKey(specialty)]
        ).toBe("Only works in a prepared clinic")
        expect(screen.queryByLabelText("Medicine Anesthetics custom note")).not.toBeInTheDocument()
    })

    it("adds a custom note to an official discipline power without changing its summary", async () => {
        let character = getBasicTestCharacter()
        const power = character.disciplines[0]
        const setCharacter = (update: typeof character | ((current: typeof character) => typeof character)) => {
            character = typeof update === "function" ? update(character) : update
        }

        render(
            <MantineProvider>
                <Disciplines options={freeOptions(character, setCharacter)} />
            </MantineProvider>
        )

        expect(screen.queryByLabelText("Prowess custom note")).not.toBeInTheDocument()
        fireEvent.click(screen.getByLabelText("Edit Prowess custom note"))
        fireEvent.change(screen.getByLabelText("Prowess custom note"), {
            target: { value: "Applies while enraged" }
        })

        expect(power.summary).toBe("Test prowess power")
        expect(character.customText.disciplinePowers[getDisciplinePowerCustomTextKey(power)]).toBe(
            "Applies while enraged"
        )
    })
})
