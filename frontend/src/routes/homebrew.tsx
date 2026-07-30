import { createFileRoute } from "@tanstack/react-router"
import { lazy, Suspense } from "react"
import RenderProfiler from "~/components/RenderProfiler"

const HomebrewPage = lazy(() => import("~/pages/HomebrewPage"))

export const Route = createFileRoute("/homebrew")({
    component: Homebrew
})

function Homebrew() {
    return (
        <RenderProfiler id="HomebrewPage">
            <Suspense fallback={null}>
                <HomebrewPage />
            </Suspense>
        </RenderProfiler>
    )
}
