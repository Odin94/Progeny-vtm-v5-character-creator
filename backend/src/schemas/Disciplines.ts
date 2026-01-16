import { z } from "zod"
import { disciplineNameSchema } from "./NameSchemas.js"

export const amalgamPrerequisiteSchema = z.object({
    discipline: disciplineNameSchema,
    level: z.number().min(1).int(),
})

export type AmalgamPrerequisite = z.infer<typeof amalgamPrerequisiteSchema>

export const powerSchema = z.object({
    name: z.string(),
    description: z.string(),
    summary: z.string(),
    dicePool: z.string(),
    level: z.number().min(1).int(),
    discipline: disciplineNameSchema,
    rouseChecks: z.number().min(0).int(),
    amalgamPrerequisites: amalgamPrerequisiteSchema.array(),
    isCustom: z.boolean().optional().default(false),
})

export type Power = z.infer<typeof powerSchema>

export const customDisciplineSchema = z.object({
    name: z.string(),
    summary: z.string(),
    logo: z.string().optional().default(""),
})
export type CustomDiscipline = z.infer<typeof customDisciplineSchema>

export const ritualSchema = z.object({
    name: z.string(),
    summary: z.string(),
    rouseChecks: z.number().min(0).int(),
    requiredTime: z.string(),
    dicePool: z.string(),
    ingredients: z.string(),
    level: z.number().min(1).int(),
    discipline: disciplineNameSchema.optional(),
})

export type Ritual = z.infer<typeof ritualSchema>
