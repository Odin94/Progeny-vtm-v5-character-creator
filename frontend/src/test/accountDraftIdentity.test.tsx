import React, { useState } from "react"
import { MantineProvider } from "@mantine/core"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, render, waitFor } from "@testing-library/react"
import { expect, it, vi } from "vitest"
import { getEmptyCharacter } from "~/data/Character"

const state = vi.hoisted(() => ({
    character: null as any,
    section: null as any,
    confirm: null as any,
    create: vi.fn(),
    update: vi.fn()
}))
vi.mock("~/utils/api", () => ({
    api: { createCharacter: state.create, updateCharacter: state.update }
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
    useCharacters: () => ({ data: [], isPending: false, isError: false })
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
    loadCharacterFromJson: async () => ({ ...getEmptyCharacter(), name: "Imported B" })
}))
vi.mock("~/generator/utils", async (original) => ({
    ...(await original<any>()),
    getUploadFile: async () => "data:application/json;base64,e30="
}))

import MePage from "~/pages/MePage"
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
