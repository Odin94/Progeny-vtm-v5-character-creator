import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "../utils/api"

export const useCharacterShares = (characterId: string | null) => {
    return useQuery({
        queryKey: ["shares", characterId],
        queryFn: () => (characterId ? api.getCharacterShares(characterId) : null),
        enabled: !!characterId,
    })
}

export const useShareCharacter = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ characterId, sharedWithUserEmail }: { characterId: string; sharedWithUserEmail: string }) =>
            api.shareCharacter(characterId, { sharedWithUserEmail }),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["shares", variables.characterId] })
            queryClient.invalidateQueries({ queryKey: ["characters"] })
        },
    })
}

export const useUnshareCharacter = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ characterId, userId }: { characterId: string; userId: string }) => api.unshareCharacter(characterId, userId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["shares", variables.characterId] })
            queryClient.invalidateQueries({ queryKey: ["characters"] })
        },
    })
}
