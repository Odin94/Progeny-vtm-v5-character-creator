import type { Character, MeritFlaw } from "~/data/Character"
import type { Power } from "~/data/Disciplines"
import type { Specialty } from "~/data/Specialties"
import { getMeritFlawIdentity, getPowerIdentity } from "./homebrewOptions"

export const getMeritFlawCustomTextKey = (meritFlaw: MeritFlaw): string =>
    `${getMeritFlawIdentity(meritFlaw, meritFlaw.type)}:${meritFlaw.text ?? ""}`

export const getSkillSpecialtyCustomTextKey = (specialty: Specialty): string =>
    `${specialty.skill}:${specialty.name}`

export const getDisciplinePowerCustomTextKey = (power: Power): string => getPowerIdentity(power)

export const appendCustomText = (text: string, customText: string): string =>
    [text, customText].filter(Boolean).join("\n\n")

type CustomTextKind = keyof Character["customText"]

// Keep empty notes out of persisted data while allowing every caller to treat a
// missing entry as an empty string.
export const updateCustomText = (
    character: Character,
    kind: CustomTextKind,
    key: string,
    value: string
): Character["customText"] => {
    const entries = { ...character.customText[kind] }
    if (value) {
        entries[key] = value
    } else {
        delete entries[key]
    }

    return { ...character.customText, [kind]: entries }
}
