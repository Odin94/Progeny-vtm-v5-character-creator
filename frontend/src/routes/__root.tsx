import { createRootRoute, Outlet, useRouterState } from "@tanstack/react-router"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createTheme, MantineProvider } from "@mantine/core"
import { generateColors } from "@mantine/colors-generator"
import { Notifications } from "@mantine/notifications"
import { useEffect } from "react"
import posthog, { type PostHogConfig } from "posthog-js"
import { PostHogProvider } from "posthog-js/react"
import { globals } from "~/globals"
import BrokenSaveModal from "~/components/BrokenSaveModal"
import ErrorBoundary from "~/components/ErrorBoundary"
import CharacterAutosave from "~/components/CharacterAutosave"
import { CookiesBanner } from "~/components/CookiesBanner"
import RenderProfiler from "~/components/RenderProfiler"
import { inputFocusTheme } from "~/theme/inputFocus"
import { modalTheme } from "~/theme/modal"
import { removeUtmParametersFromCurrentUrl, resetPostHogIdentity } from "~/utils/analytics"
import { AUTH_UNAUTHORIZED_EVENT, type ApiError } from "~/utils/api"
import {
    isFramelessSyntheticNoise,
    isResizeObserverLoopNoise,
    type ExceptionListEntry
} from "~/utils/exceptionFilter"
import {
    monitorSupportConversationResources,
    warmSupportConversation
} from "~/utils/supportConversations"
import RecentChangesGate from "~/components/RecentChangesGate"
import { AuthSignInConfirmation } from "~/components/AuthSignInConfirmation"
import { clearAuthSignInSeed } from "~/hooks/useAuth"

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000,
            retry: (failureCount, error) => {
                const status = (error as ApiError)?.status
                if (status && status >= 400 && status < 500) {
                    return false
                }

                return failureCount < 1
            },
            refetchOnWindowFocus: false
        }
    }
})

const POSTHOG_CONSENT_RETENTION_DAYS = 180

const posthogTracingHeaders =
    typeof window === "undefined"
        ? []
        : [new URL(import.meta.env.VITE_API_URL?.trim() || "/api", window.location.origin).hostname]
const INVITE_QUERY_PARAM = "coterieInvite"

const stripInviteToken = (value: unknown) => {
    if (typeof value !== "string" || !value.includes(INVITE_QUERY_PARAM)) {
        return value
    }

    try {
        const parsed = new URL(value, window.location.origin)
        parsed.searchParams.delete(INVITE_QUERY_PARAM)
        return `${parsed.origin}${parsed.pathname}${parsed.search}${parsed.hash}`
    } catch {
        return value.replace(/([?&]coterieInvite=)[^&#]+/g, "$1[redacted]")
    }
}

const scrubInviteTokensFromProperties = (properties: Record<string, unknown> | undefined) => {
    if (!properties) {
        return
    }

    for (const key of ["$current_url", "$initial_current_url", "current_url", "url"]) {
        properties[key] = stripInviteToken(properties[key])
    }
}

const posthogOptions: Partial<PostHogConfig> = {
    api_host: "https://info.odin-matthias.com",
    ui_host: "https://eu.posthog.com",
    defaults: "2025-05-24",
    capture_exceptions: true,
    cookieless_mode: "on_reject",
    cookie_expiration: POSTHOG_CONSENT_RETENTION_DAYS,
    opt_out_capturing_persistence_type: "cookie",
    tracing_headers: posthogTracingHeaders,
    before_send: (event) => {
        scrubInviteTokensFromProperties(event?.properties)

        if (event && event.event === "$exception") {
            const exceptionList = event.properties?.$exception_list
            const exceptionListEntry: ExceptionListEntry | undefined = Array.isArray(exceptionList)
                ? exceptionList[0]
                : undefined
            const exceptionType = event.properties?.$exception_type ?? exceptionListEntry?.type
            const exceptionMessage =
                event.properties?.$exception_message ?? exceptionListEntry?.value
            const exceptionValue =
                exceptionListEntry?.value ?? event.properties?.$exception_values?.[0]

            if (
                exceptionType === "CustomEvent" ||
                (typeof exceptionValue === "string" && exceptionValue.includes("CustomEvent"))
            ) {
                return null
            }

            if (
                exceptionType === "NotFoundError" &&
                typeof exceptionMessage === "string" &&
                exceptionMessage.includes("removeChild") &&
                exceptionMessage.includes("not a child of this node")
            ) {
                return null
            }

            if (isFramelessSyntheticNoise(exceptionListEntry)) {
                return null
            }

            if (isResizeObserverLoopNoise(exceptionValue, exceptionMessage)) {
                return null
            }

            try {
                const characterData = localStorage.getItem("character")
                if (characterData) {
                    const parsed = JSON.parse(characterData)
                    event.properties = event.properties || {}
                    event.properties.character = parsed
                }
            } catch (_error) {
                // Silently fail
            }
        }
        return event
    }
}

// Restore persisted consent before children such as CookiesBanner read the PostHog client.
monitorSupportConversationResources()
posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_KEY, posthogOptions)
removeUtmParametersFromCurrentUrl()
warmSupportConversation()

const AuthUnauthorizedHandler = () => {
    useEffect(() => {
        const handleUnauthorized = () => {
            const wasAuthenticated = Boolean(queryClient.getQueryData(["auth", "me"]))
            queryClient.setQueryData(["auth", "me"], null)
            // Drop the sign-in seed so an expired session isn't re-seeded on reload.
            clearAuthSignInSeed()
            queryClient.removeQueries({ queryKey: ["characters"] })
            queryClient.removeQueries({ queryKey: ["coteries"] })
            queryClient.removeQueries({ queryKey: ["shares"] })
            queryClient.removeQueries({ queryKey: ["user", "preferences"] })

            // Anonymous /auth/me requests normally return 401. Resetting PostHog for those
            // destroys the loaded Support config and stops its remote-config loader.
            if (wasAuthenticated) {
                try {
                    resetPostHogIdentity()
                } catch (error) {
                    console.warn("PostHog reset failed:", error)
                }
            }
        }

        window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized)
        return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized)
    }, [])

    return null
}

// Catch render crashes from any route, not only the character generator, so a
// failure shows a fallback and reports a component stack instead of a blank page.
// The key resets the boundary on navigation, so a user can recover from a crashed
// route by moving to another one.
const RouteOutlet = () => {
    const pathname = useRouterState({ select: (state) => state.location.pathname })

    return (
        <ErrorBoundary key={pathname}>
            <RenderProfiler id="RouteOutlet">
                <Outlet />
            </RenderProfiler>
        </ErrorBoundary>
    )
}

export const Route = createRootRoute({
    component: () => (
        <QueryClientProvider client={queryClient}>
            <PostHogProvider client={posthog}>
                <MantineProvider
                    theme={createTheme({
                        colors: {
                            red: generateColors("#e03131"),
                            grape: generateColors("#7e4ac9")
                        },
                        primaryColor: "grape",
                        components: { ...inputFocusTheme, ...modalTheme },
                        breakpoints: {
                            xs: "576px",
                            sm: "768px",
                            md: "992px",
                            lg: `${globals.smallScreenW}px`,
                            xl: `${globals.largeScreenW}px`
                        }
                    })}
                    forceColorScheme="dark"
                >
                    <Notifications position="bottom-center" zIndex={3000} />
                    <AuthUnauthorizedHandler />
                    <AuthSignInConfirmation />
                    <CharacterAutosave />
                    <BrokenSaveModal />
                    <CookiesBanner />
                    <RecentChangesGate />
                    <RouteOutlet />
                </MantineProvider>
            </PostHogProvider>
        </QueryClientProvider>
    )
})
