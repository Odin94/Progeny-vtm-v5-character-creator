import { createFileRoute } from "@tanstack/react-router"
import { lazy, Suspense } from "react"
import { RouteFallback } from "~/components/ui/RouteFallback"
import RenderProfiler from "~/components/RenderProfiler"
import { homebrewItemKinds, type HomebrewItemKind } from "~/data/Homebrew"

const HomebrewLibraryPage = lazy(() => import("~/pages/HomebrewLibraryPage"))

const librarySorts = ["top", "trending", "newest", "copied"] as const
export type HomebrewLibrarySort = (typeof librarySorts)[number]

/** Library filters live in the URL so they survive reloads and back/forward. */
export type HomebrewLibrarySearch = {
    q?: string
    type?: HomebrewItemKind
    sort?: Exclude<HomebrewLibrarySort, "top">
}

export const Route = createFileRoute("/homebrew/library")({
    validateSearch: (search: Record<string, unknown>): HomebrewLibrarySearch => ({
        q: typeof search.q === "string" && search.q.trim() ? search.q : undefined,
        type: homebrewItemKinds.includes(search.type as HomebrewItemKind)
            ? (search.type as HomebrewItemKind)
            : undefined,
        sort:
            librarySorts.includes(search.sort as HomebrewLibrarySort) && search.sort !== "top"
                ? (search.sort as HomebrewLibrarySearch["sort"])
                : undefined
    }),
    component: HomebrewLibrary
})

function HomebrewLibrary() {
    const search = Route.useSearch()

    return (
        <RenderProfiler id="HomebrewLibraryPage">
            <Suspense fallback={<RouteFallback />}>
                <HomebrewLibraryPage search={search} />
            </Suspense>
        </RenderProfiler>
    )
}
