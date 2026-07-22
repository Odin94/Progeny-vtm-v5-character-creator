import { describe, expect, it } from "vitest"
import { disciplines, type Power } from "~/data/Disciplines"
import { getDisciplinePowerDisabledReason } from "~/generator/disciplinePowerAvailability"

const power = (discipline: keyof typeof disciplines, name: string): Power => {
    const found = disciplines[discipline].powers.find((candidate) => candidate.name === name)
    if (!found) throw new Error(`Missing ${discipline} power fixture: ${name}`)
    return found
}

const lethalBody = power("potence", "Lethal Body")
const soaringLeap = power("potence", "Soaring Leap")
const prowess = power("potence", "Prowess")
const catsGrace = power("celerity", "Cat's Grace")
const rapidReflexes = power("celerity", "Rapid Reflexes")
const heightenedSenses = power("auspex", "Heightened Senses")
const senseTheUnseen = power("auspex", "Sense the Unseen")
const bondFamulus = power("animalism", "Bond Famulus")
const leashTheBeast = power("animalism", "Leash the Beast")

const reasonFor = (
    candidate: Power,
    pickedClanPowers: Power[] = [],
    pickedPredatorTypePower?: Power,
    isForPredatorType = false
) =>
    getDisciplinePowerDisabledReason({
        power: candidate,
        isForPredatorType,
        pickedClanPowers,
        pickedPredatorTypePower
    })

describe("discipline power availability", () => {
    it("allows an eligible power", () => {
        expect(reasonFor(lethalBody)).toBeNull()
        expect(reasonFor(prowess, [lethalBody])).toBeNull()
    })

    it("explains missing lower-level powers", () => {
        expect(reasonFor(prowess)).toBe("Pick 1 lower-level Potence power first")
    })

    it("explains missing amalgam prerequisites", () => {
        expect(reasonFor(leashTheBeast, [bondFamulus])).toBe("Requires Fortitude Lv 1")
    })

    it("explains the two-discipline clan limit", () => {
        expect(reasonFor(heightenedSenses, [lethalBody, catsGrace])).toBe(
            "Clan powers may only come from 2 disciplines"
        )
    })

    it("explains the two-power per discipline limit", () => {
        expect(reasonFor(prowess, [lethalBody, soaringLeap])).toBe(
            "You've already taken 2 powers from Potence"
        )
    })

    it("explains when all clan powers are selected", () => {
        expect(reasonFor(heightenedSenses, [lethalBody, catsGrace, rapidReflexes])).toBe(
            "You've already chosen all 3 clan powers"
        )
    })

    it("explains when the predator type power is already selected", () => {
        expect(reasonFor(senseTheUnseen, [], heightenedSenses, true)).toBe(
            "You've already chosen your predator type power"
        )
    })
})
