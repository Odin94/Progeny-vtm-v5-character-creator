import { MantineProvider } from "@mantine/core"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import ClanPicker from "~/generator/components/ClanPicker"
import type { HomebrewCollection } from "~/data/Homebrew"
import { getBasicTestCharacter } from "./testUtils"

const legacyClanCollection: HomebrewCollection = {
    id: "collection-1",
    name: "Legacy collection",
    shortDescription: "",
    description: "",
    tags: [],
    contentWarning: "",
    sourceLibraryEntryId: null,
    sourcePublicationId: null,
    rootSourceLibraryEntryId: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    items: [
        {
            id: "legacy-clan",
            kind: "clan",
            name: "Legacy Clan",
            summary: "",
            description: "",
            logo: "",
            bane: "",
            compulsion: "",
            nativeDisciplines: ["auspex"],
            // Older saved collections predate these optional fields.
            excludedPredatorTypes: undefined as never,
            excludedMeritsAndFlaws: undefined as never
        }
    ]
}

vi.mock("~/hooks/useHomebrew", () => ({
    useCharacterHomebrew: () => ({ data: [legacyClanCollection] })
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

globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
}

describe("ClanPicker Homebrew compatibility", () => {
    it("selects a legacy Homebrew clan without predator-type exclusions", async () => {
        const user = userEvent.setup()
        const setCharacter = vi.fn()
        const nextStep = vi.fn()

        render(
            <MantineProvider>
                <ClanPicker
                    character={getBasicTestCharacter()}
                    setCharacter={setCharacter}
                    nextStep={nextStep}
                />
            </MantineProvider>
        )

        await user.click(screen.getByText("Legacy Clan"))

        expect(setCharacter).toHaveBeenCalledWith(
            expect.objectContaining({
                homebrewClan: expect.objectContaining({
                    name: "Legacy Clan",
                    excludedPredatorTypes: [],
                    excludedMeritsAndFlaws: []
                })
            })
        )
        expect(nextStep).toHaveBeenCalledOnce()
    })
})
