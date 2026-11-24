import { act, renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import {
    applyCharacterCompatibilityPatches,
    characterSchema,
    getEmptyCharacter
} from "~/data/Character"
import { Ceremonies } from "~/data/Ceremonies"
import { disciplines } from "~/data/Disciplines"
import { Rituals } from "~/data/Rituals"
import { getDisciplineDraft } from "~/generator/creatorDrafts"
import { getCharacterWithGeneration } from "~/generator/generation"
import { useCharacterLocalStorage } from "~/hooks/useCharacterLocalStorage"
import { getPowerIdentity } from "~/utils/homebrewOptions"

const [firstPower, secondPower] = disciplines.auspex.powers
const olderCharacter = () => {
    const empty = getEmptyCharacter()
    return {
        ...empty,
        version: 13,
        clan: "Toreador" as const,
        name: "A returning character",
        generation: 10,
        experience: 45,
        ephemeral: { ...empty.ephemeral, experienceSpent: 23 },
        predatorType: { ...empty.predatorType, name: "Consensualist", pickedDiscipline: "auspex" },
        disciplines: [firstPower],
        disciplineLevels: { "official:auspex": 1 },
        rituals: Rituals.slice(0, 2),
        ceremonies: Ceremonies.slice(0, 2)
    }
}

afterEach(() => localStorage.clear())

describe("v14 creator save migration", () => {
    it("upgrades a v13 local character and preserves its totals, revision and learned entries", () => {
        const original = { ...olderCharacter(), characterVersion: 17 }
        localStorage.setItem("character", JSON.stringify(original))

        const { result, unmount } = renderHook(useCharacterLocalStorage)
        const [migrated, update] = result.current
        expect(migrated).toMatchObject({
            version: 14,
            characterVersion: 17,
            generationBonusXp: 35,
            experience: 45,
            ephemeral: { experienceSpent: 23 },
            disciplines: original.disciplines,
            rituals: original.rituals,
            ceremonies: original.ceremonies,
            predatorType: { pickedPowerId: getPowerIdentity(firstPower) }
        })
        expect(migrated.freeRitual).toBeUndefined()
        expect(migrated.freeCeremony).toBeUndefined()
        const changed = getCharacterWithGeneration(migrated, 13)
        expect(changed.experience).toBe(25)
        expect(changed.ephemeral.experienceSpent).toBe(23)
        act(() => update(changed))
        unmount()

        expect(renderHook(useCharacterLocalStorage).result.current[0]).toEqual(changed)
        expect(JSON.parse(localStorage.getItem("character")!)).toMatchObject({
            version: 14,
            experience: 25,
            generationBonusXp: 15
        })
    })

    it("runs older patches before v14 and leaves ambiguous power provenance unset", () => {
        const original = olderCharacter()
        const { disciplineLevels: _oldLevels, ...legacy } = original
        const stored = {
            ...legacy,
            version: 8,
            disciplines: [firstPower, secondPower],
            experience: 12
        }

        applyCharacterCompatibilityPatches(stored)
        const upgraded = characterSchema.parse(stored)
        expect(upgraded.disciplineLevels["official:auspex"]).toBe(2)
        expect(upgraded.experience).toBe(12)
        expect(upgraded.generationBonusXp).toBe(0)
        expect(getDisciplineDraft(upgraded)).toEqual({
            clanPowers: stored.disciplines,
            predatorPower: undefined
        })
        expect(getCharacterWithGeneration(upgraded, 10)).toBe(upgraded)
    })

    it("does not claim a lone purchased power when an older sheet recorded a separate dot", () => {
        const original = { ...olderCharacter(), disciplineLevels: { "official:auspex": 2 } }

        applyCharacterCompatibilityPatches(original)
        const upgraded = characterSchema.parse(original)
        expect(upgraded.disciplines).toEqual(original.disciplines)
        expect(upgraded.predatorType.pickedPowerId).toBeUndefined()
    })

    it("retains v14 provenance and never guesses an award again for a current save", () => {
        const original = olderCharacter()
        const current = {
            ...original,
            version: 14,
            generationBonusXp: 10,
            predatorType: { ...original.predatorType, pickedPowerId: undefined }
        }
        applyCharacterCompatibilityPatches(current)
        expect(current.generationBonusXp).toBe(10)
        expect(current.predatorType.pickedPowerId).toBeUndefined()
    })
})
