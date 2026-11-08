import { z } from "zod"
import { knownDisciplineNameSchema } from "./NameSchemas"
import { predatorTypeRulesSchema } from "./PredatorTypeRules"
const nameSchema = z.string().trim().min(1).max(100)
const summarySchema = z.string().trim().max(500)
const descriptionSchema = z.string().trim().max(20_000)
const itemBaseSchema = z.object({ id: z.string().min(1).max(128).optional(), name: nameSchema })
const disciplineReferenceSchema = z.object({
    type: z.enum(["official", "homebrew"]),
    name: nameSchema,
    itemId: z.string().min(1).max(128).optional()
})
const predatorGrantSchema = z.object({
    name: nameSchema,
    level: z.number().int().min(0).max(5),
    summary: summarySchema,
    excludes: z.array(nameSchema).max(20),
    type: z.enum(["merit", "flaw"])
})
export const homebrewPredatorTypeSchema = itemBaseSchema.extend({
    kind: z.literal("predatorType"),
    summary: summarySchema,
    description: descriptionSchema,
    specialtyOptions: z
        .array(
            predatorTypeRulesSchema.shape.specialtyOptions.element.extend({
                name: nameSchema,
                customInput: z.string().trim().min(1).max(200).optional()
            })
        )
        .min(1, "Add at least one specialty choice.")
        .max(10),
    disciplineOptions: z
        .array(
            disciplineReferenceSchema.refine(
                (ref) =>
                    ref.type === "homebrew" ||
                    (ref.name !== "" && knownDisciplineNameSchema.safeParse(ref.name).success),
                "Choose a supported Discipline"
            )
        )
        .min(1, "Choose at least one bonus Discipline.")
        .max(5)
        .refine(
            (options) =>
                new Set(
                    options.map((option) =>
                        option.type === "homebrew" ? `homebrew:${option.itemId}` : option.name
                    )
                ).size === options.length,
            "Choose each Discipline once"
        ),
    skillBonuses: z
        .array(predatorTypeRulesSchema.shape.skillBonuses.unwrap().element)
        .max(27)
        .refine(
            (bonuses) => new Set(bonuses.map(({ skill }) => skill)).size === bonuses.length,
            "Use one grant per skill"
        ),
    meritsAndFlaws: z.array(predatorGrantSchema).max(20),
    selectableMeritsAndFlaws: z
        .array(
            z
                .object({
                    options: z
                        .array(
                            predatorGrantSchema
                                .omit({ level: true })
                                .extend({ maxLevel: z.number().int().min(1).max(5) })
                        )
                        .min(1)
                        .max(20),
                    totalPoints: z.number().int().min(1).max(20),
                    exclusive: z.boolean().optional()
                })
                .refine(
                    (group) =>
                        group.exclusive
                            ? group.options.some((option) => option.maxLevel >= group.totalPoints)
                            : group.options.reduce((sum, option) => sum + option.maxLevel, 0) >=
                              group.totalPoints,
                    "Options must cover the point budget"
                )
        )
        .max(10),
    humanityChange: z.number().int().min(-10).max(10),
    bloodPotencyChange: z.number().int().min(-10).max(10)
})
