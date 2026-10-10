import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, render } from "@testing-library/react"
import { expect, it, vi } from "vitest"
import ResetModal from "~/components/ResetModal"
import { getEmptyCharacter, type Character } from "~/data/Character"
import { characterPersistence } from "~/modules/characterPersistence"

const state = vi.hoisted(() => ({
    confirm: null as (() => void) | null,
    create: vi.fn(),
    update: vi.fn()
}))
vi.mock("~/utils/api", () => ({
    api: { createCharacter: state.create, updateCharacter: state.update }
}))
vi.mock("~/components/ConfirmActionModal", () => ({
    default: ({ onConfirm }: { onConfirm: () => void }) => {
        state.confirm = onConfirm
        return null
    }
}))

it("resetting after an id-less draft was saved creates a separate cloud character", async () => {
    const client = new QueryClient()
    client.setQueryData(["auth", "me"], { id: "alice" })
    state.create
        .mockResolvedValueOnce({ id: "first", characterVersion: 1 })
        .mockResolvedValueOnce({ id: "second", characterVersion: 1 })
    state.update.mockResolvedValue({ id: "first", characterVersion: 2 })
    const persistence = characterPersistence(client)
    let character: Character = await persistence.save(
        { ...getEmptyCharacter(), name: "First" },
        { owned: false }
    )
    render(
        <QueryClientProvider client={client}>
            <ResetModal
                setCharacter={(replacement) => {
                    character = replacement
                }}
                setSelectedStep={vi.fn()}
                resetModalOpened
                closeResetModal={vi.fn()}
            />
        </QueryClientProvider>
    )
    act(() => state.confirm?.())
    const second = await persistence.save({ ...character, name: "Second" }, { owned: false })
    expect(second.id).toBe("second")
    expect(state.create).toHaveBeenCalledTimes(2)
    expect(state.update).not.toHaveBeenCalled()
})
