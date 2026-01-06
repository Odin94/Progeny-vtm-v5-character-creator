import { z } from "zod"
import { attributesSchema } from "./Attributes.js"
import { powerSchema, ritualSchema } from "./Disciplines.js"
import { clanNameSchema, disciplineNameSchema, predatorTypeNameSchema } from "./NameSchemas.js"
import { skillsSchema } from "./Skills.js"
import { specialtySchema } from "./Specialties.js"

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

export const schemaVersion = 4

export const characterSchema = z.object({
    id: z.string().optional().default(""),
    name: z.string(),
    description: z.string(),
    sire: z.string(),
    player: z.string().optional().default(""),
    chronicle: z.string().optional().default(""),
    sect: z.string().optional().default(""),

    clan: clanNameSchema,
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
    characterVersion: z.number().int().min(0).optional().default(0),
})

export type Character = z.infer<typeof characterSchema>

// Export partial schema for backend validation
export const characterDataSchema = characterSchema.partial()

// Helper function to create an empty character
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
        version: schemaVersion,
        characterVersion: 0,
    }
}
