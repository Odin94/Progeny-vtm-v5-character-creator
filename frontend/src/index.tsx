import "@mantine/core/styles.css"
import "@mantine/notifications/styles.css"
import { MantineProvider } from "@mantine/core"
import { Notifications } from "@mantine/notifications"
import React from "react"
import ReactDOM from "react-dom/client"
import ReactGA from "react-ga4"
import { PostHogProvider } from "posthog-js/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import App from "./App"
import "./index.css"
import reportWebVitals from "./reportWebVitals"
import { globals } from "./globals"

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
})

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement)

// Must be changed in host configs if deployed from github since .env is ignored
const GA4_MEASUREMENT_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID

if (GA4_MEASUREMENT_ID) {
    ReactGA.initialize(GA4_MEASUREMENT_ID)
} else {
    console.error("Failed to load GA4 measurement id!")
}

const getCharacterFromStorage = () => {
    try {
        const characterData = localStorage.getItem("character")
        if (characterData) {
            const parsed = JSON.parse(characterData)
            return parsed
        }
    } catch (_error) {
        // Silently fail if we can't read character data
    }
    return null
}

root.render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <PostHogProvider
                apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY}
                options={{
                    api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
                    defaults: "2025-05-24",
                    capture_exceptions: true,
                    // debug: import.meta.env.MODE === "development",
                    before_send: (event) => {
                        if (event && event.event === "$exception") {
                            const character = getCharacterFromStorage()
                            if (character) {
                                event.properties = event.properties || {}
                                event.properties.character = character
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
                    <Notifications position="bottom-center" />
                    <App />
                </MantineProvider>
            </PostHogProvider>
        </QueryClientProvider>
    </React.StrictMode>
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
