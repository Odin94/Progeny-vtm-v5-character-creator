import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "../utils/api"

export const useCoteries = (enabled = true) => {
    return useQuery({
        queryKey: ["coteries"],
        queryFn: () => api.getCoteries(),
        enabled
    })
}

export const useCoterie = (id: string | null) => {
    return useQuery({
        queryKey: ["coteries", id],
        queryFn: () => (id ? api.getCoterie(id) : null),
        enabled: !!id
    })
}

export const useCoterieInvites = (coterieId: string | null) => {
    return useQuery({
        queryKey: ["coteries", coterieId, "invites"],
        queryFn: () => (coterieId ? api.getCoterieInvites(coterieId) : []),
        enabled: !!coterieId
    })
}

export const useCreateCoterie = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: { name: string }) => api.createCoterie(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["coteries"] })
        }
    })
}

export const useUpdateCoterie = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: { name?: string } }) =>
            api.updateCoterie(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["coteries"] })
            queryClient.invalidateQueries({ queryKey: ["coteries", variables.id] })
        }
    })
}

export const useDeleteCoterie = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string) => api.deleteCoterie(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["coteries"] })
        }
    })
}

export const useCreateCoterieInvite = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (coterieId: string) => api.createCoterieInvite(coterieId),
        onSuccess: (_, coterieId) => {
            queryClient.invalidateQueries({ queryKey: ["coteries", coterieId, "invites"] })
        }
    })
}

export const useRevokeCoterieInvite = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ coterieId, inviteId }: { coterieId: string; inviteId: string }) =>
            api.revokeCoterieInvite(coterieId, inviteId),
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
        mutationFn: (token: string) => api.acceptCoterieInvite(token),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["coteries"] })
        }
    })
}

export const useRemoveCoteriePlayer = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ coterieId, membershipId }: { coterieId: string; membershipId: string }) =>
            api.removeCoteriePlayer(coterieId, membershipId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["coteries"] })
            queryClient.invalidateQueries({ queryKey: ["coteries", variables.coterieId] })
        }
    })
}

export const useAddCharacterToCoterie = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ coterieId, characterId }: { coterieId: string; characterId: string }) =>
            api.addCharacterToCoterie(coterieId, { characterId }),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["coteries"] })
            queryClient.invalidateQueries({ queryKey: ["coteries", variables.coterieId] })
        }
    })
}

export const useRemoveCharacterFromCoterie = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ coterieId, characterId }: { coterieId: string; characterId: string }) =>
            api.removeCharacterFromCoterie(coterieId, characterId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["coteries"] })
            queryClient.invalidateQueries({ queryKey: ["coteries", variables.coterieId] })
        }
    })
}
