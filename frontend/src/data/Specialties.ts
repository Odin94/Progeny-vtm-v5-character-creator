import { z } from "zod"
import { skillsKeySchema } from "./Skills"

export const specialtySchema = z.object({
  skill: skillsKeySchema,
  name: z.string(),
})

export type Specialty = z.infer<typeof specialtySchema>
