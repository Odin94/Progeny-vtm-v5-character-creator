import { createFileRoute } from "@tanstack/react-router"
import AdminImpersonationPage from "~/pages/AdminImpersonationPage"

export const Route = createFileRoute("/admin/impersonation")({
    component: AdminImpersonation
})

function AdminImpersonation() {
    return <AdminImpersonationPage />
}
