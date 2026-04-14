import { createFileRoute } from "@tanstack/react-router"
import CreatorPage from "~/pages/CreatorPage"

export const Route = createFileRoute("/create")({
    component: Create,
})

function Create() {
    return <CreatorPage />
}
