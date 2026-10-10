import React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, act } from "@testing-library/react"
import { it, expect, vi } from "vitest"
import { getEmptyCharacter } from "~/data/Character"
const spies = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn(), invite: vi.fn() }))
vi.mock("~/utils/api", () => ({
    api: { createCharacter: spies.create, updateCharacter: spies.update }
}))
vi.mock("~/utils/http/coteries", () => ({ coterieHttp: { createInvite: spies.invite } }))
import { useCreateCoterieInvite } from "~/hooks/useCoteries"
import { useCreateCharacter } from "~/hooks/useCharacters"
it("a creation submitted for Alice must not dispatch under Bob after mutation scheduling", async () => {
    const client = new QueryClient()
    client.setQueryData(["auth", "me"], { id: "alice" })
    spies.create.mockResolvedValue({ id: "bob-created", characterVersion: 1 })
    const wrapper = ({ children }: any) =>
        React.createElement(QueryClientProvider, { client }, children)
    const { result } = renderHook(() => useCreateCharacter(), { wrapper })
    let pending!: Promise<any>
    act(() => {
        pending = result.current.mutateAsync({
            name: "Alice private draft",
            data: { ...getEmptyCharacter(), name: "Alice private draft" }
        })
        client.setQueryData(["auth", "me"], { id: "bob" })
    })
    await expect(pending).rejects.toThrow("account changed")
    expect(spies.create).not.toHaveBeenCalled()
})

import { useUpdateCharacter } from "~/hooks/useCharacters"
it("a full update submitted for Alice must not dispatch under Bob after mutation scheduling", async () => {
    spies.update.mockClear()
    const client = new QueryClient()
    client.setQueryData(["auth", "me"], { id: "alice" })
    spies.update.mockResolvedValue({ id: "alice-character", characterVersion: 1 })
    const wrapper = ({ children }: any) =>
        React.createElement(QueryClientProvider, { client }, children)
    const { result } = renderHook(() => useUpdateCharacter(), { wrapper })
    let pending!: Promise<any>
    act(() => {
        pending = result.current.mutateAsync({
            id: "alice-character",
            data: {
                name: "Alice private draft",
                characterVersion: 0,
                data: { ...getEmptyCharacter(), id: "alice-character", name: "Alice private draft" }
            }
        })
        client.setQueryData(["auth", "me"], { id: "bob" })
    })
    await expect(pending).rejects.toThrow("account changed")
    expect(spies.update).not.toHaveBeenCalled()
})

it("submitted account survives a hook rerender while onMutate is pending", async () => {
    spies.create.mockClear()
    let release!: () => void
    const gate = new Promise<void>((resolve) => {
        release = resolve
    })
    const client = new QueryClient({
        defaultOptions: { mutations: { onMutate: async () => gate } }
    })
    client.setQueryData(["auth", "me"], { id: "alice" })
    const wrapper = ({ children }: any) =>
        React.createElement(QueryClientProvider, { client }, children)
    const { result, rerender } = renderHook(() => useCreateCharacter(), { wrapper })
    let pending!: Promise<any>
    act(() => {
        pending = result.current.mutateAsync({
            name: "Alice draft",
            data: { ...getEmptyCharacter(), name: "Alice draft" }
        })
    })
    const rejected = expect(pending).rejects.toThrow("account changed")
    act(() => {
        client.setQueryData(["auth", "me"], { id: "bob" })
        rerender()
    })
    await act(async () => {
        release()
        await rejected
    })
    expect(spies.create).not.toHaveBeenCalled()
})

it("membership submissions stay bound to their account across a deferred hook rerender", async () => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => {
        release = resolve
    })
    const client = new QueryClient({
        defaultOptions: { mutations: { onMutate: async () => gate } }
    })
    client.setQueryData(["auth", "me"], { id: "alice" })
    const wrapper = ({ children }: any) =>
        React.createElement(QueryClientProvider, { client }, children)
    const { result, rerender } = renderHook(() => useCreateCoterieInvite(), { wrapper })
    let pending!: Promise<any>
    act(() => {
        pending = result.current.mutateAsync("alice-coterie")
    })
    const rejected = expect(pending).rejects.toThrow("account changed")
    act(() => {
        client.setQueryData(["auth", "me"], { id: "bob" })
        rerender()
    })
    await act(async () => {
        release()
        await rejected
    })
    expect(spies.invite).not.toHaveBeenCalled()
})
