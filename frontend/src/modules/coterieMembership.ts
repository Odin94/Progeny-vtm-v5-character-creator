import type { QueryClient } from "@tanstack/react-query"
import type { CoterieResponse } from "~/utils/api"
import { coterieHttp } from "~/utils/http/coteries"

export type MembershipCommand =
    | { type: "createInvite"; coterieId: string }
    | { type: "revokeInvite"; coterieId: string; inviteId: string }
    | { type: "acceptInvite"; token: string }
    | { type: "removePlayer"; coterieId: string; membershipId: string }
    | { type: "addCharacter" | "removeCharacter"; coterieId: string; characterId: string }

type MembershipState = {
    pending: ReadonlySet<string>
    errors: ReadonlyMap<string, unknown>
    inviteUrls: ReadonlyMap<string, string>
}
type MembershipEnvironment = {
    coterie: (id: string) => CoterieResponse | undefined
    refresh: (keys: string[]) => void
    location: () => string
    replaceLocation: (url: string) => void
}
export const membershipCommandKey = (command: MembershipCommand) => JSON.stringify(command)

// Own the operation lifetime, duplicate-submit protection, invite bearer URL and
// affected reads together. Authorization remains enforced by the unchanged backend.
export const createCoterieMembership = (
    transport: Pick<
        typeof coterieHttp,
        | "createInvite"
        | "revokeInvite"
        | "acceptInvite"
        | "removePlayer"
        | "addCharacter"
        | "removeCharacter"
    >,
    environment: MembershipEnvironment,
    isCurrentSession: () => boolean = () => true
) => {
    let state: MembershipState = { pending: new Set(), errors: new Map(), inviteUrls: new Map() }
    const listeners = new Set<() => void>()
    const flights = new Map<string, Promise<unknown>>()
    const consumedTokens = new Set<string>()
    const inviteGenerations = new Map<string, number>()
    const publish = (next: MembershipState) => {
        state = next
        listeners.forEach((listener) => listener())
    }
    const forgetInvite = (coterieId: string) => {
        inviteGenerations.set(coterieId, (inviteGenerations.get(coterieId) ?? 0) + 1)
        const urls = new Map(state.inviteUrls)
        urls.delete(coterieId)
        publish({ ...state, inviteUrls: urls })
    }
    const perform = async <T>(request: () => Promise<T>) => {
        if (!isCurrentSession()) throw new Error("Your account changed. Retry this operation.")
        const result = await request()
        if (!isCurrentSession()) throw new Error("Your account changed. Retry this operation.")
        return result
    }
    const execute = async (command: MembershipCommand) => {
        if (command.type !== "acceptInvite") {
            const coterie = environment.coterie(command.coterieId)
            if (
                (command.type === "createInvite" || command.type === "revokeInvite") &&
                coterie?.canManageInvites === false
            )
                throw new Error("Only the coterie owner can manage invites.")
            if (command.type === "removePlayer" && coterie?.canManagePlayers === false)
                throw new Error("Only the coterie owner can remove players.")
            if (
                command.type === "removePlayer" &&
                coterie?.players?.some(
                    (player) => player.isOwner && player.membershipId === command.membershipId
                )
            )
                throw new Error("The coterie owner cannot be removed.")
        }
        switch (command.type) {
            case "createInvite": {
                const generation = inviteGenerations.get(command.coterieId) ?? 0
                const invite = await perform(() => transport.createInvite(command.coterieId))
                if (
                    invite.token &&
                    generation === (inviteGenerations.get(command.coterieId) ?? 0)
                ) {
                    const url = new URL("/me", environment.location())
                    url.searchParams.set("coterieInvite", invite.token)
                    const urls = new Map(state.inviteUrls)
                    urls.set(command.coterieId, url.toString())
                    publish({ ...state, inviteUrls: urls })
                }
                environment.refresh(["coteries"])
                return invite
            }
            case "revokeInvite": {
                const result = await perform(() =>
                    transport.revokeInvite(command.coterieId, command.inviteId)
                )
                forgetInvite(command.coterieId)
                environment.refresh(["coteries"])
                return result
            }
            case "acceptInvite": {
                try {
                    const result = await perform(() => transport.acceptInvite(command.token))
                    environment.refresh(["coteries", "coterieVitals", "characters"])
                    return result
                } finally {
                    const url = new URL(environment.location())
                    if (
                        isCurrentSession() &&
                        url.searchParams.get("coterieInvite") === command.token
                    ) {
                        url.searchParams.delete("coterieInvite")
                        environment.replaceLocation(`${url.pathname}${url.search}${url.hash}`)
                    }
                }
            }
            case "removePlayer": {
                const result = await perform(() =>
                    transport.removePlayer(command.coterieId, command.membershipId)
                )
                environment.refresh(["coteries", "coterieVitals", "characters"])
                return result
            }
            case "addCharacter":
            case "removeCharacter": {
                const result = await perform(() =>
                    transport[command.type](command.coterieId, command.characterId)
                )
                environment.refresh(["coteries", "coterieVitals", "characters"])
                return result
            }
        }
    }
    return {
        subscribe: (listener: () => void) => {
            listeners.add(listener)
            return () => {
                listeners.delete(listener)
            }
        },
        snapshot: () => state,
        forgetInvite,
        claimInvite: (token: string) => {
            if (consumedTokens.has(token)) return false
            consumedTokens.add(token)
            return true
        },
        run: <T = unknown>(command: MembershipCommand): Promise<T> => {
            const key = membershipCommandKey(command)
            const existing = flights.get(key)
            if (existing) return existing as Promise<T>
            const pending = new Set(state.pending)
            pending.add(key)
            const errors = new Map(state.errors)
            errors.delete(key)
            publish({ ...state, pending, errors })
            const flight = execute(command)
                .catch((error) => {
                    const errors = new Map(state.errors)
                    errors.set(key, error)
                    publish({ ...state, errors })
                    throw error
                })
                .finally(() => {
                    flights.delete(key)
                    const pending = new Set(state.pending)
                    pending.delete(key)
                    publish({ ...state, pending })
                })
            flights.set(key, flight)
            return flight as Promise<T>
        }
    }
}
const modules = new WeakMap<
    QueryClient,
    { accountId: string | null; module: ReturnType<typeof createCoterieMembership> }
>()
export const coterieMembership = (client: QueryClient) => {
    const account = () => client.getQueryData<{ id: string } | null>(["auth", "me"])?.id ?? null
    const accountId = account()
    let entry = modules.get(client)
    if (!entry || entry.accountId !== accountId) {
        const isCurrentSession = () =>
            account() === accountId && modules.get(client)?.module === module
        const module = createCoterieMembership(
            {
                createInvite: (id) => coterieHttp.createInvite(id, isCurrentSession),
                revokeInvite: (id, inviteId) =>
                    coterieHttp.revokeInvite(id, inviteId, isCurrentSession),
                acceptInvite: (token) => coterieHttp.acceptInvite(token, isCurrentSession),
                removePlayer: (id, memberId) =>
                    coterieHttp.removePlayer(id, memberId, isCurrentSession),
                addCharacter: (id, characterId) =>
                    coterieHttp.addCharacter(id, characterId, isCurrentSession),
                removeCharacter: (id, characterId) =>
                    coterieHttp.removeCharacter(id, characterId, isCurrentSession)
            },
            {
                coterie: (id) =>
                    client.getQueryData<CoterieResponse>(["coteries", id]) ??
                    client
                        .getQueryData<CoterieResponse[]>(["coteries"])
                        ?.find((coterie) => coterie.id === id),
                refresh: (keys) => {
                    keys.forEach((key) => {
                        void client.invalidateQueries({ queryKey: [key] })
                    })
                },
                location: () => window.location.href,
                replaceLocation: (url) => window.history.replaceState(null, "", url)
            },
            isCurrentSession
        )
        entry = { accountId, module }
        modules.set(client, entry)
    }
    return entry.module
}
