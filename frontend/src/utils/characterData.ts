import type { Character } from "~/data/Character"
import { characterIntake } from "~/modules/characterIntake"
import type { CharacterValidationSource } from "./characterRecoveryAnalytics"

export const parseCharacterData = (
    data: unknown,
    source: CharacterValidationSource = "character-data"
): Character | null => {
    const result = characterIntake.read(data, source)
    return result.success ? result.character : null
}
