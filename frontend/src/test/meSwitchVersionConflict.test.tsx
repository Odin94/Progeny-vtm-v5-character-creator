import React, { useState } from "react"
import { MantineProvider } from "@mantine/core"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, render, waitFor } from "@testing-library/react"
import { beforeEach, expect, it, vi } from "vitest"
import { getEmptyCharacter } from "~/data/Character"

const state = vi.hoisted(() => ({
    character: null as any,
    section: null as any,
    conflict: null as any,
    characters: [] as any[],
    get: vi.fn(),
    update: vi.fn(),
    report: vi.fn()
}))
vi.mock("~/utils/api", () => ({
    api: { getCharacter: state.get, updateCharacter: state.update }
}))
vi.mock("~/utils/http/characters", () => ({ characterHttp: { get: state.get } }))
vi.mock("~/utils/characterOperationAnalytics", () => ({
    reportCharacterOperationFailure: state.report
}))
vi.mock("~/hooks/useAuth", () => ({
    useAuth: () => ({ user: { id: "alice" }, isAuthenticated: true })
}))
vi.mock("~/hooks/useCharacterLocalStorage", () => ({
    useCharacterLocalStorage: () => {
        const [character, setCharacter] = useState(state.character)
        state.character = character
        return [character, setCharacter]
    }
}))
vi.mock("~/hooks/useCharacters", async (original) => ({
    ...(await original<any>()),
    useCharacters: () => ({ data: state.characters, isPending: false, isError: false })
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
        if (props.title === "Version Conflict") state.conflict = props
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

beforeEach(() => vi.clearAllMocks())

it.each(["preflight", "update race", "cancel pending"])("Account resolves a save-before-load conflict: %s", async (scenario) => {
    const local = { ...getEmptyCharacter(), id: "a", name: "Alice", characterVersion: 1 }
    const target = { ...getEmptyCharacter(), id: "b", name: "Bob", characterVersion: 3 }
    state.character = { ...local, concept: "Edited in browser" }
    state.characters = [
        { id: "a", name: "Alice", data: local, characterVersion: 1 },
        { id: "b", name: "Bob", data: target, characterVersion: 3 }
    ]
    const remote = {
        a: {
            id: "a",
            name: "Alice",
            data: { ...local, characterVersion: 2 },
            characterVersion: 2,
            canEdit: true
        },
        b: { id: "b", name: "Bob", data: target, characterVersion: 3, canEdit: true }
    }
    state.get.mockImplementation(async (id: "a" | "b") => remote[id])
    if (scenario === "update race") {
        state.get.mockResolvedValueOnce({ ...remote.a, characterVersion: 1 })
        state.update.mockRejectedValueOnce(Object.assign(new Error("Conflict"), { status: 409 }))
    }
    state.update.mockImplementation(async (id: string, payload: any) => ({
        id,
        name: payload.name,
        data: { ...payload.data, characterVersion: payload.characterVersion + 1 },
        characterVersion: payload.characterVersion + 1
    }))
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
    client.setQueryData(["auth", "me"], { id: "alice" })
    render(
        <QueryClientProvider client={client}>
            <MantineProvider>
                <MePage />
            </MantineProvider>
        </QueryClientProvider>
    )

    await act(async () => {
        await state.section.handleLoadCharacter(state.characters[1])
    })

    expect(state.conflict.opened).toBe(true)
    expect(state.conflict.confirmLabel).toBe("Overwrite and load")
    expect(state.update).toHaveBeenCalledTimes(scenario === "update race" ? 1 : 0)
    expect(state.character).toMatchObject({ id: "a", concept: "Edited in browser" })
    expect(state.report).toHaveBeenCalledWith(
        "save-before-load",
        expect.anything(),
        expect.objectContaining({ severity: "warning", localVersion: 1, remoteVersion: 2 })
    )

    let complete!: (value: any) => void
    if (scenario === "cancel pending")
        state.update.mockImplementationOnce(() => new Promise((resolve) => { complete = resolve }))
    await act(async () => {
        await state.conflict.onConfirm()
    })
    if (scenario === "cancel pending") {
        act(() => state.conflict.onClose())
        await act(async () => complete({ id: "a", name: "Alice", characterVersion: 3 }))
        await waitFor(() => expect(state.character.characterVersion).toBe(3))
        expect(state.character).toMatchObject({ id: "a", concept: "Edited in browser" })
        expect(state.conflict.opened).toBe(false)
        return
    }

    await waitFor(() => expect(state.character).toMatchObject({ id: "b", name: "Bob" }))
    expect(state.update).toHaveBeenCalledTimes(scenario === "update race" ? 2 : 1)
    expect(state.update.mock.calls.at(-1)![0]).toBe("a")
    expect(state.update.mock.calls.at(-1)![1]).toMatchObject({
        characterVersion: 2,
        data: { concept: "Edited in browser" }
    })
    expect(state.conflict.opened).toBe(false)
})
