import { FastifyReply } from "fastify"
import { env } from "../config/env.js"

const getSessionCookieOptions = () => ({
    path: "/",
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: (env.NODE_ENV === "production" ? "none" : "lax") as "none" | "lax"
})

export const setSessionCookie = (reply: FastifyReply, sealedSession: string) => {
    reply.setCookie("wos-session", sealedSession, getSessionCookieOptions())
}

export const clearSessionCookie = (reply: FastifyReply) => {
    reply.clearCookie("wos-session", getSessionCookieOptions())
}
