import { createFileRoute } from "@tanstack/react-router"
import { lazy, Suspense } from "react"
import RenderProfiler from "~/components/RenderProfiler"

const HomebrewLibraryDetailsPage = lazy(() => import("~/pages/HomebrewLibraryDetailsPage"))

export const Route = createFileRoute("/homebrew/library/$collectionId")({
    component: HomebrewLibraryDetails
})

function HomebrewLibraryDetails() {
    const { collectionId } = Route.useParams()

    return (
        <RenderProfiler id="HomebrewLibraryDetailsPage">
            <Suspense fallback={null}>
                <HomebrewLibraryDetailsPage collectionId={collectionId} />
            </Suspense>
        </RenderProfiler>
    )
}
