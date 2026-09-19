import posthog from "posthog-js"
import { z } from "zod"
import type { CharacterRepairChange } from "./repairCharacter"

export type CharacterValidationSource = "local-storage" | "api" | "json-import" | "character-data"
const recentErrors = new Map<string, number>()
const metadata = (data: unknown) => {
    const character = data && typeof data === "object" ? (data as Record<string, unknown>) : {}
    return {
        character_id: typeof character.id === "string" ? character.id : undefined,
        character_schema_version:
            typeof character.version === "number" ? character.version : undefined
    }
}

export const reportCharacterValidationError = (
    error: unknown,
    source: CharacterValidationSource,
    phase: "json" | "compatibility" | "schema",
    data?: unknown
) => {
    try {
        const issues =
            error instanceof z.ZodError
                ? error.issues.map((issue) => ({
                      path: issue.path.map(String).join("."),
                      code: issue.code
                  }))
                : []
        // A compatibility-phase failure is a plain error (e.g. a TypeError), not a Zod
        // error. Keep its name, message, and cause so the capture names the real fault
        // instead of pointing at this helper.
        const underlyingName = error instanceof Error ? error.name : typeof error
        const underlyingMessage = error instanceof Error ? error.message : String(error)
        const underlyingCause =
            error instanceof Error && error.cause !== undefined
                ? error.cause instanceof Error
                    ? `${error.cause.name}: ${error.cause.message}`
                    : String(error.cause)
                : undefined
        // Group one fault as one issue regardless of which mounted consumer raised it, so
        // differing React frames above the deserializer do not split it across issues.
        const issueSignature = issues.map((i) => `${i.path}:${i.code}`).join("|")
        const fingerprint = `CharacterValidationError:${source}:${phase}:${issueSignature || underlyingName}`
        const meta = metadata(data)
        const properties = {
            ...meta,
            validation_source: source,
            validation_phase: phase,
            validation_issues: issues,
            error_name: underlyingName,
            error_message: underlyingMessage,
            error_cause: underlyingCause,
            $exception_fingerprint: fingerprint
        }
        // Throttle on the stable fingerprint (plus character id), not the serialized payload:
        // instance-specific error text must not split one fault across the window.
        const key = `${fingerprint}:${meta.character_id ?? ""}`
        const now = Date.now()
        // Local-storage deserializers run in multiple mounted consumers. Report a failure
        // once per minute rather than creating an exception for every render/query retry.
        if (recentErrors.has(key) && now - recentErrors.get(key)! < 60_000) return
        const exception = new Error(
            `Character validation failed (${source}, ${phase}): ${underlyingName}: ${underlyingMessage}`,
            error instanceof Error ? { cause: error } : undefined
        )
        exception.name = "CharacterValidationError"
        posthog.captureException(exception, properties)
        if (recentErrors.size >= 100) recentErrors.delete(recentErrors.keys().next().value!)
        recentErrors.set(key, now)
    } catch {
        // Analytics must never interfere with character recovery or loading.
        console.warn("Could not report character validation error to PostHog")
    }
}

const valueType = (value: unknown) =>
    value === null ? "null" : Array.isArray(value) ? "array" : typeof value

export const trackCharacterRepair = (
    action: "suggested" | "applied",
    repairId: string,
    changes: CharacterRepairChange[],
    character: unknown
) => {
    try {
        posthog.capture(`character_repair_${action}`, {
            ...metadata(character),
            repair_id: repairId,
            repair_algorithm_version: 1,
            change_count: changes.length,
            changes: changes.map((change) => ({
                path: change.path.map(String).join("."),
                action: change.action,
                // Identify the affected entry without uploading descriptions, notes, raw
                // JSON, or arbitrary text-field contents with every analytics event.
                item_name:
                    change.before &&
                    typeof change.before === "object" &&
                    "name" in change.before &&
                    typeof change.before.name === "string"
                        ? change.before.name.slice(0, 160)
                        : undefined,
                previous_type: valueType(change.before),
                previous_number: typeof change.before === "number" ? change.before : undefined,
                replacement_type: valueType(change.after),
                replacement:
                    typeof change.after === "number" ||
                    typeof change.after === "boolean" ||
                    change.after === ""
                        ? change.after
                        : undefined
            }))
        })
    } catch {
        console.warn("Could not track character repair in PostHog")
    }
}
