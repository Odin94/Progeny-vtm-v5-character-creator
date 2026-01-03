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
})

export type Power = z.infer<typeof powerSchema>

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
