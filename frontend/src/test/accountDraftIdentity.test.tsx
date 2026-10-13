import React, { useSyncExternalStore } from "react"
import { MantineProvider } from "@mantine/core"
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query"
import { act, render, waitFor } from "@testing-library/react"
import { expect, it, vi } from "vitest"
import { getEmptyCharacter } from "~/data/Character"

const state = vi.hoisted(() => ({
    character: null as any,
    listeners: new Set<() => void>(),
    section: null as any,
    confirm: null as any,
    get: vi.fn(),
    characters: [] as any[],
    create: vi.fn(),
    update: vi.fn()
}))
vi.mock("~/utils/http/characters", () => ({ characterHttp: { get: state.get } }))
vi.mock("~/utils/api", () => ({
    api: { createCharacter: state.create, updateCharacter: state.update }
}))
vi.mock("~/hooks/useAuth", () => ({
    useAuth: () => ({ user: { id: "alice" }, isAuthenticated: true })
}))
vi.mock("~/hooks/useCharacterLocalStorage", () => ({
    useCharacterLocalStorage: () => {
        const character = useSyncExternalStore(
            (listener) => {
                state.listeners.add(listener)
                return () => {
                    state.listeners.delete(listener)
                }
            },
            () => state.character
        )
        const setCharacter = (next: any) => {
            state.character = typeof next === "function" ? next(state.character) : next
            state.listeners.forEach((listener) => listener())
        }
        return [character, setCharacter]
    }
}))
vi.mock("~/hooks/useCharacters", async (original) => ({
    ...(await original<any>()),
    useCharacters: (enabled = true) =>
        useQuery({
            queryKey: ["characters"],
            queryFn: async () => state.characters,
            initialData: state.characters,
            staleTime: 300_000,
            enabled
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
        if (props.title === "Load Character?") state.confirm = props
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
vi.mock("~/components/LoadModal", () => ({
    loadCharacterFromFile: async () => ({ ...getEmptyCharacter(), name: "Imported B" })
}))
vi.mock("~/generator/utils", async (original) => ({
    ...(await original<any>()),
    getUploadFile: async () => "data:application/json;base64,e30="
}))

import MePage from "~/pages/MePage"
import CharacterAutosave from "~/components/CharacterAutosave"
Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
    }))
})

it("Account ignores a pending creation acknowledgement after importing another id-less draft", async () => {
    state.character = { ...getEmptyCharacter(), name: "Draft A" }
    let finish!: (value: any) => void
    state.create.mockImplementation(
        () =>
            new Promise((resolve) => {
                finish = resolve
            })
    )
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
        await state.section.handleSaveCurrentCharacter()
    })
    await waitFor(() => expect(state.create).toHaveBeenCalledOnce())
    await act(async () => {
        await state.section.handleLoadFromFile(new File(["{}"], "character.json"))
    })
    expect(state.confirm.opened).toBe(true)
    await act(async () => {
        await state.confirm.onConfirm()
    })
    expect(state.character.name).toBe("Imported B")
    await act(async () => {
        finish({ id: "remote-A", characterVersion: 1 })
        await new Promise((resolve) => setTimeout(resolve, 0))
    })
    expect(state.character).toMatchObject({ id: "", name: "Imported B" })
    state.create.mockResolvedValue({ id: "remote-B", characterVersion: 1 })
    await act(async () => {
        await state.section.handleSaveCurrentCharacter()
    })
    await waitFor(() => expect(state.character.id).toBe("remote-B"))
    expect(state.create).toHaveBeenCalledTimes(2)
    expect(state.update).not.toHaveBeenCalled()
})

it("Account loads the fresh cloud record instead of the stale list snapshot", async () => {
    state.character = getEmptyCharacter()
    const cached = { ...getEmptyCharacter(), id: "saved", name: "Cached", characterVersion: 1 }
    state.characters = [{ id: "saved", name: "Cached", data: cached, canEdit: true }]
    state.get.mockResolvedValue({
        id: "saved",
        name: "Fresh",
        characterVersion: 3,
        data: { ...cached, description: "Latest cloud edits", characterVersion: 2 }
    })
    const client = new QueryClient()
    client.setQueryData(["auth", "me"], { id: "alice" })
    render(
        <QueryClientProvider client={client}>
            <MantineProvider>
                <MePage />
            </MantineProvider>
        </QueryClientProvider>
    )
    await act(async () => {
        await state.section.handleLoadCharacter(state.characters[0])
    })
    expect(state.character).toMatchObject({
        id: "saved",
        name: "Fresh",
        description: "Latest cloud edits",
        characterVersion: 3
    })
})

it.each([new Error("Offline"), { status: 404 }, new Error("Invalid character data")])(
    "Account keeps the current character when the destination cannot be fetched: %s",
    async (error) => {
        state.character = {
            ...getEmptyCharacter(),
            id: "shared",
            name: "Current",
            description: "Keep me"
        }
        state.characters = [
            { id: "shared", shared: true, data: state.character },
            { id: "saved", name: "Cached", data: { ...getEmptyCharacter(), name: "Cached" } }
        ]
        state.get.mockRejectedValue(error)
        const client = new QueryClient()
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
        expect(state.character).toMatchObject({
            id: "shared",
            name: "Current",
            description: "Keep me"
        })
    }
)

it.each([
    { hasConfirmedBase: false, shared: false },
    { hasConfirmedBase: true, shared: false },
    { hasConfirmedBase: false, shared: true }
])(
    "fresh account loads retain data and ownership (confirmed base: $hasConfirmedBase, shared: $shared)",
    async ({ hasConfirmedBase, shared }) => {
        localStorage.clear()
        state.update.mockClear()
        state.character = getEmptyCharacter()
        const cached = {
            ...getEmptyCharacter(),
            id: "saved",
            name: "Cached",
            description: "Old cloud data",
            characterVersion: 1
        }
        const fresh = {
            ...cached,
            name: "Fresh",
            description: "Latest cloud edits",
            characterVersion: 3
        }
        const envelope = (data: any) => ({
            id: data.id,
            name: data.name,
            data,
            characterVersion: data.characterVersion,
            version: data.version,
            canEdit: !shared
        })
        state.characters = [{ ...envelope(cached), shared, sharedBy: shared ? "Owner" : null }]
        state.get.mockResolvedValue(envelope(fresh))
        state.update.mockImplementation(async (_id, payload) => {
            const data = { ...payload.data, characterVersion: payload.characterVersion + 1 }
            state.characters = [envelope(data)]
            return envelope(data)
        })
        if (hasConfirmedBase)
            localStorage.setItem("progeny-character-confirmed:saved", JSON.stringify(fresh))
        const client = new QueryClient()
        client.setQueryData(["auth", "me"], { id: "alice" })
        render(
            <QueryClientProvider client={client}>
                <MantineProvider>
                    <MePage />
                    <CharacterAutosave />
                </MantineProvider>
            </QueryClientProvider>
        )
        await act(async () => {
            await state.section.handleLoadCharacter(state.characters[0])
        })
        // Allow the global cache subscriber to process the loaded draft.
        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 20))
        })
        expect(state.character).toMatchObject(fresh)
        expect(localStorage.getItem("progeny-character-recovery")).toBeNull()
        expect(client.getQueryData<any[]>(["characters"])?.[0]).toMatchObject({
            shared,
            canEdit: !shared,
            sharedBy: shared ? "Owner" : null
        })
        if (shared) {
            await act(async () => {
                await new Promise((resolve) => setTimeout(resolve, 1000))
            })
            expect(state.update).not.toHaveBeenCalled()
            client.clear()
            localStorage.clear()
            return
        }
        act(() => {
            state.character = { ...state.character, description: "Edit after fresh load" }
            state.listeners.forEach((listener) => listener())
        })
        await waitFor(() => expect(state.update).toHaveBeenCalledOnce(), { timeout: 2500 })
        expect(state.update.mock.calls[0][1]).toMatchObject({
            characterVersion: 3,
            data: { description: "Edit after fresh load" }
        })
        await waitFor(() => expect(state.character.characterVersion).toBe(4))
        client.clear()
        localStorage.clear()
    }
)
