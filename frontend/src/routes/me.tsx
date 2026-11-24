import { createFileRoute } from "@tanstack/react-router"
import { lazy, Suspense, useCallback } from "react"
import { RouteFallback } from "~/components/ui/RouteFallback"
import RenderProfiler from "~/components/RenderProfiler"
import { DEFAULT_ME_TAB, parseMeTab, type MeTab } from "~/pages/me/meTabs"

const MePage = lazy(() => import("~/pages/MePage"))

type MeSearch = {
    tab?: MeTab
    coterieInvite?: string
}

export const Route = createFileRoute("/me")({
    // `tab` keeps the account sub-view in the URL so back/forward works. `coterieInvite` is read by
    // MePage straight from window.location; it is declared here only so tab switches keep it.
    validateSearch: (search: Record<string, unknown>): MeSearch => ({
        tab: parseMeTab(search.tab),
        coterieInvite: typeof search.coterieInvite === "string" ? search.coterieInvite : undefined
    }),
    component: Me
})

function Me() {
    const { tab } = Route.useSearch()
    const navigate = Route.useNavigate()
    const setTab = useCallback(
        (next: MeTab) =>
            void navigate({
                search: (previous) => ({
                    ...previous,
                    tab: next === DEFAULT_ME_TAB ? undefined : next
                }),
                resetScroll: false
            }),
        [navigate]
    )

    return (
        <RenderProfiler id="MePage">
            <Suspense fallback={<RouteFallback />}>
                <MePage tab={tab ?? DEFAULT_ME_TAB} onTabChange={setTab} />
            </Suspense>
        </RenderProfiler>
    )
}
