import Fastify from "fastify"
import cors from "@fastify/cors"
import websocket from "@fastify/websocket"
import cookie from "@fastify/cookie"
import rateLimit from "@fastify/rate-limit"
import { readFileSync } from "fs"
import { characterRoutes } from "./routes/characters.js"
import { coterieRoutes } from "./routes/coteries.js"
import { shareRoutes } from "./routes/shares.js"
import { authRoutes } from "./routes/auth.js"
import { preferencesRoutes } from "./routes/preferences.js"
import { characterSyncWebSocket } from "./websocket/characterSync.js"
import { sessionChatWebSocket } from "./websocket/sessionChat.js"
import { env } from "./config/env.js"
import { generateRequestId, setRequestId } from "./middleware/requestId.js"
import { CSRF_TOKEN_HEADER_NAME, generateCsrfToken, setCsrfToken, validateCsrfToken } from "./middleware/csrf.js"
import { logError, logRequest, logSecurityEvent } from "./middleware/securityLogger.js"

export async function buildApp() {
    const httpsOptions =
        env.SSL_CERT_PATH && env.SSL_KEY_PATH
            ? {
                  cert: readFileSync(env.SSL_CERT_PATH),
                  key: readFileSync(env.SSL_KEY_PATH),
              }
            : null

    const fastify = Fastify({
        https: httpsOptions,
        trustProxy: true,
        logger:
            env.NODE_ENV === "development"
                ? {
                      transport: {
                          target: "pino-pretty",
                          options: {
                              colorize: true,
                              translateTime: "HH:MM:ss Z",
                              ignore: "pid,hostname",
                          },
                      },
                  }
                : env.NODE_ENV !== "test",
    })

    await fastify.register(cors, {
        origin: (origin, callback) => {
            if (!origin) {
                return callback(null, true)
            }

            if (
                origin.startsWith("http://localhost:") ||
                origin.startsWith("http://127.0.0.1:") ||
                origin.startsWith("https://localhost:") ||
                origin.startsWith("https://127.0.0.1:")
            ) {
                return callback(null, true)
            }

            const allowedPatterns = [/^https?:\/\/([a-z0-9-]+\.)*odin-matthias\.de$/, /^https?:\/\/([a-z0-9-]+\.)*odin-matthias\.com$/]

            const isAllowed = allowedPatterns.some((pattern) => pattern.test(origin))

            if (isAllowed) {
                return callback(null, true)
            }

            callback(new Error("Not allowed by CORS"), false)
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token", CSRF_TOKEN_HEADER_NAME, "X-Request-Id"],
        exposedHeaders: ["X-Request-Id", "X-CSRF-Token", CSRF_TOKEN_HEADER_NAME],
    })

    await fastify.register(cookie, {
        secret: env.WORKOS_COOKIE_PASSWORD,
    })

    await fastify.register(rateLimit, {
        max: 1000,
        timeWindow: "15 minutes",
        skipOnError: true,
    })

    await fastify.register(websocket)

    fastify.addHook("onRequest", async (request, reply) => {
        const requestId = (request.headers["x-request-id"] as string | undefined) || generateRequestId()
        setRequestId(request, reply, requestId)
    })

    fastify.addHook("onRequest", async (request, reply) => {
        if (request.method === "GET" && !request.url.startsWith("/ws/")) {
            const existingToken = request.cookies["csrf-token"]
            const token = existingToken ?? generateCsrfToken()
            // TODOdin: We now set csrf in cookie and header, but only really need header
            if (!existingToken) {
                setCsrfToken(reply, token, request)
            }
            reply.header("X-CSRF-Token", token)
        }
    })

    fastify.addHook("onRequest", async (request, reply) => {
        try {
            await validateCsrfToken(request, reply)
        } catch (error) {
            logSecurityEvent(request, reply, "csrf_failure", {
                url: request.url,
                method: request.method,
            })
            throw error
        }
    })

    fastify.addHook("onResponse", async (request, reply) => {
        logRequest(request, reply)
    })

    fastify.addHook("onError", async (request, reply, error) => {
        logError(request, reply, error)
    })

    await fastify.register(authRoutes)
    await fastify.register(preferencesRoutes)
    await fastify.register(characterRoutes)
    await fastify.register(coterieRoutes)
    await fastify.register(shareRoutes)

    await fastify.register(characterSyncWebSocket)
    await fastify.register(sessionChatWebSocket)

    fastify.get(
        "/health",
        {
            config: {
                rateLimit: false,
            },
        },
        async () => {
            return { status: "ok" }
        }
    )

    return fastify
}
