import { lazy, type ComponentType } from "react"
import posthog from "posthog-js"

const RETRY_DELAY_MS = 400

// WebKit throws a stackless `TypeError: Load failed` when a lazy chunk fetch fails (flaky
// mobile connection, or a stale bundle after a deploy). React.lazy does not retry, so a bare
// `lazy(() => import(...))` leaves the route with an uncaught rejection and a blank page.
//
// This loader retries the import once after a short delay. If the retry also fails, it captures
// a named event (so the failure stops arriving as a generic TypeError) and, as a last resort for
// the stale-bundle case, reloads the page once to fetch a fresh index and its chunk hashes. The
// reload runs at most once per chunk per session; after that the rejection propagates to the
// route error boundary, which shows a "tap to retry" fallback.
export function lazyWithRetry<T extends ComponentType<any>>(
    factory: () => Promise<{ default: T }>,
    chunkName: string
) {
    const reloadKey = `chunk-reload-${chunkName}`

    return lazy(async () => {
        try {
            const module = await factory()
            sessionStorage.removeItem(reloadKey)
            return module
        } catch (_firstError) {
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))

            try {
                const module = await factory()
                sessionStorage.removeItem(reloadKey)
                return module
            } catch (retryError) {
                try {
                    posthog.capture("chunk-load-failed", {
                        chunk: chunkName,
                        error:
                            retryError instanceof Error
                                ? retryError.message
                                : String(retryError)
                    })
                } catch (_captureError) {
                    // Ignore capture failures so they cannot mask the original chunk error.
                }

                if (!sessionStorage.getItem(reloadKey)) {
                    sessionStorage.setItem(reloadKey, "1")
                    window.location.reload()
                }

                throw retryError
            }
        }
    })
}
