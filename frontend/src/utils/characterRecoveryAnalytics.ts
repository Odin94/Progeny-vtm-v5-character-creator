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
        const properties = {
            ...metadata(data),
            validation_source: source,
            validation_phase: phase,
            validation_issues: issues
        }
        const key = JSON.stringify(properties)
        const now = Date.now()
        // Local-storage deserializers run in multiple mounted consumers. Report a failure
        // once per minute rather than creating an exception for every render/query retry.
        if (recentErrors.has(key) && now - recentErrors.get(key)! < 60_000) return
        const exception = new Error(
            `Character validation failed (${source}, ${phase})${issues.length ? `: ${issues.map((i) => `${i.path}: ${i.code}`).join(", ")}` : ""}`
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
