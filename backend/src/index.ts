import { buildApp } from "./app.js"
import { env } from "./config/env.js"
import { initializeMetrics } from "./utils/metrics.js"
import { initializePostHogLogging, shutdownPostHogLogging } from "./utils/posthogLogger.js"
import { shutdownPostHogTracking } from "./utils/tracker.js"

const fastify = await buildApp()

initializePostHogLogging()
initializeMetrics(fastify)

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

const start = async () => {
    try {
        await fastify.listen({ port: env.PORT, host: env.HOST })
        const protocol = env.SSL_CERT_PATH && env.SSL_KEY_PATH ? "https" : "http"
        fastify.log.info(`Server listening on ${protocol}://${env.HOST}:${env.PORT}`)
        fastify.log.info(`Environment: ${env.NODE_ENV}`)
        if (env.SSL_CERT_PATH && env.SSL_KEY_PATH) {
            fastify.log.info("HTTPS enabled with SSL certificates")
        }
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}

start()
