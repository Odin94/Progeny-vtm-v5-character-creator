import { z } from "zod"
import { attributesSchema } from "./Attributes.js"
import {
    powerSchema,
    ritualSchema,
    customDisciplineSchema,
    homebrewSourceSchema
} from "./Disciplines.js"
import { ceremonySchema } from "./Ceremonies.js"
import { clanNameSchema, disciplineNameSchema, predatorTypeNameSchema } from "./NameSchemas.js"
import { skillsSchema } from "./Skills.js"
import { specialtySchema } from "./Specialties.js"
import { clans } from "./Clans"
import { getAllKnownMeritsAndFlaws } from "./MeritsAndFlaws"
import type { Power } from "./Disciplines.js"
import { getPowerDisciplineIdentity } from "~/utils/homebrewOptions"

export const clanBaneSchema = z.enum(["default", "variant"])
export type ClanBane = z.infer<typeof clanBaneSchema>

export const meritFlawSchema = z.object({
    name: z.string(),
    level: z.number().min(1).int(),
    summary: z.string(),
    excludes: z.string().array(),
    type: z.union([z.literal("merit"), z.literal("flaw")]),
    text: z.string().optional(),
    homebrewSource: homebrewSourceSchema.optional()
})

export type MeritFlaw = z.infer<typeof meritFlawSchema>

export const touchstoneSchema = z.object({
    name: z.string(),
    description: z.string(),
    conviction: z.string()
})

export type Touchstone = z.infer<typeof touchstoneSchema>

export const schemaVersion = 9

export const disciplineLevelsSchema = z.record(z.string(), z.number().int().min(0).max(5))

export const characterSchema = z.object({
    id: z.string().optional().default(""),
    name: z.string(),
    description: z.string(),
    sire: z.string(),
    player: z.string().optional().default(""),
    chronicle: z.string().optional().default(""),
    sect: z.string().optional().default(""),

    clan: clanNameSchema,
    clanBane: clanBaneSchema.optional().default("default"),
    homebrewClan: z
        .object({
            name: z.string(),
            description: z.string(),
            summary: z.string(),
            logo: z.string(),
            bane: z.string(),
            compulsion: z.string(),
            nativeDisciplines: disciplineNameSchema.array(),
            nativeDisciplineRefs: z
                .array(
                    z.object({
                        type: z.enum(["official", "homebrew"]),
                        name: disciplineNameSchema,
                        itemId: z.string().optional()
                    })
                )
                .optional(),
            excludedPredatorTypes: z.string().array(),
            excludedMeritsAndFlaws: z.string().array(),
            homebrewSource: homebrewSourceSchema
        })
        .optional(),
    predatorType: z.object({
        name: predatorTypeNameSchema,
        pickedDiscipline: disciplineNameSchema,
        pickedSpecialties: specialtySchema.array(),
        pickedMeritsAndFlaws: meritFlawSchema.array()
    }),
    touchstones: touchstoneSchema.array(),
    ambition: z.string(),
    desire: z.string(),

    attributes: attributesSchema,
    skills: skillsSchema,
    skillSpecialties: specialtySchema.array(),
    availableDisciplineNames: disciplineNameSchema.array(),
    disciplines: powerSchema.array(),
    disciplineLevels: disciplineLevelsSchema,
    rituals: ritualSchema.array(),
    ceremonies: ceremonySchema.array().optional().default([]),
    customDisciplines: z
        .record(disciplineNameSchema, customDisciplineSchema)
        .optional()
        .default({}),

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
        experienceSpent: z.number().min(0).int()
    }),
    version: z.number().int().positive().optional().default(schemaVersion),
    characterVersion: z.number().int().min(0).optional().default(0)
})

export type Character = z.infer<typeof characterSchema>

export const getCharacterExcludedPredatorTypes = (character: Character): string[] =>
    character.homebrewClan?.excludedPredatorTypes ??
    clans[character.clan]?.excludedPredatorTypes ??
    []

export const getCharacterExcludedMeritsAndFlaws = (character: Character): string[] =>
    character.homebrewClan?.excludedMeritsAndFlaws ??
    clans[character.clan]?.excludedMeritsAndFlaws ??
    []

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
        clanBane: "default",
        predatorType: {
            name: "",
            pickedDiscipline: "",
            pickedSpecialties: [],
            pickedMeritsAndFlaws: []
        },
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
            resolve: 1
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
            technology: 0
        },
        skillSpecialties: [],
        availableDisciplineNames: [],
        disciplines: [],
        disciplineLevels: {},
        rituals: [],
        ceremonies: [],
        customDisciplines: {},

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
            experienceSpent: 0
        },
        version: schemaVersion,
        characterVersion: 0
    }
}

export const containsBloodSorcery = (powers: Power[]) =>
    powers.some((power) => getPowerDisciplineIdentity(power) === "official:blood sorcery")

export const containsOblivion = (powers: Power[]) =>
    powers.some((power) => getPowerDisciplineIdentity(power) === "official:oblivion")

export const getDisciplineLevel = (
    character: Pick<Character, "disciplineLevels">,
    disciplineIdentity: string
): number => character.disciplineLevels[disciplineIdentity] ?? 0

export const getDisciplineLevelsFromPowers = (powers: Power[]): Record<string, number> => {
    const levels: Record<string, number> = {}

    for (const power of powers) {
        const identity = getPowerDisciplineIdentity(power)
        levels[identity] = Math.min(5, (levels[identity] ?? 0) + 1)
    }

    return levels
}

export const increaseDisciplineLevelForPower = (
    character: Pick<Character, "disciplineLevels">,
    power: Power
): Record<string, number> => {
    const identity = getPowerDisciplineIdentity(power)
    const currentLevel = getDisciplineLevel(character, identity)

    return {
        ...character.disciplineLevels,
        [identity]: Math.min(5, currentLevel + 1)
    }
}

export const applyCharacterCompatibilityPatches = (parsed: Record<string, unknown>): void => {
    if (!parsed["rituals"]) parsed["rituals"] = []
    if (!parsed["ceremonies"]) parsed["ceremonies"] = []
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
    if (!parsed["customDisciplines"]) parsed["customDisciplines"] = {}
    if (!parsed["ephemeral"]) {
        // backwards compatibility for characters that were saved before ephemeral was added
        parsed["ephemeral"] = {
            hunger: 0,
            superficialDamage: 0,
            aggravatedDamage: 0,
            superficialWillpowerDamage: 0,
            aggravatedWillpowerDamage: 0,
            humanityStains: 0,
            experienceSpent: 0
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
            experienceSpent: ephemeral["experienceSpent"] ?? 0
        }
    }

    patchV2ToV3Compatibility(parsed)
    patchV3ToV4Compatibility(parsed)
    patchV5ToV6Compatibility(parsed)
    patchV6ToV7Compatibility(parsed)
    patchV7ToV8Compatibility(parsed)
    patchV8ToV9Compatibility(parsed)

    parsed["version"] = schemaVersion
}

export const patchV7ToV8Compatibility = (parsed: Record<string, unknown>): void => {
    if (
        (typeof parsed["version"] !== "number" || parsed["version"] < 8) &&
        !parsed["homebrewClan"]
    ) {
        delete parsed["homebrewClan"]
    }
}

export const patchV8ToV9Compatibility = (parsed: Record<string, unknown>): void => {
    if (
        (typeof parsed["version"] !== "number" || parsed["version"] < 9) &&
        !parsed["disciplineLevels"]
    ) {
        const powers = Array.isArray(parsed["disciplines"])
            ? (parsed["disciplines"] as Power[])
            : []
        parsed["disciplineLevels"] = getDisciplineLevelsFromPowers(powers)
    }
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

export const patchV3ToV4Compatibility = (parsed: Record<string, unknown>): void => {
    if (parsed["characterVersion"] === undefined || parsed["characterVersion"] === null) {
        parsed["characterVersion"] = 0
    }
}

export const patchV5ToV6Compatibility = (parsed: Record<string, unknown>): void => {
    if (!Array.isArray(parsed["ceremonies"])) {
        parsed["ceremonies"] = []
    }
}

export const patchV6ToV7Compatibility = (parsed: Record<string, unknown>): void => {
    if (parsed["clanBane"] === undefined || parsed["clanBane"] === null) {
        parsed["clanBane"] = "default"
    }
}
