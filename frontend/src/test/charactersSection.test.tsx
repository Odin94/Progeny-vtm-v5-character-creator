import { MantineProvider } from "@mantine/core"
import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { getEmptyCharacter } from "~/data/Character"
import CharactersSection from "~/pages/sections/CharactersSection"

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

const props = {
    isLoading: false,
    hasLoadError: false,
    onRetry: vi.fn(),
    userCharacters: [],
    character: { ...getEmptyCharacter(), name: "Unsaved draft" },
    showSaveCurrentButton: true,
    isSavingCharacter: false,
    isAnyOperationInFlight: false,
    loadingCharacterId: null,
    setCreateCharacterModalOpened: vi.fn(),
    handleSaveCurrentCharacter: vi.fn(),
    handleLoadFromFile: vi.fn(),
    handleLoadCharacter: vi.fn(),
    handleShareCharacter: vi.fn(),
    handleShowSummary: vi.fn(),
    handleSaveJson: vi.fn(),
    handleDownloadPdf: vi.fn(),
    handleDeleteCharacter: vi.fn(),
    handleUnshareCharacter: vi.fn()
}

const show = (overrides = {}) =>
    render(
        <MantineProvider env="test">
            <CharactersSection {...props} {...overrides} />
        </MantineProvider>
    )

afterEach(cleanup)

describe("account character list states", () => {
    it("shows a retryable error instead of claiming the account is empty", async () => {
        show({ hasLoadError: true })
        expect(screen.getByText("Could not load saved characters")).toBeInTheDocument()
        expect(screen.queryByText(/No characters yet/)).not.toBeInTheDocument()
        expect(
            screen.queryByRole("button", { name: "Save Current Character" })
        ).not.toBeInTheDocument()
        expect(screen.queryByRole("button", { name: "Create Empty" })).not.toBeInTheDocument()
        await userEvent.click(screen.getByRole("button", { name: "Retry loading characters" }))
        expect(props.onRetry).toHaveBeenCalledOnce()
    })

    it("does not offer saving while the initial list is loading", () => {
        show({ isLoading: true })
        expect(screen.getByRole("status")).toHaveTextContent("Loading saved characters")
        expect(screen.queryByText(/No characters yet/)).not.toBeInTheDocument()
        expect(
            screen.queryByRole("button", { name: "Save Current Character" })
        ).not.toBeInTheDocument()
    })

    it("offers creation when a successful query confirms an empty account", () => {
        show()
        expect(screen.getByText(/No characters yet/)).toBeInTheDocument()
        expect(screen.getByRole("button", { name: "Save Current Character" })).toBeEnabled()
        expect(screen.getByRole("button", { name: "Create Empty" })).toBeEnabled()
    })
})
