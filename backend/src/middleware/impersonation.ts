import { FastifyReply, FastifyRequest } from "fastify"
import { and, eq, isNull, sql } from "drizzle-orm"
import { nanoid } from "nanoid"
import { db, schema } from "../db/index.js"
import { env } from "../config/env.js"
import { trackEvent } from "../utils/tracker.js"

export const IMPERSONATION_COOKIE_NAME = "impersonation-session"
export const IMPERSONATION_SESSION_TTL_MS = 10 * 60 * 1000

export type ActiveImpersonationSession = {
    id: string
    superadminUserId: string
    impersonatedUserId: string
    expiresAt: number
}

type EndedReason = "stopped" | "expired" | "lost"

// Impersonation sessions are handled in-memory, may cause trouble in horizontally scaled deployments
const activeImpersonationSessions = new Map<string, ActiveImpersonationSession>()

const expireInactiveSessions = async () => {
    const now = Date.now()
    const expiredSessions = [...activeImpersonationSessions.values()].filter(
        (session) => session.expiresAt <= now
    )

    await Promise.all(
        expiredSessions.map((session) => endImpersonationSession(session.id, "expired"))
    )
}

const expiryInterval = setInterval(() => {
    void expireInactiveSessions()
}, 60 * 1000)
expiryInterval.unref?.()

const getCookieOptions = () => ({
    path: "/",
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: (env.NODE_ENV === "production" ? "none" : "lax") as "none" | "lax",
    signed: true
})

export function setImpersonationCookie(reply: FastifyReply, sessionId: string): void {
    reply.setCookie(IMPERSONATION_COOKIE_NAME, sessionId, {
        ...getCookieOptions(),
        maxAge: Math.floor(IMPERSONATION_SESSION_TTL_MS / 1000)
    })
}

export function clearImpersonationCookie(reply: FastifyReply): void {
    reply.clearCookie(IMPERSONATION_COOKIE_NAME, getCookieOptions())
}

export async function startImpersonationSession({
    superadminUserId,
    impersonatedUserId
}: {
    superadminUserId: string
    impersonatedUserId: string
}): Promise<ActiveImpersonationSession> {
    const now = new Date()
    const expiresAt = new Date(now.getTime() + IMPERSONATION_SESSION_TTL_MS)
    const session: ActiveImpersonationSession = {
        id: nanoid(),
        superadminUserId,
        impersonatedUserId,
        expiresAt: expiresAt.getTime()
    }

    const startEvent = {
        type: "started",
        timestamp: now.toISOString(),
        actorUserId: superadminUserId,
        effectiveUserId: impersonatedUserId,
        expiresAt: expiresAt.toISOString()
    }

    await db.insert(schema.impersonationSessions).values({
        id: session.id,
        superadminUserId,
        impersonatedUserId,
        startedAt: now,
        expiresAt,
        auditLog: JSON.stringify([startEvent])
    })

    activeImpersonationSessions.set(session.id, session)

    await trackEvent(
        "superadmin_impersonation_started",
        {
            impersonationSessionId: session.id,
            superadminUserId,
            impersonatedUserId,
            expiresAt: expiresAt.toISOString()
        },
        superadminUserId
    )

    return session
}

export async function endImpersonationSession(
    sessionId: string,
    reason: EndedReason = "stopped"
): Promise<void> {
    activeImpersonationSessions.delete(sessionId)
    const session = await db.query.impersonationSessions.findFirst({
        where: eq(schema.impersonationSessions.id, sessionId),
        columns: {
            superadminUserId: true,
            impersonatedUserId: true,
            endedAt: true
        }
    })

    await db
        .update(schema.impersonationSessions)
        .set({
            endedAt: new Date(),
            endedReason: reason
        })
        .where(
            and(
                eq(schema.impersonationSessions.id, sessionId),
                isNull(schema.impersonationSessions.endedAt)
            )
        )

    if (session && !session.endedAt) {
        await trackEvent(
            "superadmin_impersonation_ended",
            {
                impersonationSessionId: sessionId,
                superadminUserId: session.superadminUserId,
                impersonatedUserId: session.impersonatedUserId,
                endedReason: reason
            },
            session.superadminUserId
        )
    }
}

export async function resolveImpersonationSession(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<ActiveImpersonationSession | null> {
    const rawCookie = request.cookies[IMPERSONATION_COOKIE_NAME]
    if (!rawCookie) {
        return null
    }

    const unsigned = request.unsignCookie(rawCookie)
    if (!unsigned.valid || !unsigned.value) {
        clearImpersonationCookie(reply)
        return null
    }

    const session = activeImpersonationSessions.get(unsigned.value)
    if (!session) {
        clearImpersonationCookie(reply)
        await endImpersonationSession(unsigned.value, "lost")
        return null
    }

    if (session.expiresAt <= Date.now()) {
        clearImpersonationCookie(reply)
        await endImpersonationSession(session.id, "expired")
        return null
    }

    return session
}

const SENSITIVE_KEY_PATTERN = /(authorization|cookie|csrf|password|secret|token)/i

const redactValue = (value: unknown, depth = 0): unknown => {
    if (depth > 4) {
        return "[Max depth]"
    }

    if (Array.isArray(value)) {
        return value.slice(0, 20).map((item) => redactValue(item, depth + 1))
    }

    if (value && typeof value === "object") {
        return Object.fromEntries(
            Object.entries(value as Record<string, unknown>).map(([key, nested]) => [
                key,
                SENSITIVE_KEY_PATTERN.test(key) ? "[Redacted]" : redactValue(nested, depth + 1)
            ])
        )
    }

    return value
}

export function summarizeAuditBody(body: unknown): unknown {
    if (body === undefined) {
        return undefined
    }

    const redacted = redactValue(body)
    const json = JSON.stringify(redacted)

    if (json.length <= 4000) {
        return redacted
    }

    return {
        truncated: true,
        length: json.length,
        preview: `${json.slice(0, 4000)}...`
    }
}

export async function appendImpersonationAuditLog(
    sessionId: string,
    entry: Record<string, unknown>
): Promise<void> {
    await db
        .update(schema.impersonationSessions)
        .set({
            auditLog: sql`json_insert(
                case
                    when json_valid(${schema.impersonationSessions.auditLog})
                        and json_type(${schema.impersonationSessions.auditLog}) = 'array'
                    then ${schema.impersonationSessions.auditLog}
                    else '[]'
                end,
                '$[#]',
                json(${JSON.stringify(entry)})
            )`
        })
        .where(eq(schema.impersonationSessions.id, sessionId))
}

export function expireImpersonationSessionForTests(sessionId: string): void {
    if (env.NODE_ENV !== "test") {
        return
    }

    const session = activeImpersonationSessions.get(sessionId)
    if (session) {
        activeImpersonationSessions.set(sessionId, {
            ...session,
            expiresAt: Date.now() - 1
        })
    }
}
