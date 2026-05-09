import { createFileRoute } from "@tanstack/react-router"
import RenderProfiler from "~/components/RenderProfiler"
import MePage from "~/pages/MePage"
export const Route = createFileRoute("/me")({
    component: Me
})

function Me() {
    return (
        <RenderProfiler id="MePage">
            <MePage />
        </RenderProfiler>
    )
}
