import { createFileRoute } from "@tanstack/react-router"
import { lazy, Suspense } from "react"
import { RouteFallback } from "~/components/ui/RouteFallback"
import RenderProfiler from "~/components/RenderProfiler"

const HomebrewPage = lazy(() => import("~/pages/HomebrewPage"))

export const Route = createFileRoute("/homebrew")({
    component: Homebrew
})

function Homebrew() {
    return (
        <RenderProfiler id="HomebrewPage">
            <Suspense fallback={<RouteFallback />}>
                <HomebrewPage />
            </Suspense>
        </RenderProfiler>
    )
}
