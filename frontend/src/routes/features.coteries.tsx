import { createFileRoute } from "@tanstack/react-router"
import { lazy, Suspense } from "react"
import RenderProfiler from "~/components/RenderProfiler"

const FeaturesPage = lazy(() => import("~/pages/FeaturesPage"))

export const Route = createFileRoute("/features/coteries")({
    component: CoteriesFeatureGuide
})

function CoteriesFeatureGuide() {
    return (
        <RenderProfiler id="CoteriesFeatureGuide">
            <Suspense fallback={null}>
                <FeaturesPage pageId="coteries" />
            </Suspense>
        </RenderProfiler>
    )
}
