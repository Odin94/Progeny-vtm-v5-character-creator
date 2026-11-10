import posthog from "posthog-js"

export type DownloadFormat =
    | "pdf"
    | "progeny-json"
    | "foundry-json"
    | "inconnu-json"
    | "inconnu-commands"
    | "recovery-json"
    | "broken-save-json"
export type DownloadSource =
    | "generator"
    | "sheet"
    | "account"
    | "conflict-backup"
    | "broken-save"
    | "recovery"
    | "unknown"
export type DownloadOutcome =
    | "started"
    | "prepared"
    | "capabilities_checked"
    | "prompt_shown"
    | "share_requested"
    | "shared"
    | "cancelled"
    | "download_requested"
    | "preview_requested"
    | "failed"
    | "dismissed"
    | "reported_failed"
    | "reported_saved"
export type DownloadStage =
    | "prepare"
    | "capability"
    | "share"
    | "download"
    | "prompt"
    | "preview"
    | "feedback"
export type DownloadDetails = {
    stage?: DownloadStage
    method?: "anchor" | "share" | "prompt" | "preview"
    mime_type?: string
    size_bytes?: number
    file_share_supported?: boolean
    error_name?: string
}

// Never forward raw error messages, filenames, URLs or file contents.
export const downloadErrorName = (error: unknown) => {
    const name =
        typeof error === "object" && error !== null && "name" in error ? error.name : "UnknownError"
    return [
        "AbortError",
        "NotAllowedError",
        "NotSupportedError",
        "InvalidStateError",
        "SecurityError",
        "TypeError",
        "Error"
    ].includes(String(name))
        ? String(name)
        : "UnknownError"
}

export const createDownloadTracker = (
    format: DownloadFormat,
    source: DownloadSource,
    iosInApp: boolean
) => {
    const started = performance.now()
    let attemptId: string
    try {
        attemptId = crypto.randomUUID()
    } catch {
        attemptId = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    }
    const metadata: DownloadDetails = {}
    let shareAttempts = 0
    return (outcome: DownloadOutcome, details: DownloadDetails = {}) => {
        try {
            if (outcome === "share_requested") shareAttempts += 1
            for (const key of ["mime_type", "size_bytes", "file_share_supported"] as const) {
                if (details[key] !== undefined) Object.assign(metadata, { [key]: details[key] })
            }
            posthog.capture("file_download", {
                attempt_id: attemptId,
                format,
                source,
                outcome,
                ios_in_app_browser: iosInApp,
                share_attempts: shareAttempts,
                secure_context: window.isSecureContext,
                can_share_available: typeof navigator.canShare === "function",
                download_attribute_supported: "download" in HTMLAnchorElement.prototype,
                share_available: typeof navigator.share === "function",
                user_activation: navigator.userActivation?.isActive ?? null,
                elapsed_ms: Math.round(performance.now() - started),
                ...metadata,
                ...details
            })
        } catch {
            // Telemetry must never interrupt downloading or sharing.
        }
    }
}
export type DownloadTracker = ReturnType<typeof createDownloadTracker>
