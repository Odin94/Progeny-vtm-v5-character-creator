import { Outlet, useRouterState } from "@tanstack/react-router"
import ErrorBoundary from "./ErrorBoundary"
import RenderProfiler from "./RenderProfiler"

// Catch render crashes from any route, not only the character generator, so a
// failure shows a fallback and reports a component stack instead of a blank page.
// Reset error state on navigation without remounting healthy parent routes.
const RouteOutlet = () => {
    // The URL updates before the new matches commit; resetting then can rethrow the old route.
    const pathname = useRouterState({ select: (state) => state.matches.at(-1)?.pathname })

    return (
        <ErrorBoundary resetKey={pathname}>
            <RenderProfiler id="RouteOutlet">
                <Outlet />
            </RenderProfiler>
        </ErrorBoundary>
    )
}

export default RouteOutlet
