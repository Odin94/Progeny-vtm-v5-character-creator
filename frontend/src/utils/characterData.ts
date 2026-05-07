import { applyCharacterCompatibilityPatches, Character, characterSchema } from "~/data/Character"

export const parseCharacterData = (data: unknown): Character | null => {
    let parsed: unknown

    if (typeof data === "string") {
        try {
            parsed = JSON.parse(data)
        } catch (_error) {
            return null
        }
    } else if (data && typeof data === "object" && !Array.isArray(data)) {
        try {
            parsed = JSON.parse(JSON.stringify(data))
        } catch (_error) {
            return null
        }
    } else {
        return null
    }

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return null
    }

    try {
        applyCharacterCompatibilityPatches(parsed as Record<string, unknown>)
    } catch (_error) {
        return null
    }

    const result = characterSchema.safeParse(parsed)
    return result.success ? result.data : null
}
