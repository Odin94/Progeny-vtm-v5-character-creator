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
        retry: (failureCount, error) => {
            // Retry up to 2 times for network/auth errors
            if (failureCount < 2) {
                return true
            }
            return false
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000), // Exponential backoff
        staleTime: 5 * 60 * 1000, // 5 minutes
    })

    const refreshAuth = async () => {
        // Invalidate the query cache first to force a fresh fetch
        queryClient.invalidateQueries({ queryKey: ["auth", "me"] })
        // Then refetch
        return refetch()
    }

    const logoutMutation = useMutation({
        mutationFn: () => api.logout(),
        onSuccess: (data) => {
            queryClient.setQueryData(["auth", "me"], null)
            // If WorkOS provided a logout URL, navigate to it, otherwise go home
            if (data.logoutUrl) {
                window.location.href = data.logoutUrl
            } else {
                window.location.href = "/"
            }
        },
        onError: () => {
            queryClient.setQueryData(["auth", "me"], null)
            // Even on error, try to go home
            window.location.href = "/"
        },
    })

    const handleCallbackMutation = useMutation({
        mutationFn: ({ code, state }: { code: string; state?: string }) => api.handleAuthCallback(code, state),
        onSuccess: (data) => {
            // Update the auth query cache with the user data
            queryClient.setQueryData(["auth", "me"], data.user)
            // Invalidate to ensure fresh data
            queryClient.invalidateQueries({ queryKey: ["auth", "me"] })
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
        handleCallback: handleCallbackMutation.mutate,
        isHandlingCallback: handleCallbackMutation.isPending,
        callbackError: handleCallbackMutation.error,
    }
}
