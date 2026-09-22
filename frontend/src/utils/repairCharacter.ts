import { z } from "zod"
import {
    applyCharacterCompatibilityPatches,
    characterSchema,
    getEmptyCharacter,
    isRecord as isObject,
    type Character
} from "~/data/Character"

type Path = (string | number)[]
export type CharacterRepairChange = {
    path: Path
    before: unknown
    after: unknown
    action: "remove" | "reset"
    description: string
}
export type CharacterRepairPreview =
    | { success: true; character: Character; changes: CharacterRepairChange[] }
    | { success: false; error: string }

type Repair = { value: unknown; changes: CharacterRepairChange[] }
const clone = <T>(value: T): T => structuredClone(value)
const humanize = (key: string) =>
    key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase())
const itemLabels: Record<string, string> = {
    flaws: "Flaw",
    merits: "Merit",
    disciplines: "Power",
    rituals: "Ritual",
    ceremonies: "Ceremony",
    touchstones: "Touchstone",
    skillSpecialties: "Skill specialty",
    pickedSpecialties: "Predator specialty",
    pickedMeritsAndFlaws: "Predator merit/flaw",
    availableDisciplineNames: "Available discipline",
    customDisciplines: "Custom discipline",
    disciplineLevels: "Discipline level"
}
const displayValue = (value: unknown): string =>
    value === undefined ? "missing" : JSON.stringify(value)

const change = (path: Path, before: unknown, after: unknown): CharacterRepairChange => {
    const last = path.at(-1)!
    const parent = String(path.at(-2) ?? "")
    const itemLabel = itemLabels[parent]
    const name =
        isObject(before) && typeof before.name === "string" && before.name
            ? before.name
            : typeof last !== "number"
              ? String(last)
              : typeof before === "string"
                ? before
                : `entry ${last + 1}`
    const field = path
        .map((part) => (typeof part === "number" ? `Entry ${part + 1}` : humanize(part)))
        .join(" → ")
    const label = itemLabel ? `${itemLabel}: ${name}` : field
    return {
        path,
        before,
        after,
        action: after === undefined ? "remove" : "reset",
        description:
            after === undefined
                ? `${label} will be removed`
                : `${label} will be reset from ${displayValue(before)} to ${displayValue(after)}`
    }
}

// Validation can add defaults, strip unsupported properties, or normalize values even on
// success. Include these changes in the preview too; nothing discarded should be hidden.
const differences = (before: unknown, after: unknown, path: Path): CharacterRepairChange[] => {
    if (JSON.stringify(before) === JSON.stringify(after)) return []
    if (isObject(before) && isObject(after)) {
        return [...new Set([...Object.keys(before), ...Object.keys(after)])].flatMap((key) =>
            differences(
                Object.hasOwn(before, key) ? before[key] : undefined,
                Object.hasOwn(after, key) ? after[key] : undefined,
                [...path, key]
            )
        )
    }
    if (Array.isArray(before) && Array.isArray(after) && before.length === after.length) {
        return before.flatMap((entry, index) => differences(entry, after[index], [...path, index]))
    }
    return [change(path, before, after)]
}

const repair = (
    schema: z.ZodType,
    value: unknown,
    fallback: unknown,
    path: Path
): Repair | null => {
    const valid = schema.safeParse(value)
    if (valid.success) return { value: valid.data, changes: differences(value, valid.data, path) }

    let inner = schema
    while (inner instanceof z.ZodOptional || inner instanceof z.ZodDefault)
        inner = inner.unwrap() as z.ZodType

    if (inner instanceof z.ZodArray && Array.isArray(value)) {
        const result: unknown[] = []
        const changes: CharacterRepairChange[] = []
        value.forEach((entry, index) => {
            const repaired = repair(inner.element as z.ZodType, entry, undefined, [...path, index])
            if (repaired) {
                result.push(repaired.value)
                changes.push(...repaired.changes)
            } else {
                // Invalid list entries have no trustworthy empty-character template. Remove
                // only that entry, retaining all valid entries and their order.
                changes.push(change([...path, index], entry, undefined))
            }
        })
        return { value: result, changes }
    }

    if (inner instanceof z.ZodRecord && isObject(value)) {
        const result: Record<string, unknown> = Object.create(null)
        const changes: CharacterRepairChange[] = []
        for (const [key, entry] of Object.entries(value)) {
            const parsed = inner.safeParse({ [key]: entry })
            if (parsed.success) {
                result[key] = parsed.data[key]
                changes.push(...differences(entry, parsed.data[key], [...path, key]))
            } else changes.push(change([...path, key], entry, undefined))
        }
        return { value: result, changes }
    }

    if (inner instanceof z.ZodObject && isObject(value)) {
        const result: Record<string, unknown> = Object.create(null)
        const changes: CharacterRepairChange[] = []
        let complete = true
        for (const [key, child] of Object.entries(inner.shape)) {
            const repaired = repair(
                child as z.ZodType,
                Object.hasOwn(value, key) ? value[key] : undefined,
                isObject(fallback) && Object.hasOwn(fallback, key) ? fallback[key] : undefined,
                [...path, key]
            )
            if (!repaired) {
                complete = false
                break
            }
            if (repaired.value !== undefined) result[key] = repaired.value
            changes.push(...repaired.changes)
        }
        if (complete) {
            for (const key of Object.keys(value)) {
                if (!Object.hasOwn(inner.shape, key))
                    changes.push(change([...path, key], value[key], undefined))
            }
            return { value: result, changes }
        }
    }

    // Use only a schema-validated empty-character value (or an allowed optional omission).
    // Never invent field values, and never replace a parent containing healthy siblings.
    const safeDefault = schema.safeParse(fallback)
    if (!safeDefault.success) return null
    return { value: clone(safeDefault.data), changes: differences(value, safeDefault.data, path) }
}

// Some historical patches refresh valid reference text/exclusions as well. During
// recovery, take only patches for invalid fields so healthy custom data stays intact.
const compatibilityDefaults = (original: Record<string, unknown>): Record<string, unknown> => {
    const patched = clone(original)
    applyCharacterCompatibilityPatches(patched)
    const validation = characterSchema.safeParse(original)
    const issues = validation.success ? [] : validation.error.issues
    const candidate = clone(original)
    for (const entry of differences(original, patched, [])) {
        const overlapsInvalidField = issues.some((issue) =>
            issue.path
                .slice(0, Math.min(issue.path.length, entry.path.length))
                .every((part, index) => part === entry.path[index])
        )
        if (!overlapsInvalidField && entry.path.join(".") !== "version") continue
        let parent: Record<string | number, unknown> = candidate
        for (const key of entry.path.slice(0, -1))
            parent = parent[key] as Record<string | number, unknown>
        const key = entry.path.at(-1)!
        if (entry.after === undefined) delete parent[key]
        else parent[key] = clone(entry.after)
    }
    return candidate
}

export const previewCharacterRepair = (raw: string): CharacterRepairPreview => {
    let original: unknown
    try {
        original = JSON.parse(raw)
    } catch {
        return {
            success: false,
            error: "This save is not readable JSON. Download it so it can be recovered manually."
        }
    }
    if (!isObject(original))
        return {
            success: false,
            error: "This save does not contain a character object. Download it for manual recovery."
        }

    const alreadyValid = characterSchema.safeParse(original)
    if (alreadyValid.success) {
        return {
            success: true,
            character: alreadyValid.data,
            changes: differences(original, alreadyValid.data, [])
        }
    }

    // Apply normal migrations first so old-but-valid data is not mistaken for damage.
    let candidate = clone(original)
    let migrated = true
    try {
        candidate = compatibilityDefaults(original)
    } catch {
        candidate = clone(original)
        migrated = false
    }
    const repaired = repair(characterSchema, candidate, getEmptyCharacter(), [])
    if (!repaired)
        return {
            success: false,
            error: "A safe repair could not be prepared. Download the original save for manual recovery."
        }

    const changes = [...differences(original, candidate, []), ...repaired.changes]
    let result = repaired.value as Record<string, unknown>
    if (!migrated) {
        // A malformed field can prevent migration entirely. Retry after repairing it,
        // including deriving legacy discipline ratings from the surviving powers.
        const beforeMigration = clone(result)
        if (
            (!Object.hasOwn(original, "disciplineLevels") || original.disciplineLevels == null) &&
            (typeof original.version !== "number" || original.version < 9)
        ) {
            delete result.disciplineLevels
            result.version = 8
        }
        try {
            result = compatibilityDefaults(result)
        } catch {
            return {
                success: false,
                error: "Compatibility updates could not be completed safely. Download the original save for manual recovery."
            }
        }
        changes.push(...differences(beforeMigration, result, []))
    }
    const validated = characterSchema.safeParse(result)
    if (!validated.success)
        return {
            success: false,
            error: "The proposed repair still fails validation. Download the original save for manual recovery."
        }

    // Merge successive changes to the same field and suppress changes inside removed items.
    const merged = new Map<string, CharacterRepairChange>()
    for (const entry of changes) {
        const key = JSON.stringify(entry.path)
        const previous = merged.get(key)
        merged.set(key, change(entry.path, previous ? previous.before : entry.before, entry.after))
    }
    const entries = [...merged.values()]
    return {
        success: true,
        character: validated.data,
        changes: entries.filter(
            (entry) =>
                JSON.stringify(entry.before) !== JSON.stringify(entry.after) &&
                !entries.some(
                    (parent) =>
                        parent.action === "remove" &&
                        parent.path.length < entry.path.length &&
                        parent.path.every((part, index) => entry.path[index] === part)
                )
        )
    }
}
