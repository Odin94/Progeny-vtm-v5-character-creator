import { createRootRoute, Outlet } from "@tanstack/react-router"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createTheme, MantineProvider } from "@mantine/core"
import { generateColors } from "@mantine/colors-generator"
import { Notifications } from "@mantine/notifications"
import { useEffect } from "react"
import posthog, { type PostHogConfig } from "posthog-js"
import { PostHogProvider } from "posthog-js/react"
import { globals } from "~/globals"
import BrokenSaveModal from "~/components/BrokenSaveModal"
import { CookiesBanner } from "~/components/CookiesBanner"
import RenderProfiler from "~/components/RenderProfiler"
import { inputFocusTheme } from "~/theme/inputFocus"
import { resetPostHogIdentity } from "~/utils/analytics"
import { AUTH_UNAUTHORIZED_EVENT, type ApiError } from "~/utils/api"

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
    before_send: (event) => {
        scrubInviteTokensFromProperties(event?.properties)

        if (event && event.event === "$exception") {
            const exceptionList = event.properties?.$exception_list
            const exceptionListEntry = Array.isArray(exceptionList) ? exceptionList[0] : undefined
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

            // Drop synthetic captures of non-Error values thrown by injected scripts /
            // browser extensions (e.g. a bare string "he" swept up by posthog-js's global
            // uncaught handler). These arrive as stackless, synthetic:true exceptions whose
            // message is posthog-js's wrapper text and are never produced by our own code.
            const mechanism = exceptionListEntry?.mechanism
            const frameCount = exceptionListEntry?.stacktrace?.frames?.length ?? 0
            if (
                typeof exceptionValue === "string" &&
                exceptionValue.includes("captured as exception with message") &&
                mechanism?.synthetic === true &&
                mechanism?.handled === false &&
                frameCount === 0
            ) {
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
posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_KEY, posthogOptions)

const AuthUnauthorizedHandler = () => {
    useEffect(() => {
        const handleUnauthorized = () => {
            queryClient.setQueryData(["auth", "me"], null)
            queryClient.removeQueries({ queryKey: ["characters"] })
            queryClient.removeQueries({ queryKey: ["coteries"] })
            queryClient.removeQueries({ queryKey: ["shares"] })
            queryClient.removeQueries({ queryKey: ["user", "preferences"] })

            try {
                resetPostHogIdentity()
            } catch (error) {
                console.warn("PostHog reset failed:", error)
            }
        }

        window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized)
        return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized)
    }, [])

    return null
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
                        components: inputFocusTheme,
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
                    <BrokenSaveModal />
                    <CookiesBanner />
                    <RenderProfiler id="RouteOutlet">
                        <Outlet />
                    </RenderProfiler>
                </MantineProvider>
            </PostHogProvider>
        </QueryClientProvider>
    )
})
