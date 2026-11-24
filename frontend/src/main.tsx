import "@fontsource/cinzel/500.css"
import "@fontsource/cinzel/600.css"
import "@fontsource/cinzel/700.css"
import "@fontsource/inter/400.css"
import "@fontsource/inter/500.css"
import "@fontsource/inter/600.css"
import "@fontsource/inter/700.css"
import "@fontsource/crimson-text/400.css"
import "@fontsource/crimson-text/400-italic.css"
import "@fontsource/crimson-text/600.css"
import "@mantine/core/styles.css"
import "@mantine/notifications/styles.css"
import "@mantine/spotlight/styles.css"
import React from "react"
import ReactDOM from "react-dom/client"
import { RouterProvider, createRouter } from "@tanstack/react-router"
import "./index.css"
import { routeTree } from "./routeTree.gen"
import "./components/HomebrewFormControls.css"
import RenderProfiler from "./components/RenderProfiler"
import reportWebVitals from "./reportWebVitals"
import { installAssetPreloadRecovery } from "./utils/assetPreloadRecovery"

installAssetPreloadRecovery()

const router = createRouter({ routeTree })

declare module "@tanstack/react-router" {
    interface Register {
        router: typeof router
    }
}

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement)

root.render(
    <React.StrictMode>
        <RenderProfiler id="Router">
            <RouterProvider router={router} />
        </RenderProfiler>
    </React.StrictMode>
)

reportWebVitals()
