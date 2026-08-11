import { MantineProvider } from "@mantine/core"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import DisciplinesPicker from "~/generator/components/DisciplinesPicker"
import type { Power } from "~/data/Disciplines"
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

// jsdom lacks IntersectionObserver / ResizeObserver, used by Mantine's ScrollArea.
class MockObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
}
;(globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = MockObserver
;(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = MockObserver

afterEach(cleanup)

const power = (name: string, discipline: string): Power => ({
    name,
    discipline: discipline as Power["discipline"],
    level: 1,
    summary: "",
    description: "",
    dicePool: "",
    rouseChecks: 1,
    amalgamPrerequisites: []
})

const renderPicker = (pickedPowers: Power[], pickedPredatorTypePower?: Power) => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    return render(
        <QueryClientProvider client={queryClient}>
            <MantineProvider>
                <DisciplinesPicker
                    character={getBasicTestCharacter()}
                    setCharacter={vi.fn()}
                    nextStep={vi.fn()}
                    pickedPowers={pickedPowers}
                    setPickedPowers={vi.fn()}
                    pickedPredatorTypePower={pickedPredatorTypePower}
                    setPickedPredatorTypePower={vi.fn()}
                />
            </MantineProvider>
        </QueryClientProvider>
    )
}

describe("Disciplines confirm reason", () => {
    it("states what is still missing while Confirm is disabled", () => {
        renderPicker([])

        expect(screen.getByTestId("disciplines-confirm-button")).toBeDisabled()
        expect(screen.getByTestId("disciplines-confirm-reason")).toHaveTextContent(
            "Pick two clan disciplines"
        )
    })

    it("names the predator pick once the clan powers are complete", () => {
        renderPicker([
            power("A", "potence"),
            power("B", "potence"),
            power("C", "blood sorcery")
        ])

        expect(screen.getByTestId("disciplines-confirm-reason")).toHaveTextContent(
            "Pick predator type discipline"
        )
    })

    it("drops the reason line once every pick is made", () => {
        renderPicker(
            [power("A", "potence"), power("B", "potence"), power("C", "blood sorcery")],
            power("D", "auspex")
        )

        expect(screen.getByTestId("disciplines-confirm-button")).toBeEnabled()
        expect(screen.queryByTestId("disciplines-confirm-reason")).not.toBeInTheDocument()
    })
})
