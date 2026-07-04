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
