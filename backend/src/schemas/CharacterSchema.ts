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

export const characterDataSchema = characterSchema.partial()
