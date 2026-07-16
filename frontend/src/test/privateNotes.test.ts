import { describe, expect, it } from "vitest"
import { formatPrivateNoteWordCount, getPrivateNoteWordCount } from "~/utils/privateNotes"

describe("private note word counts", () => {
    it("counts empty, singular, Unicode, numeric, and apostrophe-containing words", () => {
        expect(formatPrivateNoteWordCount("")).toBe("0 words")
        expect(formatPrivateNoteWordCount("clue")).toBe("1 word")
        expect(getPrivateNoteWordCount("Lásombra's 2 clues — gefährlich")).toBe(4)
        expect(formatPrivateNoteWordCount("Lásombra's 2 clues — gefährlich")).toBe("4 words")
    })
})
