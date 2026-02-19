import { createRootRoute, Outlet } from "@tanstack/react-router"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MantineProvider } from "@mantine/core"
import { Notifications } from "@mantine/notifications"
import { PostHogProvider } from "posthog-js/react"
import { globals } from "~/globals"
import BrokenSaveModal from "~/components/BrokenSaveModal"
import { CookiesBanner } from "~/components/CookiesBanner"

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
})

export const Route = createRootRoute({
    component: () => (
        <QueryClientProvider client={queryClient}>
            <PostHogProvider
                apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY}
                options={{
                    api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
                    defaults: "2025-05-24",
                    capture_exceptions: true,
                    cookieless_mode: "on_reject",
                    before_send: (event) => {
                        if (event && event.event === "$exception") {
                            const exceptionType = event.properties?.$exception_type
                            const exceptionMessage = event.properties?.$exception_message
                            const exceptionValue = event.properties?.$exception_values?.[0]

                            if (exceptionType === "CustomEvent" ||
                                (typeof exceptionValue === "string" && exceptionValue.includes("CustomEvent"))) {
                                return null
                            }

                            if (exceptionType === "NotFoundError" &&
                                typeof exceptionMessage === "string" &&
                                exceptionMessage.includes("removeChild") &&
                                exceptionMessage.includes("not a child of this node")) {
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
                    },
                }}
            >
                <MantineProvider
                    theme={{
                        breakpoints: {
                            xs: "576px",
                            sm: "768px",
                            md: "992px",
                            lg: `${globals.smallScreenW}px`,
                            xl: `${globals.largeScreenW}px`,
                        },
                    }}
                    defaultColorScheme="dark"
                >
                    <Notifications position="bottom-center" zIndex={3000} />
                    <BrokenSaveModal />
                    <CookiesBanner />
                    <Outlet />
                </MantineProvider>
            </PostHogProvider>
        </QueryClientProvider>
    ),
})
