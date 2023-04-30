import { z } from "zod";


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

    "animal ken": z.number().min(0).max(5).int(),
    etiquette: z.number().min(0).max(5).int(),
    insight: z.number().min(0).max(5).int(),
    intimidation: z.number().min(0).max(5).int(),
    leadership: z.number().min(0).max(5).int(),
    performance: z.number().min(0).max(5).int(),
    persuasion: z.number().min(0).max(5).int(),
    streetwise: z.number().min(0).max(5).int(),
    subterfuge: z.number().min(0).max(5).int(),

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
export const skillsKeySchema = skillsSchema.keyof()
export type SkillsKey = z.infer<typeof skillsKeySchema>

export const allSkills: SkillsKey[] = [
    "athletics",
    "brawl",
    "craft",
    "drive",
    "firearms",
    "melee",
    "larceny",
    "stealth",
    "survival",

    "animal ken",
    "etiquette",
    "insight",
    "intimidation",
    "leadership",
    "performance",
    "persuasion",
    "streetwise",
    "subterfuge",

    "academics",
    "awareness",
    "finance",
    "investigation",
    "medicine",
    "occult",
    "politics",
    "science",
    "technology",
]

export const emptySkills: Skills = {
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
}