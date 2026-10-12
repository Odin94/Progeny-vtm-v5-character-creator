import React, { useState } from "react"
import { MantineProvider } from "@mantine/core"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, render } from "@testing-library/react"
import { beforeEach, expect, it, vi } from "vitest"
import { getEmptyCharacter } from "~/data/Character"

const state = vi.hoisted(() => ({
    character: null as any,
    section: null as any,
    deleteModal: null as any,
    characters: [] as any[],
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    report: vi.fn(),
    notify: vi.fn(),
    deferDelete: false,
    completeDelete: null as (() => void) | null
}))
vi.mock("~/utils/api", () => ({
    api: { getCharacter: state.get, createCharacter: state.create, updateCharacter: state.update }
}))
vi.mock("~/utils/http/characters", () => ({ characterHttp: { get: state.get } }))
vi.mock("~/utils/characterOperationAnalytics", () => ({
    reportCharacterOperationFailure: state.report
}))
vi.mock("@mantine/notifications", () => ({ notifications: { show: state.notify } }))
vi.mock("~/hooks/useAuth", () => ({
    useAuth: () => ({ user: { id: "alice" }, isAuthenticated: true })
}))
vi.mock("~/hooks/useCharacterLocalStorage", () => ({
    useCharacterLocalStorage: () => {
        const [character, setCharacter] = useState(state.character)
        state.character = character
        const clearCharacter = (matches?: (current: any) => boolean) => {
            if (matches && !matches(state.character)) return false
            state.character = getEmptyCharacter()
            setCharacter(state.character)
            return true
        }
        return [character, setCharacter, clearCharacter]
    }
}))
vi.mock("~/hooks/useCharacters", async (original) => ({
    ...(await original<any>()),
    useCharacters: () => ({ data: state.characters, isPending: false, isError: false }),
    useDeleteCharacter: () => ({
        isPending: false,
        mutate: (id: string, options: { onSuccess: () => void }) => {
            state.remove(id)
            state.characters = state.characters.filter((candidate) => candidate.id !== id)
            if (state.deferDelete) state.completeDelete = options.onSuccess
            else options.onSuccess()
        }
    })
}))
vi.mock("~/hooks/useCoteries", () => {
    const query = () => ({ data: [] })
    const mutation = () => ({ isPending: false, mutate: vi.fn() })
    return {
        useCoteries: query,
        useCoterieVitals: query,
        useCoterieInvites: query,
        useCoterieMembership: () => ({ generatedInviteUrl: "", claimInvite: () => false }),
        useCreateCoterie: mutation,
        useUpdateCoterie: mutation,
        useDeleteCoterie: mutation,
        useAddCharacterToCoterie: mutation,
        useRemoveCharacterFromCoterie: mutation,
        useCreateCoterieInvite: mutation,
        useRevokeCoterieInvite: mutation,
        useAcceptCoterieInvite: mutation,
        useRemoveCoteriePlayer: mutation
    }
})
vi.mock("~/hooks/useShares", () => ({
    useCharacterShares: () => ({ data: [] }),
    useUnshareCharacter: () => ({ isPending: false })
}))
vi.mock("~/hooks/useSessionChat", () => ({
    useSessionChat: () => ({ connect: vi.fn(), joinSession: vi.fn() })
}))
vi.mock("@tanstack/react-router", () => ({ Link: ({ children }: any) => <>{children}</> }))
vi.mock("~/pages/sections/CharactersSection", () => ({
    default: (props: any) => {
        state.section = props
        return null
    }
}))
vi.mock("~/pages/sections/CoteriesSection", () => ({ default: () => null }))
vi.mock("~/pages/sections/UserProfileSection", () => ({ default: () => null }))
vi.mock("~/components/ConfirmActionModal", () => ({
    default: (props: any) => {
        if (props.title === "Delete Character") state.deleteModal = props
        return null
    },
    confirmationModalCancelButtonStyles: {},
    confirmationModalWithHeaderStyles: () => ({})
}))
vi.mock("~/components/SaveCharacterCopyModal", () => ({ default: () => null }))
vi.mock("~/components/NameCharacterBeforeSwitchModal", () => ({ default: () => null }))
vi.mock("~/components/SupportConversationButton", () => ({ default: () => null }))
vi.mock("~/topbar/Topbar", () => ({ default: () => null }))
vi.mock("~/character_sheet/components/ChatWindow", () => ({ default: () => null }))

import MePage from "~/pages/MePage"
Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
    }))
})

const alice = { ...getEmptyCharacter(), id: "a", name: "Alice", characterVersion: 1 }
const bob = { ...getEmptyCharacter(), id: "b", name: "Bob", characterVersion: 1 }
const remoteBob = { id: "b", name: "Bob", data: bob, characterVersion: 1, canEdit: true }

const renderMePage = () => {
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
    client.setQueryData(["auth", "me"], { id: "alice" })
    render(
        <QueryClientProvider client={client}>
            <MantineProvider>
                <MePage />
            </MantineProvider>
        </QueryClientProvider>
    )
    return client
}

beforeEach(() => {
    vi.clearAllMocks()
    state.deferDelete = false
    state.completeDelete = null
})

it("Account clears the loaded draft when its character is deleted, so another character loads", async () => {
    state.character = { ...alice, concept: "Edited in browser" }
    state.characters = [
        { id: "a", name: "Alice", data: alice, characterVersion: 1 },
        { id: "b", name: "Bob", data: bob, characterVersion: 1 }
    ]
    state.get.mockResolvedValue(remoteBob)
    renderMePage()

    act(() => state.section.handleDeleteCharacter("a", "Alice"))
    act(() => state.deleteModal.onConfirm())

    expect(state.remove).toHaveBeenCalledWith("a")
    expect(state.character).toMatchObject({ id: "", name: "" })

    await act(async () => {
        await state.section.handleLoadCharacter(state.characters[0])
    })

    expect(state.character).toMatchObject({ id: "b", name: "Bob" })
    expect(state.get).not.toHaveBeenCalledWith("a", expect.anything())
    expect(state.create).not.toHaveBeenCalled()
    expect(state.update).not.toHaveBeenCalled()
    expect(state.report).not.toHaveBeenCalled()
})

it("Account keeps the loaded draft when a different character is deleted", () => {
    state.character = { ...alice }
    state.characters = [
        { id: "a", name: "Alice", data: alice, characterVersion: 1 },
        { id: "b", name: "Bob", data: bob, characterVersion: 1 }
    ]
    renderMePage()

    act(() => state.section.handleDeleteCharacter("b", "Bob"))
    act(() => state.deleteModal.onConfirm())

    expect(state.remove).toHaveBeenCalledWith("b")
    expect(state.character).toMatchObject({ id: "a", name: "Alice" })
})

it("Account sends a save-before-load 404 to the deleted-draft dialog as a warning", async () => {
    const notFound = Object.assign(new Error("Not found"), { status: 404 })
    state.character = { ...alice, concept: "Edited in browser" }
    state.characters = [{ id: "b", name: "Bob", data: bob, characterVersion: 1 }]
    state.get.mockImplementation(async (id: string) => {
        if (id === "a") throw notFound
        return remoteBob
    })
    const client = renderMePage()
    const invalidate = vi.spyOn(client, "invalidateQueries")

    await act(async () => {
        await state.section.handleLoadCharacter(state.characters[0])
    })

    expect(state.report).toHaveBeenCalledWith("save-before-load", notFound, {
        severity: "warning",
        characterId: "a"
    })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["deleted-draft-check"] })
    expect(state.notify).not.toHaveBeenCalledWith(
        expect.objectContaining({ title: "Unable to load character" })
    )
    expect(state.character).toMatchObject({ id: "a", concept: "Edited in browser" })
})

it("Account retains the draft when deletion completes after an account change", async () => {
    state.character = { ...alice, concept: "Retained draft" }
    state.characters = [{ id: "a", name: "Alice", data: alice, characterVersion: 1 }]
    state.deferDelete = true
    const client = renderMePage()
    act(() => state.section.handleDeleteCharacter("a", "Alice"))
    act(() => state.deleteModal.onConfirm())
    client.setQueryData(["auth", "me"], { id: "bob" })
    act(() => state.completeDelete!())
    expect(state.character).toMatchObject({ id: "a", concept: "Retained draft" })
    expect(state.notify).not.toHaveBeenCalledWith(expect.objectContaining({ title: "Success" }))
})
