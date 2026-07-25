import "@mantine/core/styles.css"
import "@mantine/notifications/styles.css"
import React from "react"
import ReactDOM from "react-dom/client"
import { RouterProvider, createRouter } from "@tanstack/react-router"
import { routeTree } from "./routeTree.gen"
import "./index.css"
import RenderProfiler from "./components/RenderProfiler"
import reportWebVitals from "./reportWebVitals"

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
