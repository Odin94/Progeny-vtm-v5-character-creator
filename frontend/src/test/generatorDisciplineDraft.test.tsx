import { render } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ComponentProps } from "react"
import Generator from "~/generator/Generator"
import DisciplinesPicker from "~/generator/components/DisciplinesPicker"
import { getBasicTestCharacter } from "./testUtils"

const { renderDisciplinesPicker } = vi.hoisted(() => ({
    renderDisciplinesPicker: vi.fn()
}))

vi.mock("~/generator/components/DisciplinesPicker", () => ({
    default: (props: ComponentProps<typeof DisciplinesPicker>) => {
        renderDisciplinesPicker(props)
        return null
    }
}))

vi.mock("~/utils/analytics", () => ({
    trackEvent: vi.fn()
}))

describe("Generator discipline draft", () => {
    beforeEach(() => {
        renderDisciplinesPicker.mockClear()
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
})
