type ExceptionStackFrame = {
    in_app?: boolean
}

export type ExceptionListEntry = {
    type?: unknown
    value?: unknown
    mechanism?: {
        handled?: boolean
        synthetic?: boolean
    }
    stacktrace?: {
        frames?: ExceptionStackFrame[]
    }
}

// Browser extensions and injected third-party scripts surface as unhandled, synthetic
// exceptions whose stack contains no frame pointing at our own bundle (e.g. a cashback
// extension's `response.cashbackReminder`, or an opaque minified `a.L`). They are noise, not
// app bugs, so we drop anything unhandled + synthetic that carries no in-app frame.
export const isFramelessSyntheticNoise = (entry: ExceptionListEntry | undefined) => {
    if (!entry) {
        return false
    }

    const mechanism = entry.mechanism
    if (mechanism?.handled !== false || mechanism?.synthetic !== true) {
        return false
    }

    const frames = entry.stacktrace?.frames
    const hasInAppFrame = Array.isArray(frames) && frames.some((frame) => frame?.in_app === true)
    return !hasInAppFrame
}

// "ResizeObserver loop limit exceeded" / "ResizeObserver loop completed with undelivered
// notifications" is the benign notification browsers fire per spec when a ResizeObserver
// callback resizes its own observation target. It arrives with no stack and no user-facing
// breakage. PostHog attaches a synthetic in-app frame, so isFramelessSyntheticNoise misses it;
// match on the message instead. The regex covers both wordings across browsers.
const RESIZE_OBSERVER_LOOP_NOISE = /ResizeObserver loop/

export const isResizeObserverLoopNoise = (...candidates: unknown[]) =>
    candidates.some(
        (candidate) => typeof candidate === "string" && RESIZE_OBSERVER_LOOP_NOISE.test(candidate)
    )

// A deploy replaces the hashed asset filenames. A tab still on the old bundle then
// requests assets the host no longer serves; the SPA rewrite returns index.html in
// their place, so a lazy import() or CSS preload fails. Browsers word this failure
// several ways across /sheet, /me, and /. The minified frame moves each release and
// no source maps are uploaded, so each deploy would otherwise open a fresh issue id
// for one already-handled fault. assetPreloadRecovery.ts reloads the tab onto the
// current bundle, but Vite must rethrow for the reload to work, so the error still
// reaches error tracking. The regex covers the known wordings.
const STALE_ASSET_NOISE =
    /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Unable to preload CSS|is not a valid JavaScript MIME type/

export const isStaleAssetError = (...candidates: unknown[]) =>
    candidates.some(
        (candidate) => typeof candidate === "string" && STALE_ASSET_NOISE.test(candidate)
    )

// A stable fingerprint groups every wording and deploy into one issue instead of one
// per deploy. The recovered class collapses the handled reload; the unrecovered class
// stays separate so a reload that failed to fix the tab remains a visible failure.
export const STALE_ASSET_FINGERPRINT_RECOVERED = "stale-asset-preload-recovered"
export const STALE_ASSET_FINGERPRINT_UNRECOVERED = "stale-asset-preload-unrecovered"
