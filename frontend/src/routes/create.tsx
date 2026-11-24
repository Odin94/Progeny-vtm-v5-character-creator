import { createFileRoute } from "@tanstack/react-router"
import { RouteFallback } from "~/components/ui/RouteFallback"
import RenderProfiler from "~/components/RenderProfiler"
import { lazy, Suspense } from "react"

const CreatorPage = lazy(() => import("~/pages/CreatorPage"))

export const Route = createFileRoute("/create")({
    component: Create
})

function Create() {
    return (
        <RenderProfiler id="CreatorPage">
            <Suspense fallback={<RouteFallback />}>
                <CreatorPage />
            </Suspense>
        </RenderProfiler>
    )
}
