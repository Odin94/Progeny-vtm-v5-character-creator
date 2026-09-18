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

// The backend answers a request that carries no valid WorkOS session with a 401 and this
// exact message. It is an expected, expired session, not an app fault. `request()` in
// utils/api.ts already recovers: it fires the unauthorized event, and the root handler clears
// the cached user and the sign-in seed. The rejection still escapes as an unhandled,
// high-severity exception, so every session expiry opens an error-tracking issue and buries
// real auth faults. Drop it here; the recovery path stays intact.
const EXPECTED_SESSION_EXPIRY_NOISE = /Unauthorized: No valid session/

export const isExpectedSessionExpiryNoise = (...candidates: unknown[]) =>
    candidates.some(
        (candidate) =>
            typeof candidate === "string" && EXPECTED_SESSION_EXPIRY_NOISE.test(candidate)
    )
