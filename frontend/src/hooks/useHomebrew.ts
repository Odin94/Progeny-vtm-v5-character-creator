import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { HomebrewCollectionInput } from "~/data/Homebrew"
import { useAuth } from "~/hooks/useAuth"
import { api } from "~/utils/api"

export const useHomebrewCollections = (enabled = true) =>
    useQuery({
        queryKey: ["homebrew", "collections"],
        queryFn: api.getHomebrewCollections,
        enabled
    })

export const useHomebrewCollection = (id: string | null | undefined, enabled = true) =>
    useQuery({
        queryKey: ["homebrew", "collections", id],
        queryFn: () => api.getHomebrewCollection(id!),
        enabled: enabled && !!id
    })

export const useCharacterHomebrew = (characterId: string | null | undefined) => {
    const { isAuthenticated } = useAuth()

    return useQuery({
        queryKey: ["homebrew", "character", characterId ?? "new"],
        queryFn: async () => {
            if (characterId) return api.getCharacterHomebrew(characterId)

            const collections = await api.getHomebrewCollections()
            return collections.filter((collection) => collection.enabledForAccount)
        },
        enabled: isAuthenticated
    })
}

export const useCoterieHomebrew = (coterieId: string | null | undefined) =>
    useQuery({
        queryKey: ["homebrew", "coterie", coterieId],
        queryFn: () => api.getCoterieHomebrew(coterieId!),
        enabled: !!coterieId
    })

export const useCreateHomebrewCollection = () => {
    const client = useQueryClient()
    return useMutation({
        mutationFn: (input: HomebrewCollectionInput) => api.createHomebrewCollection(input),
        onSuccess: () => client.invalidateQueries({ queryKey: ["homebrew", "collections"] })
    })
}

export const useUpdateHomebrewCollection = () => {
    const client = useQueryClient()
    return useMutation({
        mutationFn: ({ id, input }: { id: string; input: HomebrewCollectionInput }) =>
            api.updateHomebrewCollection(id, input),
        onSuccess: () => client.invalidateQueries({ queryKey: ["homebrew"] })
    })
}

export const useDeleteHomebrewCollection = () => {
    const client = useQueryClient()
    return useMutation({
        mutationFn: api.deleteHomebrewCollection,
        onSuccess: () => client.invalidateQueries({ queryKey: ["homebrew"] })
    })
}

export const useSetCoterieHomebrew = () => {
    const client = useQueryClient()
    return useMutation({
        mutationFn: ({
            coterieId,
            collectionIds
        }: {
            coterieId: string
            collectionIds: string[]
        }) => api.setCoterieHomebrew(coterieId, collectionIds),
        onSuccess: (_, variables) => {
            client.invalidateQueries({ queryKey: ["homebrew", "coterie", variables.coterieId] })
            client.invalidateQueries({ queryKey: ["homebrew", "character"] })
        }
    })
}

export const useSetHomebrewCollectionAccountEnabled = () => {
    const client = useQueryClient()
    return useMutation({
        mutationFn: ({ collectionId, enabled }: { collectionId: string; enabled: boolean }) =>
            api.setHomebrewCollectionAccountEnabled(collectionId, enabled),
        onSuccess: () => {
            client.invalidateQueries({ queryKey: ["homebrew", "collections"] })
            client.invalidateQueries({ queryKey: ["homebrew", "character"] })
        }
    })
}
