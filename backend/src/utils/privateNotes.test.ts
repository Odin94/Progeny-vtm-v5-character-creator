import { describe, expect, it } from "vitest"
import {
    getPrivateNoteWriteAction,
    getPrivateNoteVersionIdsToPrune,
    isDestructiveNoteEdit,
    NOTE_VERSION_LIMIT,
    NOTE_VERSION_SPLIT_MS
} from "./privateNotes.js"

describe("private note history policy", () => {
    const now = new Date("2026-07-16T12:00:00.000Z").getTime()
    const recent = new Date(now - 60_000)
    const old = new Date(now - NOTE_VERSION_SPLIT_MS - 1)

    it("preserves cleared and substantially removed content immediately", () => {
        const largeNote = "A carefully recorded clue. ".repeat(20)

        expect(isDestructiveNoteEdit(largeNote, "")).toBe(true)
        expect(
            getPrivateNoteWriteAction({
                previousContent: largeNote,
                nextContent: "",
                latestCreatedAt: recent,
                now
            })
        ).toBe("create")
    })

    it("preserves large replacements even when their total length is unchanged", () => {
        const previous = `Known facts:\n${"a".repeat(120)}\nEnd.`
        const next = `Known facts:\n${"b".repeat(120)}\nEnd.`

        expect(previous).toHaveLength(next.length)
        expect(isDestructiveNoteEdit(previous, next)).toBe(true)
        expect(
            getPrivateNoteWriteAction({
                previousContent: previous,
                nextContent: next,
                latestCreatedAt: recent,
                now
            })
        ).toBe("create")
    })

    it("updates recent additive work without creating autosave history spam", () => {
        expect(
            getPrivateNoteWriteAction({
                previousContent: "A clue",
                nextContent: "A clue with a little more context",
                latestCreatedAt: recent,
                now
            })
        ).toBe("update")
    })

    it("creates periodic snapshots for substantial older edits", () => {
        expect(
            getPrivateNoteWriteAction({
                previousContent: "The original plan",
                nextContent: "The prince replaced the entire original plan with a dangerous favor",
                latestCreatedAt: old,
                now
            })
        ).toBe("create")
    })

    it("does not store identical content", () => {
        expect(
            getPrivateNoteWriteAction({
                previousContent: "Unchanged",
                nextContent: "Unchanged",
                latestCreatedAt: old,
                now
            })
        ).toBe("unchanged")
    })

    it("retains the current note plus ten historical entries", () => {
        const versions = Array.from({ length: NOTE_VERSION_LIMIT + 2 }, (_, index) => ({
            id: `version-${index}`
        }))

        expect(getPrivateNoteVersionIdsToPrune(versions)).toEqual(["version-0", "version-1"])
    })
})
