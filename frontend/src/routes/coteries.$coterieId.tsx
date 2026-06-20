import { createFileRoute } from "@tanstack/react-router"
import RenderProfiler from "~/components/RenderProfiler"
import CoteriePage from "~/pages/CoteriePage"

export const Route = createFileRoute("/coteries/$coterieId")({
    component: Coterie
})

function Coterie() {
    const { coterieId } = Route.useParams()

    return (
        <RenderProfiler id="CoteriePage">
            <CoteriePage coterieId={coterieId} />
        </RenderProfiler>
    )
}
