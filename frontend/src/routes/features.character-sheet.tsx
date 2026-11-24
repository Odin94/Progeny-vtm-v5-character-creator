import { createFileRoute } from "@tanstack/react-router"
import { Suspense } from "react"
import { RouteFallback } from "~/components/ui/RouteFallback"
import RenderProfiler from "~/components/RenderProfiler"
import FeaturesPage from "~/pages/LazyFeaturesPage"

export const Route = createFileRoute("/features/character-sheet")({
    component: CharacterSheetFeatureGuide
})

function CharacterSheetFeatureGuide() {
    return (
        <RenderProfiler id="CharacterSheetFeatureGuide">
            <Suspense fallback={<RouteFallback />}>
                <FeaturesPage pageId="character-sheet" />
            </Suspense>
        </RenderProfiler>
    )
}
