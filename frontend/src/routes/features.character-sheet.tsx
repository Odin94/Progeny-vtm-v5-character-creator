import { createFileRoute } from "@tanstack/react-router"
import { Suspense } from "react"
import RenderProfiler from "~/components/RenderProfiler"
import FeaturesPage from "~/pages/LazyFeaturesPage"

export const Route = createFileRoute("/features/character-sheet")({
    component: CharacterSheetFeatureGuide
})

function CharacterSheetFeatureGuide() {
    return (
        <RenderProfiler id="CharacterSheetFeatureGuide">
            <Suspense fallback={null}>
                <FeaturesPage pageId="character-sheet" />
            </Suspense>
        </RenderProfiler>
    )
}
