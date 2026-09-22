import { trackAssetPreloadRecovered } from "~/utils/analytics"

// A deploy replaces the hashed asset filenames. A tab that still runs the old
// bundle then requests assets that no longer exist; the SPA rewrite serves
// index.html in their place, so a lazy import() or CSS preload fails. One reload
// pulls the current bundle and clears the condition.
const RELOAD_TIMESTAMP_KEY = "asset-preload-reload-at"

// Reload at most once per window. A reload cannot recover an asset the host no
// longer serves, so a repeated failure must surface instead of looping.
const RELOAD_GUARD_MS = 30_000

// The reload timestamp already reported as recovered. The reload timestamp stays
// in sessionStorage for the whole guard window so the loop guard keeps working,
// so a plain manual reload in that window would otherwise report the same
// recovery again. This marker records the one reload that was counted, so each
// reload the handler requested is measured exactly once.
const RECOVERY_REPORTED_KEY = "asset-preload-recovery-reported-at"

const reloadedWithinGuard = () => {
    let timestamp = 0
    try {
        timestamp = Number(window.sessionStorage.getItem(RELOAD_TIMESTAMP_KEY)) || 0
    } catch {
        // sessionStorage can throw in private modes; treat it as no prior reload.
    }
    return Date.now() - timestamp < RELOAD_GUARD_MS
}

type AssetReloadState = "reload-requested" | "reload-blocked" | "unattempted"
let lastAttempt: { at: number; state: AssetReloadState } | undefined

// A reload request is not proof that the next page successfully loads. Only
// describe what this page's handler actually did, and expire old attempts.
export const getAssetReloadState = (): AssetReloadState =>
    lastAttempt && Date.now() - lastAttempt.at < RELOAD_GUARD_MS ? lastAttempt.state : "unattempted"

export const handleAssetPreloadError = () => {
    if (reloadedWithinGuard()) {
        if (getAssetReloadState() !== "reload-requested") {
            lastAttempt = { at: Date.now(), state: "reload-blocked" }
        }
        return
    }

    try {
        window.sessionStorage.setItem(RELOAD_TIMESTAMP_KEY, String(Date.now()))
    } catch {
        // Without the guard a reload could loop, so leave the error to surface.
        lastAttempt = { at: Date.now(), state: "reload-blocked" }
        return
    }

    // The reload is asynchronous, so React still renders once before the page
    // navigates. The event must stay uncancelled: Vite's preload helper only
    // rethrows the fetch error when the event is not cancelled. Cancelling it
    // makes the failed import() resolve empty, so React's lazy reads `.default`
    // off nothing and crashes. Left thrown, the error reaches the boundary,
    // which shows a retry until the reload lands.
    lastAttempt = { at: Date.now(), state: "reload-requested" }
    window.location.reload()
}

// Records the recovery when this load follows a reload the handler requested, so
// recovered reloads become measurable against preload failures. Reports once per
// requested reload: a later manual reload in the same guard window does not add a
// second recovery for the one reload the handler asked for.
export const reportAssetPreloadRecovery = () => {
    if (!reloadedWithinGuard()) {
        return
    }

    try {
        const requestedAt = window.sessionStorage.getItem(RELOAD_TIMESTAMP_KEY) ?? ""
        if (window.sessionStorage.getItem(RECOVERY_REPORTED_KEY) === requestedAt) {
            return
        }
        window.sessionStorage.setItem(RECOVERY_REPORTED_KEY, requestedAt)
    } catch {
        // sessionStorage can throw in private modes. The guard window still
        // expires the reload timestamp, so at worst one reload is miscounted,
        // never a reload loop.
    }

    trackAssetPreloadRecovered(window.location.pathname)
}

export const installAssetPreloadRecovery = () => {
    reportAssetPreloadRecovery()
    window.addEventListener("vite:preloadError", handleAssetPreloadError)
}
