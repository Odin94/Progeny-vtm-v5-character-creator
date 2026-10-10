import { z } from "zod"
import {
    applyCharacterCompatibilityPatches,
    characterSchema,
    type Character
} from "~/data/Character"
import {
    reportCharacterValidationError,
    type CharacterValidationSource
} from "~/utils/characterRecoveryAnalytics"
import { previewCharacterRepair } from "~/utils/repairCharacter"

export const CHARACTER_RECOVERY_KEY = "character_recovery_saves"
export const BROKEN_SAVE_KEY = "character_broken_save"
export const BROKEN_SAVE_ERROR_KEY = "character_broken_save_error"
export const recoverySavesSchema = z.array(
    z.object({ savedAt: z.string(), data: z.string(), error: z.string() })
)
type RecoveryStorage = Pick<Storage, "getItem" | "setItem">

// All original bytes are retained before any repair or replacement. Storage failures
// propagate: callers must keep the current draft/recovery prompt visible on failure.
export const createCharacterIntake = (storage: () => RecoveryStorage) => {
    const archive = (data: string, error: string) => {
        const saves = recoverySavesSchema.parse(
            JSON.parse(storage().getItem(CHARACTER_RECOVERY_KEY) || "[]")
        )
        if (!saves.some((save) => save.data === data)) {
            saves.push({ savedAt: new Date().toISOString(), data, error })
            storage().setItem(CHARACTER_RECOVERY_KEY, JSON.stringify(saves))
        }
        return saves
    }
    const preserve = (data: string, error: string) => {
        const previous = JSON.parse(storage().getItem(BROKEN_SAVE_KEY) || '""') as string
        if (previous && previous !== data)
            archive(previous, JSON.parse(storage().getItem(BROKEN_SAVE_ERROR_KEY) || '""'))
        storage().setItem(BROKEN_SAVE_KEY, JSON.stringify(data))
        storage().setItem(BROKEN_SAVE_ERROR_KEY, JSON.stringify(error))
    }
    const read = (data: unknown, source: CharacterValidationSource) => {
        let original = ""
        let parsed: unknown
        let phase: "json" | "compatibility" | "schema" = "json"
        try {
            original = typeof data === "string" ? data : JSON.stringify(data)
            parsed = JSON.parse(original)
            phase = "schema"
            if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
                throw new Error("Expected character object")
            phase = "compatibility"
            applyCharacterCompatibilityPatches(parsed as Record<string, unknown>)
            phase = "schema"
            return { success: true as const, character: characterSchema.parse(parsed) }
        } catch (error) {
            if (data != null || source !== "character-data")
                reportCharacterValidationError(error, source, phase, parsed)
            const message =
                error instanceof z.ZodError
                    ? JSON.stringify(error.issues, null, 2)
                    : error instanceof Error
                      ? error.message
                      : String(error)
            if (original) {
                if (source === "local-storage") preserve(original, message)
                else archive(original, message)
            }
            return { success: false as const, original, error, message }
        }
    }
    const clear = (data: string, error: string) => {
        if (data) archive(data, error)
        storage().setItem(BROKEN_SAVE_KEY, JSON.stringify(""))
        storage().setItem(BROKEN_SAVE_ERROR_KEY, JSON.stringify(""))
    }
    return {
        read,
        archive,
        preserve,
        clear,
        persist: (character: Character) => {
            const original = JSON.parse(storage().getItem(BROKEN_SAVE_KEY) || '""') as string
            if (original)
                archive(original, JSON.parse(storage().getItem(BROKEN_SAVE_ERROR_KEY) || '""'))
            storage().setItem("character", JSON.stringify(character))
        },
        preview: previewCharacterRepair,
        applyApprovedRepair: (original: string, error: string): Character => {
            const pending = JSON.parse(storage().getItem(BROKEN_SAVE_KEY) || '""') as string
            if (pending && pending !== original)
                throw new Error(
                    "The recovery save changed. Review the new repair before applying it."
                )
            const preview = previewCharacterRepair(original)
            if (!preview.success) throw new Error(preview.error)
            archive(original, error)
            storage().setItem("character", JSON.stringify(preview.character))
            clear(original, error)
            return preview.character
        }
    }
}
export const characterIntake = createCharacterIntake(() => ({
    getItem: (key) => localStorage.getItem(key),
    setItem: (key, value) => {
        localStorage.setItem(key, value)
        if (key === CHARACTER_RECOVERY_KEY) {
            const saves = JSON.parse(value)
            queueMicrotask(() =>
                window.dispatchEvent(
                    new CustomEvent("mantine-local-storage", { detail: { key, value: saves } })
                )
            )
        }
    }
}))
