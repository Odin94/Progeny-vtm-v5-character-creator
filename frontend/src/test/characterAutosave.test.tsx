import posthog from "posthog-js"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook } from "@testing-library/react"
import type { CharacterApiResponse } from "~/utils/characterApi"
import { characterPersistence } from "~/modules/characterPersistence"
import { useState, type PropsWithChildren } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { getEmptyCharacter, type Character } from "~/data/Character"
import {
    CHARACTER_AUTOSAVE_DELAY_MS,
    CHARACTER_AUTOSAVE_RETRY_DELAY_MS,
    isOwnedSavedCharacter,
    useAutosaveCharacter
} from "~/hooks/useAutosaveCharacter"

vi.mock("posthog-js", () => ({ default: { capture: vi.fn(), captureException: vi.fn() } }))

const apiMocks = vi.hoisted(() => ({
    updateCharacter: vi.fn()
}))

vi.mock("~/utils/api", () => ({
    api: {
        updateCharacter: apiMocks.updateCharacter
    }
}))

const makeCharacter = (overrides: Partial<Character> = {}): Character => ({
    ...getEmptyCharacter(),
    id: "character-1",
    name: "Avery",
    ...overrides
})

const remoteFor = (character: Character): CharacterApiResponse => ({
    id: character.id,
    name: character.name,
    data: character,
    version: character.version,
    characterVersion: character.characterVersion,
    createdAt: "2026-10-03",
    updatedAt: "2026-10-03"
})

const makeWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false }
        }
    })

    return ({ children }: PropsWithChildren) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
}

const finishPendingPromises = async () => {
    await Promise.resolve()
    await Promise.resolve()
}

describe("useAutosaveCharacter", () => {
    beforeEach(() => {
        vi.mocked(posthog.capture).mockClear()
        vi.mocked(posthog.captureException).mockClear()
        localStorage.clear()
        vi.useFakeTimers()
        apiMocks.updateCharacter.mockReset()
        apiMocks.updateCharacter.mockResolvedValue({
            id: "character-1",
            characterVersion: 2,
            data: { characterVersion: 2 }
        })
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it("treats the initially loaded character as the saved baseline", () => {
        const character = makeCharacter()

        renderHook(() => useAutosaveCharacter(character, vi.fn(), true, remoteFor(character)), {
            wrapper: makeWrapper()
        })

        act(() => vi.advanceTimersByTime(CHARACTER_AUTOSAVE_DELAY_MS * 2))

        expect(apiMocks.updateCharacter).not.toHaveBeenCalled()
    })

    it.each([
        { label: "ownership is not confirmed", enabled: false, id: "character-1" },
        { label: "the character has not been saved", enabled: true, id: "" }
    ])("does not save when $label", ({ enabled, id }) => {
        const initialCharacter = makeCharacter({ id })
        const { rerender } = renderHook(
            ({ character }) =>
                useAutosaveCharacter(character, vi.fn(), enabled, remoteFor(initialCharacter)),
            {
                initialProps: { character: initialCharacter },
                wrapper: makeWrapper()
            }
        )

        rerender({ character: { ...initialCharacter, description: "Changed locally" } })
        act(() => vi.advanceTimersByTime(CHARACTER_AUTOSAVE_DELAY_MS * 2))

        expect(apiMocks.updateCharacter).not.toHaveBeenCalled()
    })

    it("debounces rapid changes and saves the complete latest character", async () => {
        const setCharacter = vi.fn()
        const initialCharacter = makeCharacter()
        const { rerender } = renderHook(
            ({ character }) =>
                useAutosaveCharacter(character, setCharacter, true, remoteFor(initialCharacter)),
            {
                initialProps: { character: initialCharacter },
                wrapper: makeWrapper()
            }
        )

        rerender({ character: { ...initialCharacter, description: "First edit" } })
        act(() => vi.advanceTimersByTime(CHARACTER_AUTOSAVE_DELAY_MS / 2))

        const latestCharacter = { ...initialCharacter, description: "Latest edit" }
        rerender({ character: latestCharacter })
        act(() => vi.advanceTimersByTime(CHARACTER_AUTOSAVE_DELAY_MS - 1))
        expect(apiMocks.updateCharacter).not.toHaveBeenCalled()

        await act(async () => {
            vi.advanceTimersByTime(1)
            await finishPendingPromises()
        })

        expect(apiMocks.updateCharacter).toHaveBeenCalledTimes(1)
        expect(apiMocks.updateCharacter).toHaveBeenCalledWith(
            "character-1",
            {
                name: latestCharacter.name,
                data: latestCharacter,
                version: latestCharacter.version,
                characterVersion: 0
            },
            expect.any(Function)
        )
        expect(setCharacter).toHaveBeenCalledWith(expect.any(Function))

        const applySavedVersion = setCharacter.mock.calls[0][0] as (
            character: Character
        ) => Character
        expect(applySavedVersion(latestCharacter).characterVersion).toBe(2)
    })

    it("queues changes made while a save is in flight", async () => {
        let resolveFirstSave: ((value: unknown) => void) | undefined
        apiMocks.updateCharacter
            .mockImplementationOnce(
                () =>
                    new Promise((resolve) => {
                        resolveFirstSave = resolve
                    })
            )
            .mockResolvedValueOnce({
                id: "character-1",
                characterVersion: 3,
                data: { characterVersion: 3 }
            })

        const initialCharacter = makeCharacter()
        const { rerender } = renderHook(
            ({ character }) =>
                useAutosaveCharacter(character, vi.fn(), true, remoteFor(initialCharacter)),
            {
                initialProps: { character: initialCharacter },
                wrapper: makeWrapper()
            }
        )

        rerender({ character: { ...initialCharacter, description: "First edit" } })
        await act(async () => {
            vi.advanceTimersByTime(CHARACTER_AUTOSAVE_DELAY_MS)
            await finishPendingPromises()
        })
        expect(apiMocks.updateCharacter).toHaveBeenCalledTimes(1)

        const latestCharacter = { ...initialCharacter, description: "Edit during save" }
        rerender({ character: latestCharacter })
        await act(async () => {
            vi.advanceTimersByTime(CHARACTER_AUTOSAVE_DELAY_MS)
            await finishPendingPromises()
        })
        expect(apiMocks.updateCharacter).toHaveBeenCalledTimes(1)

        await act(async () => {
            resolveFirstSave?.({
                id: "character-1",
                characterVersion: 2,
                data: { characterVersion: 2 }
            })
            await finishPendingPromises()
            vi.advanceTimersByTime(CHARACTER_AUTOSAVE_DELAY_MS)
            await finishPendingPromises()
        })

        expect(apiMocks.updateCharacter).toHaveBeenCalledTimes(2)
        expect(apiMocks.updateCharacter.mock.calls[1][1].data).toEqual({
            ...latestCharacter,
            characterVersion: 2
        })
    })

    it("cancels a pending save when a different character is loaded", () => {
        const initialCharacter = makeCharacter()
        const { rerender } = renderHook(
            ({ character }) =>
                useAutosaveCharacter(character, vi.fn(), true, remoteFor(initialCharacter)),
            {
                initialProps: { character: initialCharacter },
                wrapper: makeWrapper()
            }
        )

        rerender({ character: { ...initialCharacter, description: "Pending edit" } })
        rerender({ character: makeCharacter({ id: "character-2", name: "Bea" }) })
        act(() => vi.advanceTimersByTime(CHARACTER_AUTOSAVE_DELAY_MS * 2))

        expect(apiMocks.updateCharacter).not.toHaveBeenCalled()
    })

    it("saves a restored dirty draft after ownership loading without another edit", async () => {
        const server = makeCharacter({ description: "Server base" })
        const draft = { ...server, description: "Recovered offline edit" }
        const { rerender } = renderHook(
            ({ enabled }) => useAutosaveCharacter(draft, vi.fn(), enabled, remoteFor(server)),
            {
                initialProps: { enabled: false },
                wrapper: makeWrapper()
            }
        )
        rerender({ enabled: true })
        await act(async () => {
            vi.advanceTimersByTime(CHARACTER_AUTOSAVE_DELAY_MS)
            await finishPendingPromises()
        })
        expect(apiMocks.updateCharacter).toHaveBeenCalledWith(
            server.id,
            expect.objectContaining({ characterVersion: 0, data: draft }),
            expect.any(Function)
        )
    })

    it("preserves a restored draft when the cloud revision has changed", async () => {
        const server = makeCharacter({ description: "Other device edit", characterVersion: 2 })
        const draft = makeCharacter({ description: "Offline draft", characterVersion: 1 })
        renderHook(() => useAutosaveCharacter(draft, vi.fn(), true, remoteFor(server)), {
            wrapper: makeWrapper()
        })
        await act(async () => {
            vi.advanceTimersByTime(CHARACTER_AUTOSAVE_DELAY_MS * 3)
            await finishPendingPromises()
        })
        expect(apiMocks.updateCharacter).not.toHaveBeenCalled()
        expect(posthog.captureException).toHaveBeenCalledWith(
            expect.any(Error),
            expect.objectContaining({
                operation: "autosave",
                failure_reason: "version_conflict",
                severity: "error"
            })
        )
        expect(
            JSON.parse(localStorage.getItem("progeny-character-recovery")!)[0].character
        ).toEqual(draft)
        expect(posthog.captureException).toHaveBeenCalledWith(
            expect.any(Error),
            expect.objectContaining({
                local_version: 1,
                remote_version: 2,
                has_confirmed_base: false
            })
        )
    })

    it("reports a blocked draft once across reloads", async () => {
        const server = makeCharacter({ description: "Other device edit", characterVersion: 2 })
        const draft = makeCharacter({ description: "Offline draft", characterVersion: 1 })
        for (let load = 0; load < 2; load++) {
            const { unmount } = renderHook(
                () => useAutosaveCharacter(draft, vi.fn(), true, remoteFor(server)),
                { wrapper: makeWrapper() }
            )
            await act(async () => {
                vi.advanceTimersByTime(CHARACTER_AUTOSAVE_DELAY_MS)
                await finishPendingPromises()
            })
            unmount()
        }
        expect(apiMocks.updateCharacter).not.toHaveBeenCalled()
        expect(posthog.captureException).toHaveBeenCalledTimes(1)
    })

    it("continues from its own save when a reload lost the save response", async () => {
        const useStatefulAutosave = (initial: Character, remote: CharacterApiResponse) => {
            const [character, setCharacter] = useState(initial)
            useAutosaveCharacter(character, setCharacter, true, remote)
            return setCharacter
        }
        const base = makeCharacter({ description: "Cloud base", characterVersion: 1 })
        const sent = { ...base, description: "Power picked" }
        // The server stores the save, but the tab reloads before the response arrives.
        apiMocks.updateCharacter.mockImplementationOnce(() => new Promise(() => undefined))
        const firstLoad = renderHook(() => useStatefulAutosave(base, remoteFor(base)), {
            wrapper: makeWrapper()
        })
        act(() => firstLoad.result.current(sent))
        await act(async () => {
            vi.advanceTimersByTime(CHARACTER_AUTOSAVE_DELAY_MS)
            await finishPendingPromises()
        })
        expect(apiMocks.updateCharacter).toHaveBeenCalledTimes(1)
        firstLoad.unmount()

        apiMocks.updateCharacter.mockResolvedValueOnce({
            id: "character-1",
            characterVersion: 3,
            data: { characterVersion: 3 }
        })
        const localDraft = { ...sent, description: "Edited after the lost response" }
        renderHook(
            () => useStatefulAutosave(localDraft, remoteFor({ ...sent, characterVersion: 2 })),
            { wrapper: makeWrapper() }
        )
        await act(async () => {
            vi.advanceTimersByTime(CHARACTER_AUTOSAVE_DELAY_MS)
            await finishPendingPromises()
        })

        expect(posthog.captureException).not.toHaveBeenCalled()
        expect(localStorage.getItem("progeny-character-recovery")).toBeNull()
        expect(apiMocks.updateCharacter).toHaveBeenCalledTimes(2)
        expect(apiMocks.updateCharacter.mock.calls[1][1]).toEqual(
            expect.objectContaining({
                characterVersion: 2,
                data: { ...localDraft, characterVersion: 2 }
            })
        )
    })

    it.each([1, 2])(
        "keeps editing after a foreground save while the local revision is %s",
        async (localVersion) => {
            const client = new QueryClient()
            const wrapper = ({ children }: PropsWithChildren) => (
                <QueryClientProvider client={client}>{children}</QueryClientProvider>
            )
            const base = makeCharacter({ description: "Base", characterVersion: 1 })
            const foreground = { ...base, description: "Explicitly saved" }
            const local = {
                ...foreground,
                description: "Edited again before refresh",
                characterVersion: localVersion
            }
            const hook = renderHook(
                ({ character, remote }) => useAutosaveCharacter(character, vi.fn(), true, remote),
                { initialProps: { character: base, remote: remoteFor(base) }, wrapper }
            )
            await act(async () => {
                await characterPersistence(client).save(foreground, { owned: true })
            })
            hook.rerender({
                character: local,
                remote: remoteFor({ ...foreground, characterVersion: 2 })
            })
            await act(async () => {
                vi.advanceTimersByTime(CHARACTER_AUTOSAVE_DELAY_MS)
                await finishPendingPromises()
            })
            expect(posthog.captureException).not.toHaveBeenCalled()
            expect(localStorage.getItem("progeny-character-recovery")).toBeNull()
            expect(apiMocks.updateCharacter).toHaveBeenCalledTimes(2)
            expect(apiMocks.updateCharacter.mock.calls[1][1]).toMatchObject({
                characterVersion: 2,
                data: { description: local.description }
            })
        }
    )

    it.each(["different content", "newer revision", "replaced draft"])(
        "still blocks divergence from a foreground acknowledgement: %s",
        async (scenario) => {
            const client = new QueryClient()
            const wrapper = ({ children }: PropsWithChildren) => (
                <QueryClientProvider client={client}>{children}</QueryClientProvider>
            )
            const base = makeCharacter({ description: "Base", characterVersion: 1 })
            const foreground = { ...base, description: "Explicitly saved" }
            const hook = renderHook(
                ({ character, remote }) => useAutosaveCharacter(character, vi.fn(), true, remote),
                { initialProps: { character: base, remote: remoteFor(base) }, wrapper }
            )
            await act(async () => {
                await characterPersistence(client).save(foreground, { owned: true })
            })
            if (scenario === "replaced draft") characterPersistence(client).startDraft()
            const remote = {
                ...foreground,
                characterVersion: scenario === "newer revision" ? 3 : 2,
                description:
                    scenario === "different content" ? "External edit" : foreground.description
            }
            hook.rerender({
                character: { ...base, description: "Local edits" },
                remote: remoteFor(remote)
            })
            await act(async () => {
                vi.advanceTimersByTime(CHARACTER_AUTOSAVE_DELAY_MS * 2)
                await finishPendingPromises()
            })
            expect(posthog.captureException).toHaveBeenCalledWith(
                expect.any(Error),
                expect.objectContaining({ failure_reason: "version_conflict" })
            )
            expect(apiMocks.updateCharacter).toHaveBeenCalledTimes(1)
            expect(
                JSON.parse(localStorage.getItem("progeny-character-recovery")!)[0].character
                    .description
            ).toBe("Local edits")
        }
    )

    it.each([true, false])(
        "does not let a pre-conflict foreground acknowledgement undo a 409 (refetch arrived: %s)",
        async (refetchArrived) => {
            const client = new QueryClient()
            const wrapper = ({ children }: PropsWithChildren) => (
                <QueryClientProvider client={client}>{children}</QueryClientProvider>
            )
            const base = makeCharacter({ description: "Base", characterVersion: 1 })
            const foreground = { ...base, description: "Foreground save" }
            const hook = renderHook(
                ({ character, remote }) => useAutosaveCharacter(character, vi.fn(), true, remote),
                { initialProps: { character: base, remote: remoteFor(base) }, wrapper }
            )
            await act(async () => {
                await characterPersistence(client).save(foreground, { owned: true })
            })
            const acknowledged = { ...foreground, characterVersion: 2 }
            if (refetchArrived)
                hook.rerender({ character: acknowledged, remote: remoteFor(acknowledged) })
            apiMocks.updateCharacter.mockRejectedValueOnce(
                Object.assign(new Error("Other device saved revision 3"), { status: 409 })
            )
            const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined)
            hook.rerender({
                character: { ...acknowledged, description: "Pending local edit" },
                remote: remoteFor(refetchArrived ? acknowledged : base)
            })
            await act(async () => {
                vi.advanceTimersByTime(CHARACTER_AUTOSAVE_DELAY_MS)
                await finishPendingPromises()
            })
            expect(apiMocks.updateCharacter).toHaveBeenCalledTimes(2)
            // The refetch has not returned yet; cached revision 2 is still present.
            hook.rerender({
                character: { ...acknowledged, description: "Another local edit" },
                remote: remoteFor(acknowledged)
            })
            await act(async () => {
                vi.advanceTimersByTime(CHARACTER_AUTOSAVE_DELAY_MS * 2)
                await finishPendingPromises()
            })
            expect(apiMocks.updateCharacter).toHaveBeenCalledTimes(2)
            // An explicit successful resolution at a newer revision can unblock edits.
            apiMocks.updateCharacter.mockResolvedValueOnce({ id: base.id, characterVersion: 4 })
            const resolved = {
                ...acknowledged,
                description: "Resolved local edit",
                characterVersion: 3
            }
            await act(async () => {
                await characterPersistence(client).save(resolved, { owned: true, force: true })
            })
            hook.rerender({
                character: {
                    ...resolved,
                    description: "Edit after resolution",
                    characterVersion: 4
                },
                remote: remoteFor({ ...resolved, characterVersion: 4 })
            })
            await act(async () => {
                vi.advanceTimersByTime(CHARACTER_AUTOSAVE_DELAY_MS)
                await finishPendingPromises()
            })
            expect(apiMocks.updateCharacter).toHaveBeenCalledTimes(4)
            expect(apiMocks.updateCharacter.mock.calls[3][1]).toMatchObject({ characterVersion: 4 })
            warn.mockRestore()
        }
    )

    it("retries transient failures after the retry delay", async () => {
        const transientError = Object.assign(new Error("Unavailable"), { status: 503 })
        apiMocks.updateCharacter.mockRejectedValueOnce(transientError).mockResolvedValueOnce({
            id: "character-1",
            characterVersion: 2,
            data: { characterVersion: 2 }
        })
        const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined)
        const initialCharacter = makeCharacter()
        const { rerender } = renderHook(
            ({ character }) =>
                useAutosaveCharacter(character, vi.fn(), true, remoteFor(initialCharacter)),
            {
                initialProps: { character: initialCharacter },
                wrapper: makeWrapper()
            }
        )

        rerender({ character: { ...initialCharacter, description: "Retry me" } })
        await act(async () => {
            vi.advanceTimersByTime(CHARACTER_AUTOSAVE_DELAY_MS)
            await finishPendingPromises()
        })
        expect(apiMocks.updateCharacter).toHaveBeenCalledTimes(1)

        act(() => vi.advanceTimersByTime(CHARACTER_AUTOSAVE_RETRY_DELAY_MS - 1))
        expect(apiMocks.updateCharacter).toHaveBeenCalledTimes(1)

        await act(async () => {
            vi.advanceTimersByTime(1)
            await finishPendingPromises()
        })

        expect(apiMocks.updateCharacter).toHaveBeenCalledTimes(2)
        expect(posthog.capture).toHaveBeenCalledWith(
            "character_operation_warning",
            expect.objectContaining({
                operation: "autosave",
                http_status: 503,
                severity: "warning"
            })
        )
        expect(posthog.captureException).not.toHaveBeenCalled()
        warn.mockRestore()
    })
})

describe("isOwnedSavedCharacter", () => {
    const characters = [
        { id: "owned", shared: false },
        { id: "shared", shared: true }
    ]

    it("accepts a character owned by the current user", () => {
        expect(isOwnedSavedCharacter("owned", characters)).toBe(true)
    })

    it.each(["shared", "missing", ""])("rejects the ineligible character %s", (id) => {
        expect(isOwnedSavedCharacter(id, characters)).toBe(false)
    })
})
