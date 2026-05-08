import { FastifyRequest, FastifyReply } from "fastify"
import { eq } from "drizzle-orm"
import { workos } from "../config/workos.js"
import { env } from "../config/env.js"
import { db, schema } from "../db/index.js"
import { logSecurityEvent } from "./securityLogger.js"
import { clearSessionCookie, setSessionCookie } from "../utils/sessionCookie.js"
import {
    IMPERSONATION_COOKIE_NAME,
    clearImpersonationCookie,
    endImpersonationSession,
    resolveImpersonationSession
} from "./impersonation.js"
import { markUserActive } from "./userActivity.js"

export type AuthenticatedUser = {
    id: string
    email: string
    firstName?: string
    lastName?: string
    nickname?: string | null
    isSuperadmin: boolean
}

export type ImpersonationRequestState = {
    active: true
    sessionId: string
    expiresAt: Date
    actorUser: AuthenticatedUser
    impersonatedUser: AuthenticatedUser
}

export interface AuthenticatedRequest extends FastifyRequest {
    user?: AuthenticatedUser
    actorUser?: AuthenticatedUser
    impersonation?: ImpersonationRequestState
}

type WorkosUser = {
    id: string
    email: string
    firstName?: string | null
    lastName?: string | null
}

async function toAuthenticatedUser(user: WorkosUser): Promise<AuthenticatedUser> {
    const dbUser = await db.query.users.findFirst({
        where: eq(schema.users.id, user.id)
    })

    return {
        id: user.id,
        email: dbUser?.email ?? user.email,
        firstName: dbUser?.firstName ?? user.firstName ?? undefined,
        lastName: dbUser?.lastName ?? user.lastName ?? undefined,
        nickname: dbUser?.nickname ?? null,
        isSuperadmin: dbUser?.isSuperadmin ?? false
    }
}

async function getDbAuthenticatedUser(userId: string): Promise<AuthenticatedUser | null> {
    const user = await db.query.users.findFirst({
        where: eq(schema.users.id, userId)
    })

    if (!user) {
        return null
    }

    return {
        id: user.id,
        email: user.email,
        firstName: user.firstName ?? undefined,
        lastName: user.lastName ?? undefined,
        nickname: user.nickname,
        isSuperadmin: user.isSuperadmin
    }
}

export async function resolveWorkosAuthenticatedUser(
    request: AuthenticatedRequest,
    reply: FastifyReply
): Promise<AuthenticatedUser | null> {
    const cookiePassword = env.WORKOS_COOKIE_PASSWORD
    const sessionData = request.cookies["wos-session"]

    if (!sessionData) {
        return null
    }

    const session = workos.userManagement.loadSealedSession({
        sessionData,
        cookiePassword
    })

    const authResult = await session.authenticate()

    if (authResult.authenticated && "user" in authResult) {
        return toAuthenticatedUser(authResult.user)
    }

    const refreshResult = await session.refresh()
    if (
        refreshResult.authenticated &&
        "sealedSession" in refreshResult &&
        "user" in refreshResult &&
        refreshResult.sealedSession
    ) {
        setSessionCookie(reply, refreshResult.sealedSession)

        return toAuthenticatedUser(refreshResult.user)
    }

    return null
}

export async function authenticateUser(
    request: AuthenticatedRequest,
    reply: FastifyReply
): Promise<void> {
    try {
        const actorUser = await resolveWorkosAuthenticatedUser(request, reply)

        if (!actorUser) {
            logSecurityEvent(request, reply, "authentication_failure", {
                reason: "No valid WorkOS session"
            })
            clearSessionCookie(reply)
            reply.code(401).send({ error: "Unauthorized: No valid session" })
            return
        }

        request.actorUser = actorUser
        request.user = actorUser
        markUserActive(actorUser.id)

        const hadImpersonationCookie = !!request.cookies[IMPERSONATION_COOKIE_NAME]
        const impersonationSession = await resolveImpersonationSession(request, reply)
        if (!impersonationSession) {
            if (
                hadImpersonationCookie &&
                !(request.method === "GET" && request.url === "/auth/me")
            ) {
                reply.code(401).send({
                    error: "Unauthorized",
                    message: "Impersonation session expired"
                })
            }
            return
        }

        if (impersonationSession.superadminUserId !== actorUser.id || !actorUser.isSuperadmin) {
            clearImpersonationCookie(reply)
            await endImpersonationSession(impersonationSession.id, "lost")
            if (!(request.method === "GET" && request.url === "/auth/me")) {
                reply.code(401).send({
                    error: "Unauthorized",
                    message: "Impersonation session is no longer valid"
                })
            }
            return
        }

        const impersonatedUser = await getDbAuthenticatedUser(
            impersonationSession.impersonatedUserId
        )
        if (!impersonatedUser || impersonatedUser.isSuperadmin) {
            clearImpersonationCookie(reply)
            await endImpersonationSession(impersonationSession.id, "lost")
            if (!(request.method === "GET" && request.url === "/auth/me")) {
                reply.code(401).send({
                    error: "Unauthorized",
                    message: "Impersonation session is no longer valid"
                })
            }
            return
        }

        request.user = impersonatedUser
        request.impersonation = {
            active: true,
            sessionId: impersonationSession.id,
            expiresAt: new Date(impersonationSession.expiresAt),
            actorUser,
            impersonatedUser
        }
    } catch (error) {
        request.log.error({ err: error }, "Authentication error")
        logSecurityEvent(request, reply, "authentication_failure", {
            reason: "Failed to authenticate session",
            error: error instanceof Error ? error.message : String(error)
        })
        clearSessionCookie(reply)
        reply.code(401).send({ error: "Unauthorized: Failed to authenticate session" })
    }
}

export async function requireSuperadmin(
    request: AuthenticatedRequest,
    reply: FastifyReply
): Promise<void> {
    if (request.impersonation?.active) {
        logSecurityEvent(request, reply, "authorization_failure", {
            reason: "Admin action attempted during impersonation"
        })
        reply.code(403).send({
            error: "Forbidden",
            message: "Stop impersonating before using superadmin tools"
        })
        return
    }

    if (!request.actorUser?.isSuperadmin) {
        logSecurityEvent(request, reply, "authorization_failure", {
            reason: "Superadmin required"
        })
        reply.code(403).send({ error: "Forbidden", message: "Superadmin access required" })
    }
}

export async function authenticateWebSocketRequest(
    request: AuthenticatedRequest
): Promise<AuthenticatedUser | null> {
    const noopReply = {
        setCookie: () => noopReply,
        clearCookie: () => noopReply
    } as unknown as FastifyReply

    const actorUser = await resolveWorkosAuthenticatedUser(request, noopReply)
    if (!actorUser) {
        return null
    }
    markUserActive(actorUser.id)

    const hadImpersonationCookie = !!request.cookies[IMPERSONATION_COOKIE_NAME]
    const impersonationSession = await resolveImpersonationSession(request, noopReply)
    if (!impersonationSession) {
        if (hadImpersonationCookie) {
            return null
        }
        return actorUser
    }

    if (impersonationSession.superadminUserId !== actorUser.id || !actorUser.isSuperadmin) {
        await endImpersonationSession(impersonationSession.id, "lost")
        return null
    }

    const impersonatedUser = await getDbAuthenticatedUser(impersonationSession.impersonatedUserId)
    if (!impersonatedUser || impersonatedUser.isSuperadmin) {
        await endImpersonationSession(impersonationSession.id, "lost")
        return null
    }

    return impersonatedUser
}
