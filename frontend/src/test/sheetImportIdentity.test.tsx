import React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, render, screen } from "@testing-library/react"
import { expect, it, vi } from "vitest"
import { getEmptyCharacter, type Character } from "~/data/Character"
import { characterPersistence } from "~/modules/characterPersistence"
const state = vi.hoisted(() => ({
    upload: null as any,
    confirm: null as any,
    create: vi.fn(),
    update: vi.fn()
}))
vi.mock("~/utils/api", () => ({
    api: { createCharacter: state.create, updateCharacter: state.update }
}))
vi.mock("~/hooks/useAuth", () => ({ useAuth: () => ({ isAuthenticated: true }) }))
vi.mock("@mantine/core", () => {
    const container = ({ children }: any) => <>{children}</>
    return {
        Modal: container,
        Stack: container,
        Text: container,
        ActionIcon: ({ onClick }: any) => <button onClick={onClick}>Open menu</button>,
        Button: container,
        FileButton: ({ onChange }: any) => {
            state.upload = onChange
            return null
        }
    }
})
vi.mock("framer-motion", () => ({
    AnimatePresence: ({ children }: any) => <>{children}</>,
    motion: { div: ({ children }: any) => <>{children}</> },
    useReducedMotion: () => true
}))
vi.mock("@tanstack/react-router", () => ({ Link: () => null }))
vi.mock("~/components/ConfirmActionModal", () => ({
    default: (props: any) => {
        state.confirm = props
        return null
    }
}))
vi.mock("~/components/RecentChangesModal", () => ({ default: () => null }))
vi.mock("~/components/SupportConversationButton", () => ({ default: () => null }))
vi.mock("~/character_sheet/components/PreferencesModal", () => ({ default: () => null }))
vi.mock("~/generator/utils", async (original) => ({
    ...(await original<any>()),
    getUploadFile: async () =>
        "data:application/json;base64," +
        btoa(JSON.stringify({ ...getEmptyCharacter(), name: "Imported B" }))
}))
import CharacterSheetMenu from "~/character_sheet/components/CharacterSheetMenu"

it("a sheet JSON import after a saved id-less draft gets a fresh cloud identity", async () => {
    const client = new QueryClient()
    client.setQueryData(["auth", "me"], { id: "alice" })
    state.create
        .mockResolvedValueOnce({ id: "saved-A", characterVersion: 1 })
        .mockResolvedValueOnce({ id: "saved-B", characterVersion: 1 })
    const persistence = characterPersistence(client)
    let character: Character = { ...getEmptyCharacter(), name: "Original A" }
    await persistence.save(character, { owned: false })
    render(
        <QueryClientProvider client={client}>
            <CharacterSheetMenu
                options={
                    {
                        character,
                        setCharacter: (next: Character | ((current: Character) => Character)) => {
                            character = typeof next === "function" ? next(character) : next
                        },
                        primaryColor: "red",
                        preferences: {}
                    } as any
                }
            />
        </QueryClientProvider>
    )
    act(() => screen.getByRole("button", { name: "Open menu" }).click())
    await act(async () => {
        await state.upload(new File(["{}"], "sheet.json"))
    })
    await act(async () => {
        await state.confirm.onConfirm()
    })
    expect(character).toMatchObject({ id: "", name: "Imported B" })
    const saved = await persistence.save(character, { owned: false })
    expect(saved.id).toBe("saved-B")
    expect(state.create).toHaveBeenCalledTimes(2)
    expect(state.update).not.toHaveBeenCalled()
})
