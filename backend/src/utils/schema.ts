import { z } from "zod"

type FastifySchemaOptions = {
    preserveUnionBranchProperties?: boolean
}

const preserveUnionBranchProperties = (value: unknown): void => {
    if (Array.isArray(value)) {
        value.forEach(preserveUnionBranchProperties)
        return
    }
    if (!value || typeof value !== "object") return

    const schema = value as Record<string, unknown>
    if (Array.isArray(schema.oneOf)) {
        schema.oneOf.forEach((branch) => {
            if (branch && typeof branch === "object" && !Array.isArray(branch)) {
                const branchSchema = branch as Record<string, unknown>
                branchSchema.additionalProperties = true
            }
        })
    }
    Object.values(schema).forEach(preserveUnionBranchProperties)
}

// TODOdin: Consider switching to https://github.com/turkerdev/fastify-type-provider-zod
export const zodToFastifySchema = (
    schema: z.ZodTypeAny,
    options: FastifySchemaOptions = {}
): Record<string, unknown> => {
    const jsonSchema = schema.toJSONSchema()
    // Remove $schema property that Fastify doesn't recognize
    const { $schema, ...schemaWithoutMeta } = jsonSchema
    if (options.preserveUnionBranchProperties) {
        // AJV's removeAdditional mutates input while evaluating oneOf branches.
        // The caller must perform its own strict Zod parse after Fastify validation.
        preserveUnionBranchProperties(schemaWithoutMeta)
    }
    return schemaWithoutMeta as Record<string, unknown>
}
