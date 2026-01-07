import { FastifyRequest, FastifyReply } from "fastify"
import { nanoid } from "nanoid"
import { env } from "../config/env.js"

const CSRF_TOKEN_COOKIE_NAME = "csrf-token"
export const CSRF_TOKEN_HEADER_NAME = "x-csrf-token"

export function generateCsrfToken(): string {
    return nanoid(32)
}

export function setCsrfToken(reply: FastifyReply, token: string, request: FastifyRequest): void {
    // Determine domain based on request origin
    const origin = request.headers.origin
    let domain: string | undefined

    // TODOdin: Allow configuring these domains (and cors domains) via env variables
    if (origin) {
        if (origin.includes("odin-matthias.de")) {
            domain = ".odin-matthias.de"
        } else if (origin.includes("odin-matthias.com")) {
            domain = ".odin-matthias.com"
        }
    }

    reply.setCookie(CSRF_TOKEN_COOKIE_NAME, token, {
        httpOnly: false,
        secure: env.NODE_ENV === "production",
        sameSite: env.NODE_ENV === "production" ? "none" : "lax",
        path: "/",
        domain: env.NODE_ENV === "production" ? domain : undefined,
    })
}

export async function validateCsrfToken(request: FastifyRequest, reply: FastifyReply): Promise<boolean> {
    // Skip CSRF validation for GET, HEAD, OPTIONS requests
    if (["GET", "HEAD", "OPTIONS"].includes(request.method)) {
        return true
    }

    // Skip CSRF validation for health check and metrics endpoints
    if (request.url === "/health" || request.url.startsWith("/metrics")) {
        return true
    }

    const cookieToken = request.cookies[CSRF_TOKEN_COOKIE_NAME]
    const headerToken = request.headers[CSRF_TOKEN_HEADER_NAME] as string | undefined

    if (!cookieToken || !headerToken) {
        const error = new Error("CSRF token missing") as Error & { statusCode?: number }
        error.statusCode = 403
        reply.code(403)
        throw error
    }

    if (cookieToken !== headerToken) {
        const error = new Error("CSRF token mismatch") as Error & { statusCode?: number }
        error.statusCode = 403
        reply.code(403)
        throw error
    }

    return true
}
