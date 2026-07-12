import { createFileRoute } from "@tanstack/react-router"
import { lazy, Suspense } from "react"
import RenderProfiler from "~/components/RenderProfiler"

const AdminImpersonationPage = lazy(() => import("~/pages/AdminImpersonationPage"))

export const Route = createFileRoute("/admin/impersonation")({
    component: AdminImpersonation
})

function AdminImpersonation() {
    return (
        <RenderProfiler id="AdminImpersonationPage">
            <Suspense fallback={null}>
                <AdminImpersonationPage />
            </Suspense>
        </RenderProfiler>
    )
}
