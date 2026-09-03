import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { characterHttp } from "../utils/http/characters"
import type { CreateCharacterPayload, UpdateCharacterPayload } from "../utils/characterApi"

export const useCharacters = (enabled = true) => {
    return useQuery({
        queryKey: ["characters"],
        queryFn: characterHttp.getAll,
        enabled
    })
}

export const useCharacter = (id: string | null) => {
    return useQuery({
        queryKey: ["characters", id],
        queryFn: () => (id ? characterHttp.get(id) : null)
    })
}

export const useCharacterNotes = (characterId: string | null, enabled = true) => {
    return useQuery({
        queryKey: ["characters", characterId, "notes"],
        queryFn: () => (characterId ? characterHttp.getNotes(characterId) : null),
        enabled: enabled && !!characterId
    })
}

export const useCreateCharacter = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: characterHttp.create,
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
        mutationFn: ({ id, data }: { id: string; data: UpdateCharacterPayload }) =>
            characterHttp.update(id, data),
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
        mutationFn: characterHttp.remove,
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
            characterHttp.saveNotes(characterId, content),
        onSuccess: (data, variables) => {
            queryClient.setQueryData(["characters", variables.characterId, "notes"], data)
        }
    })
}

export const useRestoreCharacterNoteVersion = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ characterId, versionId }: { characterId: string; versionId: string }) =>
            characterHttp.restoreNote(characterId, versionId),
        onSuccess: (data, variables) => {
            queryClient.setQueryData(["characters", variables.characterId, "notes"], data)
        }
    })
}
