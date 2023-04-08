import { z } from "zod";

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


export const skillsSchema = z.object({
    athletics: z.number().min(0).max(5).int(),
    brawl: z.number().min(0).max(5).int(),
    craft: z.number().min(0).max(5).int(),
    drive: z.number().min(0).max(5).int(),
    firearms: z.number().min(0).max(5).int(),
    melee: z.number().min(0).max(5).int(),
    larceny: z.number().min(0).max(5).int(),
    stealth: z.number().min(0).max(5).int(),
    survival: z.number().min(0).max(5).int(),

    animalKen: z.number().min(0).max(5).int(),
    etiquette: z.number().min(0).max(5).int(),
    insight: z.number().min(0).max(5).int(),
    intimidation: z.number().min(0).max(5).int(),
    leadership: z.number().min(0).max(5).int(),
    performance: z.number().min(0).max(5).int(),
    persuasion: z.number().min(0).max(5).int(),
    streetwise: z.number().min(0).max(5).int(),
    subertfuge: z.number().min(0).max(5).int(),

    academics: z.number().min(0).max(5).int(),
    awareness: z.number().min(0).max(5).int(),
    finance: z.number().min(0).max(5).int(),
    investigation: z.number().min(0).max(5).int(),
    medicine: z.number().min(0).max(5).int(),
    occult: z.number().min(0).max(5).int(),
    politics: z.number().min(0).max(5).int(),
    science: z.number().min(0).max(5).int(),
    technology: z.number().min(0).max(5).int(),
})

export type Skills = z.infer<typeof skillsSchema>


export const characterSchema = z.object({
    name: z.string(),
    clan: z.string(),

    attributes: attributesSchema,
    skills: skillsSchema,
    disciplines: z.string().array(),

    bloodPotency: z.number().min(0).int(),
    generation: z.number().min(0).int(),

    maxHealth: z.number().min(0).int(),
    willpower: z.number().min(0).int(),
    experience: z.number().min(0).int(),
    humanity: z.number().min(0).int(),
})

export type Character = z.infer<typeof characterSchema>

export const getEmptyCharacter = (): Character => {
    return characterSchema.parse({
        name: "",
        clan: "",
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
            animalKen: 0,
            etiquette: 0,
            insight: 0,
            intimidation: 0,
            leadership: 0,
            performance: 0,
            persuasion: 0,
            streetwise: 0,
            subertfuge: 0,
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
        disciplines: [],

        bloodPotency: 0,
        generation: 0,

        maxHealth: 0,
        willpower: 0,
        experience: 0,
        humanity: 0,
    })
}