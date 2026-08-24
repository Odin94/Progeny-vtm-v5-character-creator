import { act, render } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ComponentProps } from "react"
import Generator from "~/generator/Generator"
import DisciplinesPicker from "~/generator/components/DisciplinesPicker"
import { getBasicTestCharacter } from "./testUtils"

const { renderDisciplinesPicker, renderPredatorTypePicker } = vi.hoisted(() => ({
    renderDisciplinesPicker: vi.fn(),
    renderPredatorTypePicker: vi.fn()
}))

vi.mock("~/generator/components/DisciplinesPicker", () => ({
    default: (props: ComponentProps<typeof DisciplinesPicker>) => {
        renderDisciplinesPicker(props)
        return null
    }
}))

vi.mock("~/generator/components/PredatorTypePicker", () => ({
    default: (props: { onPredatorTypeChanged: () => void; skipPredatorType: () => void }) => {
        renderPredatorTypePicker(props)
        return null
    }
}))

vi.mock("~/utils/analytics", () => ({
    trackEvent: vi.fn()
}))

describe("Generator discipline draft", () => {
    beforeEach(() => {
        renderDisciplinesPicker.mockClear()
        renderPredatorTypePicker.mockClear()
    })

    it("passes the rebuilt draft to the picker after a sheet power is removed", () => {
        const character = getBasicTestCharacter()
        const [removedPower, remainingPower] = character.disciplines

        render(
            <Generator
                character={{
                    ...character,
                    disciplines: [remainingPower]
                }}
                setCharacter={vi.fn()}
                selectedStep="disciplines"
                setSelectedStep={vi.fn()}
            />
        )

        expect(removedPower.level).toBe(1)
        expect(renderDisciplinesPicker).toHaveBeenCalledWith(
            expect.objectContaining({
                pickedPowers: [remainingPower],
                pickedPredatorTypePower: undefined
            })
        )
    })

    it("clears the persisted predator power draft when the predator type changes", () => {
        const character = getBasicTestCharacter()
        character.predatorType.pickedDiscipline = "potence"
        const { rerender } = render(
            <Generator
                character={character}
                setCharacter={vi.fn()}
                selectedStep="predator-type"
                setSelectedStep={vi.fn()}
            />
        )

        act(() => {
            renderPredatorTypePicker.mock.calls[0][0].onPredatorTypeChanged()
        })

        rerender(
            <Generator
                character={character}
                setCharacter={vi.fn()}
                selectedStep="disciplines"
                setSelectedStep={vi.fn()}
            />
        )

        expect(renderDisciplinesPicker).toHaveBeenLastCalledWith(
            expect.objectContaining({
                pickedPowers: [],
                pickedPredatorTypePower: undefined
            })
        )
    })

    it("preserves clan discipline picks when skipping an already-empty predator type", () => {
        const character = getBasicTestCharacter()
        character.predatorType = {
            name: "",
            pickedDiscipline: "",
            pickedSpecialties: [],
            pickedMeritsAndFlaws: []
        }
        const { rerender } = render(
            <Generator
                character={character}
                setCharacter={vi.fn()}
                selectedStep="predator-type"
                setSelectedStep={vi.fn()}
            />
        )

        act(() => {
            renderPredatorTypePicker.mock.calls[0][0].skipPredatorType()
        })

        rerender(
            <Generator
                character={character}
                setCharacter={vi.fn()}
                selectedStep="disciplines"
                setSelectedStep={vi.fn()}
            />
        )

        expect(renderDisciplinesPicker).toHaveBeenLastCalledWith(
            expect.objectContaining({ pickedPowers: character.disciplines })
        )
    })
})
