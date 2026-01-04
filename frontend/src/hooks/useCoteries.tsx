import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "../utils/api"
import { isBackendDisabled } from "../utils/backend"

export const useCoteries = () => {
    return useQuery({
        queryKey: ["coteries"],
        queryFn: () => api.getCoteries(),
        enabled: !isBackendDisabled(), // Disable query if backend is disabled
    })
}

export const useCoterie = (id: string | null) => {
    return useQuery({
        queryKey: ["coteries", id],
        queryFn: () => (id ? api.getCoterie(id) : null),
        enabled: !!id && !isBackendDisabled(), // Disable query if backend is disabled
    })
}

export const useCreateCoterie = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: { name: string }) => api.createCoterie(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["coteries"] })
        },
    })
}

export const useUpdateCoterie = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: { name?: string } }) => api.updateCoterie(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["coteries"] })
            queryClient.invalidateQueries({ queryKey: ["coteries", variables.id] })
        },
    })
}

export const useDeleteCoterie = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string) => api.deleteCoterie(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["coteries"] })
        },
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
        },
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
        },
    })
}
