import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, expect, it, vi } from "vitest"
import { getEmptyCharacter } from "~/data/Character"
import { useCharacterLocalStorage } from "~/hooks/useCharacterLocalStorage"
import DeletedCharacterDraftModal from "~/components/DeletedCharacterDraftModal"

const state = vi.hoisted(() => ({ get: vi.fn(), create: vi.fn(), update: vi.fn(), accountId: "alice" }))
vi.mock("~/hooks/useAuth", () => ({
    useAuth: () => ({ user: { id: state.accountId }, isAuthenticated: true, isLoading: false })
}))
vi.mock("~/utils/http/characters", () => ({ characterHttp: { get: state.get } }))
vi.mock("~/utils/api", () => ({
    api: { createCharacter: state.create, updateCharacter: state.update }
}))
vi.mock("posthog-js", () => ({ default: { capture: vi.fn(), captureException: vi.fn() } }))
vi.mock("@mantine/notifications", () => ({ notifications: { show: vi.fn() } }))
vi.mock("@mantine/core", () => {
    const box = ({ children }: any) => <div>{children}</div>
    return {
        Modal: ({ opened, children }: any) => (opened ? <div role="dialog">{children}</div> : null),
        TextInput: ({ label, value, onChange }: any) => <label>{label}<input value={value} onChange={onChange} /></label>,
        Stack: box,
        Group: box,
        Text: box,
        Alert: ({ children }: any) => <div role="alert">{children}</div>,
        Button: ({ children, disabled, loading, onClick }: any) => (
            <button disabled={disabled || loading} onClick={onClick}>
                {children}
            </button>
        )
    }
})

const draft = () => ({
    ...getEmptyCharacter(),
    id: "deleted",
    name: "Avery",
    characterVersion: 8,
    notes: "Keep my notes"
})
let view: ReturnType<typeof render>
let current: ReturnType<typeof useCharacterLocalStorage>
function Observer() {
    current = useCharacterLocalStorage()
    return null
}
const setup = () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    client.setQueryData(["auth", "me"], { id: "alice" })
    localStorage.setItem("character", JSON.stringify(draft()))
    view = render(
        <QueryClientProvider client={client}>
            <Observer />
            <DeletedCharacterDraftModal />
        </QueryClientProvider>
    )
    return client
}

beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    state.accountId = "alice"
    state.get.mockRejectedValue(Object.assign(new Error("Missing"), { status: 404 }))
    state.create.mockResolvedValue({ id: "restored", characterVersion: 1 })
})
afterEach(cleanup)

it("restores the draft as a fresh copy and installs its new identity locally", async () => {
    setup()
    fireEvent.click(await screen.findByRole("button", { name: "Restore character" }))
    await waitFor(() => expect(current[0].id).toBe("restored"))
    expect(state.create).toHaveBeenCalledTimes(1)
    expect(state.create.mock.calls[0][0].data).toMatchObject({
        id: "",
        characterVersion: 0,
        notes: "Keep my notes"
    })
    expect(state.update).not.toHaveBeenCalled()
    expect(JSON.parse(localStorage.getItem("character")!)).toMatchObject({
        id: "restored",
        characterVersion: 1,
        notes: "Keep my notes"
    })
})

it("deletes the active draft from storage and resets every mounted subscriber", async () => {
    setup()
    fireEvent.click(await screen.findByRole("button", { name: "Delete local draft" }))
    await waitFor(() => expect(current[0].id).toBe(""))
    expect(current[0].notes).toBe("")
    expect(localStorage.getItem("character")).toBeNull()
    expect(state.create).not.toHaveBeenCalled()
    expect(state.update).not.toHaveBeenCalled()
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
})

it.each([403, 500])("does not offer deletion or restoration for HTTP %s", async (status) => {
    state.get.mockRejectedValue(Object.assign(new Error("Unavailable"), { status }))
    const client = setup()
    await waitFor(() =>
        expect(client.getQueryState(["deleted-draft-check", "alice", "deleted"])?.status).toBe("error")
    )
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    expect(current[0].id).toBe("deleted")
    expect(state.create).not.toHaveBeenCalled()
})

it("keeps the draft on a failed restore and allows retry", async () => {
    state.create.mockRejectedValueOnce(new Error("Offline"))
    setup()
    fireEvent.click(await screen.findByRole("button", { name: "Restore character" }))
    await screen.findByRole("alert")
    expect(current[0].id).toBe("deleted")
    expect(JSON.parse(localStorage.getItem("character")!).notes).toBe("Keep my notes")
    fireEvent.click(screen.getByRole("button", { name: "Restore character" }))
    await waitFor(() => expect(current[0].id).toBe("restored"))
    expect(state.create).toHaveBeenCalledTimes(2)
})

it("retries local installation without duplicating a successful cloud restore", async () => {
    setup()
    await screen.findByRole("button", { name: "Restore character" })
    const write = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new DOMException("Full", "QuotaExceededError")
    })
    try {
        fireEvent.click(screen.getByRole("button", { name: "Restore character" }))
        await screen.findByRole("alert")
        expect(current[0].id).toBe("deleted")
        expect(state.create).toHaveBeenCalledTimes(1)
    } finally {
        write.mockRestore()
    }
    fireEvent.click(await screen.findByRole("button", { name: "Restore character" }))
    await waitFor(() => expect(current[0].id).toBe("restored"))
    expect(state.create).toHaveBeenCalledTimes(1)
})

it("does not install an old account's restore after the account changes", async () => {
    let finish!: (response: unknown) => void
    state.create.mockImplementation(
        () =>
            new Promise((resolve) => {
                finish = resolve
            })
    )
    const client = setup()
    fireEvent.click(await screen.findByRole("button", { name: "Restore character" }))
    await waitFor(() => expect(state.create).toHaveBeenCalledTimes(1))
    await act(async () => {
        client.setQueryData(["auth", "me"], { id: "bob" })
        finish({ id: "restored", characterVersion: 1 })
    })
    expect(current[0].id).toBe("deleted")
    expect(JSON.parse(localStorage.getItem("character")!).id).toBe("deleted")
})

it("preserves a replacement draft when a restore response arrives late", async () => {
    let finish!: (response: unknown) => void
    state.create.mockImplementation(
        () =>
            new Promise((resolve) => {
                finish = resolve
            })
    )
    setup()
    fireEvent.click(await screen.findByRole("button", { name: "Restore character" }))
    await waitFor(() => expect(state.create).toHaveBeenCalledTimes(1))
    await act(async () => {
        current[1]({ ...getEmptyCharacter(), name: "New draft" })
        finish({ id: "restored", characterVersion: 1 })
    })
    expect(current[0].id).toBe("")
    expect(current[0].name).toBe("New draft")
})

it("updates the same restored copy when the source draft is edited during creation", async () => {
    let finish!: (response: unknown) => void
    state.create.mockImplementation(() => new Promise(resolve => { finish = resolve }))
    state.update.mockResolvedValue({ id: "restored", characterVersion: 2 })
    setup()
    fireEvent.click(await screen.findByRole("button", { name: "Restore character" }))
    await waitFor(() => expect(state.create).toHaveBeenCalledTimes(1))
    await act(async () => {
        current[1](value => ({ ...value, notes: "New edits" }))
        finish({ id: "restored", characterVersion: 1 })
    })
    fireEvent.click(await screen.findByRole("button", { name: "Restore character" }))
    await waitFor(() => expect(current[0].id).toBe("restored"))
    expect(state.create).toHaveBeenCalledTimes(1)
    expect(state.update).toHaveBeenCalledTimes(1)
    expect(current[0].notes).toBe("New edits")
})

it("checks the freshest cached draft before removing storage", async () => {
    setup()
    await screen.findByRole("button", { name: "Delete local draft" })
    act(() => {
        current[1]({ ...getEmptyCharacter(), name: "Replacement" })
        expect(current[2](value => value.id === "deleted")).toBe(false)
    })
    expect(JSON.parse(localStorage.getItem("character")!).name).toBe("Replacement")
})


it("requires a new missing-character check after switching accounts", async () => {
    const client = setup()
    await screen.findByRole("button", { name: "Delete local draft" })
    state.accountId = "bob"
    state.get.mockImplementation(() => new Promise(() => {}))
    view.rerender(
        <QueryClientProvider client={client}>
            <Observer />
            <DeletedCharacterDraftModal />
        </QueryClientProvider>
    )
    await waitFor(() => expect(state.get).toHaveBeenCalledTimes(2))
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    expect(current[0].id).toBe("deleted")
})


it("lets an unnamed deleted draft receive a name and restore without losing content", async () => {
    setup()
    act(() => current[1](value => ({ ...value, name: "   " })))
    fireEvent.change(await screen.findByLabelText("Character name"), { target: { value: "Recovered" } })
    fireEvent.click(screen.getByRole("button", { name: "Restore character" }))
    await waitFor(() => expect(current[0].id).toBe("restored"))
    expect(current[0].name).toBe("Recovered")
    expect(current[0].notes).toBe("Keep my notes")
})
