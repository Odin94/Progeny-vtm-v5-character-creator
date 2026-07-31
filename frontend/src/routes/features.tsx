import { createFileRoute } from "@tanstack/react-router"
import { lazy, Suspense } from "react"
import RenderProfiler from "~/components/RenderProfiler"

const FeaturesPage = lazy(() => import("~/pages/FeaturesPage"))

export const Route = createFileRoute("/features")({
    component: Features
})

function Features() {
    return (
        <RenderProfiler id="FeaturesPage">
            <Suspense fallback={null}>
                <FeaturesPage />
            </Suspense>
        </RenderProfiler>
    )
}
