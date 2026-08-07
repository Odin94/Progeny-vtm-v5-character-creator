import { MantineProvider } from "@mantine/core"
import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { Character } from "~/data/Character"
import ClanPicker from "~/generator/components/ClanPicker"
import DisciplinesPicker from "~/generator/components/DisciplinesPicker"
import { getBasicTestCharacter } from "./testUtils"

// Homebrew resolves to an empty set of collections so these render against official data only —
// the crashes reproduced here do not need homebrew content, only a clan whose official record
// omits `excludedPredatorTypes` and a predator-type discipline the official map can't resolve.
vi.mock("~/hooks/useHomebrew", () => ({
    useCharacterHomebrew: () => ({ data: [] })
}))

vi.mock("~/utils/analytics", () => ({
    trackEvent: vi.fn()
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

Object.defineProperty(document, "fonts", {
    writable: true,
    value: { addEventListener: vi.fn(), removeEventListener: vi.fn() }
})

globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
}

afterEach(cleanup)

describe("Generator unguarded clan/discipline lookups", () => {
    it("selects a clan whose official record omits excludedPredatorTypes without throwing", async () => {
        const user = userEvent.setup()
        const setCharacter = vi.fn()
        const nextStep = vi.fn()

        // Brujah (like most clans) has no `excludedPredatorTypes`, so the old
        // `clans[clan].excludedPredatorTypes.includes(...)` dereferenced undefined on click.
        render(
            <MantineProvider>
                <ClanPicker
                    character={getBasicTestCharacter()}
                    setCharacter={setCharacter}
                    nextStep={nextStep}
                />
            </MantineProvider>
        )

        await user.click(screen.getByTestId("clan-brujah-card"))

        expect(nextStep).toHaveBeenCalledTimes(1)
        // The picked predator type is kept because the clan excludes nothing.
        expect(setCharacter).toHaveBeenCalledWith(
            expect.objectContaining({ predatorType: getBasicTestCharacter().predatorType })
        )
    })

    it("renders the disciplines step when the predator-type discipline can't be resolved", () => {
        const character: Character = {
            ...getBasicTestCharacter(),
            clan: "Brujah",
            predatorType: {
                ...getBasicTestCharacter().predatorType,
                // A discipline name that exists in neither the official map nor the clan options,
                // e.g. left dangling by homebrew content or a clan change. Previously this made
                // `disciplines[...]` return undefined and the predator accordion threw on render.
                pickedDiscipline: "some-unresolvable-discipline" as never
            }
        }

        expect(() =>
            render(
                <MantineProvider>
                    <DisciplinesPicker
                        character={character}
                        setCharacter={vi.fn()}
                        nextStep={vi.fn()}
                        pickedPowers={[]}
                        setPickedPowers={vi.fn()}
                        pickedPredatorTypePower={undefined}
                        setPickedPredatorTypePower={vi.fn()}
                    />
                </MantineProvider>
            )
        ).not.toThrow()

        // The step still renders; the predator-type accordion is simply skipped.
        expect(screen.getByText("Disciplines")).toBeInTheDocument()
    })
})
