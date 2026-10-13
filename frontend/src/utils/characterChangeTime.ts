import { stableStringify, type Character } from "~/data/Character"

const replacementTimes = new WeakMap<Character, string | null>()
export const markBrowserCharacterReplacement = (
    character: Character,
    changedAt: string | null = null
): Character => {
    replacementTimes.set(character, changedAt)
    return character
}
export const browserCharacterReplacementTime = (character: Character) =>
    replacementTimes.get(character)

const STORAGE_KEY = "progeny-character-change-time"
const contentKey = (character: Character) => {
    const { characterVersion: _revision, ...content } = character
    return stableStringify(content)
}

// Optional browser metadata, separate from the exported character contract.
// A revision acknowledgement alone is not an edit. Loading a different character
// cannot tell us when its contents were originally edited, so leave it unknown.
export const recordBrowserCharacterChange = (
    previous: Character,
    next: Character,
    replacementAt?: string | null
) => {
    try {
        if (replacementAt !== undefined) {
            if (replacementAt && Number.isFinite(Date.parse(replacementAt))) {
                localStorage.setItem(
                    STORAGE_KEY,
                    JSON.stringify({ key: contentKey(next), changedAt: replacementAt })
                )
            } else localStorage.removeItem(STORAGE_KEY)
            return
        }
        const key = contentKey(next)
        if (previous.id === next.id && contentKey(previous) === key) return
        if (previous.id !== next.id || previous.characterVersion !== next.characterVersion) {
            localStorage.removeItem(STORAGE_KEY)
            return
        }
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ key, changedAt: new Date().toISOString() })
        )
    } catch {
        // Date metadata must never interfere with character persistence.
    }
}

export const readBrowserCharacterChangeTime = (character: Character): string | null => {
    try {
        const entry = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null")
        return entry?.key === contentKey(character) &&
            typeof entry.changedAt === "string" &&
            Number.isFinite(Date.parse(entry.changedAt))
            ? entry.changedAt
            : null
    } catch {
        return null
    }
}
