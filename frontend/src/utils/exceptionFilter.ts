type ExceptionStackFrame = {
    in_app?: boolean
    filename?: unknown
    abs_path?: unknown
    module?: unknown
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

// A stack overflow thrown deep inside posthog-js's bundled rrweb session recorder while it
// serializes the DOM (e.g. `O.getId`'s node-mirror lookup on Firefox/Android). It is internal
// to the recorder, not our app code, and surfaces only because we enable session recording +
// exception capture. Drop it so it doesn't add noise to error tracking. Matched narrowly — a
// stack-overflow message plus an rrweb frame — so real recursion bugs in our own code survive.
const STACK_OVERFLOW_MARKERS = [
    "too much recursion", // Firefox
    "Maximum call stack size exceeded", // Chromium
    "call stack size exceeded" // Safari / WebKit variants
]

const frameReferencesRrweb = (frame: ExceptionStackFrame | undefined) => {
    if (!frame) {
        return false
    }

    return ["filename", "abs_path", "module"].some((key) => {
        const value = frame[key as keyof ExceptionStackFrame]
        return typeof value === "string" && value.includes("rrweb")
    })
}

export const isRrwebRecursionNoise = (entry: ExceptionListEntry | undefined) => {
    if (!entry) {
        return false
    }

    const message = typeof entry.value === "string" ? entry.value : ""
    const isStackOverflow = STACK_OVERFLOW_MARKERS.some((marker) => message.includes(marker))
    if (!isStackOverflow) {
        return false
    }

    const frames = entry.stacktrace?.frames
    return Array.isArray(frames) && frames.some(frameReferencesRrweb)
}
