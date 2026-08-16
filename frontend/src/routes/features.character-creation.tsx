import { createFileRoute } from "@tanstack/react-router"
import { lazy, Suspense } from "react"
import RenderProfiler from "~/components/RenderProfiler"

const FeaturesPage = lazy(() => import("~/pages/FeaturesPage"))

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
