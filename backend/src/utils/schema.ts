import { z } from "zod"

// TODOdin: Consider switching to https://github.com/turkerdev/fastify-type-provider-zod
export const zodToFastifySchema = (schema: z.ZodTypeAny): Record<string, unknown> => {
    const jsonSchema = schema.toJSONSchema()
    // Remove $schema property that Fastify doesn't recognize
    const { $schema, ...schemaWithoutMeta } = jsonSchema
    return schemaWithoutMeta as Record<string, unknown>
}
