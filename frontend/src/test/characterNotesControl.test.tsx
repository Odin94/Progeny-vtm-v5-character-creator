import { MantineProvider } from "@mantine/core"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import CharacterNotesControl from "~/character_sheet/components/CharacterNotesControl"

const notesHooks = vi.hoisted(() => ({
    useCharacterNotes: vi.fn(),
    saveMutate: vi.fn(),
    restoreMutate: vi.fn()
}))

vi.mock("~/hooks/useCharacters", () => ({
    useCharacterNotes: notesHooks.useCharacterNotes,
    useSaveCharacterNotes: () => ({ isPending: false, mutate: notesHooks.saveMutate }),
    useRestoreCharacterNoteVersion: () => ({
        isPending: false,
        mutate: notesHooks.restoreMutate
    })
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
    configurable: true,
    value: {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
    }
})

describe("character private notes control", () => {
    beforeEach(() => {
        notesHooks.useCharacterNotes.mockReturnValue({
            data: { current: null, versions: [] },
            isLoading: false,
            isError: false,
            refetch: vi.fn()
        })
        notesHooks.saveMutate.mockReset()
        notesHooks.restoreMutate.mockReset()
    })

    it("shows guests a disabled notebook with the account message", async () => {
        const user = userEvent.setup()

        render(
            <MantineProvider env="test">
                <CharacterNotesControl
                    characterId=""
                    isAuthenticated={false}
                    authLoading={false}
                    characterAccessLoading={false}
                    hasCharacterAccess={false}
                    primaryColor="red"
                />
            </MantineProvider>
        )

        const button = screen.getByRole("button", {
            name: "Private notes unavailable: Create a free account to use private notes."
        })
        expect(button).toBeDisabled()

        await user.hover(button)
        expect(
            await screen.findByText("Create a free account to use private notes.")
        ).toBeInTheDocument()
    })

    it("opens the private notebook for an authenticated character", async () => {
        const user = userEvent.setup()

        render(
            <MantineProvider env="test">
                <CharacterNotesControl
                    characterId="character-1"
                    isAuthenticated
                    authLoading={false}
                    characterAccessLoading={false}
                    hasCharacterAccess
                    primaryColor="red"
                />
            </MantineProvider>
        )

        await user.click(screen.getByRole("button", { name: "Open private notes" }))

        expect(screen.getByRole("dialog")).toBeInTheDocument()
        expect(
            screen.getByPlaceholderText("Plans, clues, debts, boons, suspicions...")
        ).toBeEnabled()
        expect(notesHooks.useCharacterNotes).toHaveBeenLastCalledWith("character-1", true)
    })

    it("closes and clears private notes when account access ends", async () => {
        const user = userEvent.setup()
        const renderControl = (isAuthenticated: boolean) => (
            <MantineProvider env="test">
                <CharacterNotesControl
                    characterId="character-1"
                    isAuthenticated={isAuthenticated}
                    authLoading={false}
                    characterAccessLoading={false}
                    hasCharacterAccess={isAuthenticated}
                    primaryColor="red"
                />
            </MantineProvider>
        )

        const { rerender } = render(renderControl(true))
        await user.click(screen.getByRole("button", { name: "Open private notes" }))
        const editor = screen.getByPlaceholderText("Plans, clues, debts, boons, suspicions...")
        await user.type(editor, "Sensitive draft")

        rerender(renderControl(false))

        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
        expect(
            screen.getByRole("button", {
                name: "Private notes unavailable: Create a free account to use private notes."
            })
        ).toBeDisabled()
    })

    it("does not rerender when an unrelated parent state changes", async () => {
        const user = userEvent.setup()
        const Parent = () => {
            const [count, setCount] = useState(0)

            return (
                <>
                    <button type="button" onClick={() => setCount((value) => value + 1)}>
                        Parent updates: {count}
                    </button>
                    <CharacterNotesControl
                        characterId="character-1"
                        isAuthenticated
                        authLoading={false}
                        characterAccessLoading={false}
                        hasCharacterAccess
                        primaryColor="red"
                    />
                </>
            )
        }

        render(
            <MantineProvider env="test">
                <Parent />
            </MantineProvider>
        )
        const queryRenderCount = notesHooks.useCharacterNotes.mock.calls.length

        await user.click(screen.getByRole("button", { name: "Parent updates: 0" }))

        expect(screen.getByRole("button", { name: "Parent updates: 1" })).toBeInTheDocument()
        expect(notesHooks.useCharacterNotes).toHaveBeenCalledTimes(queryRenderCount)
    })

    it("accepts server refreshes while clean without overwriting a dirty draft", async () => {
        const user = userEvent.setup()
        const renderControl = (primaryColor = "red") => (
            <MantineProvider env="test">
                <CharacterNotesControl
                    characterId="character-1"
                    isAuthenticated
                    authLoading={false}
                    characterAccessLoading={false}
                    hasCharacterAccess
                    primaryColor={primaryColor}
                />
            </MantineProvider>
        )
        const queryResult = (content: string) => ({
            data: {
                current: {
                    id: "same-version-id",
                    content,
                    createdAt: "2026-07-14T20:00:00.000Z"
                },
                versions: []
            },
            isLoading: false,
            isError: false,
            refetch: vi.fn()
        })

        notesHooks.useCharacterNotes.mockReturnValue(queryResult("Server note one"))
        const { rerender } = render(renderControl())
        await user.click(screen.getByRole("button", { name: "Open private notes" }))
        const editor = screen.getByPlaceholderText("Plans, clues, debts, boons, suspicions...")
        expect(editor).toHaveValue("Server note one")

        notesHooks.useCharacterNotes.mockReturnValue(queryResult("Server note two"))
        rerender(renderControl("grape"))
        await waitFor(() => expect(editor).toHaveValue("Server note two"))

        await user.clear(editor)
        await user.type(editor, "Unsaved local draft")
        notesHooks.useCharacterNotes.mockReturnValue(queryResult("Server note three"))
        rerender(renderControl("red"))

        expect(editor).toHaveValue("Unsaved local draft")

        await user.clear(editor)
        await user.type(editor, "Server note two")
        await waitFor(() => expect(editor).toHaveValue("Server note three"))
    })
})
