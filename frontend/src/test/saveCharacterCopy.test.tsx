import { MantineProvider } from "@mantine/core"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import posthog from "posthog-js"
import SaveCharacterCopyModal, { type CharacterCopySource } from "~/components/SaveCharacterCopyModal"
import { getEmptyCharacter } from "~/data/Character"
import { characterHttp } from "~/utils/http/characters"

vi.mock("posthog-js", () => ({ default: { capture: vi.fn() } }))
vi.mock("~/utils/http/characters", () => ({ characterHttp: { create: vi.fn() } }))
Object.defineProperty(window, "matchMedia", { writable: true, value: vi.fn().mockImplementation(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })) })
const source: CharacterCopySource = { character: { ...getEmptyCharacter(), id: "original", name: "Shared character", characterVersion: 7 }, ownerId: "owner", viewerId: "viewer", sharedBy: "Owner nickname", classification: "shared" }
function setup() {
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
    client.setQueryData(["characters"], [{ id: "original", shared: true }])
    const setCharacter = vi.fn(), onClose = vi.fn()
    render(<QueryClientProvider client={client}><MantineProvider><SaveCharacterCopyModal source={structuredClone(source)} setCharacter={setCharacter} onClose={onClose} /></MantineProvider></QueryClientProvider>)
    return { client, setCharacter, onClose, user: userEvent.setup() }
}
describe("save a character as an owned copy", () => {
    beforeEach(() => vi.clearAllMocks())
    it("requires confirmation and leaves the original unchanged on OK", async () => {
        const { user, onClose, setCharacter } = setup()
        expect(screen.getByText("You're viewing somebody elses character and you can't save it.")).toBeInTheDocument()
        await user.click(screen.getByRole("button", { name: "OK", exact: true }))
        expect(onClose).toHaveBeenCalledOnce()
        expect(characterHttp.create).not.toHaveBeenCalled()
        expect(setCharacter).not.toHaveBeenCalled()
    })
    it("creates a fresh identity, activates it, caches ownership and correlates source and copy", async () => {
        const saved = { id: "copy", name: source.character.name, data: { ...source.character, id: "", characterVersion: 0 }, version: 10, characterVersion: 0, createdAt: "today", updatedAt: "today" }
        vi.mocked(characterHttp.create).mockResolvedValue(saved)
        const { user, client, setCharacter, onClose } = setup()
        await user.click(screen.getByRole("button", { name: "Save as copy" }))
        await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
        expect(characterHttp.create).toHaveBeenCalledWith(expect.objectContaining({ data: { ...source.character, id: "", characterVersion: 0 } }), expect.anything())
        expect(setCharacter).toHaveBeenCalledWith({ ...saved.data, id: "copy", characterVersion: 0 })
        expect(client.getQueryData(["characters", "copy"])).toMatchObject({ canEdit: true, shared: false })
        expect(client.getQueryData(["characters"])).toEqual([ { id: "original", shared: true }, expect.objectContaining({ id: "copy", shared: false }) ])
        expect(posthog.capture).toHaveBeenCalledWith("character_save_as_copy_requested", expect.objectContaining({ source_character_id: "original", source_owner_id: "owner", viewer_user_id: "viewer" }))
        expect(posthog.capture).toHaveBeenCalledWith("character_save_as_copy_applied", expect.objectContaining({ new_character_id: "copy", source_character_id: "original" }))
        expect(source.character.id).toBe("original")
    })
    it("keeps the source active and allows retry after a rejected save", async () => {
        vi.mocked(characterHttp.create).mockRejectedValue(new Error("Connection interrupted"))
        const { user, onClose, setCharacter } = setup()
        await user.click(screen.getByRole("button", { name: "Save as copy" }))
        expect(await screen.findByText("Connection interrupted")).toBeInTheDocument()
        expect(onClose).not.toHaveBeenCalled()
        expect(setCharacter).not.toHaveBeenCalled()
        expect(posthog.capture).not.toHaveBeenCalledWith("character_save_as_copy_applied", expect.anything())
    })
})
