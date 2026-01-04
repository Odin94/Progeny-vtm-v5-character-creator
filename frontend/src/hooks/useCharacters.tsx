import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "../utils/api"
import { isBackendDisabled } from "../utils/backend"

export const useCharacters = () => {
    return useQuery({
        queryKey: ["characters"],
        queryFn: () => api.getCharacters(),
        enabled: !isBackendDisabled(), // Disable query if backend is disabled
    })
}

export const useCharacter = (id: string | null) => {
    return useQuery({
        queryKey: ["characters", id],
        queryFn: () => (id ? api.getCharacter(id) : null),
        enabled: !!id && !isBackendDisabled(), // Disable query if backend is disabled
    })
}

export const useCreateCharacter = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: { name: string; data?: unknown; version?: number }) => api.createCharacter(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["characters"] })
        },
    })
}

export const useUpdateCharacter = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: { name?: string; data?: unknown; version?: number } }) =>
            api.updateCharacter(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["characters"] })
            queryClient.invalidateQueries({ queryKey: ["characters", variables.id] })
        },
    })
}

export const useDeleteCharacter = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string) => api.deleteCharacter(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["characters"] })
        },
    })
}
