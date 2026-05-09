import { createFileRoute } from "@tanstack/react-router"
import RenderProfiler from "~/components/RenderProfiler"
import LandingPage from "~/pages/LandingPage"

export const Route = createFileRoute("/")({
    component: Index
})

function Index() {
    return (
        <RenderProfiler id="LandingPage">
            <LandingPage />
        </RenderProfiler>
    )
}
