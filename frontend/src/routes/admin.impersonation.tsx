import { createFileRoute } from "@tanstack/react-router"
import RenderProfiler from "~/components/RenderProfiler"
import AdminImpersonationPage from "~/pages/AdminImpersonationPage"

export const Route = createFileRoute("/admin/impersonation")({
    component: AdminImpersonation
})

function AdminImpersonation() {
    return (
        <RenderProfiler id="AdminImpersonationPage">
            <AdminImpersonationPage />
        </RenderProfiler>
    )
}
