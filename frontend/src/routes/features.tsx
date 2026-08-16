import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/features")({
    beforeLoad: () => {
        throw redirect({ to: "/features/character-creation" })
    }
})
