import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { characterHttp } from "../utils/http/characters"
import { characterPersistence } from "~/modules/characterPersistence"
import { api } from "~/utils/api"
import { useBoundMutation } from "./useBoundMutation"
import type { CreateCharacterPayload, UpdateCharacterPayload } from "../utils/characterApi"

export const useCharacters = (enabled = true) => {
    return useQuery({
        queryKey: ["characters"],
        queryFn: characterHttp.getAll,
        enabled
    })
}

export const useCharacter = (id: string | null, enabled = true) => {
    return useQuery({
        queryKey: ["characters", id],
        queryFn: () => (id ? characterHttp.get(id) : null),
        enabled: enabled && !!id
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
    const client = useQueryClient()
    return useBoundMutation(
        () => characterPersistence(client),
        async (persistence, data: CreateCharacterPayload & { newDocument?: boolean }) => {
            const saved = await persistence.save(
                { ...data.data, name: data.name },
                { owned: false, newDocument: data.newDocument }
            )
            return {
                id: saved.id,
                name: saved.name,
                data: saved,
                characterVersion: saved.characterVersion
            }
        }
    )
}

export const useUpdateCharacter = () => {
    const client = useQueryClient()
    return useBoundMutation(
        () => characterPersistence(client),
        async (persistence, { id, data }: { id: string; data: UpdateCharacterPayload }) => {
            const draft =
                data.data ?? (await api.getCharacter(id, persistence.isCurrentSession)).data
            const saved = await persistence.save(
                { ...draft, id, name: data.name ?? draft.name },
                { owned: true, force: true }
            )
            return {
                id: saved.id,
                name: saved.name,
                data: saved,
                characterVersion: saved.characterVersion
            }
        }
    )
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
