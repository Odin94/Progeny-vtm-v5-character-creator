import { describe, expect, it, vi } from "vitest"
import { getEmptyCharacter } from "~/data/Character"
import { characterSwitchDecision, createCharacterPersistence } from "~/modules/characterPersistence"

const character = () => ({
    ...getEmptyCharacter(),
    id: "owned",
    name: "Avery",
    characterVersion: 1
})
const deferred = <T>() => {
    let resolve!: (value: T) => void
    const promise = new Promise<T>((r) => {
        resolve = r
    })
    return { promise, resolve }
}
const setup = () => {
    const transport = {
        get: vi.fn().mockResolvedValue({ id: "owned", characterVersion: 1, canEdit: true }),
        create: vi.fn().mockResolvedValue({ id: "created", characterVersion: 1 }),
        update: vi.fn().mockResolvedValue({ id: "owned", characterVersion: 2 })
    }
    const refresh = vi.fn()
    return { transport, refresh, module: createCharacterPersistence(transport, refresh) }
}

describe("character persistence contract", () => {
    it("owns shared/empty/unnamed/unknown ownership transition decisions", () => {
        expect(characterSwitchDecision(character(), [{ id: "owned", shared: true }])).toBe(
            "continue"
        )
        expect(characterSwitchDecision(getEmptyCharacter(), undefined)).toBe("continue")
        expect(
            characterSwitchDecision({ ...character(), name: "", description: "Unsaved choices" }, [
                { id: "owned" }
            ])
        ).toBe("name")
        expect(characterSwitchDecision(character(), undefined)).toBe("unavailable")
    })
    it("waits for autosave, then reconciles its version before saving newer edits", async () => {
        const { module, transport } = setup()
        const first = deferred<{ id: string; characterVersion: number }>()
        transport.update.mockReturnValueOnce(first.promise)
        const automatic = module.save(character(), { owned: true })
        const edited = { ...character(), description: "Edited while request pending" }
        const foreground = module.save(edited, { owned: true, beforeSwitch: true })
        expect(transport.get).not.toHaveBeenCalled()
        expect(transport.update).toHaveBeenCalledTimes(1)
        first.resolve({ id: "owned", characterVersion: 2 })
        transport.get.mockResolvedValue({ id: "owned", characterVersion: 2, canEdit: true })
        transport.update.mockResolvedValue({ id: "owned", characterVersion: 3 })
        await automatic
        const saved = await foreground
        expect(transport.update).toHaveBeenCalledTimes(2)
        expect(transport.update.mock.calls[1][1].data).toMatchObject({
            description: edited.description,
            characterVersion: 2
        })
        expect(saved).toMatchObject({ description: edited.description, characterVersion: 3 })
    })
    it("does not write the same draft twice when explicit save overlaps autosave", async () => {
        const { module, transport } = setup()
        const first = deferred<{ id: string; characterVersion: number }>()
        transport.update.mockReturnValueOnce(first.promise)
        const automatic = module.save(character(), { owned: true })
        const foreground = module.save(character(), { owned: true, beforeSwitch: true })
        first.resolve({ id: "owned", characterVersion: 2 })
        await automatic
        expect((await foreground).characterVersion).toBe(2)
        expect(transport.update).toHaveBeenCalledTimes(1)
    })
    it("rejects conflicts, unavailable ownership and read-only remote records before any write", async () => {
        const { module, transport } = setup()
        transport.get.mockResolvedValue({ id: "owned", characterVersion: 9, canEdit: true })
        await expect(module.save(character(), { owned: true, beforeSwitch: true })).rejects.toThrow(
            "newer version"
        )
        await expect(
            module.save(character(), { owned: false, ownershipLoaded: false })
        ).rejects.toThrow("Reload")
        transport.get.mockResolvedValue({ id: "owned", characterVersion: 1, canEdit: false })
        await expect(module.save(character(), { owned: true, beforeSwitch: true })).rejects.toThrow(
            "read-only"
        )
        expect(transport.create).not.toHaveBeenCalled()
        expect(transport.update).not.toHaveBeenCalled()
    })
    it("does not acknowledge failures, and releases the queue for a retry", async () => {
        const { module, transport, refresh } = setup()
        transport.update.mockRejectedValueOnce(new Error("Unavailable"))
        await expect(module.save(character(), { owned: true })).rejects.toThrow("Unavailable")
        expect(refresh).not.toHaveBeenCalled()
        expect((await module.save(character(), { owned: true })).characterVersion).toBe(2)
        expect(transport.update).toHaveBeenCalledTimes(2)
    })
    it("creates an unsaved draft once, then updates that new identity for queued edits", async () => {
        const { module, transport } = setup()
        const first = deferred<{ id: string; characterVersion: number }>()
        transport.create.mockReturnValueOnce(first.promise)
        const draft = { ...character(), id: "" }
        const created = module.save(draft, { owned: false })
        const duplicate = module.save(draft, { owned: false })
        const edited = module.save({ ...draft, description: "Latest" }, { owned: false })
        first.resolve({ id: "created", characterVersion: 1 })
        await Promise.all([created, duplicate, edited])
        expect(transport.create).toHaveBeenCalledTimes(1)
        expect(transport.update).toHaveBeenCalledTimes(1)
        expect(transport.update.mock.calls[0][0]).toBe("created")
        expect(transport.update.mock.calls[0][1].data).toMatchObject({
            id: "created",
            description: "Latest"
        })
        module.startDraft()
        await module.save(draft, { owned: false })
        expect(transport.create).toHaveBeenCalledTimes(2)
    })
    it("captures a queued snapshot before the caller can mutate it", async () => {
        const { module, transport } = setup()
        const first = deferred<{ id: string; characterVersion: number }>()
        transport.update.mockReturnValueOnce(first.promise)
        const initial = module.save(character(), { owned: true })
        const draft = { ...character(), description: "Queued snapshot" }
        const queued = module.save(draft, { owned: true })
        draft.description = "Mutated later"
        first.resolve({ id: "owned", characterVersion: 2 })
        await Promise.all([initial, queued])
        expect(transport.update.mock.calls[1][1].data.description).toBe("Queued snapshot")
    })
    it("gives an imported draft its own identity after create and saved-character load", async () => {
        const { module, transport } = setup()
        await module.save({ ...character(), id: "", name: "First draft" }, { owned: false })
        await module.settle("created")
        const loaded = { ...character(), id: "another-owned" }
        expect(module.decision(loaded, [{ id: "another-owned" }], "another-owned")).toBe("continue")
        const imported = module.replaceDraft({ ...loaded, name: "Imported third character" })
        await module.save(imported, { owned: false })
        expect(transport.create).toHaveBeenCalledTimes(2)
        expect(transport.create.mock.calls[1][0].data.name).toBe("Imported third character")
        expect(transport.update).not.toHaveBeenCalled()
    })
    it("holds one foreground transition through deferred save and target load", async () => {
        const { module, transport } = setup()
        const save = deferred<{ id: string; characterVersion: number }>()
        const load = deferred<void>()
        transport.update.mockReturnValueOnce(save.promise)
        const targetLoad = vi.fn(() => load.promise)
        const competingLoad = vi.fn(async () => undefined)
        const notify = vi.fn()
        module.subscribeTransitions(notify)
        const first = module.transition(async () => {
            await module.save(character(), { owned: true })
            await targetLoad()
        })
        expect(module.transitionSnapshot()).toBe(true)
        expect(await module.transition(competingLoad)).toBe(false)
        expect(competingLoad).not.toHaveBeenCalled()
        save.resolve({ id: "owned", characterVersion: 2 })
        await vi.waitFor(() => expect(targetLoad).toHaveBeenCalledTimes(1))
        expect(module.transitionSnapshot()).toBe(true)
        expect(await module.transition(competingLoad)).toBe(false)
        load.resolve()
        expect(await first).toBe(true)
        expect(module.transitionSnapshot()).toBe(false)
        expect(notify).toHaveBeenCalledTimes(2)
        expect(await module.transition(competingLoad)).toBe(true)
    })
    it("keeps explicit copies and separate account-created documents out of the active draft identity", async () => {
        const { module, transport } = setup()
        transport.create.mockResolvedValueOnce({ id: "active", characterVersion: 1 })
        const draft = { ...character(), id: "" }
        await module.save(draft, { owned: false })
        await module.save(character(), { owned: false, newDocument: true })
        await module.save({ ...draft, description: "Active draft edits" }, { owned: false })
        expect(transport.create).toHaveBeenCalledTimes(2)
        expect(transport.create.mock.calls[1][0].data).toMatchObject({
            id: "",
            characterVersion: 0
        })
        expect(transport.update).toHaveBeenCalledExactlyOnceWith("active", expect.anything())
    })
    it("rejects stale account responses and queued writes without refreshing another account's cache", async () => {
        const { transport, refresh } = setup()
        let account = "first"
        const module = createCharacterPersistence(transport, refresh, () => account === "first")
        const first = deferred<{ id: string; characterVersion: number }>()
        transport.update.mockReturnValueOnce(first.promise)
        const pending = module.save(character(), { owned: true })
        const queued = module.save({ ...character(), description: "Queued" }, { owned: true })
        account = "second"
        first.resolve({ id: "owned", characterVersion: 2 })
        await expect(pending).rejects.toThrow("account changed")
        await expect(queued).rejects.toThrow("account changed")
        expect(transport.update).toHaveBeenCalledTimes(1)
        expect(refresh).not.toHaveBeenCalled()
    })
    it("verifies saved identities absent from the list rather than silently creating a duplicate", async () => {
        const { module, transport } = setup()
        await module.save(character(), { owned: false, beforeSwitch: true })
        expect(transport.create).not.toHaveBeenCalled()
        expect(transport.update).toHaveBeenCalledWith("owned", expect.anything())
    })
})

it("writes an edit returning to older acknowledged content after a newer remote draft is loaded", async () => {
    const first = {
        ...getEmptyCharacter(),
        id: "owned",
        name: "Avery",
        description: "A",
        characterVersion: 1
    }
    const transport = {
        get: vi.fn(),
        create: vi.fn(),
        update: vi.fn().mockResolvedValue({ id: "owned", characterVersion: 2 })
    }
    const persistence = createCharacterPersistence(transport, vi.fn())
    await persistence.save(first, { owned: true })
    persistence.startDraft() // Creator/Me calls this when remote version 3 with description B is loaded.
    const edited = { ...first, characterVersion: 3 } // user edits description B back to A.
    transport.update.mockResolvedValue({ id: "owned", characterVersion: 4 })
    const saved = await persistence.save(edited, { owned: true })
    expect(transport.update).toHaveBeenCalledTimes(2)
    expect(saved.characterVersion).toBe(4)
})
it("does not borrow a previous draft acknowledgement when evaluating an older reloaded version conflict", async () => {
    const first = {
        ...getEmptyCharacter(),
        id: "owned",
        name: "Avery",
        description: "new",
        characterVersion: 1
    }
    const transport = {
        get: vi.fn().mockResolvedValue({ id: "owned", characterVersion: 2, canEdit: true }),
        create: vi.fn(),
        update: vi.fn().mockResolvedValue({ id: "owned", characterVersion: 2 })
    }
    const persistence = createCharacterPersistence(transport, vi.fn())
    await persistence.save(first, { owned: true })
    persistence.startDraft()
    await expect(
        persistence.save(
            { ...first, description: "older", characterVersion: 1 },
            { owned: true, beforeSwitch: true }
        )
    ).rejects.toThrow("newer version")
    expect(transport.update).toHaveBeenCalledTimes(1)
})

it("keeps a late acknowledgement with its submitted draft when the same saved identity is reloaded", async () => {
    const { module, transport } = setup()
    const pending = deferred<{ id: string; characterVersion: number }>()
    transport.update.mockReturnValueOnce(pending.promise)
    const first = module.save(character(), { owned: true })
    module.startDraft()
    const reloaded = { ...character(), characterVersion: 3 }
    transport.update.mockResolvedValue({ id: "owned", characterVersion: 4 })
    const second = module.save(reloaded, { owned: true })
    pending.resolve({ id: "owned", characterVersion: 2 })
    await first
    expect((await second).characterVersion).toBe(4)
    expect(transport.update).toHaveBeenCalledTimes(2)
    expect(transport.update.mock.calls[1][1].data.characterVersion).toBe(3)
})
