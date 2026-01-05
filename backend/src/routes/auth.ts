import { FastifyInstance } from "fastify"
import { eq } from "drizzle-orm"
import { db, schema } from "../db/index.js"
import { workos, WORKOS_CLIENT_ID } from "../config/workos.js"
import { env } from "../config/env.js"
import { z } from "zod"
import { updateUserSchema, type UpdateUserInput } from "../schemas/user.js"
import { zodToFastifySchema } from "../utils/schema.js"
import { authenticateUser, type AuthenticatedRequest } from "../middleware/auth.js"

const callbackQuerySchema = z.object({
    code: z.string().min(1, "Authorization code is required"),
    state: z.string().optional(),
})

export async function authRoutes(fastify: FastifyInstance) {
    // Sign-in endpoint - redirects to WorkOS AuthKit
    fastify.get("/auth/login", async (request, reply) => {
        try {
            // Construct the frontend URL for the callback
            // WorkOS will redirect to the frontend, which then calls the backend API
            let redirectUri: string
            const hostHeader = request.headers.host
            const isLocalhost =
                hostHeader?.includes("localhost") ||
                hostHeader?.includes("127.0.0.1") ||
                request.hostname === "localhost" ||
                request.hostname === "127.0.0.1"

            if (env.FRONTEND_URL) {
                redirectUri = `${env.FRONTEND_URL}/auth/callback`
            } else {
                const protocol = request.protocol || (env.NODE_ENV === "production" ? "https" : "http")

                // In development, use localhost:3000 (frontend port)
                // In production, extract hostname from request
                if (isLocalhost) {
                    redirectUri = `http://localhost:3000/auth/callback`
                } else {
                    // Try to get host from Host header, fallback to hostname
                    const host = hostHeader || request.hostname || "localhost"
                    // Remove port if present (frontend uses standard ports)
                    const hostname = host.split(":")[0]
                    redirectUri = `${protocol}://${hostname}/auth/callback`
                }
            }

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
            // For cross-origin requests (frontend on different subdomain), we need:
            // - sameSite: "none" (allows cross-origin cookies)
            // - secure: true (required when sameSite is "none")
            const cookieOptions = {
                path: "/",
                httpOnly: true,
                secure: env.NODE_ENV === "production",
                sameSite: (env.NODE_ENV === "production" ? "none" : "lax") as "none" | "lax",
            }

            reply.setCookie("wos-session", sealedSession, cookieOptions)

            if (env.NODE_ENV === "development") {
                fastify.log.info(
                    {
                        hasSealedSession: !!sealedSession,
                        sessionLength: sealedSession?.length,
                    },
                    "Cookie set in /auth/callback"
                )
            }

            // Get user from database to include nickname
            const dbUser = await db.query.users.findFirst({
                where: eq(schema.users.id, user.id),
            })

            // Return success response instead of redirecting
            // The frontend will handle the redirect
            reply.send({
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    nickname: dbUser?.nickname ?? null,
                },
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
            let logoutUrl: string | null = null

            if (sessionData) {
                try {
                    const session = workos.userManagement.loadSealedSession({
                        sessionData,
                        cookiePassword,
                    })

                    // Authenticate to get the session ID
                    const authResult = await session.authenticate()

                    if (authResult.authenticated && "sessionId" in authResult) {
                        // Get logout URL using the session ID directly
                        logoutUrl = workos.userManagement.getLogoutUrl({
                            sessionId: authResult.sessionId,
                            returnTo: env.FRONTEND_URL,
                        })
                    }
                } catch (error) {
                    // If we can't get the logout URL, that's okay - we'll still clear the cookie
                    fastify.log.warn({ err: error }, "Failed to get WorkOS logout URL")
                }
            }

            // Clear the session cookie
            reply.clearCookie("wos-session", {
                path: "/",
                httpOnly: true,
                secure: env.NODE_ENV === "production",
                sameSite: (env.NODE_ENV === "production" ? "none" : "lax") as "none" | "lax",
            })

            // Return the logout URL as JSON instead of redirecting
            // The frontend will navigate to it if provided, otherwise just redirect to home
            reply.send({
                success: true,
                logoutUrl: logoutUrl || null,
            })
        } catch (error) {
            fastify.log.error({ err: error }, "Logout error")
            // Clear cookie even on error
            reply.clearCookie("wos-session", {
                path: "/",
                httpOnly: true,
                secure: env.NODE_ENV === "production",
                sameSite: (env.NODE_ENV === "production" ? "none" : "lax") as "none" | "lax",
            })
            reply.send({
                success: true,
                logoutUrl: null,
            })
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
                            sameSite: (env.NODE_ENV === "production" ? "none" : "lax") as "none" | "lax",
                        })

                        // Get user from database to include nickname
                        const dbUser = await db.query.users.findFirst({
                            where: eq(schema.users.id, refreshResult.user.id),
                        })

                        reply.send({
                            id: refreshResult.user.id,
                            email: refreshResult.user.email,
                            firstName: refreshResult.user.firstName,
                            lastName: refreshResult.user.lastName,
                            nickname: dbUser?.nickname || null,
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
                // Get user from database to include nickname
                const dbUser = await db.query.users.findFirst({
                    where: eq(schema.users.id, authResult.user.id),
                })

                reply.send({
                    id: authResult.user.id,
                    email: authResult.user.email,
                    firstName: authResult.user.firstName,
                    lastName: authResult.user.lastName,
                    nickname: dbUser?.nickname || null,
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

    // Update user profile endpoint
    fastify.put<{
        Body: UpdateUserInput
    }>(
        "/auth/me",
        {
            preHandler: authenticateUser,
            schema: {
                body: zodToFastifySchema(updateUserSchema),
            },
        },
        async (request: AuthenticatedRequest, reply) => {
            try {
                const userId = request.user!.id
                const updateData = request.body as UpdateUserInput

                const [updated] = await db
                    .update(schema.users)
                    .set({
                        ...(updateData.nickname !== undefined && { nickname: updateData.nickname ?? null }),
                        updatedAt: new Date(),
                    })
                    .where(eq(schema.users.id, userId))
                    .returning()

                if (!updated) {
                    reply.code(404).send({
                        error: "User not found",
                    })
                    return
                }

                // Get WorkOS user data for email, firstName, lastName
                const cookiePassword = env.WORKOS_COOKIE_PASSWORD
                let workosUser = null
                if (cookiePassword) {
                    const sessionData = request.cookies["wos-session"]
                    if (sessionData) {
                        try {
                            const session = workos.userManagement.loadSealedSession({
                                sessionData,
                                cookiePassword,
                            })
                            const authResult = await session.authenticate()
                            if (authResult.authenticated && "user" in authResult) {
                                workosUser = authResult.user
                            }
                        } catch (error) {
                            fastify.log.warn({ err: error }, "Failed to get WorkOS user data")
                        }
                    }
                }

                reply.send({
                    id: updated.id,
                    email: workosUser?.email || updated.email,
                    firstName: workosUser?.firstName || updated.firstName,
                    lastName: workosUser?.lastName || updated.lastName,
                    nickname: updated.nickname,
                })
            } catch (error) {
                // Handle unique constraint violation for nickname
                if (error && typeof error === "object" && "code" in error && error.code === "SQLITE_CONSTRAINT_UNIQUE") {
                    const errorMessage = error instanceof Error ? error.message : String(error)
                    if (errorMessage.includes("nickname")) {
                        reply.code(409).send({
                            error: "Nickname already taken",
                            message: "This nickname is already in use. Please choose a different one.",
                        })
                        return
                    }
                }
                const errorMessage = error instanceof Error ? error.message : "Failed to update user"
                fastify.log.error({ err: error }, "Update user error")
                reply.code(500).send({
                    error: "Internal server error",
                    message: errorMessage,
                })
            }
        }
    )
}
