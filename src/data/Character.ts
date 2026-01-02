import { z } from "zod"
import { attributesSchema } from "./Attributes"
import { Power, powerSchema, ritualSchema } from "./Disciplines"
import { clanNameSchema, disciplineNameSchema, predatorTypeNameSchema } from "./NameSchemas"
import { skillsSchema } from "./Skills"
import { specialtySchema } from "./Specialties"
import { clans } from "./Clans"
import { getAllKnownMeritsAndFlaws } from "./MeritsAndFlaws"

export const meritFlawSchema = z.object({
    name: z.string(),
    level: z.number().min(1).int(),
    summary: z.string(),
    excludes: z.string().array(),
    type: z.union([z.literal("merit"), z.literal("flaw")]),
})
export type MeritFlaw = z.infer<typeof meritFlawSchema>

export const touchstoneSchema = z.object({
    name: z.string(),
    description: z.string(),
    conviction: z.string(),
})
export type Touchstone = z.infer<typeof touchstoneSchema>

export const schemaVersion = 3
export const characterSchema = z.object({
    id: z.string().optional().default(""),
    name: z.string(),
    description: z.string(),
    sire: z.string(),
    player: z.string().optional().default(""),
    chronicle: z.string().optional().default(""),
    sect: z.string().optional().default(""),

    clan: clanNameSchema,
    // clanDisciplines:
    predatorType: z.object({
        name: predatorTypeNameSchema,
        pickedDiscipline: disciplineNameSchema,
        pickedSpecialties: specialtySchema.array(),
        pickedMeritsAndFlaws: meritFlawSchema.array(),
    }),
    touchstones: touchstoneSchema.array(),
    ambition: z.string(),
    desire: z.string(),

    attributes: attributesSchema,
    skills: skillsSchema,
    skillSpecialties: specialtySchema.array(),
    availableDisciplineNames: disciplineNameSchema.array(),
    disciplines: powerSchema.array(),
    rituals: ritualSchema.array(),

    bloodPotency: z.number().min(0).int(),
    generation: z.number().min(0).int(),

    maxHealth: z.number().min(0).int(),
    willpower: z.number().min(0).int(),
    experience: z.number().min(0).int(),
    humanity: z.number().min(0).int(),

    merits: meritFlawSchema.array(),
    flaws: meritFlawSchema.array(),

    notes: z.string().optional().default(""),

    ephemeral: z.object({
        hunger: z.number().min(0).int(),
        superficialDamage: z.number().min(0).int(),
        aggravatedDamage: z.number().min(0).int(),
        superficialWillpowerDamage: z.number().min(0).int(),
        aggravatedWillpowerDamage: z.number().min(0).int(),
        humanityStains: z.number().min(0).int(),
        experienceSpent: z.number().min(0).int(),
    }),
    version: z.number().int().positive().optional().default(schemaVersion),
})
export type Character = z.infer<typeof characterSchema>

export const getEmptyCharacter = (): Character => {
    return {
        id: "",
        name: "",
        description: "",
        sire: "",
        player: "",
        chronicle: "",
        sect: "",

        clan: "",
        predatorType: { name: "", pickedDiscipline: "", pickedSpecialties: [], pickedMeritsAndFlaws: [] },
        touchstones: [],
        ambition: "",
        desire: "",

        attributes: {
            strength: 1,
            dexterity: 1,
            stamina: 1,
            charisma: 1,
            manipulation: 1,
            composure: 1,
            intelligence: 1,
            wits: 1,
            resolve: 1,
        },
        skills: {
            athletics: 0,
            brawl: 0,
            craft: 0,
            drive: 0,
            firearms: 0,
            melee: 0,
            larceny: 0,
            stealth: 0,
            survival: 0,
            "animal ken": 0,
            etiquette: 0,
            insight: 0,
            intimidation: 0,
            leadership: 0,
            performance: 0,
            persuasion: 0,
            streetwise: 0,
            subterfuge: 0,
            academics: 0,
            awareness: 0,
            finance: 0,
            investigation: 0,
            medicine: 0,
            occult: 0,
            politics: 0,
            science: 0,
            technology: 0,
        },
        skillSpecialties: [],
        availableDisciplineNames: [],
        disciplines: [],
        rituals: [],

        bloodPotency: 0,
        generation: 0,

        maxHealth: 0,
        willpower: 0,
        experience: 0,
        humanity: 0,

        merits: [],
        flaws: [],

        notes: "",

        ephemeral: {
            hunger: 0,
            superficialDamage: 0,
            aggravatedDamage: 0,
            superficialWillpowerDamage: 0,
            aggravatedWillpowerDamage: 0,
            humanityStains: 0,
            experienceSpent: 0,
        },
        version: 1,
    }
}

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
