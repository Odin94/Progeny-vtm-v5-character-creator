import { createFileRoute } from "@tanstack/react-router"
import { lazy, Suspense } from "react"
import RenderProfiler from "~/components/RenderProfiler"

const AdminImpersonationPage = lazy(() => import("~/pages/AdminImpersonationPage"))
export const ADMIN_TABS = ["users", "recent-changes", "homebrew-review"] as const
export type AdminTab = (typeof ADMIN_TABS)[number]

const getAdminTab = (value: unknown): AdminTab =>
    typeof value === "string" && ADMIN_TABS.includes(value as AdminTab)
        ? (value as AdminTab)
        : "users"

export const Route = createFileRoute("/admin")({
    validateSearch: (search): { tab: AdminTab } => ({ tab: getAdminTab(search.tab) }),
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
