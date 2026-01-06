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
import { characterSyncWebSocket } from "./websocket/characterSync.js"
import { env } from "./config/env.js"
import { initializeMetrics } from "./utils/metrics.js"
import { initializePostHogLogging, shutdownPostHogLogging } from "./utils/posthogLogger.js"
import { shutdownPostHogTracking } from "./utils/tracker.js"

const httpsOptions =
    env.SSL_CERT_PATH && env.SSL_KEY_PATH
        ? {
              cert: readFileSync(env.SSL_CERT_PATH),
              key: readFileSync(env.SSL_KEY_PATH),
          }
        : null

const fastify = Fastify({
    https: httpsOptions,
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
            : true,
})

// Register plugins
await fastify.register(cors, {
    origin: (origin, callback) => {
        // In production, reject requests with no origin to prevent CSRF attacks
        if (!origin) {
            if (env.NODE_ENV === "development") {
                // Allow in development for tools like Postman
                return callback(null, true)
            }
            return callback(new Error("Not allowed by CORS: No origin header"), false)
        }

        // In development, allow localhost
        if (env.NODE_ENV === "development") {
            if (origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:")) {
                return callback(null, true)
            }
        }

        // In production, only allow the frontend domain
        const allowedOrigins = [
            "https://progeny.odin-matthias.de",
            "https://www.progeny.odin-matthias.de",
            "https://progeny.odin-matthias.com",
            "https://www.progeny.odin-matthias.com",
            "https://vtm-progeny.netlify.app",
            env.FRONTEND_URL,
        ].filter(Boolean)

        if (allowedOrigins.includes(origin)) {
            return callback(null, true)
        }

        callback(new Error("Not allowed by CORS"), false)
    },
    credentials: true,
})

await fastify.register(cookie, {
    secret: env.WORKOS_COOKIE_PASSWORD,
})

await fastify.register(rateLimit, {
    max: 1000, // Maximum number of requests per IP
    timeWindow: "15 minutes", // Time window for the rate limit
    // Continue processing even if rate limit store has errors
    skipOnError: true,
})

await fastify.register(websocket)

// Register routes
await fastify.register(authRoutes)
await fastify.register(characterRoutes)
await fastify.register(coterieRoutes)
await fastify.register(shareRoutes)

// Register WebSocket routes
await fastify.register(characterSyncWebSocket)

// Initialize PostHog logging
initializePostHogLogging()

// Initialize metrics collection
initializeMetrics(fastify)

// Health check (excluded from rate limiting)
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

const start = async () => {
    try {
        await fastify.listen({ port: env.PORT, host: env.HOST })
        const protocol = httpsOptions ? "https" : "http"
        fastify.log.info(`Server listening on ${protocol}://${env.HOST}:${env.PORT}`)
        fastify.log.info(`Environment: ${env.NODE_ENV}`)
        if (httpsOptions) {
            fastify.log.info("HTTPS enabled with SSL certificates")
        }
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}

process.on("SIGTERM", async () => {
    await shutdownPostHogLogging()
    await shutdownPostHogTracking()
    await fastify.close()
    process.exit(0)
})

process.on("SIGINT", async () => {
    await shutdownPostHogLogging()
    await shutdownPostHogTracking()
    await fastify.close()
    process.exit(0)
})

start()
