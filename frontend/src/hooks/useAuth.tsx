import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react"
import { api, API_URL, type ApiError, type CurrentUser } from "../utils/api"
import { PREFERENCES_QUERY_KEY } from "./useUserPreferences"
import posthog from "posthog-js"
import { resetPostHogIdentity } from "~/utils/analytics"

const AUTH_RETURN_TO_STORAGE_KEY = "auth:returnTo"
const AUTH_SIGN_IN_SEED_KEY = "auth:signInSeed"
const AUTH_SIGN_IN_CONFIRM_KEY = "auth:signInConfirm"
const DEFAULT_POST_AUTH_PATH = "/"
let signInPending = false
const signInPendingListeners = new Set<() => void>()

const setSignInPending = (pending: boolean) => {
    signInPending = pending
    signInPendingListeners.forEach((listener) => listener())
}

export const clearSignInPending = () => setSignInPending(false)

const subscribeToSignInPending = (listener: () => void) => {
    signInPendingListeners.add(listener)
    return () => signInPendingListeners.delete(listener)
}

// After a successful sign-in the callback does a full-document navigation to the
// returnTo path, which discards the in-memory react-query cache. Persisting the
// user in sessionStorage lets the reloaded page seed the auth query immediately
// so the topbar renders the signed-in state instead of flashing "Loading..." /
// "Sign in" while /auth/me is refetched from scratch.
export const storeAuthSignInSeed = (user: CurrentUser) => {
    try {
        sessionStorage.setItem(AUTH_SIGN_IN_SEED_KEY, JSON.stringify(user))
        sessionStorage.setItem(AUTH_SIGN_IN_CONFIRM_KEY, "1")
    } catch (error) {
        console.warn("Failed to store auth sign-in seed:", error)
    }
}

export const readAuthSignInSeed = (): CurrentUser | null => {
    try {
        const raw = sessionStorage.getItem(AUTH_SIGN_IN_SEED_KEY)
        return raw ? (JSON.parse(raw) as CurrentUser) : null
    } catch {
        return null
    }
}

export const clearAuthSignInSeed = () => {
    try {
        sessionStorage.removeItem(AUTH_SIGN_IN_SEED_KEY)
        sessionStorage.removeItem(AUTH_SIGN_IN_CONFIRM_KEY)
    } catch (error) {
        console.warn("Failed to clear auth sign-in seed:", error)
    }
}

// Read-and-clear the one-shot confirmation flag so a landing "you're signed in"
// toast shows exactly once after the post-sign-in reload.
export const consumeAuthSignInConfirmation = (): CurrentUser | null => {
    let shouldConfirm = false
    try {
        shouldConfirm = sessionStorage.getItem(AUTH_SIGN_IN_CONFIRM_KEY) === "1"
        sessionStorage.removeItem(AUTH_SIGN_IN_CONFIRM_KEY)
    } catch {
        return null
    }
    return shouldConfirm ? readAuthSignInSeed() : null
}

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
    const isSigningIn = useSyncExternalStore(
        subscribeToSignInPending,
        () => signInPending,
        () => false
    )

    useEffect(() => {
        const handlePageShow = (event: PageTransitionEvent) => {
            if (event.persisted) clearSignInPending()
        }
        window.addEventListener("pageshow", handlePageShow)
        return () => window.removeEventListener("pageshow", handlePageShow)
    }, [])

    const {
        data: user,
        isLoading,
        error,
        isError,
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
        // Seed the freshly-reloaded page with the user captured at sign-in so the
        // topbar shows the signed-in state right away. initialDataUpdatedAt: 0
        // marks it stale so a background /auth/me refetch still confirms it.
        initialData: () => readAuthSignInSeed() ?? undefined,
        initialDataUpdatedAt: 0,
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnMount: true,
        refetchOnWindowFocus: false
    })

    const currentUser = user ?? null

    // A failed /auth/me (server/network error — not the expected anonymous 401,
    // which resolves to null) is otherwise invisible in analytics. Capture it once
    // per error so a real sign-in outage becomes a metric, not a replay someone
    // happens to watch.
    const reportedAuthMeErrorRef = useRef<unknown>(null)
    useEffect(() => {
        if (!isError || !error || reportedAuthMeErrorRef.current === error) {
            return
        }
        reportedAuthMeErrorRef.current = error
        try {
            posthog.capture("auth_me_failure", {
                status: (error as ApiError)?.status ?? null,
                message: error instanceof Error ? error.message : String(error)
            })
        } catch (captureError) {
            console.warn("PostHog capture failed:", captureError)
        }
    }, [isError, error])

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

    const refreshAuth = useCallback(async () => {
        // Invalidate the query cache first to force a fresh fetch
        queryClient.invalidateQueries({ queryKey: ["auth", "me"] })
        // Then refetch
        return refetch()
    }, [queryClient, refetch])

    const logoutMutation = useMutation({
        mutationFn: () => api.logout(),
        onSuccess: (data) => {
            queryClient.setQueryData(["auth", "me"], null)
            clearAuthSignInSeed()

            // Reset PostHog user identification on logout
            try {
                resetPostHogIdentity()
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
            clearAuthSignInSeed()

            // Reset PostHog user identification even on error
            try {
                resetPostHogIdentity()
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

    // The redirect to WorkOS is a full-document navigation that takes several
    // seconds. isSigningIn lets callers render a pending label so the click is
    // acknowledged, and the ref ignores repeat clicks while it is in flight.
    const signIn = () => {
        if (signInPending) {
            return
        }
        setSignInPending(true)

        try {
            posthog.capture("sign_in_started")
        } catch (error) {
            console.warn("PostHog capture failed:", error)
        }

        const returnTo = getCurrentReturnTo()
        sessionStorage.setItem(AUTH_RETURN_TO_STORAGE_KEY, returnTo)
        const target = `${API_URL}/auth/login?returnTo=${encodeURIComponent(returnTo)}`

        // Let React paint the pending label before the full-document navigation
        // starts. A synchronous window.location.href here preempts the render, so
        // the page still looks unchanged for the seconds the redirect takes. Two
        // animation frames guarantee one paint of the pending state first.
        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
                window.location.href = target
            })
        })
    }

    const signOut = () => {
        logoutMutation.mutate()
    }

    const updateProfileMutation = useMutation({
        mutationFn: (data: { nickname?: string | null; nameTagVisible?: boolean }) =>
            api.updateUserProfile(data),
        onSuccess: (data, variables) => {
            queryClient.setQueryData(["auth", "me"], data)
            queryClient.invalidateQueries({ queryKey: ["auth", "me"] })

            // The nickname is embedded in several other cached surfaces (the coterie
            // owner row, coterie vitals, and character shares). Invalidate them so a
            // nickname change is reflected without a full page reload.
            if (Object.hasOwn(variables, "nickname")) {
                queryClient.invalidateQueries({ queryKey: ["coteries"] })
                queryClient.invalidateQueries({ queryKey: ["coterieVitals"] })
                queryClient.invalidateQueries({ queryKey: ["shares"] })
            }
        }
    })

    return {
        user: currentUser,
        isLoading,
        isAuthenticated: !!currentUser,
        signIn,
        isSigningIn,
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
