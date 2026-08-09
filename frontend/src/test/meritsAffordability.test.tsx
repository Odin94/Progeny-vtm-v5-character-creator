import { MantineProvider } from "@mantine/core"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import MeritsAndFlawsPicker from "~/generator/components/MeritsAndFlawsPicker"
import { getEmptyCharacter, type Character } from "~/data/Character"

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

// jsdom lacks IntersectionObserver / ResizeObserver, used by the picker's progressive
// rendering and Mantine's ScrollArea.
class MockObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
}
;(globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = MockObserver
;(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = MockObserver

afterEach(cleanup)

const renderPicker = () => {
    const character: Character = { ...getEmptyCharacter(), clan: "Brujah", generation: 13 }
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    return render(
        <QueryClientProvider client={queryClient}>
            <MantineProvider>
                <MeritsAndFlawsPicker
                    character={character}
                    setCharacter={vi.fn()}
                    nextStep={vi.fn()}
                />
            </MantineProvider>
        </QueryClientProvider>
    )
}

// Walk up from a merit's name to the card <div> that also contains its level buttons.
const cardFor = (name: string): HTMLElement => {
    let el: HTMLElement | null = screen.getByText(name, { exact: true })
    while (el && !el.querySelector("button")) {
        el = el.parentElement
    }
    if (!el) throw new Error(`Card for ${name} not found`)
    return el
}

const clickLevel = (name: string, level: string) => {
    fireEvent.click(within(cardFor(name)).getByRole("button", { name: level }))
}

describe("Merits & Flaws affordability", () => {
    it("reveals advanced merits and flaws when requested", () => {
        renderPicker()

        expect(screen.queryByText("Laboratory", { exact: true })).not.toBeInTheDocument()
        fireEvent.click(screen.getByTestId("toggle-all-merits-button"))

        expect(screen.getByText("Laboratory", { exact: true })).toBeInTheDocument()
        expect(
            screen.getByRole("button", { name: "Show essential merits" })
        ).toBeInTheDocument()
    })

    it("filters by case-insensitive title, description, and category substrings", () => {
        renderPicker()
        const search = screen.getByRole("textbox", { name: "Search merits and flaws" })

        fireEvent.change(search, { target: { value: "LoOkS" } })
        expect(screen.getByText("Beautiful", { exact: true })).toBeInTheDocument()
        expect(screen.queryByText("Watchmen", { exact: true })).not.toBeInTheDocument()

        fireEvent.change(search, { target: { value: "secu" } })
        expect(screen.getByText("Haven", { exact: true })).toBeInTheDocument()
        expect(screen.getByText("Watchmen", { exact: true })).toBeInTheDocument()
        expect(screen.queryByText("Beautiful", { exact: true })).not.toBeInTheDocument()

        fireEvent.change(search, { target: { value: "watchmen" } })
        expect(screen.getByText("Watchmen", { exact: true })).toBeInTheDocument()
        expect(screen.queryByText("Beautiful", { exact: true })).not.toBeInTheDocument()
    })

    it("shows a persistent per-item cost + remaining budget for each merit", () => {
        renderPicker()
        expect(
            within(cardFor("Beautiful")).getByText("Costs 2 pts · 7 advantage points left")
        ).toBeInTheDocument()
        // The level button is clickable while affordable.
        expect(within(cardFor("Beautiful")).getByRole("button", { name: "2" })).toBeEnabled()
    })

    it("explains an unaffordable level only after the user tries to pick it", () => {
        renderPicker()

        // Spend 6 of 7 advantage points with non-excluding Haven merits (leaves 1).
        clickLevel("Haven", "3")
        clickLevel("Cell", "1")
        clickLevel("Watchmen", "1")
        clickLevel("Luxury", "1")

        // Beautiful (cost 2) is now unaffordable, but the page stays uncluttered until
        // the user asks to take it.
        const beautiful = cardFor("Beautiful")
        const levelButton = within(beautiful).getByRole("button", { name: "2" })
        expect(levelButton).toHaveAttribute("aria-disabled", "true")
        expect(
            within(beautiful).queryByText(
                "Not enough points — costs 2 pts, you have 1 advantage points left"
            )
        ).not.toBeInTheDocument()

        fireEvent.click(levelButton)
        expect(
            within(beautiful).getByText(
                "Not enough points — costs 2 pts, you have 1 advantage points left"
            )
        ).toBeInTheDocument()
    })
})
