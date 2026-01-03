import { z } from "zod"
import {
    attributesSchema,
    characterSchema as baseCharacterSchema,
    meritFlawSchema,
    touchstoneSchema,
    schemaVersion,
    Power,
    powerSchema,
    ritualSchema,
    clanNameSchema,
    disciplineNameSchema,
    predatorTypeNameSchema,
    skillsSchema,
    specialtySchema,
    getEmptyCharacter,
    type MeritFlaw,
    type Touchstone,
} from "@progeny/shared"
import { clans } from "./Clans"
import { getAllKnownMeritsAndFlaws } from "./MeritsAndFlaws"

// Re-export types for backwards compatibility
export { meritFlawSchema, touchstoneSchema, schemaVersion, type MeritFlaw, type Touchstone }

// Use the shared character schema
export const characterSchema = baseCharacterSchema
export type Character = z.infer<typeof baseCharacterSchema>

// Re-export getEmptyCharacter from shared for backwards compatibility
export { getEmptyCharacter } from "@progeny/shared"

export const containsBloodSorcery = (powers: Power[]) => powers.filter((power) => power.discipline === "blood sorcery").length > 0

export const applyCharacterCompatibilityPatches = (parsed: Record<string, unknown>): void => {
    if (!parsed["rituals"]) parsed["rituals"] = []
    if (parsed["predatorType"]) {
        const predatorType = parsed["predatorType"] as Record<string, unknown>
        if (!predatorType["pickedMeritsAndFlaws"]) {
            predatorType["pickedMeritsAndFlaws"] = []
        }
    }
    if (!parsed["availableDisciplineNames"]) {
        // backwards compatibility for characters that were saved before Caitiff were added
        const clan = clanNameSchema.parse(parsed["clan"])
        const clanDisciplines = clans[clan].nativeDisciplines

        parsed["availableDisciplineNames"] = Array.from(new Set(clanDisciplines))
    }
    if (!parsed["notes"]) parsed["notes"] = ""
    if (!parsed["id"]) parsed["id"] = ""
    if (!parsed["player"]) parsed["player"] = ""
    if (!parsed["chronicle"]) parsed["chronicle"] = ""
    if (!parsed["sect"]) parsed["sect"] = ""
    if (!parsed["ephemeral"]) {
        // backwards compatibility for characters that were saved before ephemeral was added
        parsed["ephemeral"] = {
            hunger: 0,
            superficialDamage: 0,
            aggravatedDamage: 0,
            superficialWillpowerDamage: 0,
            aggravatedWillpowerDamage: 0,
            humanityStains: 0,
            experienceSpent: 0,
        }
    } else {
        // Ensure all ephemeral fields exist, defaulting to 0 if missing
        const ephemeral = parsed["ephemeral"] as Record<string, unknown>
        parsed["ephemeral"] = {
            hunger: ephemeral["hunger"] ?? 0,
            superficialDamage: ephemeral["superficialDamage"] ?? 0,
            aggravatedDamage: ephemeral["aggravatedDamage"] ?? 0,
            superficialWillpowerDamage: ephemeral["superficialWillpowerDamage"] ?? 0,
            aggravatedWillpowerDamage: ephemeral["aggravatedWillpowerDamage"] ?? 0,
            humanityStains: ephemeral["humanityStains"] ?? 0,
            experienceSpent: ephemeral["experienceSpent"] ?? 0,
        }
    }

    patchV2ToV3Compatibility(parsed)

    parsed["version"] = schemaVersion
}

export const patchV2ToV3Compatibility = (parsed: Record<string, unknown>): void => {
    const knownMeritsAndFlaws = getAllKnownMeritsAndFlaws()

    const updateMeritFlawExcludes = (meritFlaw: Record<string, unknown>) => {
        const name = meritFlaw["name"]
        if (typeof name === "string") {
            const known = knownMeritsAndFlaws.get(name)
            meritFlaw["excludes"] = known?.excludes ?? []
        }
    }

    if (Array.isArray(parsed["merits"])) {
        parsed["merits"].forEach((merit: unknown) => {
            if (merit && typeof merit === "object") {
                updateMeritFlawExcludes(merit as Record<string, unknown>)
            }
        })
    }

    if (Array.isArray(parsed["flaws"])) {
        parsed["flaws"].forEach((flaw: unknown) => {
            if (flaw && typeof flaw === "object") {
                updateMeritFlawExcludes(flaw as Record<string, unknown>)
            }
        })
    }

    if (parsed["predatorType"]) {
        const predatorType = parsed["predatorType"] as Record<string, unknown>
        if (Array.isArray(predatorType["pickedMeritsAndFlaws"])) {
            predatorType["pickedMeritsAndFlaws"].forEach((meritFlaw: unknown) => {
                if (meritFlaw && typeof meritFlaw === "object") {
                    updateMeritFlawExcludes(meritFlaw as Record<string, unknown>)
                }
            })
        }
    }
}
