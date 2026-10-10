import type { QueryClient } from "@tanstack/react-query"
import { isCharacterEmpty, stableStringify, type Character } from "~/data/Character"
import { api } from "~/utils/api"
import type { CreateCharacterPayload, UpdateCharacterPayload } from "~/utils/characterApi"

export type CharacterOwnership = { id: string; shared?: boolean; canEdit?: boolean }
export const isOwnedSavedCharacter = (
    id: string | undefined,
    characters: CharacterOwnership[] | undefined
) =>
    !!id &&
    !!characters?.some(
        (candidate) =>
            candidate.id === id && candidate.shared !== true && candidate.canEdit !== false
    )

export const characterSwitchDecision = (
    character: Character,
    characters: CharacterOwnership[] | undefined,
    targetId?: string
) => {
    if (targetId && targetId === character.id) return "continue" as const
    if (isCharacterEmpty(character) && !character.name.trim()) return "continue" as const
    if (!characters) return "unavailable" as const
    const current = characters.find((candidate) => candidate.id === character.id)
    if (current?.shared || current?.canEdit === false) return "continue" as const
    return character.name.trim() ? ("save" as const) : ("name" as const)
}

type SavedCharacter = {
    id: string
    characterVersion?: number
    data?: { characterVersion?: number }
    shared?: boolean
    canEdit?: boolean
}
type Transport = {
    get: (id: string) => Promise<SavedCharacter>
    create: (data: CreateCharacterPayload) => Promise<SavedCharacter>
    update: (id: string, data: UpdateCharacterPayload) => Promise<SavedCharacter>
}
export const getCharacterSaveKey = (character: Character) => {
    const { characterVersion: _version, id: _id, ...data } = character
    return stableStringify(data)
}
const savedVersion = (saved: SavedCharacter, fallback: number) =>
    saved.characterVersion ?? saved.data?.characterVersion ?? fallback

// One queue owns both foreground saves and autosave. A failed write releases the
// queue but never acknowledges the draft. Version checks happen AFTER earlier writes.
export const createCharacterPersistence = (
    transport: Transport,
    refresh: (saved: SavedCharacter, created: boolean) => void,
    isCurrentSession: () => boolean = () => true
) => {
    const queues = new Map<string, Promise<unknown>>()
    const acknowledgements = new Map<
        string,
        { key: string; version: number; saved: SavedCharacter }
    >()
    let draftGeneration = 0
    let newDocumentGeneration = 0
    let replacementGeneration = 0
    let transitioning = false
    const transitionListeners = new Set<() => void>()
    const assertCurrentSession = () => {
        if (!isCurrentSession())
            throw new Error(
                "Your account changed while saving. Your draft is still in this browser."
            )
    }
    const replacementGuard = () => {
        const generation = replacementGeneration
        return () => isCurrentSession() && replacementGeneration === generation
    }
    return {
        startDraft: () => {
            draftGeneration += 1
            replacementGeneration += 1
        },
        replaceDraft: (input: Character) => {
            draftGeneration += 1
            replacementGeneration += 1
            return { ...structuredClone(input), id: "" }
        },
        isCurrentSession,
        replacementGuard,
        transitionSnapshot: () => transitioning,
        subscribeTransitions: (listener: () => void) => {
            transitionListeners.add(listener)
            return () => {
                transitionListeners.delete(listener)
            }
        },
        transition: async (operation: (isCurrent: () => boolean) => Promise<void>) => {
            if (transitioning || !isCurrentSession()) return false
            transitioning = true
            transitionListeners.forEach((listener) => listener())
            const isCurrent = replacementGuard()
            try {
                await operation(isCurrent)
                return isCurrent()
            } finally {
                transitioning = false
                transitionListeners.forEach((listener) => listener())
            }
        },
        decision: characterSwitchDecision,
        save: (
            input: Character,
            options: {
                owned: boolean
                beforeSwitch?: boolean
                ownershipLoaded?: boolean
                force?: boolean
                allowCopy?: boolean
                newDocument?: boolean
            }
        ) => {
            const character = structuredClone(input)
            if (options.newDocument) {
                character.id = ""
                character.characterVersion = 0
            }
            const queueId = options.newDocument
                ? `new:${++newDocumentGeneration}`
                : character.id || `draft:${draftGeneration}`
            const generation = draftGeneration
            const acknowledgementKey = (id: string) => `${generation}:${id}`
            const previous = queues.get(queueId)
            const execute = async () => {
                assertCurrentSession()
                if (options.ownershipLoaded === false)
                    throw new Error(
                        "Reload your saved characters before saving or switching characters."
                    )
                if (!character.name.trim())
                    throw new Error("Please give the current character a name before switching.")
                const acknowledged = acknowledgements.get(acknowledgementKey(queueId))
                const key = getCharacterSaveKey(character)
                let targetId = options.owned ? character.id : acknowledged?.saved.id
                if (!targetId && character.id && !options.allowCopy) {
                    const remote = await transport.get(character.id)
                    assertCurrentSession()
                    if (remote.canEdit !== true || remote.shared === true)
                        throw new Error(
                            "Could not verify ownership. Save a copy or discard before switching."
                        )
                    targetId = character.id
                }
                const localVersion = Math.max(
                    character.characterVersion ?? 0,
                    acknowledged?.version ?? 0
                )
                if (options.beforeSwitch && targetId) {
                    const remote = await transport.get(targetId)
                    assertCurrentSession()
                    if (remote.shared === true || remote.canEdit === false)
                        throw new Error("This shared character is read-only. Save a copy instead.")
                    if (savedVersion(remote, 0) > localVersion)
                        throw new Error(
                            `"${character.name}" has a newer version in the database. Resolve that conflict before switching characters.`
                        )
                }
                // An overlapping explicit save can use the autosave acknowledgement.
                if (!options.force && acknowledged?.key === key)
                    return {
                        ...character,
                        id: acknowledged.saved.id,
                        characterVersion: acknowledged.version
                    }
                const data = {
                    ...character,
                    ...(targetId ? { id: targetId } : {}),
                    characterVersion: localVersion
                }
                const payload = {
                    name: data.name,
                    data,
                    version: data.version,
                    characterVersion: localVersion
                }
                assertCurrentSession()
                const saved = targetId
                    ? await transport.update(targetId, payload)
                    : await transport.create(payload)
                assertCurrentSession()
                const version = savedVersion(saved, localVersion)
                acknowledgements.set(acknowledgementKey(queueId), { key, version, saved })
                acknowledgements.set(acknowledgementKey(saved.id), {
                    key: getCharacterSaveKey({ ...character, id: saved.id }),
                    version,
                    saved
                })
                const tail = queues.get(queueId)
                if (tail) queues.set(saved.id, tail)
                // Refresh is deliberately non-blocking: a successful durable save must not
                // be reported as failed simply because a background read fails.
                refresh(saved, !targetId)
                return { ...character, id: saved.id, characterVersion: version }
            }
            const pending = previous ? previous.catch(() => undefined).then(execute) : execute()
            queues.set(queueId, pending)
            void pending
                .finally(() => {
                    for (const [id, tail] of queues) {
                        if (tail === pending) queues.delete(id)
                    }
                })
                .catch(() => undefined)
            return pending
        },
        settle: async (id: string | undefined) => {
            const key = id || `draft:${draftGeneration}`
            while (queues.has(key)) await queues.get(key)?.catch(() => undefined)
        }
    }
}

const coordinators = new WeakMap<
    QueryClient,
    { accountId: string | null; module: ReturnType<typeof createCharacterPersistence> }
>()
export const characterPersistence = (queryClient: QueryClient) => {
    const account = () =>
        queryClient.getQueryData<{ id: string } | null>(["auth", "me"])?.id ?? null
    const accountId = account()
    let entry = coordinators.get(queryClient)
    if (!entry || entry.accountId !== accountId) {
        const isCurrentSession = () =>
            account() === accountId && coordinators.get(queryClient)?.module === module
        const module = createCharacterPersistence(
            {
                get: (id) => api.getCharacter(id, isCurrentSession),
                create: (data) => api.createCharacter(data, isCurrentSession),
                update: (id, data) => api.updateCharacter(id, data, isCurrentSession)
            },
            (saved, created) => {
                if (created) {
                    const owned = { ...saved, shared: false, canEdit: true }
                    queryClient.setQueryData(["characters", saved.id], owned)
                    queryClient.setQueryData<SavedCharacter[]>(["characters"], (previous) =>
                        previous
                            ? [...previous.filter((entry) => entry.id !== saved.id), owned]
                            : undefined
                    )
                }
                for (const key of ["characters", "coteries", "coterieVitals"])
                    void queryClient.invalidateQueries({ queryKey: [key] })
            },
            isCurrentSession
        )
        entry = { accountId, module }
        coordinators.set(queryClient, entry)
    }
    return entry.module
}
