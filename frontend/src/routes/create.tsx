import { createFileRoute } from "@tanstack/react-router"
import RenderProfiler from "~/components/RenderProfiler"
import { lazy, Suspense } from "react"
import { Center, Loader } from "@mantine/core"

const CreatorPage = lazy(() => import("~/pages/CreatorPage"))

export const Route = createFileRoute("/create")({
    component: Create
})

function Create() {
    return (
        <RenderProfiler id="CreatorPage">
            <Suspense
                fallback={
                    <Center mih="100vh">
                        <Loader color="grape" />
                    </Center>
                }
            >
                <CreatorPage />
            </Suspense>
        </RenderProfiler>
    )
}
