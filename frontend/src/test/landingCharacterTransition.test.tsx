import posthog from "posthog-js"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MantineProvider } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, expect, it, vi } from "vitest"
import { getEmptyCharacter } from "~/data/Character"
import { characterPersistence } from "~/modules/characterPersistence"

const state = vi.hoisted(() => ({
    character: null as any,
    setCharacter: vi.fn(),
    create: vi.fn(),
    get: vi.fn(),
    navigate: vi.fn()
}))
vi.mock("~/hooks/useAuth", () => ({ useAuth: () => ({ isAuthenticated: true }) }))
vi.mock("~/hooks/useCharacterLocalStorage", () => ({
    useCharacterLocalStorage: () => [state.character, state.setCharacter]
}))
vi.mock("~/hooks/useCharacters", () => ({ useCharacters: () => ({ data: [] }) }))
vi.mock("@tanstack/react-router", () => ({
    useNavigate: () => state.navigate,
    Link: ({ children }: any) => <span>{children}</span>
}))
vi.mock("posthog-js", () => ({ default: { capture: vi.fn(), captureException: vi.fn() } }))
vi.mock("@mantine/notifications", () => ({ notifications: { show: vi.fn() } }))
vi.mock("~/components/AppTopbar", () => ({ default: () => null }))
vi.mock("~/components/SupportConversationButton", () => ({ default: () => null }))
vi.mock("~/utils/api", () => ({ api: { createCharacter: state.create, getCharacter: state.get } }))
import LandingPage from "~/pages/LandingPage"

afterEach(cleanup)
beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(window, "matchMedia", {
        configurable: true,
        value: vi.fn(() => ({
            matches: false,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn()
        }))
    })
    state.character = { ...getEmptyCharacter(), name: "Avery", description: "Unsaved choices" }
    state.create.mockResolvedValue({ id: "saved", characterVersion: 1 })
})

const open = async () => {
    const client = new QueryClient()
    client.setQueryData(["auth", "me"], { id: "alice" })
    render(
        <QueryClientProvider client={client}>
            <MantineProvider>
                <LandingPage />
            </MantineProvider>
        </QueryClientProvider>
    )
    fireEvent.click(screen.getByRole("button", { name: "Embrace a new character" }))
    await screen.findByRole("button", { name: "Save and start new" })
    return client
}

it("saves and navigates even when the rendered coordinator has been retired", async () => {
    const client = await open()
    // Replace the coordinator without rerendering the page, then invoke its existing button.
    client.setQueryData(["auth", "me"], null)
    characterPersistence(client)
    client.setQueryData(["auth", "me"], { id: "alice" })
    characterPersistence(client)
    fireEvent.click(screen.getByRole("button", { name: "Save and start new" }))
    await waitFor(() => expect(state.create).toHaveBeenCalledTimes(1))
    await waitFor(() =>
        expect(state.navigate).toHaveBeenCalledWith(expect.objectContaining({ to: "/create" }))
    )
    expect(state.create.mock.calls[0][0].data.name).toBe("Avery")
    expect(notifications.show).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Character saved" })
    )
})

it("shows feedback for a busy transition and successfully saves when retried", async () => {
    const client = await open()
    let finish!: () => void
    const pending = characterPersistence(client).transition(
        () =>
            new Promise<void>((resolve) => {
                finish = resolve
            })
    )
    fireEvent.click(screen.getByRole("button", { name: "Save and start new" }))
    await waitFor(() =>
        expect(notifications.show).toHaveBeenCalledWith(
            expect.objectContaining({ title: "Character operation in progress" })
        )
    )
    expect(posthog.capture).toHaveBeenCalledWith(
        "character_operation_warning",
        expect.objectContaining({ failure_reason: "busy", severity: "warning" })
    )
    expect(posthog.captureException).not.toHaveBeenCalled()
    expect(state.create).not.toHaveBeenCalled()
    expect(state.setCharacter).not.toHaveBeenCalled()
    expect(state.navigate).not.toHaveBeenCalled()
    await act(async () => {
        finish()
        await pending
    })
    fireEvent.click(screen.getByRole("button", { name: "Save and start new" }))
    await waitFor(() => expect(state.create).toHaveBeenCalledTimes(1))
    await waitFor(() =>
        expect(state.navigate).toHaveBeenCalledWith(expect.objectContaining({ to: "/create" }))
    )
})

it("reports a deleted draft identity as a blocking error and keeps the draft", async () => {
    const client = new QueryClient()
    client.setQueryData(["auth", "me"], { id: "alice" })
    state.character.id = "deleted"
    state.get.mockRejectedValue(Object.assign(new Error("Character not found"), { status: 404 }))
    render(
        <QueryClientProvider client={client}>
            <MantineProvider>
                <LandingPage />
            </MantineProvider>
        </QueryClientProvider>
    )
    fireEvent.click(screen.getByRole("button", { name: "Embrace a new character" }))
    fireEvent.click(await screen.findByRole("button", { name: "Save and start new" }))
    await waitFor(() =>
        expect(posthog.captureException).toHaveBeenCalledWith(
            expect.any(Error),
            expect.objectContaining({
                operation: "save-and-start-new",
                failure_reason: "not_found",
                http_status: 404,
                character_id: "deleted"
            })
        )
    )
    expect(state.create).not.toHaveBeenCalled()
    expect(state.setCharacter).not.toHaveBeenCalled()
    expect(state.navigate).not.toHaveBeenCalled()
    expect(notifications.show).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Error saving character" })
    )
})
