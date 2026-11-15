import { createFileRoute } from "@tanstack/react-router"
import { Suspense } from "react"
import RenderProfiler from "~/components/RenderProfiler"
import FeaturesPage from "~/pages/LazyFeaturesPage"

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
