import { createFileRoute } from "@tanstack/react-router"
import { lazy, Suspense } from "react"
import { RouteFallback } from "~/components/ui/RouteFallback"
import RenderProfiler from "~/components/RenderProfiler"

const CoteriePage = lazy(() => import("~/pages/CoteriePage"))

export const Route = createFileRoute("/coteries/$coterieId")({
    component: Coterie
})

function Coterie() {
    const { coterieId } = Route.useParams()

    return (
        <RenderProfiler id="CoteriePage">
            <Suspense fallback={<RouteFallback />}>
                <CoteriePage coterieId={coterieId} />
            </Suspense>
        </RenderProfiler>
    )
}
