import { NodeSDK } from "@opentelemetry/sdk-node"
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http"
import { BatchLogRecordProcessor } from "@opentelemetry/sdk-logs"
import { resourceFromAttributes } from "@opentelemetry/resources"
import { logs } from "@opentelemetry/api-logs"
import { env } from "../config/env.js"

let sdk: NodeSDK | null = null
let logger: ReturnType<typeof logs.getLogger> | null = null

export const initializePostHogLogging = () => {
    if (!env.POSTHOG_API_KEY) {
        console.log("PostHog API key not configured, skipping PostHog logging initialization")
        return
    }
    if (!env.POSTHOG_HOST) {
        console.log("PostHog host not configured, skipping PostHog logging initialization")
        return
    }

    const logsUrl = `${env.POSTHOG_HOST}/i/v1/logs`

    try {
        sdk = new NodeSDK({
            resource: resourceFromAttributes({
                "service.name": "progeny-backend",
                "service.environment": env.NODE_ENV,
            }),
            logRecordProcessor: new BatchLogRecordProcessor(
                new OTLPLogExporter({
                    url: logsUrl,
                    headers: {
                        Authorization: `Bearer ${env.POSTHOG_API_KEY}`,
                    },
                })
            ),
        })

        sdk.start()

        logger = logs.getLogger("progeny-backend")

        console.log(`PostHog logging initialized (endpoint: ${logsUrl})`)
    } catch (error) {
        console.error("Failed to initialize PostHog logging:", error)
    }
}

export const getPostHogLogger = () => {
    if (!logger) {
        return {
            emit: () => {},
        }
    }
    return logger
}

export const shutdownPostHogLogging = async () => {
    if (sdk) {
        await sdk.shutdown()
        sdk = null
        logger = null
    }
}
