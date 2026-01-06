import "@mantine/core/styles.css"
import "@mantine/notifications/styles.css"
import React from "react"
import ReactDOM from "react-dom/client"
import ReactGA from "react-ga4"
import { RouterProvider, createRouter } from "@tanstack/react-router"
import { routeTree } from "./routeTree.gen"
import "./index.css"
import reportWebVitals from "./reportWebVitals"

const router = createRouter({ routeTree })

declare module "@tanstack/react-router" {
    interface Register {
        router: typeof router
    }
}

const GA4_MEASUREMENT_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID

if (GA4_MEASUREMENT_ID) {
    ReactGA.initialize(GA4_MEASUREMENT_ID)
} else {
    console.error("Failed to load GA4 measurement id!")
}

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement)

root.render(
    <React.StrictMode>
        <RouterProvider router={router} />
    </React.StrictMode>
)

reportWebVitals()
