import type { Character } from "~/data/Character"

// Local-only identities do not change the exported character schema. Functional
// edits retain their identity; document replacements receive a new one.
const anonymousIdentities = new WeakMap<Character, string>()
export const getCharacterDraftIdentity = (character: Character): string => {
    if (character.id) return character.id
    let identity = anonymousIdentities.get(character)
    if (!identity) {
        identity = crypto.randomUUID()
        anonymousIdentities.set(character, identity)
    }
    return identity
}
export const retainCharacterDraftIdentity = (previous: Character, next: Character) => {
    if (!next.id) anonymousIdentities.set(next, getCharacterDraftIdentity(previous))
}

const latestDrafts = new Map<string, Character>()
export const rememberCharacterDraft = (character: Character) => {
    latestDrafts.set(getCharacterDraftIdentity(character), character)
}
export const getLatestCharacterDraft = (identity: string, fallback: Character) =>
    latestDrafts.get(identity) ?? fallback

// Keep interrupted edits available without writing them into the newly selected
// document. Each entry is a full importable JSON character with a recovery reason.
export const preserveCharacterDraft = (character: Character, reason: string) => {
    try {
        const key = "progeny-character-recovery"
        const existing = JSON.parse(localStorage.getItem(key) ?? "[]")
        const entries = Array.isArray(existing) ? existing : []
        if (
            !entries.some((entry) => JSON.stringify(entry.character) === JSON.stringify(character))
        ) {
            entries.push({ character, reason, recoveredAt: new Date().toISOString() })
            localStorage.setItem(key, JSON.stringify(entries))
        }
    } catch {
        // The active draft remains available even if browser storage is exhausted.
        console.warn("Could not preserve an interrupted character draft")
    }
}

export const readRecoveredCharacterDrafts = (): Array<{
    character: Character
    reason: string
    recoveredAt: string
}> => {
    try {
        const entries = JSON.parse(localStorage.getItem("progeny-character-recovery") ?? "[]")
        return Array.isArray(entries)
            ? entries.filter((entry) => entry?.character && typeof entry.reason === "string")
            : []
    } catch {
        return []
    }
}
