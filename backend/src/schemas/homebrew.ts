import { z } from "zod"

const idSchema = z.string().min(1).max(128)
const nameSchema = z.string().trim().min(1).max(100)
const summarySchema = z.string().trim().max(500)
const descriptionSchema = z.string().trim().max(20_000)
const logoSchema = z.string().trim().url().max(2_000).or(z.literal(""))

const itemBaseSchema = z.object({
    id: idSchema.optional(),
    name: nameSchema
})

export const homebrewDisciplineSchema = itemBaseSchema.extend({
    kind: z.literal("discipline"),
    summary: summarySchema,
    description: descriptionSchema,
    logo: logoSchema
})

const amalgamPrerequisiteSchema = z.object({
    discipline: nameSchema,
    level: z.number().int().min(1).max(5)
})

const powerBaseSchema = itemBaseSchema.extend({
    summary: summarySchema,
    description: descriptionSchema,
    discipline: nameSchema,
    level: z.number().int().min(1).max(5),
    dicePool: z.string().trim().max(250),
    rouseChecks: z.number().int().min(0).max(5),
    amalgamPrerequisites: z.array(amalgamPrerequisiteSchema).max(5)
})

export const homebrewPowerSchema = powerBaseSchema.extend({ kind: z.literal("power") })
export const homebrewRitualSchema = powerBaseSchema.extend({
    kind: z.literal("ritual"),
    requiredTime: z.string().trim().max(500),
    ingredients: z.string().trim().max(2_000)
})
export const homebrewCeremonySchema = powerBaseSchema.extend({
    kind: z.literal("ceremony"),
    requiredTime: z.string().trim().max(500),
    ingredients: z.string().trim().max(2_000)
})
export const homebrewFormulaSchema = powerBaseSchema.extend({
    kind: z.literal("formula"),
    requiredTime: z.string().trim().max(500),
    ingredients: z.string().trim().max(2_000)
})

export const homebrewMeritSchema = itemBaseSchema.extend({
    kind: z.literal("merit"),
    summary: summarySchema,
    description: descriptionSchema,
    costs: z.array(z.number().int().min(1).max(5)).min(1).max(5),
    excludes: z.array(nameSchema).max(20)
})

export const homebrewFlawSchema = itemBaseSchema.extend({
    kind: z.literal("flaw"),
    summary: summarySchema,
    description: descriptionSchema,
    costs: z.array(z.number().int().min(1).max(5)).min(1).max(5),
    excludes: z.array(nameSchema).max(20)
})

const loresheetTierSchema = z.object({
    level: z.number().int().min(1).max(5),
    name: nameSchema,
    summary: z.string().trim().min(1).max(2_000)
})

export const homebrewLoresheetSchema = itemBaseSchema.extend({
    kind: z.literal("loresheet"),
    summary: summarySchema,
    description: descriptionSchema,
    source: z.string().trim().max(200),
    requirements: z.string().trim().max(2_000),
    tiers: z
        .array(loresheetTierSchema)
        .length(5)
        .refine((tiers) => new Set(tiers.map((tier) => tier.level)).size === 5, {
            message: "Loresheets require one unique entry for each level from 1 to 5"
        })
})

export const homebrewClanSchema = itemBaseSchema.extend({
    kind: z.literal("clan"),
    summary: summarySchema,
    description: descriptionSchema,
    logo: logoSchema,
    bane: z.string().trim().min(1).max(5_000),
    compulsion: z.string().trim().min(1).max(5_000),
    nativeDisciplines: z.array(nameSchema).min(1).max(5),
    excludedPredatorTypes: z.array(nameSchema).max(30),
    excludedMeritsAndFlaws: z.array(nameSchema).max(50)
})

export const homebrewItemSchema = z.discriminatedUnion("kind", [
    homebrewDisciplineSchema,
    homebrewPowerSchema,
    homebrewRitualSchema,
    homebrewCeremonySchema,
    homebrewFormulaSchema,
    homebrewLoresheetSchema,
    homebrewMeritSchema,
    homebrewFlawSchema,
    homebrewClanSchema
])

export const homebrewCollectionInputSchema = z.object({
    name: nameSchema,
    shortDescription: z.string().trim().max(240).default(""),
    description: z.string().trim().max(10_000).default(""),
    tags: z.array(z.string().trim().min(1).max(32)).max(8).default([]),
    contentWarning: z.string().trim().max(1_000).default(""),
    shareAcknowledged: z.boolean().optional(),
    items: z.array(homebrewItemSchema).max(200).default([])
})

export const homebrewCollectionParamsSchema = z.object({ id: idSchema })
export const homebrewCommentParamsSchema = z.object({ id: idSchema, commentId: idSchema })
export const homebrewCoterieParamsSchema = z.object({ id: idSchema })

export const attachHomebrewCollectionsSchema = z.object({
    collectionIds: z.array(idSchema).max(50)
})

export const libraryQuerySchema = z.object({
    query: z.string().trim().max(100).optional(),
    type: z
        .enum([
            "discipline",
            "power",
            "ritual",
            "ceremony",
            "formula",
            "loresheet",
            "merit",
            "flaw",
            "clan"
        ])
        .optional(),
    tag: z.string().trim().max(32).optional(),
    sort: z.enum(["top", "trending", "newest", "copied"]).default("top")
})

export const publishRequestSchema = z.object({
    collectionId: idSchema,
    shareAcknowledged: z.literal(true)
})

export const publishRequestParamsSchema = z.object({ id: idSchema })
export const moderatePublishRequestSchema = z.discriminatedUnion("decision", [
    z.object({ decision: z.literal("approve") }),
    z.object({
        decision: z.literal("deny"),
        message: z.string().trim().min(1).max(2_000)
    })
])

export const ratingSchema = z.object({ rating: z.number().int().min(1).max(5) })
export const commentSchema = z.object({ body: z.string().trim().min(1).max(5_000) })

export type HomebrewItemInput = z.infer<typeof homebrewItemSchema>
export type HomebrewCollectionInput = z.infer<typeof homebrewCollectionInputSchema>
export type AttachHomebrewCollectionsInput = z.infer<typeof attachHomebrewCollectionsSchema>
export type LibraryQuery = z.infer<typeof libraryQuerySchema>
export type PublishRequestInput = z.infer<typeof publishRequestSchema>
export type ModeratePublishRequestInput = z.infer<typeof moderatePublishRequestSchema>
export type RatingInput = z.infer<typeof ratingSchema>
export type CommentInput = z.infer<typeof commentSchema>
