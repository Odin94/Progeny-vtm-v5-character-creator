import { createFileRoute } from "@tanstack/react-router"
import { Suspense } from "react"
import { RouteFallback } from "~/components/ui/RouteFallback"
import RenderProfiler from "~/components/RenderProfiler"
import FeaturesPage from "~/pages/LazyFeaturesPage"

export const Route = createFileRoute("/features/coteries")({
    component: CoteriesFeatureGuide
})

function CoteriesFeatureGuide() {
    return (
        <RenderProfiler id="CoteriesFeatureGuide">
            <Suspense fallback={<RouteFallback />}>
                <FeaturesPage pageId="coteries" />
            </Suspense>
        </RenderProfiler>
    )
}
