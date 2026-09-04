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

// A recursive stack overflow surfaces as "RangeError: Maximum call stack size exceeded". On
// WebKit its trace is unstable: the top frame alternates between the two mutually recursive
// functions and the tail depth changes on every capture, and the frames carry no chunk id
// (WebKit attributes them to the document path), so they never symbolicate. PostHog fingerprints
// on the frames, so one crash mints a fresh "first observed" issue each time it fires and floods
// the inbox. Pin every occurrence to one fingerprint so a burst groups as a single issue. The
// regex covers the WebKit trailing period and the V8 wording.
const MAX_CALL_STACK_OVERFLOW = /Maximum call stack size exceeded/

export const MAX_CALL_STACK_FINGERPRINT = "range-error-maximum-call-stack-size-exceeded"

export const isMaxCallStackOverflow = (...candidates: unknown[]) =>
    candidates.some(
        (candidate) => typeof candidate === "string" && MAX_CALL_STACK_OVERFLOW.test(candidate)
    )
