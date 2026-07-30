import type { Power } from "~/data/Disciplines"
import { getPowerDisciplineIdentity, getPowerIdentity } from "~/utils/homebrewOptions"
import { upcase } from "./utils"

type DisciplinePowerAvailability = {
    power: Power
    isForPredatorType: boolean
    pickedClanPowers: Power[]
    pickedPredatorTypePower?: Power
}

export const getDisciplinePowerDisabledReason = ({
    power,
    isForPredatorType,
    pickedClanPowers,
    pickedPredatorTypePower
}: DisciplinePowerAvailability): string | null => {
    const allPickedPowers = pickedPredatorTypePower
        ? [...pickedClanPowers, pickedPredatorTypePower]
        : pickedClanPowers

    if (
        allPickedPowers.some(
            (pickedPower) => getPowerIdentity(pickedPower) === getPowerIdentity(power)
        )
    ) {
        return null
    }

    const disciplineIdentity = getPowerDisciplineIdentity(power)
    const pickedFromDiscipline = allPickedPowers.filter(
        (pickedPower) => getPowerDisciplineIdentity(pickedPower) === disciplineIdentity
    )
    const missingLevels = power.level - 1 - pickedFromDiscipline.length
    if (missingLevels > 0) {
        return `Pick ${missingLevels} lower-level ${upcase(power.discipline)} power${
            missingLevels > 1 ? "s" : ""
        } first`
    }

    const missingAmalgams = power.amalgamPrerequisites
        .filter(
            ({ discipline, level }) =>
                allPickedPowers.filter((pickedPower) => pickedPower.discipline === discipline)
                    .length < level
        )
        .map(({ discipline, level }) => `${upcase(discipline)} Lv ${level}`)
    if (missingAmalgams.length > 0) {
        return `Requires ${missingAmalgams.join(", ")}`
    }

    if (isForPredatorType) {
        return pickedPredatorTypePower ? "You've already chosen your predator type power" : null
    }

    if (pickedClanPowers.length >= 3) {
        return "You've already chosen all 3 clan powers"
    }

    const pickedDisciplines = new Set(pickedClanPowers.map(getPowerDisciplineIdentity))
    if (pickedDisciplines.size >= 2 && !pickedDisciplines.has(disciplineIdentity)) {
        return "Clan powers may only come from 2 disciplines"
    }

    if (
        pickedClanPowers.filter(
            (pickedPower) => getPowerDisciplineIdentity(pickedPower) === disciplineIdentity
        ).length >= 2
    ) {
        return `You've already taken 2 powers from ${upcase(power.discipline)}`
    }

    return null
}
