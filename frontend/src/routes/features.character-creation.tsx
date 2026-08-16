import { createFileRoute } from "@tanstack/react-router"
import { Suspense } from "react"
import RenderProfiler from "~/components/RenderProfiler"
import FeaturesPage from "~/pages/LazyFeaturesPage"

export const Route = createFileRoute("/features/character-creation")({
    component: CharacterCreationFeatureGuide
})

function CharacterCreationFeatureGuide() {
    return (
        <RenderProfiler id="CharacterCreationFeatureGuide">
            <Suspense fallback={null}>
                <FeaturesPage pageId="character-creation" />
            </Suspense>
        </RenderProfiler>
    )
}
