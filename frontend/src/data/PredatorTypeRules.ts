import { z } from "zod"
import { specialtySchema } from "./Specialties.js"
import { skillsKeySchema } from "./Skills.js"
import { disciplineNameSchema } from "./NameSchemas.js"
import { homebrewSourceSchema } from "./Disciplines.js"

export const predatorDisciplineSchema = z.object({
    name: disciplineNameSchema,
    type: z.enum(["official", "homebrew"]).optional(),
    itemId: z.string().optional()
})
const grantSchema = z.object({
    name: z.string(),
    level: z.number().int().min(0),
    summary: z.string(),
    excludes: z.string().array(),
    type: z.enum(["merit", "flaw"]),
    text: z.string().optional(),
    homebrewSource: homebrewSourceSchema.optional()
})
export const predatorTypeRulesSchema = z.object({
    name: z.string(),
    summary: z.string(),
    description: z.string().optional(),
    specialtyOptions: specialtySchema.extend({ customInput: z.string().optional() }).array(),
    disciplineOptions: predatorDisciplineSchema.array(),
    meritsAndFlaws: grantSchema.array(),
    selectableMeritsAndFlaws: z
        .object({
            options: grantSchema
                .omit({ level: true })
                .extend({ maxLevel: z.number().int() })
                .array(),
            totalPoints: z.number().int(),
            exclusive: z.boolean().optional()
        })
        .array(),
    skillBonuses: z
        .object({ skill: skillsKeySchema, dots: z.number().int().min(1).max(5) })
        .array()
        .optional(),
    humanityChange: z.number().int(),
    bloodPotencyChange: z.number().int(),
    homebrewSource: homebrewSourceSchema.optional()
})
export const predatorDisciplineKey = (option: z.infer<typeof predatorDisciplineSchema>) =>
    option.type === "homebrew" ? `homebrew:${option.itemId}` : option.name
