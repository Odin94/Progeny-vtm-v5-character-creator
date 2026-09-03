import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { coterieHttp } from "../utils/http/coteries"

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

export const useCreateCoterieInvite = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: coterieHttp.createInvite,
        onSuccess: (_, coterieId) => {
            queryClient.invalidateQueries({ queryKey: ["coteries", coterieId, "invites"] })
        }
    })
}

export const useRevokeCoterieInvite = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ coterieId, inviteId }: { coterieId: string; inviteId: string }) =>
            coterieHttp.revokeInvite(coterieId, inviteId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: ["coteries", variables.coterieId, "invites"]
            })
        }
    })
}

export const useAcceptCoterieInvite = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: coterieHttp.acceptInvite,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["coteries"] })
        }
    })
}

export const useRemoveCoteriePlayer = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ coterieId, membershipId }: { coterieId: string; membershipId: string }) =>
            coterieHttp.removePlayer(coterieId, membershipId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["coteries"] })
            queryClient.invalidateQueries({ queryKey: ["coteries", variables.coterieId] })
        }
    })
}

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

export const useAddCharacterToCoterie = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ coterieId, characterId }: { coterieId: string; characterId: string }) =>
            coterieHttp.addCharacter(coterieId, characterId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["coteries"] })
            queryClient.invalidateQueries({ queryKey: ["coteries", variables.coterieId] })
            queryClient.invalidateQueries({ queryKey: ["coterieVitals"] })
        }
    })
}

export const useRemoveCharacterFromCoterie = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ coterieId, characterId }: { coterieId: string; characterId: string }) =>
            coterieHttp.removeCharacter(coterieId, characterId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["coteries"] })
            queryClient.invalidateQueries({ queryKey: ["coteries", variables.coterieId] })
            queryClient.invalidateQueries({ queryKey: ["coterieVitals"] })
        }
    })
}
