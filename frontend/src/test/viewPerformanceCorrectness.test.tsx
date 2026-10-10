import { MantineProvider } from "@mantine/core"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, expect, it, vi } from "vitest"
import UserProfileSection from "~/pages/sections/UserProfileSection"
import CoterieCharacterSummaryGrid from "~/components/CoterieCharacterSummaryGrid"
import { characterSchema, getEmptyCharacter } from "~/data/Character"
import { getCharacterVitals } from "~/utils/characterVitals"

Object.defineProperty(window, "matchMedia", {
    value: vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn()
    }))
})
afterEach(cleanup)
it("submits the current local nickname draft and resets cancel/reopen and external edits", () => {
    const save = vi.fn(),
        cancel = vi.fn()
    const props = {
        user: { nickname: "Original", nameTagEnabled: false, nameTagVisible: false },
        isEditingNickname: true,
        setIsEditingNickname: vi.fn(),
        isUpdatingProfile: false,
        redColorValue: "red",
        handleSaveNickname: save,
        handleCancelNickname: cancel,
        handleNameTagToggle: vi.fn()
    }
    const view = (editing: boolean, nickname = "Original") => (
        <MantineProvider>
            <UserProfileSection
                {...props}
                isEditingNickname={editing}
                user={{ ...props.user, nickname }}
            />
        </MantineProvider>
    )
    const { rerender } = render(view(true))
    fireEvent.change(screen.getByPlaceholderText("Enter nickname"), {
        target: { value: "New draft" }
    })
    fireEvent.click(screen.getByRole("button", { name: "Save" }))
    expect(save).toHaveBeenLastCalledWith("New draft")
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))
    expect(cancel).toHaveBeenCalledOnce()
    rerender(view(false))
    rerender(view(true))
    expect(screen.getByDisplayValue("Original")).toBeInTheDocument()
    rerender(view(true, "Externally updated"))
    expect(screen.getByDisplayValue("Externally updated")).toBeInTheDocument()
})
it("refreshes coterie live vitals without reparsing unchanged members and refreshes replaced members", () => {
    const character = { ...getEmptyCharacter(), name: "Original Vampire" }
    const member = {
        id: "member",
        characterId: "character",
        createdAt: "2026-10-03",
        character: {
            id: "character",
            name: character.name,
            data: character,
            version: 1,
            createdAt: "2026-10-03",
            updatedAt: "2026-10-03"
        }
    }
    const members = [member],
        vitals = getCharacterVitals(character)
    const view = (data = members, hunger = 0) => (
        <MantineProvider>
            <CoterieCharacterSummaryGrid
                members={data}
                vitalsByCharacterId={{ character: { ...vitals, hunger } }}
            />
        </MantineProvider>
    )
    const { rerender } = render(view())
    const parse = vi.spyOn(characterSchema, "parse")
    rerender(view(members, 4))
    expect(screen.getByLabelText("Hunger 4")).toBeInTheDocument()
    expect(parse).not.toHaveBeenCalled()
    rerender(
        view(
            [
                {
                    ...member,
                    character: {
                        ...member.character,
                        data: { ...character, name: "Updated Vampire" }
                    }
                }
            ],
            2
        )
    )
    expect(screen.getByText("Updated Vampire")).toBeInTheDocument()
    expect(screen.getByLabelText("Hunger 2")).toBeInTheDocument()
    expect(parse).toHaveBeenCalledOnce()
    parse.mockRestore()
})
