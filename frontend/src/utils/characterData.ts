import { applyCharacterCompatibilityPatches, Character, characterSchema } from "~/data/Character"

import {
    reportCharacterValidationError,
    type CharacterValidationSource
} from "./characterRecoveryAnalytics"

export const parseCharacterData = (
    data: unknown,
    source: CharacterValidationSource = "character-data"
): Character | null => {
    let parsed: unknown

    if (typeof data === "string") {
        try {
            parsed = JSON.parse(data)
        } catch (error) {
            reportCharacterValidationError(error, source, "json")
            return null
        }
    } else if (data && typeof data === "object" && !Array.isArray(data)) {
        try {
            parsed = JSON.parse(JSON.stringify(data))
        } catch (error) {
            reportCharacterValidationError(error, source, "json")
            return null
        }
    } else {
        if (data != null || source !== "character-data")
            reportCharacterValidationError(new Error("Expected character object"), source, "schema")
        return null
    }

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        reportCharacterValidationError(new Error("Expected character object"), source, "schema")
        return null
    }

    try {
        applyCharacterCompatibilityPatches(parsed as Record<string, unknown>)
    } catch (error) {
        reportCharacterValidationError(error, source, "compatibility", parsed)
        return null
    }

    const result = characterSchema.safeParse(parsed)
    if (!result.success) reportCharacterValidationError(result.error, source, "schema", parsed)
    return result.success ? result.data : null
}
