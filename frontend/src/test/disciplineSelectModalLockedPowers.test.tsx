import { MantineProvider } from "@mantine/core"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import DisciplineSelectModal from "~/character_sheet/components/DisciplineSelectModal"
import type { SheetOptions } from "~/character_sheet/CharacterSheet"
import { disciplines } from "~/data/Disciplines"
import { getBasicTestCharacter } from "./testUtils"

const capture = vi.fn()
vi.mock("posthog-js", () => ({
    default: {
        capture: (...args: unknown[]) => capture(...args)
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

class MockObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
}
;(globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = MockObserver
;(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = MockObserver

afterEach(() => {
    cleanup()
    capture.mockClear()
})

const renderModal = () => {
    const character = getBasicTestCharacter()
    // Celerity at level 1: one power owned, so the next reachable level is 2.
    character.disciplines = [disciplines.celerity.powers[0]]

    const options = {
        mode: "xp",
        primaryColor: "grape",
        character,
        setCharacter: vi.fn()
    } as unknown as SheetOptions

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    return render(
        <QueryClientProvider client={queryClient}>
            <MantineProvider>
                <DisciplineSelectModal
                    opened
                    onClose={vi.fn()}
                    options={options}
                    initialDiscipline="celerity"
                />
            </MantineProvider>
        </QueryClientProvider>
    )
}

describe("DisciplineSelectModal locked powers", () => {
    it("shows a level-3 power that is more than one level away instead of hiding it", async () => {
        renderModal()

        // Blink is level 3 while Celerity is level 1, so it used to be filtered out entirely.
        expect(await screen.findByText("Blink")).toBeInTheDocument()
        expect(screen.getByText("Fleetness")).toBeInTheDocument()
    })

    it("surfaces the requirement and a blocked event when a locked power is clicked", async () => {
        renderModal()

        fireEvent.click(await screen.findByText("Blink"))

        expect(capture).toHaveBeenCalledWith(
            "sheet-power-pick-blocked",
            expect.objectContaining({
                power_name: "Blink",
                reason: "Requires Celerity Level 2"
            })
        )
    })

    it("shows the same XP cost that the purchase flow will charge", async () => {
        renderModal()

        await screen.findByText("Blink")
        // Celerity is not a clan discipline for this fixture, so its next
        // power costs 14 XP. Blink's own level must not inflate this display.
        expect(screen.getAllByText("14 XP").length).toBeGreaterThan(0)
    })

    it("captures a modal open event", async () => {
        renderModal()

        await waitFor(() =>
            expect(capture).toHaveBeenCalledWith(
                "sheet-discipline-modal-opened",
                expect.objectContaining({ discipline: "celerity", mode: "xp" })
            )
        )
    })
})
