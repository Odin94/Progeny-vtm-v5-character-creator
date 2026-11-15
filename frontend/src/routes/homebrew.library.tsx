import { createFileRoute } from "@tanstack/react-router"
import { lazy, Suspense } from "react"
import RenderProfiler from "~/components/RenderProfiler"

const HomebrewLibraryPage = lazy(() => import("~/pages/HomebrewLibraryPage"))

export const Route = createFileRoute("/homebrew/library")({
    component: HomebrewLibrary
})

function HomebrewLibrary() {
    return (
        <RenderProfiler id="HomebrewLibraryPage">
            <Suspense fallback={null}>
                <HomebrewLibraryPage />
            </Suspense>
        </RenderProfiler>
    )
}
