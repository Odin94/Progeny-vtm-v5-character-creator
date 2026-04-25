import { FastifyInstance } from "fastify"
import { eq } from "drizzle-orm"
import { db, schema } from "../db/index.js"
import { authenticateUser, type AuthenticatedRequest } from "../middleware/auth.js"
import {
    updatePreferencesSchema,
    type UpdatePreferencesInput,
    type UserPreferences
} from "../schemas/preferences.js"
import { zodToFastifySchema } from "../utils/schema.js"
import { logger } from "../utils/logger.js"
import { trackEvent } from "../utils/tracker.js"

const EMPTY_PREFERENCES: UserPreferences = {
    colorTheme: null,
    backgroundImage: null
}

const parsePreferences = (raw: string | null | undefined): UserPreferences => {
    if (!raw) return EMPTY_PREFERENCES
    try {
        const parsed = JSON.parse(raw)
        return {
            colorTheme: parsed.colorTheme ?? null,
            backgroundImage: parsed.backgroundImage ?? null
        }
    } catch {
        return EMPTY_PREFERENCES
    }
}

export async function preferencesRoutes(fastify: FastifyInstance) {
    fastify.get(
        "/auth/preferences",
        {
            preHandler: authenticateUser
        },
        async (request: AuthenticatedRequest, reply) => {
            try {
                const userId = request.user!.id

                const user = await db.query.users.findFirst({
                    where: eq(schema.users.id, userId),
                    columns: { preferences: true }
                })

                reply.send(parsePreferences(user?.preferences))
            } catch (error) {
                const errorMessage =
                    error instanceof Error ? error.message : "Failed to get preferences"
                fastify.log.error({ err: error }, "Get preferences error")
                logger.error("Get preferences error", error, {
                    endpoint: "/auth/preferences",
                    method: "GET",
                    userId: request.user!.id
                })
                reply.code(500).send({
                    error: "Internal server error",
                    message: errorMessage
                })
            }
        }
    )

    fastify.put<{ Body: UpdatePreferencesInput }>(
        "/auth/preferences",
        {
            preHandler: authenticateUser,
            schema: {
                body: zodToFastifySchema(updatePreferencesSchema)
            }
        },
        async (request: AuthenticatedRequest, reply) => {
            try {
                const userId = request.user!.id
                const body = request.body as UpdatePreferencesInput

                const user = await db.query.users.findFirst({
                    where: eq(schema.users.id, userId),
                    columns: { preferences: true }
                })

                const existing = parsePreferences(user?.preferences)

                const updated: UserPreferences = {
                    colorTheme:
                        "colorTheme" in body ? (body.colorTheme ?? null) : existing.colorTheme,
                    backgroundImage:
                        "backgroundImage" in body
                            ? (body.backgroundImage ?? null)
                            : existing.backgroundImage
                }

                await db
                    .update(schema.users)
                    .set({
                        preferences: JSON.stringify(updated),
                        updatedAt: new Date()
                    })
                    .where(eq(schema.users.id, userId))

                await trackEvent(
                    "preferences_updated",
                    {
                        endpoint: "/auth/preferences",
                        method: "PUT",
                        userId,
                        colorTheme: updated.colorTheme,
                        backgroundImage: updated.backgroundImage
                    },
                    userId,
                    request
                )

                reply.send(updated)
            } catch (error) {
                const errorMessage =
                    error instanceof Error ? error.message : "Failed to update preferences"
                fastify.log.error({ err: error }, "Update preferences error")
                logger.error("Update preferences error", error, {
                    endpoint: "/auth/preferences",
                    method: "PUT",
                    userId: request.user!.id
                })
                reply.code(500).send({
                    error: "Internal server error",
                    message: errorMessage
                })
            }
        }
    )
}
