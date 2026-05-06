import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { api, API_URL, type ApiError } from "../utils/api"
import { PREFERENCES_QUERY_KEY } from "./useUserPreferences"
import posthog from "posthog-js"

const AUTH_RETURN_TO_STORAGE_KEY = "auth:returnTo"
const DEFAULT_POST_AUTH_PATH = "/"

const getCurrentReturnTo = () => {
    const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`
    return returnTo === "/auth/callback" ? DEFAULT_POST_AUTH_PATH : returnTo
}

export const getStoredAuthReturnTo = () => sessionStorage.getItem(AUTH_RETURN_TO_STORAGE_KEY)

export const clearStoredAuthReturnTo = () => {
    sessionStorage.removeItem(AUTH_RETURN_TO_STORAGE_KEY)
}

export const getSafeAuthReturnTo = (candidate?: string | null) => {
    const returnTo = candidate || getStoredAuthReturnTo() || DEFAULT_POST_AUTH_PATH

    if (!returnTo.startsWith("/")) {
        return DEFAULT_POST_AUTH_PATH
    }

    if (returnTo.startsWith("//")) {
        return DEFAULT_POST_AUTH_PATH
    }

    try {
        const parsed = new URL(returnTo, window.location.origin)

        if (parsed.origin !== window.location.origin) {
            return DEFAULT_POST_AUTH_PATH
        }

        const safePath = `${parsed.pathname}${parsed.search}${parsed.hash}`
        return safePath === "/auth/callback" ? DEFAULT_POST_AUTH_PATH : safePath
    } catch {
        return DEFAULT_POST_AUTH_PATH
    }
}

export const useAuth = () => {
    const queryClient = useQueryClient()

    const {
        data: user,
        isLoading,
        isFetching,
        refetch
    } = useQuery({
        queryKey: ["auth", "me"],
        queryFn: () => api.getCurrentUser(),
        retry: (failureCount, error) => {
            const status = (error as ApiError)?.status
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
        refetchOnMount: "always",
        refetchOnWindowFocus: true
    })

    const isValidatingCachedAuth = !!user && isFetching
    const currentUser = isValidatingCachedAuth ? null : (user ?? null)

    // Identify user in PostHog when query succeeds (for already-authenticated users)
    useEffect(() => {
        if (currentUser) {
            try {
                posthog.identify(currentUser.id, {
                    email: currentUser.email,
                    firstName: currentUser.firstName,
                    lastName: currentUser.lastName
                })
            } catch (error) {
                console.warn("PostHog identify failed:", error)
            }
        }
    }, [currentUser])

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
        }
    })

    const handleCallbackMutation = useMutation({
        mutationFn: ({ code, state }: { code: string; state?: string }) =>
            api.handleAuthCallback(code, state),
        onSuccess: (data) => {
            // Update the auth query cache with the user data
            queryClient.setQueryData(["auth", "me"], data.user)
            // Invalidate to ensure fresh data
            queryClient.invalidateQueries({ queryKey: ["auth", "me"] })
            // Fetch preferences from backend now that user is authenticated
            queryClient.invalidateQueries({ queryKey: PREFERENCES_QUERY_KEY })

            // Identify user in PostHog
            try {
                posthog.identify(data.user.id, {
                    email: data.user.email,
                    firstName: data.user.firstName,
                    lastName: data.user.lastName
                })
            } catch (error) {
                console.warn("PostHog identify failed:", error)
            }
        }
    })

    const signIn = () => {
        const returnTo = getCurrentReturnTo()
        sessionStorage.setItem(AUTH_RETURN_TO_STORAGE_KEY, returnTo)
        window.location.href = `${API_URL}/auth/login?returnTo=${encodeURIComponent(returnTo)}`
    }

    const signOut = () => {
        logoutMutation.mutate()
    }

    const updateProfileMutation = useMutation({
        mutationFn: (data: { nickname?: string | null }) => api.updateUserProfile(data),
        onSuccess: (data) => {
            queryClient.setQueryData(["auth", "me"], data)
            queryClient.invalidateQueries({ queryKey: ["auth", "me"] })
        }
    })

    return {
        user: currentUser,
        isLoading: isLoading || isValidatingCachedAuth,
        isAuthenticated: !!currentUser,
        signIn,
        signOut,
        refreshAuth,
        handleCallback: handleCallbackMutation.mutate,
        isHandlingCallback: handleCallbackMutation.isPending,
        callbackError: handleCallbackMutation.error,
        updateProfile: updateProfileMutation.mutate,
        isUpdatingProfile: updateProfileMutation.isPending,
        updateProfileError: updateProfileMutation.error
    }
}
