import type { Power } from "~/data/Disciplines"
import { getPowerDisciplineIdentity, getPowerIdentity } from "~/utils/homebrewOptions"
import { upcase } from "./utils"

type DisciplinePowerAvailability = {
    power: Power
    isForPredatorType: boolean
    pickedClanPowers: Power[]
    pickedPredatorTypePower?: Power
}

// Returns every reason this power currently can't be taken, not just the first one.
// A single pick can trip more than one rule at once (e.g. the 2-per-discipline cap and
// the all-3-clan-powers cap), and surfacing only the first left users fixing one blocker
// then hitting the next with no warning. An empty array means the power is takeable.
export const getDisciplinePowerDisabledReasons = ({
    power,
    isForPredatorType,
    pickedClanPowers,
    pickedPredatorTypePower
}: DisciplinePowerAvailability): string[] => {
    const allPickedPowers = pickedPredatorTypePower
        ? [...pickedClanPowers, pickedPredatorTypePower]
        : pickedClanPowers

    if (
        allPickedPowers.some(
            (pickedPower) => getPowerIdentity(pickedPower) === getPowerIdentity(power)
        )
    ) {
        return []
    }

    const reasons: string[] = []

    const disciplineIdentity = getPowerDisciplineIdentity(power)
    const pickedFromDiscipline = allPickedPowers.filter(
        (pickedPower) => getPowerDisciplineIdentity(pickedPower) === disciplineIdentity
    )
    const missingLevels = power.level - 1 - pickedFromDiscipline.length
    if (missingLevels > 0) {
        reasons.push(
            `Pick ${missingLevels} lower-level ${upcase(power.discipline)} power${
                missingLevels > 1 ? "s" : ""
            } first`
        )
    }

    const missingAmalgams = power.amalgamPrerequisites
        .filter(
            ({ discipline, level }) =>
                allPickedPowers.filter((pickedPower) => pickedPower.discipline === discipline)
                    .length < level
        )
        .map(({ discipline, level }) => `${upcase(discipline)} Lv ${level}`)
    if (missingAmalgams.length > 0) {
        reasons.push(`Requires ${missingAmalgams.join(", ")}`)
    }

    // Predator-type powers are not subject to the clan-power caps below.
    if (isForPredatorType) {
        if (pickedPredatorTypePower) {
            reasons.push("You've already chosen your predator type power")
        }
        return reasons
    }

    if (pickedClanPowers.length >= 3) {
        reasons.push("You've already chosen all 3 clan powers")
    }

    const pickedDisciplines = new Set(pickedClanPowers.map(getPowerDisciplineIdentity))
    if (pickedDisciplines.size >= 2 && !pickedDisciplines.has(disciplineIdentity)) {
        reasons.push("Clan powers may only come from 2 disciplines")
    }

    if (
        pickedClanPowers.filter(
            (pickedPower) => getPowerDisciplineIdentity(pickedPower) === disciplineIdentity
        ).length >= 2
    ) {
        reasons.push(`You've already taken 2 powers from ${upcase(power.discipline)}`)
    }

    return reasons
}

// Backwards-compatible single-reason helper (first active blocker, or null).
export const getDisciplinePowerDisabledReason = (
    availability: DisciplinePowerAvailability
): string | null => getDisciplinePowerDisabledReasons(availability)[0] ?? null
