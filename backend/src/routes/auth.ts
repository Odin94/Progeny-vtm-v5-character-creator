import { FastifyInstance } from "fastify"
import { eq } from "drizzle-orm"
import { db, schema } from "../db/index.js"
import { workos, WORKOS_CLIENT_ID } from "../config/workos.js"
import { env } from "../config/env.js"
import { z } from "zod"

const callbackQuerySchema = z.object({
    code: z.string().min(1, "Authorization code is required"),
    state: z.string().optional(),
})

export async function authRoutes(fastify: FastifyInstance) {
    // Sign-in endpoint - redirects to WorkOS AuthKit
    fastify.get("/auth/login", async (request, reply) => {
        try {
            const host = request.hostname || "localhost"
            const port = request.url.includes(":") ? `:${env.PORT}` : ""
            const redirectUri = `${request.protocol}://${host}${port}/auth/callback`

            const authorizationUrl = workos.userManagement.getAuthorizationUrl({
                provider: "authkit",
                redirectUri,
                clientId: WORKOS_CLIENT_ID,
            })

            reply.redirect(authorizationUrl)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to initiate sign-in"
            fastify.log.error({ err: error }, "Sign-in initiation error")
            reply.code(500).send({
                error: "Internal server error",
                message: errorMessage,
            })
        }
    })

    // AuthKit Callback endpoint
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

            const cookiePassword = env.WORKOS_COOKIE_PASSWORD

            // Exchange authorization code for user and sealed session
            const authenticateResponse = await workos.userManagement.authenticateWithCode({
                code,
                clientId: WORKOS_CLIENT_ID,
                session: {
                    sealSession: true,
                    cookiePassword,
                },
            })

            const { user, sealedSession } = authenticateResponse

            if (!user || !sealedSession) {
                reply.code(401).send({
                    error: "Unauthorized",
                    message: "Failed to retrieve user or create session",
                })
                return
            }

            // Create or update user in database
            const existingUser = await db.query.users.findFirst({
                where: eq(schema.users.id, user.id),
            })

            if (existingUser) {
                // Update existing user
                await db
                    .update(schema.users)
                    .set({
                        email: user.email,
                        firstName: user.firstName || null,
                        lastName: user.lastName || null,
                        updatedAt: new Date(),
                    })
                    .where(eq(schema.users.id, user.id))
            } else {
                // Create new user
                await db.insert(schema.users).values({
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName || null,
                    lastName: user.lastName || null,
                })
            }

            // Store the sealed session in a cookie
            reply.setCookie("wos-session", sealedSession, {
                path: "/",
                httpOnly: true,
                secure: env.NODE_ENV === "production",
                sameSite: "lax",
            })

            // Redirect to frontend
            const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173"
            reply.redirect(`${frontendUrl}${state ? `?state=${encodeURIComponent(state)}` : ""}`)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to process SSO callback"
            fastify.log.error({ err: error }, "SSO callback error")
            reply.code(500).send({
                error: "Internal server error",
                message: errorMessage,
            })
        }
    })

    // Logout endpoint
    fastify.get("/auth/logout", async (request, reply) => {
        try {
            const cookiePassword = env.WORKOS_COOKIE_PASSWORD
            if (!cookiePassword) {
                reply.code(500).send({
                    error: "Internal server error",
                    message: "WORKOS_COOKIE_PASSWORD is not configured",
                })
                return
            }

            const sessionData = request.cookies["wos-session"]

            if (sessionData) {
                const session = workos.userManagement.loadSealedSession({
                    sessionData,
                    cookiePassword,
                })

                const logoutUrl = await session.getLogoutUrl()

                // Clear the session cookie
                reply.clearCookie("wos-session", {
                    path: "/",
                    httpOnly: true,
                    secure: env.NODE_ENV === "production",
                    sameSite: "lax",
                })

                // Redirect to WorkOS logout URL
                reply.redirect(logoutUrl)
            } else {
                // No session, redirect to frontend
                const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173"
                reply.redirect(frontendUrl)
            }
        } catch (error) {
            fastify.log.error({ err: error }, "Logout error")
            // Clear cookie even on error
            reply.clearCookie("wos-session", {
                path: "/",
                httpOnly: true,
                secure: env.NODE_ENV === "production",
                sameSite: "lax",
            })
            const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173"
            reply.redirect(frontendUrl)
        }
    })

    // Get current user endpoint
    fastify.get("/auth/me", async (request, reply) => {
        try {
            const cookiePassword = env.WORKOS_COOKIE_PASSWORD
            if (!cookiePassword) {
                reply.code(500).send({
                    error: "Internal server error",
                    message: "WORKOS_COOKIE_PASSWORD is not configured",
                })
                return
            }

            const sessionData = request.cookies["wos-session"]

            if (!sessionData) {
                reply.code(401).send({
                    error: "Unauthorized",
                    message: "No session found",
                })
                return
            }

            const session = workos.userManagement.loadSealedSession({
                sessionData,
                cookiePassword,
            })

            const authResult = await session.authenticate()

            if (!authResult.authenticated || !("user" in authResult)) {
                // Try to refresh the session
                try {
                    const refreshResult = await session.refresh()
                    if (
                        refreshResult.authenticated &&
                        "sealedSession" in refreshResult &&
                        "user" in refreshResult &&
                        refreshResult.sealedSession
                    ) {
                        // Update the cookie with the new session
                        reply.setCookie("wos-session", refreshResult.sealedSession, {
                            path: "/",
                            httpOnly: true,
                            secure: env.NODE_ENV === "production",
                            sameSite: "lax",
                        })

                        reply.send({
                            id: refreshResult.user.id,
                            email: refreshResult.user.email,
                            firstName: refreshResult.user.firstName,
                            lastName: refreshResult.user.lastName,
                        })
                        return
                    }
                } catch (_refreshError) {
                    // Refresh failed, return unauthorized
                }

                reply.code(401).send({
                    error: "Unauthorized",
                    message: "Session is invalid",
                })
                return
            }

            if ("user" in authResult) {
                reply.send({
                    id: authResult.user.id,
                    email: authResult.user.email,
                    firstName: authResult.user.firstName,
                    lastName: authResult.user.lastName,
                })
            } else {
                reply.code(401).send({
                    error: "Unauthorized",
                    message: "Session is invalid",
                })
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to get user"
            fastify.log.error({ err: error }, "Get user error")
            reply.code(500).send({
                error: "Internal server error",
                message: errorMessage,
            })
        }
    })
}
