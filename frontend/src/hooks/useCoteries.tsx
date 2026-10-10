import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { coterieHttp } from "../utils/http/coteries"
import { useSyncExternalStore } from "react"
import { useBoundMutation } from "./useBoundMutation"
import { coterieMembership, type MembershipCommand } from "~/modules/coterieMembership"
import type { AcceptCoterieInviteResponse, CreatedCoterieInviteResponse } from "~/utils/api"

export const useCoterieMembership = (coterieId: string | null) => {
    const client = useQueryClient()
    const module = coterieMembership(client)
    const state = useSyncExternalStore(module.subscribe, module.snapshot, module.snapshot)
    return { ...module, generatedInviteUrl: coterieId ? state.inviteUrls.get(coterieId) || "" : "" }
}
const useMembershipOperation = <Variables, Result = void>(
    type: MembershipCommand["type"],
    command: (variables: Variables) => MembershipCommand
) => {
    const client = useQueryClient()
    const module = coterieMembership(client)
    const state = useSyncExternalStore(module.subscribe, module.snapshot, module.snapshot)
    const mutation = useBoundMutation(
        () => coterieMembership(client),
        (owner, variables: Variables) => owner.run<Result>(command(variables))
    )
    return {
        ...mutation,
        isPending:
            mutation.isPending ||
            [...state.pending].some((key) => (JSON.parse(key) as MembershipCommand).type === type)
    }
}

export const useCoteries = (enabled = true) => {
    return useQuery({
        queryKey: ["coteries"],
        queryFn: coterieHttp.getAll,
        enabled
    })
}

export const useCoterieVitals = (enabled = true) => {
    return useQuery({
        queryKey: ["coterieVitals"],
        queryFn: coterieHttp.getVitals,
        enabled,
        refetchInterval: enabled ? 2000 : false,
        refetchIntervalInBackground: false,
        refetchOnWindowFocus: true
    })
}

export const useCoterie = (id: string | null) => {
    return useQuery({
        queryKey: ["coteries", id],
        queryFn: () => (id ? coterieHttp.get(id) : null),
        enabled: !!id
    })
}

export const useCoterieInvites = (coterieId: string | null) => {
    return useQuery({
        queryKey: ["coteries", coterieId, "invites"],
        queryFn: () => (coterieId ? coterieHttp.getInvites(coterieId) : []),
        enabled: !!coterieId
    })
}

export const useCoterieNotes = (coterieId: string | null) => {
    return useQuery({
        queryKey: ["coteries", coterieId, "notes"],
        queryFn: () => (coterieId ? coterieHttp.getNotes(coterieId) : null),
        enabled: !!coterieId
    })
}

export const useCreateCoterie = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: coterieHttp.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["coteries"] })
            queryClient.invalidateQueries({ queryKey: ["coterieVitals"] })
        }
    })
}

export const useUpdateCoterie = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: { name?: string } }) =>
            coterieHttp.update(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["coteries"] })
            queryClient.invalidateQueries({ queryKey: ["coteries", variables.id] })
            queryClient.invalidateQueries({ queryKey: ["coterieVitals"] })
        }
    })
}

export const useDeleteCoterie = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: coterieHttp.remove,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["coteries"] })
            queryClient.invalidateQueries({ queryKey: ["coterieVitals"] })
        }
    })
}

export const useCreateCoterieInvite = () =>
    useMembershipOperation<string, CreatedCoterieInviteResponse>("createInvite", (coterieId) => ({
        type: "createInvite",
        coterieId
    }))
export const useRevokeCoterieInvite = () =>
    useMembershipOperation<{ coterieId: string; inviteId: string }>(
        "revokeInvite",
        (variables) => ({ type: "revokeInvite", ...variables })
    )
export const useAcceptCoterieInvite = () =>
    useMembershipOperation<string, AcceptCoterieInviteResponse>("acceptInvite", (token) => ({
        type: "acceptInvite",
        token
    }))
export const useRemoveCoteriePlayer = () =>
    useMembershipOperation<{ coterieId: string; membershipId: string }>(
        "removePlayer",
        (variables) => ({ type: "removePlayer", ...variables })
    )

export const useSaveCoterieNotes = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ coterieId, content }: { coterieId: string; content: string }) =>
            coterieHttp.saveNotes(coterieId, content),
        onSuccess: (data, variables) => {
            queryClient.setQueryData(["coteries", variables.coterieId, "notes"], data)
        }
    })
}

export const useRestoreCoterieNoteVersion = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ coterieId, versionId }: { coterieId: string; versionId: string }) =>
            coterieHttp.restoreNote(coterieId, versionId),
        onSuccess: (data, variables) => {
            queryClient.setQueryData(["coteries", variables.coterieId, "notes"], data)
        }
    })
}

export const useAddCharacterToCoterie = () =>
    useMembershipOperation<{ coterieId: string; characterId: string }, unknown>(
        "addCharacter",
        (variables) => ({ type: "addCharacter", ...variables })
    )
export const useRemoveCharacterFromCoterie = () =>
    useMembershipOperation<{ coterieId: string; characterId: string }>(
        "removeCharacter",
        (variables) => ({ type: "removeCharacter", ...variables })
    )
