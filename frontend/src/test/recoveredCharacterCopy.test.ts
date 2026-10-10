import { beforeEach, expect, it } from "vitest"
import { getEmptyCharacter } from "~/data/Character"
import { loadCharacterFromJson } from "~/components/LoadModal"
import {
    createRecoveredCharacterCopy,
    preserveCharacterDraft,
    readRecoveredCharacterDrafts
} from "~/utils/characterDraft"

beforeEach(() => localStorage.clear())
it("exports a recovery as a separate importable draft while retaining source provenance", async () => {
    const original = {
        ...getEmptyCharacter(),
        id: "original-cloud-id",
        characterVersion: 7,
        name: "Recovered Maven",
        description: "Private recovered text"
    }
    preserveCharacterDraft(original, "Cloud save conflict")
    const savedRecovery = readRecoveredCharacterDrafts()[0]
    const copy = createRecoveredCharacterCopy(savedRecovery.character)
    const imported = await loadCharacterFromJson(JSON.stringify(copy))
    expect(imported.id).toBe("")
    expect(imported.characterVersion).toBe(0)
    expect(imported.description).toBe(original.description)
    expect(savedRecovery.character.id).toBe(original.id)
    expect(JSON.parse(localStorage.getItem("progeny-character-recovery")!)[0]).toMatchObject({
        sourceCharacterId: original.id,
        sourceCharacterVersion: 7
    })
})
