import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api, API_URL } from "../utils/api"

type User = {
    id: string
    email: string
    firstName?: string
    lastName?: string
}

export const useAuth = () => {
    const queryClient = useQueryClient()

    const {
        data: user,
        isLoading: loading,
        refetch,
    } = useQuery({
        queryKey: ["auth", "me"],
        queryFn: () => api.getCurrentUser(),
        retry: false,
        staleTime: 5 * 60 * 1000, // 5 minutes
    })

    const refreshAuth = () => {
        refetch()
    }

    const logoutMutation = useMutation({
        mutationFn: () => api.logout(),
        onSuccess: () => {
            queryClient.setQueryData(["auth", "me"], null)
            window.location.href = "/"
        },
        onError: () => {
            queryClient.setQueryData(["auth", "me"], null)
        },
    })

    const signIn = () => {
        window.location.href = `${API_URL}/auth/login`
    }

    const signOut = () => {
        logoutMutation.mutate()
    }

    return {
        user: user || null,
        loading,
        isAuthenticated: !!user,
        signIn,
        signOut,
        refreshAuth,
    }
}
