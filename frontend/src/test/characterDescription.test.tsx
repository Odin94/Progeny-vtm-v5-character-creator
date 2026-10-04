import { MantineProvider } from "@mantine/core"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import { describe, expect, it, vi } from "vitest"
import CharacterDescription from "~/character_sheet/components/CharacterDescription"
import { getEmptyCharacter } from "~/data/Character"

Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
    }))
})

describe("sheet description and appearance", () => {
    it("saves the final edit after closing the modal, and retains the full text on reopen", async () => {
        const user = userEvent.setup()
        const initial = {
            ...getEmptyCharacter(),
            description: "From the generator\n\nA second paragraph."
        }
        const Harness = () => {
            const [character, setCharacter] = useState(initial)
            return (
                <MantineProvider>
                    <CharacterDescription
                        character={character}
                        setCharacter={setCharacter}
                        primaryColor="cyan"
                        canEdit
                    />
                    <output data-testid="persisted-description">{character.description}</output>
                </MantineProvider>
            )
        }
        render(<Harness />)
        await user.click(screen.getByRole("button", { name: "Expand description & appearance" }))
        const editor = await screen.findByRole("textbox", { name: "Description & appearance" })
        expect(editor).toHaveValue(initial.description)
        const updated = "Edited on the sheet\n\nWith the full appearance intact — 🦇."
        fireEvent.change(editor, { target: { value: updated } })
        fireEvent.click(screen.getByRole("button", { name: "Done" }))
        await waitFor(() =>
            expect(screen.getByTestId("persisted-description").textContent).toBe(updated)
        )
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
        await user.click(screen.getByRole("button", { name: "Expand description & appearance" }))
        expect(
            await screen.findByRole("textbox", { name: "Description & appearance" })
        ).toHaveValue(updated)
    })

    it("can undo and redo an autosaved deletion across modal reopenings", async () => {
        const user = userEvent.setup()
        const original = "Original description\n\nAppearance intact — 🦇."
        const Harness = () => {
            const [character, setCharacter] = useState({
                ...getEmptyCharacter(),
                id: "undo-owned-description",
                description: original
            })
            return (
                <MantineProvider>
                    <CharacterDescription
                        character={character}
                        setCharacter={setCharacter}
                        primaryColor="cyan"
                        canEdit
                    />
                    <output data-testid="persisted-description">{character.description}</output>
                </MantineProvider>
            )
        }
        render(<Harness />)
        await user.click(screen.getByRole("button", { name: "Expand description & appearance" }))
        const editor = await screen.findByRole("textbox", { name: "Description & appearance" })
        expect(screen.getByRole("button", { name: "Undo description change" })).toBeDisabled()
        expect(screen.getByRole("button", { name: "Redo description change" })).toBeDisabled()
        fireEvent.change(editor, { target: { value: "" } })
        await waitFor(() =>
            expect(screen.getByTestId("persisted-description")).toBeEmptyDOMElement()
        )
        await user.click(screen.getByRole("button", { name: "Done" }))
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
        await user.click(screen.getByRole("button", { name: "Expand description & appearance" }))
        expect(
            await screen.findByRole("textbox", { name: "Description & appearance" })
        ).toHaveValue("")
        await user.click(screen.getByRole("button", { name: "Undo description change" }))
        expect(screen.getByRole("textbox", { name: "Description & appearance" })).toHaveValue(
            original
        )
        await waitFor(() =>
            expect(screen.getByTestId("persisted-description").textContent).toBe(original)
        )
        expect(screen.getByRole("button", { name: "Undo description change" })).toBeDisabled()
        expect(screen.getByRole("button", { name: "Redo description change" })).toBeEnabled()
        await user.click(screen.getByRole("button", { name: "Done" }))
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
        await user.click(screen.getByRole("button", { name: "Expand description & appearance" }))
        await screen.findByRole("textbox", { name: "Description & appearance" })
        await user.click(screen.getByRole("button", { name: "Redo description change" }))
        expect(screen.getByRole("textbox", { name: "Description & appearance" })).toHaveValue("")
        await waitFor(() =>
            expect(screen.getByTestId("persisted-description")).toBeEmptyDOMElement()
        )
        expect(screen.getByRole("button", { name: "Redo description change" })).toBeDisabled()
        expect(screen.getByRole("button", { name: "Undo description change" })).toBeEnabled()
    })

    it("lets shared readers expand the full text without exposing editing controls", async () => {
        const user = userEvent.setup()
        const setCharacter = vi.fn()
        const description = "A shared character’s appearance\n\nTheir full story."
        render(
            <MantineProvider>
                <CharacterDescription
                    character={{ ...getEmptyCharacter(), description }}
                    setCharacter={setCharacter}
                    primaryColor="cyan"
                    canEdit={false}
                    editDisabledReason="You can only edit your own characters"
                />
            </MantineProvider>
        )
        await user.click(screen.getByRole("button", { name: "Expand description & appearance" }))
        const dialog = await screen.findByRole("dialog")
        expect(dialog).toHaveTextContent("Their full story.")
        expect(dialog).toHaveTextContent("You can only edit your own characters")
        expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
        expect(
            screen.queryByRole("button", { name: "Undo description change" })
        ).not.toBeInTheDocument()
        expect(
            screen.queryByRole("button", { name: "Redo description change" })
        ).not.toBeInTheDocument()
        expect(setCharacter).not.toHaveBeenCalled()
    })
})
