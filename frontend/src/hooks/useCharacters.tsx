import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "../utils/api"

export const useCharacters = (enabled = true) => {
    return useQuery({
        queryKey: ["characters"],
        queryFn: () => api.getCharacters(),
        enabled
    })
}

export const useCharacter = (id: string | null) => {
    return useQuery({
        queryKey: ["characters", id],
        queryFn: () => (id ? api.getCharacter(id) : null)
    })
}

export const useCharacterNotes = (characterId: string | null, enabled = true) => {
    return useQuery({
        queryKey: ["characters", characterId, "notes"],
        queryFn: () => (characterId ? api.getCharacterNotes(characterId) : null),
        enabled: enabled && !!characterId
    })
}

export const useCreateCharacter = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: { name: string; data?: unknown; version?: number }) =>
            api.createCharacter(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["characters"] })
            queryClient.invalidateQueries({ queryKey: ["coteries"] })
            queryClient.invalidateQueries({ queryKey: ["coterieVitals"] })
        }
    })
}

export const useUpdateCharacter = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({
            id,
            data
        }: {
            id: string
            data: { name?: string; data?: unknown; version?: number }
        }) => api.updateCharacter(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["characters"] })
            queryClient.invalidateQueries({ queryKey: ["characters", variables.id] })
            queryClient.invalidateQueries({ queryKey: ["coteries"] })
            queryClient.invalidateQueries({ queryKey: ["coterieVitals"] })
        }
    })
}

export const useDeleteCharacter = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string) => api.deleteCharacter(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["characters"] })
            queryClient.invalidateQueries({ queryKey: ["coteries"] })
            queryClient.invalidateQueries({ queryKey: ["coterieVitals"] })
        }
    })
}

export const useSaveCharacterNotes = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ characterId, content }: { characterId: string; content: string }) =>
            api.saveCharacterNotes(characterId, { content }),
        onSuccess: (data, variables) => {
            queryClient.setQueryData(["characters", variables.characterId, "notes"], data)
        }
    })
}

export const useRestoreCharacterNoteVersion = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ characterId, versionId }: { characterId: string; versionId: string }) =>
            api.restoreCharacterNoteVersion(characterId, versionId),
        onSuccess: (data, variables) => {
            queryClient.setQueryData(["characters", variables.characterId, "notes"], data)
        }
    })
}
