import { createFileRoute } from "@tanstack/react-router"
import MePage from "~/pages/MePage"
export const Route = createFileRoute("/me")({
    component: Me,
})

function Me() {
    return <MePage />
}
