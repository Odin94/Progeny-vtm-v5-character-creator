import { createFileRoute } from "@tanstack/react-router"
import { lazy, Suspense } from "react"
import RenderProfiler from "~/components/RenderProfiler"

const LandingPage = lazy(() => import("~/pages/LandingPage"))

export const Route = createFileRoute("/")({
    component: Index
})

function Index() {
    return (
        <RenderProfiler id="LandingPage">
            <Suspense fallback={null}>
                <LandingPage />
            </Suspense>
        </RenderProfiler>
    )
}
