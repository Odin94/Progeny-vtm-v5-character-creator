import { createFileRoute } from "@tanstack/react-router"
import { lazy, Suspense } from "react"
import RenderProfiler from "~/components/RenderProfiler"

const FeaturesPage = lazy(() => import("~/pages/FeaturesPage"))

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
