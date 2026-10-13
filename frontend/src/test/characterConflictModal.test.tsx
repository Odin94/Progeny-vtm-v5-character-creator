import { useEffect, useState } from "react"
import { MantineProvider } from "@mantine/core"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, expect, it, vi } from "vitest"
import { characterPersistence } from "~/modules/characterPersistence"
import { getEmptyCharacter } from "~/data/Character"
import CharacterConflictModal, {
    CHARACTER_CONFLICT_EVENT,
    type CharacterConflictRequest
} from "~/components/CharacterConflictModal"

const mocks = vi.hoisted(() => ({
    getCharacter: vi.fn(),
    createCharacter: vi.fn(),
    updateCharacter: vi.fn(),
    downloadJson: vi.fn(),
    show: vi.fn(),
    hide: vi.fn()
}))
vi.mock("@mantine/notifications", () => ({ notifications: { show: mocks.show, hide: mocks.hide } }))
vi.mock("~/utils/api", () => ({ api: mocks }))
vi.mock("~/generator/utils", () => ({ downloadJson: mocks.downloadJson }))
vi.mock("~/components/ConfirmActionModal", () => ({
    default: (props: any) =>
        props.opened && (
            <div>
                {props.body}
                {props.children}
                <button disabled={props.disabled} onClick={props.onConfirm}>
                    {props.confirmLabel}
                </button>
            </div>
        )
}))
const browser = {
    ...getEmptyCharacter(),
    id: "original",
    name: "Browser draft",
    characterVersion: 4
}
const backend = { ...browser, name: "Backend draft", characterVersion: 85 }
const response = (data = backend) => ({
    id: data.id,
    name: data.name,
    data,
    characterVersion: data.characterVersion,
    canEdit: true
})
beforeEach(() => {
    vi.resetAllMocks()
    mocks.show.mockReturnValue("success-toast")
    Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn(() => ({
            matches: false,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn()
        }))
    })
    localStorage.clear()
    mocks.getCharacter.mockResolvedValue(response())
    mocks.downloadJson.mockResolvedValue(undefined)
})
afterEach(cleanup)
function setup() {
    const client = new QueryClient()
    client.setQueryData(["auth", "me"], { id: "owner" })
    const onResolved = vi.fn()
    const onClose = vi.fn()
    render(
        <QueryClientProvider client={client}>
            <MantineProvider>
                <CharacterConflictModal
                    opened
                    browser={browser}
                    onClose={onClose}
                    onResolved={onResolved}
                />
            </MantineProvider>
        </QueryClientProvider>
    )
    return { onResolved, onClose, client }
}
it("downloads both independent versions without resolving or saving", async () => {
    const { onResolved } = setup()
    await screen.findByText("Browser version: 4 · Backend version: 85")
    fireEvent.click(screen.getByText("Download browser JSON"))
    fireEvent.click(screen.getByText("Download backend JSON"))
    expect(mocks.downloadJson.mock.calls.map(([value]) => value)).toEqual([browser, backend])
    expect(mocks.downloadJson).toHaveBeenCalledWith(browser, "progeny_browser_v4.json")
    expect(mocks.downloadJson).toHaveBeenCalledWith(backend, "progeny_backend_v85.json")
    expect(onResolved).not.toHaveBeenCalled()
    expect(mocks.updateCharacter).not.toHaveBeenCalled()
})
it("keeps the backend without modifying the saved character", async () => {
    const { onResolved } = setup()
    await screen.findByText("Browser version: 4 · Backend version: 85")
    fireEvent.click(screen.getByText("Keep backend"))
    await waitFor(() => expect(onResolved).toHaveBeenCalledWith(backend))
    expect(mocks.updateCharacter).not.toHaveBeenCalled()
    expect(mocks.createCharacter).not.toHaveBeenCalled()
    expect(JSON.parse(localStorage.getItem("progeny-character-recovery")!)[0].character).toEqual(
        browser
    )
})
it("keeps the browser using the reviewed backend revision", async () => {
    mocks.updateCharacter.mockResolvedValue(response({ ...browser, characterVersion: 86 }))
    const { onResolved, client } = setup()
    await screen.findByText("Browser version: 4 · Backend version: 85")
    fireEvent.click(screen.getByText("Keep browser"))
    await waitFor(() =>
        expect(onResolved).toHaveBeenCalledWith({ ...browser, characterVersion: 86 })
    )
    expect(characterPersistence(client).isAcknowledged(onResolved.mock.calls[0][0])).toBe(true)
    expect(mocks.updateCharacter).toHaveBeenCalledWith(
        "original",
        expect.objectContaining({
            characterVersion: 85,
            data: expect.objectContaining({ name: "Browser draft" })
        }),
        expect.any(Function)
    )
})
it("creates a new browser copy while leaving the backend untouched", async () => {
    mocks.createCharacter.mockResolvedValue(
        response({ ...browser, id: "copy", characterVersion: 0 })
    )
    const { onResolved } = setup()
    await screen.findByText("Browser version: 4 · Backend version: 85")
    fireEvent.click(screen.getByText("Save browser as new"))
    await waitFor(() =>
        expect(onResolved).toHaveBeenCalledWith({ ...browser, id: "copy", characterVersion: 0 })
    )
    expect(mocks.updateCharacter).not.toHaveBeenCalled()
    expect(mocks.createCharacter).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ id: "", characterVersion: 0 }) }),
        expect.any(Function)
    )
})
it("requires a new choice if another device saved after the dialog opened", async () => {
    const { onResolved } = setup()
    await screen.findByText("Browser version: 4 · Backend version: 85")
    mocks.getCharacter.mockResolvedValue(response({ ...backend, characterVersion: 86 }))
    fireEvent.click(screen.getByText("Keep browser"))
    await screen.findByText(
        "The backend version changed. Review the updated version and choose again."
    )
    expect(onResolved).not.toHaveBeenCalled()
    expect(mocks.updateCharacter).not.toHaveBeenCalled()
})
it("leaves the dialog and browser intact after a failed write", async () => {
    mocks.updateCharacter.mockRejectedValue(new Error("offline"))
    const { onResolved, onClose } = setup()
    await screen.findByText("Browser version: 4 · Backend version: 85")
    fireEvent.click(screen.getByText("Keep browser"))
    await screen.findByRole("alert")
    expect(onResolved).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
    expect(mocks.show).not.toHaveBeenCalled()
})

it("does not allow replacing a shared character", async () => {
    mocks.getCharacter.mockResolvedValue({ ...response(), canEdit: false, shared: true })
    const { onResolved } = setup()
    await screen.findByRole("alert")
    expect(screen.getByText("Keep browser")).toBeDisabled()
    expect(screen.getByRole("button", { name: "Keep backend" })).toBeDisabled()
    expect(onResolved).not.toHaveBeenCalled()
    expect(mocks.updateCharacter).not.toHaveBeenCalled()
})

it.each(["Keep browser", "Keep backend"])(
    "Undo reopens both original versions after %s and restores the other choice",
    async (firstChoice) => {
        let saved = backend
        mocks.getCharacter.mockImplementation(async () => response(saved))
        mocks.updateCharacter.mockImplementation(async (_id, payload) => {
            saved = { ...payload.data, characterVersion: payload.characterVersion + 1 }
            return response(saved)
        })
        const resolved = vi.fn()
        function Host() {
            const [draft, setDraft] = useState(browser)
            const [originalBackend, setOriginalBackend] = useState<typeof backend>()
            const [opened, setOpened] = useState(true)
            useEffect(() => {
                const reopen = (event: Event) => {
                    const request = (event as CustomEvent<CharacterConflictRequest>).detail
                    setDraft(request.browser!)
                    setOriginalBackend(request.backend)
                    setOpened(true)
                }
                window.addEventListener(CHARACTER_CONFLICT_EVENT, reopen)
                return () => window.removeEventListener(CHARACTER_CONFLICT_EVENT, reopen)
            }, [])
            return (
                <CharacterConflictModal
                    opened={opened}
                    browser={draft}
                    originalBackend={originalBackend}
                    onClose={() => setOpened(false)}
                    onResolved={(value) => {
                        setDraft(value)
                        resolved(value)
                    }}
                />
            )
        }
        const client = new QueryClient()
        client.setQueryData(["auth", "me"], { id: "owner" })
        render(
            <QueryClientProvider client={client}>
                <MantineProvider>
                    <Host />
                </MantineProvider>
            </QueryClientProvider>
        )
        await screen.findByText("Browser version: 4 · Backend version: 85")
        fireEvent.click(screen.getByRole("button", { name: firstChoice }))
        await waitFor(() => expect(resolved).toHaveBeenCalledTimes(1))
        expect(mocks.show).toHaveBeenCalledWith(
            expect.objectContaining({ color: "green", autoClose: false })
        )
        render(<MantineProvider>{mocks.show.mock.calls[0][0].message}</MantineProvider>)
        fireEvent.click(screen.getByRole("button", { name: "Undo" }))
        await screen.findByText("Browser version: 4 · Backend version: 85")
        expect(mocks.hide).toHaveBeenCalledWith("success-toast")
        const other = firstChoice === "Keep browser" ? "Keep backend" : "Keep browser"
        fireEvent.click(screen.getByRole("button", { name: other }))
        await waitFor(() => expect(resolved).toHaveBeenCalledTimes(2))
        expect(saved.name).toBe(firstChoice === "Keep browser" ? "Backend draft" : "Browser draft")
        expect(saved.characterVersion).toBe(firstChoice === "Keep browser" ? 87 : 86)
        expect(mocks.updateCharacter.mock.calls.at(-1)![1].characterVersion).toBe(
            firstChoice === "Keep browser" ? 86 : 85
        )
    }
)
