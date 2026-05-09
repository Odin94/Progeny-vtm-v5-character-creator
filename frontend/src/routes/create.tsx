import { createFileRoute } from "@tanstack/react-router"
import RenderProfiler from "~/components/RenderProfiler"
import CreatorPage from "~/pages/CreatorPage"

export const Route = createFileRoute("/create")({
    component: Create
})

function Create() {
    return (
        <RenderProfiler id="CreatorPage">
            <CreatorPage />
        </RenderProfiler>
    )
}
