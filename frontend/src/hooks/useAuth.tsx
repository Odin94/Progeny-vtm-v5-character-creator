import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { api, API_URL } from "../utils/api"
import { isBackendDisabled } from "../utils/backend"
import posthog from "posthog-js"

type User = {
    id: string
    email: string
    firstName?: string
    lastName?: string
    nickname?: string | null
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
        enabled: !isBackendDisabled(),
        retry: (failureCount, error) => {
            const status = (error as Error & { status?: number })?.status
            if (status && status >= 400 && status < 500) {
                return false
            }
            if (failureCount < 2) {
                return true
            }
            return false
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000), // Exponential backoff
        staleTime: 5 * 60 * 1000, // 5 minutes
    })

    // Identify user in PostHog when query succeeds (for already-authenticated users)
    useEffect(() => {
        if (user) {
            try {
                posthog.identify(user.id, {
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                })
            } catch (error) {
                console.warn("PostHog identify failed:", error)
            }
        }
    }, [user])

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

            // Reset PostHog user identification on logout
            try {
                posthog.reset()
            } catch (error) {
                console.warn("PostHog reset failed:", error)
            }

            // If WorkOS provided a logout URL, navigate to it, otherwise go home
            if (data.logoutUrl) {
                window.location.href = data.logoutUrl
            } else {
                window.location.href = "/"
            }
        },
        onError: () => {
            queryClient.setQueryData(["auth", "me"], null)

            // Reset PostHog user identification even on error
            try {
                posthog.reset()
            } catch (error) {
                console.warn("PostHog reset failed:", error)
            }

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

            // Identify user in PostHog
            try {
                posthog.identify(data.user.id, {
                    email: data.user.email,
                    firstName: data.user.firstName,
                    lastName: data.user.lastName,
                })
            } catch (error) {
                console.warn("PostHog identify failed:", error)
            }
        },
    })

    const signIn = () => {
        if (isBackendDisabled()) return
        window.location.href = `${API_URL}/auth/login`
    }

    const signOut = () => {
        if (isBackendDisabled()) return
        logoutMutation.mutate()
    }

    const updateProfileMutation = useMutation({
        mutationFn: (data: { nickname?: string | null }) => api.updateUserProfile(data),
        onSuccess: (data) => {
            queryClient.setQueryData(["auth", "me"], data)
            queryClient.invalidateQueries({ queryKey: ["auth", "me"] })
        },
    })

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
        updateProfile: updateProfileMutation.mutate,
        isUpdatingProfile: updateProfileMutation.isPending,
        updateProfileError: updateProfileMutation.error,
    }
}
