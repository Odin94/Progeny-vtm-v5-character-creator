import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MantineProvider } from "@mantine/core"
import { afterEach, expect, it, vi } from "vitest"
import { getEmptyCharacter } from "~/data/Character"
import { readRecoveredCharacterDrafts } from "~/utils/characterDraft"
import CharacterAutosave from "~/components/CharacterAutosave"
import { CHARACTER_CONFLICT_EVENT } from "~/components/CharacterConflictModal"

const mocks = vi.hoisted(() => ({
    getCharacter: vi.fn(),
    updateCharacter: vi.fn(),
    createCharacter: vi.fn()
}))
vi.mock("~/utils/api", () => ({ api: mocks }))
vi.mock("~/hooks/useAuth", () => ({ useAuth: () => ({ isAuthenticated: true, isLoading: false }) }))
vi.mock("~/hooks/useCharacters", () => ({ useCharacters: () => ({ data: [], isLoading: false }) }))
vi.mock("~/hooks/useAutosaveCharacter", () => ({
    useAutosaveCharacter: vi.fn(),
    isOwnedSavedCharacter: () => false
}))
vi.mock("~/generator/utils", () => ({ downloadJson: vi.fn() }))
vi.mock("@mantine/notifications", () => ({ notifications: { show: vi.fn(), hide: vi.fn() } }))
vi.mock("~/components/ConfirmActionModal", () => ({
    default: (props: any) =>
        props.opened && (
            <div>
                {props.children}
                {props.footer ?? (
                    <button disabled={props.disabled} onClick={props.onConfirm}>
                        {props.confirmLabel}
                    </button>
                )}
            </div>
        )
}))
afterEach(cleanup)

it("preserves cross-tab edits arriving during Undo backend restoration", async () => {
    Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn(() => ({
            matches: false,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn()
        }))
    })
    localStorage.clear()
    const originalBrowser = {
        ...getEmptyCharacter(),
        id: "cross-tab-character",
        name: "Browser draft",
        characterVersion: 4
    }
    const originalBackend = { ...originalBrowser, name: "Backend draft", characterVersion: 85 }
    const active = { ...originalBrowser, characterVersion: 86 }
    const updatedInOtherTab = { ...active, notes: "New edits from the other tab" }
    localStorage.setItem("character", JSON.stringify(active))
    mocks.getCharacter.mockResolvedValue({
        id: active.id,
        name: active.name,
        data: active,
        characterVersion: 86,
        canEdit: true
    })
    let finishWrite!: (value: unknown) => void
    mocks.updateCharacter.mockImplementation(
        () =>
            new Promise((resolve) => {
                finishWrite = resolve
            })
    )
    const client = new QueryClient()
    client.setQueryData(["auth", "me"], { id: "owner" })
    render(
        <QueryClientProvider client={client}>
            <MantineProvider>
                <CharacterAutosave />
            </MantineProvider>
        </QueryClientProvider>
    )
    act(() =>
        window.dispatchEvent(
            new CustomEvent(CHARACTER_CONFLICT_EVENT, {
                detail: {
                    characterId: active.id,
                    browser: originalBrowser,
                    backend: originalBackend
                }
            })
        )
    )
    await screen.findByText("Browser version: 4 · Backend version: 85")
    fireEvent.click(screen.getByRole("button", { name: "Keep backend" }))
    fireEvent.click(screen.getByRole("button", { name: "Replace browser" }))
    await waitFor(() => expect(mocks.updateCharacter).toHaveBeenCalledTimes(1))
    act(() => {
        localStorage.setItem("character", JSON.stringify(updatedInOtherTab))
        window.dispatchEvent(
            new StorageEvent("storage", {
                key: "character",
                newValue: JSON.stringify(updatedInOtherTab),
                storageArea: localStorage
            })
        )
    })
    await act(async () =>
        finishWrite({
            id: active.id,
            name: originalBackend.name,
            data: { ...originalBackend, characterVersion: 87 },
            characterVersion: 87
        })
    )
    expect(JSON.parse(localStorage.getItem("character")!)).toMatchObject({
        name: "Backend draft",
        characterVersion: 87
    })
    expect(
        readRecoveredCharacterDrafts().some(
            ({ character }) => character.notes === updatedInOtherTab.notes
        )
    ).toBe(true)
})

it.each(["Keep browser", "Save browser as new"])(
    "retains the freshest cross-tab draft during ordinary %s resolution",
    async (choice) => {
        Object.defineProperty(window, "matchMedia", {
            writable: true,
            value: vi.fn(() => ({
                matches: false,
                addEventListener: vi.fn(),
                removeEventListener: vi.fn()
            }))
        })
        localStorage.clear()
        mocks.updateCharacter.mockReset()
        mocks.createCharacter.mockReset()
        const local = {
            ...getEmptyCharacter(),
            id: "ordinary-cross-tab",
            name: "Browser draft",
            characterVersion: 4
        }
        const remote = { ...local, name: "Backend draft", characterVersion: 85 }
        const freshDraft = { ...local, notes: "Fresh edits from the other tab" }
        localStorage.setItem("character", JSON.stringify(local))
        mocks.getCharacter.mockResolvedValue({
            id: remote.id,
            name: remote.name,
            data: remote,
            characterVersion: 85,
            canEdit: true
        })
        let finishWrite!: (value: unknown) => void
        const write = choice === "Keep browser" ? mocks.updateCharacter : mocks.createCharacter
        write.mockImplementation(
            () =>
                new Promise((resolve) => {
                    finishWrite = resolve
                })
        )
        const client = new QueryClient()
        client.setQueryData(["auth", "me"], { id: "owner" })
        render(
            <QueryClientProvider client={client}>
                <MantineProvider>
                    <CharacterAutosave />
                </MantineProvider>
            </QueryClientProvider>
        )
        act(() =>
            window.dispatchEvent(
                new CustomEvent(CHARACTER_CONFLICT_EVENT, { detail: { characterId: local.id } })
            )
        )
        await screen.findByText("Browser version: 4 · Backend version: 85")
        fireEvent.click(screen.getByRole("button", { name: choice }))
        if (choice === "Keep browser")
            fireEvent.click(screen.getByRole("button", { name: "Overwrite backend" }))
        await waitFor(() => expect(write).toHaveBeenCalledTimes(1))
        const id = choice === "Keep browser" ? local.id : "new-copy"
        const version = choice === "Keep browser" ? 86 : 0
        // The storage snapshot changes before React can render the new props.
        await act(async () => {
            localStorage.setItem("character", JSON.stringify(freshDraft))
            window.dispatchEvent(
                new StorageEvent("storage", {
                    key: "character",
                    newValue: JSON.stringify(freshDraft),
                    storageArea: localStorage
                })
            )
            finishWrite({
                id,
                name: local.name,
                data: { ...local, id, characterVersion: version },
                characterVersion: version
            })
        })
        expect(JSON.parse(localStorage.getItem("character")!)).toMatchObject({
            id,
            characterVersion: version,
            notes: freshDraft.notes
        })
        expect(
            readRecoveredCharacterDrafts().some(
                ({ character }) => character.notes === freshDraft.notes
            )
        ).toBe(true)
    }
)
