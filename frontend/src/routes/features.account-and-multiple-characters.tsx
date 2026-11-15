import { createFileRoute } from "@tanstack/react-router"
import { Suspense } from "react"
import RenderProfiler from "~/components/RenderProfiler"
import FeaturesPage from "~/pages/LazyFeaturesPage"

export const Route = createFileRoute("/features/account-and-multiple-characters")({
    component: AccountAndMultipleCharactersFeatureGuide
})

function AccountAndMultipleCharactersFeatureGuide() {
    return (
        <RenderProfiler id="AccountAndMultipleCharactersFeatureGuide">
            <Suspense fallback={null}>
                <FeaturesPage pageId="account-and-multiple-characters" />
            </Suspense>
        </RenderProfiler>
    )
}
