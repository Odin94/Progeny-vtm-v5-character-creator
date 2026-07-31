import { createFileRoute } from "@tanstack/react-router"
import { lazy, Suspense } from "react"
import RenderProfiler from "~/components/RenderProfiler"

const HomebrewDetailsPage = lazy(() => import("~/pages/HomebrewDetailsPage"))

export const Route = createFileRoute("/homebrew/$collectionId")({
    component: HomebrewDetails
})

function HomebrewDetails() {
    const { collectionId } = Route.useParams()

    return (
        <RenderProfiler id="HomebrewDetailsPage">
            <Suspense fallback={null}>
                <HomebrewDetailsPage collectionId={collectionId} />
            </Suspense>
        </RenderProfiler>
    )
}
