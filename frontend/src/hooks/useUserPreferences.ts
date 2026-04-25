import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { api } from "../utils/api"
import { useAuth } from "./useAuth"
import {
    type UserPreferences,
    DEFAULT_PREFERENCES,
    loadPreferences,
    savePreferences
} from "../character_sheet/utils/preferences"

export const PREFERENCES_QUERY_KEY = ["user", "preferences"] as const

export const useUserPreferences = () => {
    const { isAuthenticated } = useAuth()
    const queryClient = useQueryClient()

    const [localPreferences, setLocalPreferences] = useState<UserPreferences>(() =>
        loadPreferences()
    )

    const { data: serverPreferences, isLoading } = useQuery({
        queryKey: PREFERENCES_QUERY_KEY,
        queryFn: () => api.getPreferences(),
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000
    })

    useEffect(() => {
        if (serverPreferences) {
            const merged: UserPreferences = {
                colorTheme: serverPreferences.colorTheme ?? null,
                backgroundImage: serverPreferences.backgroundImage ?? null
            }
            savePreferences(merged)
            setLocalPreferences(merged)
        }
    }, [serverPreferences])

    const mutation = useMutation({
        mutationFn: (data: Partial<UserPreferences>) => api.updatePreferences(data),
        onSuccess: (data) => {
            queryClient.setQueryData(PREFERENCES_QUERY_KEY, data)
        }
    })

    const updatePreferences = (partial: Partial<UserPreferences>) => {
        const updated: UserPreferences = {
            ...localPreferences,
            ...partial
        }
        setLocalPreferences(updated)
        savePreferences(updated)
        if (isAuthenticated) {
            mutation.mutate(partial)
        }
    }

    const resetPreferences = () => {
        updatePreferences(DEFAULT_PREFERENCES)
    }

    return {
        preferences: localPreferences,
        updatePreferences,
        resetPreferences,
        isLoading: isAuthenticated && isLoading,
        isSaving: mutation.isPending
    }
}
