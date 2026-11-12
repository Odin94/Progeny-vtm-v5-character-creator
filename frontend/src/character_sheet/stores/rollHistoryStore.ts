import { create } from "zustand"

/**
 * Presentation-only list of this tab's recent rolls, shown in the dice roller.
 * It is never persisted or sent anywhere and survives closing the roller.
 */
export type RollHistoryEntry = {
    rollId: string
    at: number
    poolLabel: string
    dice: Array<{ value: number; isBloodDie: boolean }>
    totalSuccesses: number
    rerolled: boolean
}

const MAX_ENTRIES = 12

type RollHistoryStore = {
    entries: RollHistoryEntry[]
    /** Character the entries belong to; switching characters starts a fresh history. */
    characterKey: string | null
    record: (entry: Omit<RollHistoryEntry, "rerolled" | "at">) => void
    bindToCharacter: (characterKey: string) => void
    clear: () => void
}

const sameFaces = (a: RollHistoryEntry["dice"], b: RollHistoryEntry["dice"]) =>
    a.length === b.length && a.every((die, index) => die.value === b[index].value)

export const useRollHistoryStore = create<RollHistoryStore>((set) => ({
    entries: [],
    characterKey: null,
    record: (entry) =>
        set((state) => {
            const existing = state.entries.find((item) => item.rollId === entry.rollId)
            if (!existing) {
                return {
                    entries: [
                        { ...entry, at: Date.now(), rerolled: false },
                        ...state.entries
                    ].slice(0, MAX_ENTRIES)
                }
            }
            if (sameFaces(existing.dice, entry.dice)) return state
            return {
                entries: state.entries.map((item) =>
                    item.rollId === entry.rollId ? { ...item, ...entry, rerolled: true } : item
                )
            }
        }),
    bindToCharacter: (characterKey) =>
        set((state) =>
            state.characterKey === characterKey ? state : { characterKey, entries: [] }
        ),
    clear: () => set({ entries: [] })
}))
