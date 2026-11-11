import { createFileRoute } from "@tanstack/react-router"
import { Suspense } from "react"
import { RouteFallback } from "~/components/ui/RouteFallback"
import RenderProfiler from "~/components/RenderProfiler"
import FeaturesPage from "~/pages/LazyFeaturesPage"

export const Route = createFileRoute("/features/credits-and-contact")({
    component: CreditsAndContactFeatureGuide
})

function CreditsAndContactFeatureGuide() {
    return (
        <RenderProfiler id="CreditsAndContactFeatureGuide">
            <Suspense fallback={<RouteFallback />}>
                <FeaturesPage pageId="credits-and-contact" />
            </Suspense>
        </RenderProfiler>
    )
}
