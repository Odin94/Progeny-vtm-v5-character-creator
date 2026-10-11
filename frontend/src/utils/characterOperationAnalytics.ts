import { z } from "zod"
import posthog from "posthog-js"
import { CharacterOperationError, type CharacterFailureReason } from "./characterOperationError"

export type CharacterOperation =
    | "transition"
    | "save-and-start-new"
    | "create"
    | "save"
    | "load"
    | "save-before-load"
    | "import"
    | "save-before-import"
    | "autosave"
    | "restore-deleted-draft"
    | "delete-local-draft"
    | "storage-read"
    | "storage-write"

type FailureReason =
    | CharacterFailureReason
    | "busy"
    | "not_found"
    | "forbidden"
    | "request_failed"
    | "storage_failed"
    | "file_required"
    | "unknown"
const reportedErrors = new WeakSet<object>()
export const markCharacterFailureReported = (error: unknown) => {
    if (error && typeof error === "object") reportedErrors.add(error)
}
const retryWarnings = new Map<string, number>()

// Do not forward raw exception messages/causes: save errors can contain names,
// notes, JSON parser excerpts or server response bodies.
export const reportCharacterOperationFailure = (
    operation: CharacterOperation,
    error?: unknown,
    options: {
        severity?: "error" | "warning"
        reason?: FailureReason
        characterId?: string
    } = {}
) => {
    try {
        const status =
            error &&
            typeof error === "object" &&
            "status" in error &&
            typeof error.status === "number"
                ? error.status
                : undefined
        const reason =
            options.reason ??
            (error instanceof CharacterOperationError
                ? error.reason
                : status === 404
                  ? "not_found"
                  : status === 403
                    ? "forbidden"
                    : status === 409
                      ? "version_conflict"
                      : status
                        ? "request_failed"
                        : "unknown")
        const severity =
            options.severity ??
            ([
                "busy",
                "account_changed",
                "characters_unavailable",
                "name_required",
                "file_required"
            ].includes(reason)
                ? "warning"
                : "error")
        if (error && typeof error === "object" && reportedErrors.has(error)) return
        if (
            error instanceof z.ZodError &&
            error.issues.length > 0 &&
            error.issues.every(
                (issue) =>
                    issue.code === "custom" && issue.params?.characterValidationReported === true
            )
        )
            return
        // Autosave retries every few seconds. Keep a persistent outage visible
        // without emitting a warning on every timer tick.
        const key = `${operation}:${reason}:${status}:${options.characterId ?? ""}`
        const now = Date.now()
        if (operation === "autosave" && severity === "warning") {
            const last = retryWarnings.get(key)
            if (last !== undefined && now - last < 60_000) return
        }
        const errorName =
            error && typeof error === "object" && "name" in error && typeof error.name === "string"
                ? error.name
                : undefined
        const errorType =
            errorName &&
            [
                "Error",
                "TypeError",
                "SyntaxError",
                "RangeError",
                "QuotaExceededError",
                "SecurityError",
                "AbortError",
                "CharacterOperationError"
            ].includes(errorName)
                ? errorName
                : "unknown"
        const properties = {
            operation,
            failure_reason: reason,
            severity,
            http_status: status,
            character_id: options.characterId,
            error_type: errorType
        }
        if (severity === "warning") {
            posthog.capture("character_operation_warning", properties)
        } else {
            const exception = new Error(`Character operation blocked (${operation}, ${reason})`)
            exception.name = "CharacterOperationError"
            posthog.captureException(exception, {
                ...properties,
                $exception_fingerprint: `CharacterOperationError:${operation}:${reason}`
            })
        }
        markCharacterFailureReported(error)
        if (operation === "autosave" && severity === "warning") {
            if (retryWarnings.size >= 100) retryWarnings.delete(retryWarnings.keys().next().value!)
            retryWarnings.set(key, now)
        }
    } catch {
        // Reporting must not block a save, retry, notification or recovery action.
    }
}
