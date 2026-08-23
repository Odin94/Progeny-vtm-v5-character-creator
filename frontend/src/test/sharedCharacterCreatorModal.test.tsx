import { MantineProvider } from "@mantine/core"
import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import SharedCharacterCreatorModal, {
    getSharedCharacterLabel
} from "~/components/SharedCharacterCreatorModal"

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

afterEach(cleanup)

describe("SharedCharacterCreatorModal", () => {
    it("includes the player in the checked-out label when present", () => {
        expect(getSharedCharacterLabel("Pearl Auster", "Mina")).toBe("Pearl Auster | Mina")
    })

    it("omits the player separator when the player is empty", () => {
        expect(getSharedCharacterLabel("Pearl Auster", " ")).toBe("Pearl Auster")
    })

    it("offers sheet and new-character actions", async () => {
        const user = userEvent.setup()
        const onGoToSheet = vi.fn()
        const onCreateNewCharacter = vi.fn()

        render(
            <MantineProvider>
                <SharedCharacterCreatorModal
                    opened
                    characterName="Pearl Auster"
                    playerName="Mina"
                    onGoToSheet={onGoToSheet}
                    onCreateNewCharacter={onCreateNewCharacter}
                />
            </MantineProvider>
        )

        expect(screen.getByText(/Pearl Auster \| Mina checked out/)).toBeInTheDocument()

        await user.click(screen.getByRole("button", { name: "Go to Sheet" }))
        await user.click(screen.getByRole("button", { name: "Create New Character" }))

        expect(onGoToSheet).toHaveBeenCalledOnce()
        expect(onCreateNewCharacter).toHaveBeenCalledOnce()
    })
})
