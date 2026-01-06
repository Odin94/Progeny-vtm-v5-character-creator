import { FastifyRequest, FastifyReply } from "fastify"
import { workos } from "../config/workos.js"
import { env } from "../config/env.js"
import { logSecurityEvent } from "./securityLogger.js"

export interface AuthenticatedRequest extends FastifyRequest {
    user?: {
        id: string
        email: string
        firstName?: string
        lastName?: string
    }
}

export async function authenticateUser(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    const cookiePassword = env.WORKOS_COOKIE_PASSWORD

    const sessionData = request.cookies["wos-session"]

    if (!sessionData) {
        logSecurityEvent(request, reply, "authentication_failure", {
            reason: "No session cookie provided",
        })
        reply.code(401).send({ error: "Unauthorized: No session cookie provided" })
        return
    }

    try {
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
                        sameSite: env.NODE_ENV === "production" ? "none" : "lax",
                    })

                    request.user = {
                        id: refreshResult.user.id,
                        email: refreshResult.user.email,
                        firstName: refreshResult.user.firstName || undefined,
                        lastName: refreshResult.user.lastName || undefined,
                    }
                    return
                }
            } catch (_refreshError) {
                // Refresh failed, continue to error
            }

            logSecurityEvent(request, reply, "authentication_failure", {
                reason: "Invalid or expired session",
            })
            reply.code(401).send({ error: "Unauthorized: Invalid or expired session" })
            return
        }

        request.user = {
            id: authResult.user.id,
            email: authResult.user.email,
            firstName: authResult.user.firstName || undefined,
            lastName: authResult.user.lastName || undefined,
        }
    } catch (error) {
        request.log.error({ err: error }, "Authentication error")
        logSecurityEvent(request, reply, "authentication_failure", {
            reason: "Failed to authenticate session",
            error: error instanceof Error ? error.message : String(error),
        })
        reply.code(401).send({ error: "Unauthorized: Failed to authenticate session" })
        return
    }
}
