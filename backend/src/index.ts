import Fastify from "fastify"
import cors from "@fastify/cors"
import websocket from "@fastify/websocket"
import { characterRoutes } from "./routes/characters.js"
import { coterieRoutes } from "./routes/coteries.js"
import { shareRoutes } from "./routes/shares.js"
import { authRoutes } from "./routes/auth.js"
import { characterSyncWebSocket } from "./websocket/characterSync.js"
import { env } from "./config/env.js"
import { initializeMetrics } from "./utils/metrics.js"

const fastify = Fastify({
    logger: true,
})

// Register plugins
await fastify.register(cors, {
    origin: true,
    credentials: true,
})

await fastify.register(websocket)

// Register routes
await fastify.register(authRoutes)
await fastify.register(characterRoutes)
await fastify.register(coterieRoutes)
await fastify.register(shareRoutes)

// Register WebSocket routes
await fastify.register(characterSyncWebSocket)

// Initialize metrics collection
initializeMetrics(fastify)

// Health check
fastify.get("/health", async () => {
    return { status: "ok" }
})

const start = async () => {
    try {
        await fastify.listen({ port: env.PORT, host: env.HOST })
        fastify.log.info(`Server listening on http://${env.HOST}:${env.PORT}`)
        fastify.log.info(`Environment: ${env.NODE_ENV}`)
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}

start()
