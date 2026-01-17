import { FastifyRequest, FastifyReply, FastifyError } from "fastify"
import { getRequestId } from "./requestId.js"
import { logger } from "../utils/logger.js"

type SecurityEventType = "authentication_failure" | "authorization_failure" | "csrf_failure" | "rate_limit_exceeded" | "suspicious_activity"

interface SecurityLogEntry {
    type: SecurityEventType
    requestId: string
    method: string
    url: string
    ip: string
    userAgent?: string
    userId?: string
    details?: Record<string, unknown>
    timestamp: number
}

export function logSecurityEvent(
    request: FastifyRequest,
    reply: FastifyReply,
    type: SecurityEventType,
    details?: Record<string, unknown>
): void {
    const requestId = getRequestId(request)
    const ip = request.ip || request.socket.remoteAddress || "unknown"
    const userAgent = request.headers["user-agent"]
    const userId = (request as any).user?.id

    const logEntry: SecurityLogEntry = {
        type,
        requestId,
        method: request.method,
        url: request.url,
        ip,
        userAgent,
        userId,
        details,
        timestamp: Date.now(),
    }

    logger.warn(type, {
        securityEvent: JSON.stringify(logEntry),
        endpoint: request.url,
        method: request.method,
        userId: userId ?? null,
    })
}

export function logRequest(request: FastifyRequest, reply: FastifyReply): void {
    if (request.method === "OPTIONS") return
    if (request.url === "/health") return
    if (request.url === "/auth/me" && reply.statusCode === 401) return // These are triggered when FE checks if there is a session, so they happen a lot and mean nothing

    const requestId = getRequestId(request)
    const ip = request.ip || request.socket.remoteAddress || "unknown"
    const userAgent = request.headers["user-agent"]
    const userId = (request as any).user?.id
    const statusCode = reply.statusCode

    logger.info(`${request.method} ${request.url}: ${statusCode}`, {
        requestId,
        method: request.method,
        url: request.url,
        ip,
        userAgent: userAgent ?? null,
        userId: userId ?? null,
        statusCode,
    })
}

export function logError(request: FastifyRequest, reply: FastifyReply, error: FastifyError): void {
    // Skip logging CSRF token errors - they're already logged as security events
    if (error.message === "CSRF token missing" || error.message === "CSRF token mismatch") {
        return
    }

    const errorMessage = error.message
    const requestId = getRequestId(request)
    const ip = request.ip || request.socket.remoteAddress || "unknown"
    const userAgent = request.headers["user-agent"]
    const userId = (request as any).user?.id
    const statusCode = reply.statusCode

    logger.error(`${error.name}: ${errorMessage}`, error, {
        requestId,
        method: request.method,
        url: request.url,
        ip,
        userAgent: userAgent ?? null,
        userId: userId ?? null,
        statusCode,
        stack: error.stack ?? null,
    })
}
