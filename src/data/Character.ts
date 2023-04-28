import { z } from "zod";
import { clanNameSchema } from "./Clans";
import { powerSchema } from "./Disciplines";
import { predatorTypeNameSchema } from "./PredatorType";
import { specialtySchema } from "./Specialties";
import { skillsSchema } from "./Skills";

export const attributesSchema = z.object({
    strength: z.number().min(1).max(5).int(),
    dexterity: z.number().min(1).max(5).int(),
    stamina: z.number().min(1).max(5).int(),

    charisma: z.number().min(1).max(5).int(),
    manipulation: z.number().min(1).max(5).int(),
    composure: z.number().min(1).max(5).int(),

    intelligence: z.number().min(1).max(5).int(),
    wits: z.number().min(1).max(5).int(),
    resolve: z.number().min(1).max(5).int(),
})
export type Attributes = z.infer<typeof attributesSchema>
export const attributesKeySchema = attributesSchema.keyof()
export type AttributesKey = z.infer<typeof attributesKeySchema>

export const meritFlawSchema = z.object({
    name: z.string(),
    level: z.number().min(1).int(),
    summary: z.string(),
    type: z.union([z.literal("merit"), z.literal("flaw")])
})
export type MeritFlaw = z.infer<typeof meritFlawSchema>


export const touchstoneSchema = z.object({
    name: z.string(),
    description: z.string(),
    conviction: z.string(),
})
export type Touchstone = z.infer<typeof touchstoneSchema>

export const characterSchema = z.object({
    name: z.string(),
    description: z.string(),
    sire: z.string(),

    clan: clanNameSchema,
    predatorType: predatorTypeNameSchema,
    touchstones: touchstoneSchema.array(),
    ambition: z.string(),
    desire: z.string(),

    attributes: attributesSchema,
    skills: skillsSchema,
    specialties: specialtySchema.array(),
    disciplines: powerSchema.array(),

    bloodPotency: z.number().min(0).int(),
    generation: z.number().min(0).int(),

    maxHealth: z.number().min(0).int(),
    willpower: z.number().min(0).int(),
    experience: z.number().min(0).int(),
    humanity: z.number().min(0).int(),

    merits: meritFlawSchema.array(),
    flaws: meritFlawSchema.array(),
})
export type Character = z.infer<typeof characterSchema>


export const getEmptyCharacter = (): Character => {
    return {
        name: "",
        description: "",
        sire: "",

        clan: "",
        predatorType: "",
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
        specialties: [],
        disciplines: [],

        bloodPotency: 0,
        generation: 0,

        maxHealth: 0,
        willpower: 0,
        experience: 0,
        humanity: 0,

        merits: [],
        flaws: [],
    }
}