import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import CharacterSheet from "~/character_sheet/CharacterSheet"
import { getEmptyCharacter, type Character } from "~/data/Character"

class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
}
window.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver
globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver

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

const authState = { isAuthenticated: true, isLoading: false }
const charactersState: { data: Array<{ id: string; shared?: boolean }>; isLoading: boolean } = {
    data: [{ id: "char-1", shared: true }],
    isLoading: false
}

vi.mock("~/hooks/useAuth", () => ({
    useAuth: () => authState
}))
vi.mock("~/hooks/useCharacters", () => ({
    useCharacters: () => charactersState
}))
vi.mock("~/hooks/useUserPreferences", () => ({
    useUserPreferences: () => ({ preferences: {}, updatePreferences: vi.fn() })
}))
vi.mock("~/hooks/useAutosaveCharacterVitals", () => ({
    useAutosaveCharacterVitals: () => undefined
}))

const getSharedCharacter = (): Character => ({
    ...getEmptyCharacter(),
    id: "char-1",
    name: "Charlotte (Lottie) Lawrence"
})

describe("character sheet mode toggle for shared/unowned characters", () => {
    beforeEach(() => {
        window.localStorage.clear()
        window.localStorage.setItem("characterSheetMode", JSON.stringify("play"))
    })

    it("lets the viewer switch view modes even when editing is locked", async () => {
        const user = userEvent.setup()

        render(<CharacterSheet character={getSharedCharacter()} setCharacter={vi.fn()} />)

        const playRadio = screen.getByRole("radio", { name: "Play" })
        const xpRadio = screen.getByRole("radio", { name: "XP" })

        // The control must stay interactive so clicks are not silently swallowed.
        expect(playRadio).not.toBeDisabled()
        expect(xpRadio).not.toBeDisabled()
        expect(playRadio).toBeChecked()

        await user.click(xpRadio)

        expect(xpRadio).toBeChecked()
        expect(playRadio).not.toBeChecked()
    })
})
