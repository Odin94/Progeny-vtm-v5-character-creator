import { FastifyInstance } from "fastify"
import { eq } from "drizzle-orm"
import { db, schema } from "../db/index.js"
import { workos, WORKOS_CLIENT_ID } from "../config/workos.js"
import { z } from "zod"

const callbackQuerySchema = z.object({
    code: z.string().min(1, "Authorization code is required"),
    state: z.string().optional(),
})

export async function authRoutes(fastify: FastifyInstance) {
    // SSO Callback endpoint
    fastify.get("/auth/callback", async (request, reply) => {
        try {
            // Validate query parameters
            const queryResult = callbackQuerySchema.safeParse(request.query)
            if (!queryResult.success) {
                reply.code(400).send({
                    error: "Invalid request",
                    details: queryResult.error.issues,
                })
                return
            }

            const { code, state } = queryResult.data

            // Exchange authorization code for profile and token
            const { profile, accessToken } = await workos.sso.getProfileAndToken({
                code,
                clientId: WORKOS_CLIENT_ID,
            })

            // Validate profile
            if (!profile) {
                reply.code(401).send({
                    error: "Unauthorized",
                    message: "Failed to retrieve user profile",
                })
                return
            }

            // Optional: Validate organization ID if you have a specific organization requirement
            // if (profile.organizationId !== expectedOrganizationId) {
            //   reply.code(401).send({
            //     error: "Unauthorized",
            //     message: "User does not belong to the required organization",
            //   })
            //   return
            // }

            // Create or update user in database
            const existingUser = await db.query.users.findFirst({
                where: eq(schema.users.id, profile.id),
            })

            if (existingUser) {
                // Update existing user
                await db
                    .update(schema.users)
                    .set({
                        email: profile.email,
                        firstName: profile.firstName || null,
                        lastName: profile.lastName || null,
                        updatedAt: new Date(),
                    })
                    .where(eq(schema.users.id, profile.id))
            } else {
                // Create new user
                await db.insert(schema.users).values({
                    id: profile.id,
                    email: profile.email,
                    firstName: profile.firstName || null,
                    lastName: profile.lastName || null,
                })
            }

            // Return the access token and profile information
            // In a real application, you might want to:
            // 1. Create a session
            // 2. Set a cookie
            // 3. Redirect to the frontend with the token
            // For now, we'll return the token in the response
            reply.send({
                accessToken,
                profile: {
                    id: profile.id,
                    email: profile.email,
                    firstName: profile.firstName,
                    lastName: profile.lastName,
                    organizationId: profile.organizationId,
                },
                state, // Return state if provided for restoring application state
            })
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to process SSO callback"
            fastify.log.error({ err: error }, "SSO callback error")
            reply.code(500).send({
                error: "Internal server error",
                message: errorMessage,
            })
        }
    })

    // Optional: Endpoint to initiate SSO
    fastify.get("/auth/sso", async (request, reply) => {
        try {
            const { organization, connection, provider, redirectUri } = request.query as {
                organization?: string
                connection?: string
                provider?: string
                redirectUri?: string
            }

            // Validate that at least one identifier is provided
            if (!organization && !connection && !provider) {
                reply.code(400).send({
                    error: "Bad request",
                    message: "Must provide either organization, connection, or provider parameter",
                })
                return
            }

            // Use provided redirectUri or default
            const callbackUri = redirectUri || `${request.protocol}://${request.hostname}/auth/callback`

            // Generate authorization URL
            const authorizationUrl = workos.sso.getAuthorizationUrl({
                ...(organization && { organization }),
                ...(connection && { connection }),
                ...(provider && { provider }),
                clientId: WORKOS_CLIENT_ID,
                redirectUri: callbackUri,
            })

            // Redirect to WorkOS authorization URL
            reply.redirect(authorizationUrl)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to initiate SSO"
            fastify.log.error({ err: error }, "SSO initiation error")
            reply.code(500).send({
                error: "Internal server error",
                message: errorMessage,
            })
        }
    })
}
