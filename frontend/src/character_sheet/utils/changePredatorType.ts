import type { Character } from "~/data/Character"
import {
    getCharacterPredatorType,
    getPredatorDisciplineIdentity,
    replacePredatorSkillBonuses
} from "~/data/predatorTypeOptions"
import { getPowerDisciplineIdentity } from "~/utils/homebrewOptions"
import { adjustPickedMeritsAndFlawsForPredatorTypeChange } from "~/data/meritsAndFlawsResolution"
import { characterHasCeremonyPrerequisite, getOblivionCeremonyLevel } from "~/data/Ceremonies"

// Sheet edits operate on the latest state, preserving purchases and unrelated edits.
export const changeSheetPredatorType = (
    current: Character,
    predatorType: Character["predatorType"]
): Character => {
    const previousRules = getCharacterPredatorType(current)
    const next = {
        ...current,
        ...adjustPickedMeritsAndFlawsForPredatorTypeChange(current, predatorType),
        ...replacePredatorSkillBonuses(current, predatorType)
    }
    if (
        JSON.stringify(current.predatorType.homebrew?.skillBonuses ?? []) ===
        JSON.stringify(predatorType.homebrew?.skillBonuses ?? [])
    ) {
        next.skills = current.skills
        next.predatorType.appliedSkillBonuses = current.predatorType.appliedSkillBonuses
    }
    const nextRules = getCharacterPredatorType(next)
    next.humanity = Math.max(
        0,
        Math.min(10, current.humanity + nextRules.humanityChange - previousRules.humanityChange)
    )
    next.bloodPotency = Math.max(
        0,
        Math.min(
            10,
            current.bloodPotency + nextRules.bloodPotencyChange - previousRules.bloodPotencyChange
        )
    )
    const oldIdentity = getPredatorDisciplineIdentity(current)
    const newIdentity = getPredatorDisciplineIdentity(next)
    if (oldIdentity === newIdentity) return next
    const levels = { ...current.disciplineLevels }
    if (current.predatorType.pickedDiscipline)
        levels[oldIdentity] = Math.max(0, (levels[oldIdentity] ?? 0) - 1)
    // Remove the old bonus power (the generator appends it after clan powers).
    const bonusIndex =
        current.predatorType.pickedDiscipline &&
        current.disciplines.filter((power) => getPowerDisciplineIdentity(power) === oldIdentity)
            .length > (levels[oldIdentity] ?? 0)
            ? current.disciplines.findLastIndex(
                  (power) => getPowerDisciplineIdentity(power) === oldIdentity
              )
            : -1
    let powers = current.disciplines.filter((_, index) => index !== bonusIndex)
    if (predatorType.pickedDiscipline)
        levels[newIdentity] = Math.min(5, (levels[newIdentity] ?? 0) + 1)
    // Remove invalid powers to a fixed point: losing one amalgam may invalidate another.
    let changed = true
    while (changed) {
        changed = false
        const invalid = powers.filter(
            (power) =>
                power.level > (levels[getPowerDisciplineIdentity(power)] ?? 0) ||
                power.amalgamPrerequisites.some((prerequisite) => {
                    const identities = new Set(
                        powers
                            .filter((candidate) => candidate.discipline === prerequisite.discipline)
                            .map(getPowerDisciplineIdentity)
                    )
                    identities.add(`official:${prerequisite.discipline}`)
                    return ![...identities].some(
                        (identity) => (levels[identity] ?? 0) >= prerequisite.level
                    )
                })
        )
        if (!invalid.length) break
        for (const power of invalid) {
            const identity = getPowerDisciplineIdentity(power)
            // Level-invalid powers already lost their supporting dot; amalgam losses remove a dot.
            if (power.level <= (levels[identity] ?? 0))
                levels[identity] = Math.max(0, (levels[identity] ?? 0) - 1)
        }
        powers = powers.filter((power) => !invalid.includes(power))
        changed = true
    }
    next.disciplineLevels = Object.fromEntries(
        Object.entries(levels).filter(([, level]) => level > 0)
    )
    next.disciplines = powers
    next.rituals = current.rituals.filter(
        (ritual) => ritual.level <= (levels["official:blood sorcery"] ?? 0)
    )
    next.ceremonies = current.ceremonies.filter(
        (ceremony) =>
            ceremony.level <= getOblivionCeremonyLevel(next) &&
            characterHasCeremonyPrerequisite(next, ceremony)
    )
    return next
}
