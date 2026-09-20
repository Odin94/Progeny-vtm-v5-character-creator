import { trackAssetPreloadRecovered } from "~/utils/analytics"

// A deploy replaces the hashed asset filenames. A tab that still runs the old
// bundle then requests assets that no longer exist; the SPA rewrite serves
// index.html in their place, so a lazy import() or CSS preload fails. One reload
// pulls the current bundle and clears the condition.
const RELOAD_TIMESTAMP_KEY = "asset-preload-reload-at"

// Reload at most once per window. A reload cannot recover an asset the host no
// longer serves, so a repeated failure must surface instead of looping.
const RELOAD_GUARD_MS = 30_000

const reloadedWithinGuard = () => {
    let timestamp = 0
    try {
        timestamp = Number(window.sessionStorage.getItem(RELOAD_TIMESTAMP_KEY)) || 0
    } catch {
        // sessionStorage can throw in private modes; treat it as no prior reload.
    }
    return Date.now() - timestamp < RELOAD_GUARD_MS
}

export const handleAssetPreloadError = () => {
    if (reloadedWithinGuard()) {
        return
    }

    try {
        window.sessionStorage.setItem(RELOAD_TIMESTAMP_KEY, String(Date.now()))
    } catch {
        // Without the guard a reload could loop, so leave the error to surface.
        return
    }

    // The reload is asynchronous, so React still renders once before the page
    // navigates. The event must stay uncancelled: Vite's preload helper only
    // rethrows the fetch error when the event is not cancelled. Cancelling it
    // makes the failed import() resolve empty, so React's lazy reads `.default`
    // off nothing and crashes. Left thrown, the error reaches the boundary,
    // which shows a retry until the reload lands.
    window.location.reload()
}

// Records the recovery when this load follows a preload-triggered reload, so
// recovered reloads become measurable against preload failures.
export const reportAssetPreloadRecovery = () => {
    if (!reloadedWithinGuard()) {
        return
    }

    trackAssetPreloadRecovered(window.location.pathname)
}

export const installAssetPreloadRecovery = () => {
    reportAssetPreloadRecovery()
    window.addEventListener("vite:preloadError", handleAssetPreloadError)
}
