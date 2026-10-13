import posthog from "posthog-js"

export type ConflictTelemetryContext = {
    dialog_id: string
    parent_dialog_id?: string
    parent_resolution_id?: string
    character_id: string
    is_undo: boolean
}
export type ConflictTelemetryDetails = {
    choice?: "browser" | "backend" | "copy"
    resolution_id?: string
    local_version?: number
    remote_version?: number
    reviewed_version?: number
    resulting_version?: number
    outcome?: "success" | "failure" | "blocked" | "interrupted"
    reason?:
        | "read_only"
        | "backend_changed"
        | "browser_changed"
        | "account_changed"
        | "dialog_changed"
        | "request_failed"
        | "download_failed"
        | "application_failed"
    backup_source?: "browser" | "backend"
    phase?: "load" | "review" | "save" | "create" | "apply" | "download"
}
export const conflictTelemetryId = () => {
    try {
        return crypto.randomUUID()
    } catch {
        return `${Date.now()}-${Math.random().toString(36).slice(2)}`
    }
}
// Only fixed codes, opaque IDs and revisions belong here. Never pass character
// contents, filenames, names, dates or raw exception messages to the SDK.
export const trackCharacterConflict = (
    event:
        | "opened"
        | "ready"
        | "choice_selected"
        | "confirmation_back"
        | "confirmed"
        | "resolution_started"
        | "resolution_outcome"
        | "dismissed"
        | "backup_started"
        | "backup_outcome"
        | "undo_requested"
        | "undo_blocked",
    context: ConflictTelemetryContext,
    details: ConflictTelemetryDetails = {}
) => {
    try {
        posthog.capture(`character_conflict_${event}`, { ...context, ...details })
    } catch {
        // Analytics must never interrupt saving, downloading or Undo.
    }
}
