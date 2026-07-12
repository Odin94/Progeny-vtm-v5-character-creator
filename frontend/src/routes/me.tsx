import { createFileRoute } from "@tanstack/react-router"
import { lazy, Suspense } from "react"
import RenderProfiler from "~/components/RenderProfiler"

const MePage = lazy(() => import("~/pages/MePage"))
export const Route = createFileRoute("/me")({
    component: Me
})

function Me() {
    return (
        <RenderProfiler id="MePage">
            <Suspense fallback={null}>
                <MePage />
            </Suspense>
        </RenderProfiler>
    )
}
