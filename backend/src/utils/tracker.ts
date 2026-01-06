import { PostHog } from "posthog-node"
import { env } from "../config/env.js"
import { logger } from "./logger.js"

type EventProperties = Record<string, string | number | boolean | string[] | number[] | boolean[] | null | undefined>

let posthogClient: PostHog | null = null

const getPostHogClient = (): PostHog | null => {
    if (!env.POSTHOG_KEY || !env.POSTHOG_HOST) {
        return null
    }

    if (posthogClient) {
        return posthogClient
    }

    try {
        posthogClient = new PostHog(env.POSTHOG_KEY, {
            host: env.POSTHOG_HOST,
            flushAt: 20,
            flushInterval: 10000,
        })
        return posthogClient
    } catch (error) {
        logger.error("Failed to initialize PostHog client", error as Error, {
            component: "tracker",
        })
        return null
    }
}

export const trackEvent = async (eventName: string, properties: EventProperties = {}, distinctId: string): Promise<void> => {
    if (env.NODE_ENV === "development") {
        return
    }

    const client = getPostHogClient()
    if (!client) {
        return
    }

    try {
        client.capture({
            distinctId,
            event: eventName,
            properties: {
                ...properties,
                environment: env.NODE_ENV,
            },
        })
    } catch (error) {
        logger.warn("Failed to track event", {
            eventName,
            error: error instanceof Error ? error.message : String(error),
        })
    }
}

export const shutdownPostHogTracking = async (): Promise<void> => {
    if (posthogClient) {
        try {
            await posthogClient.shutdown()
            posthogClient = null
        } catch (error) {
            logger.error("Failed to shutdown PostHog client", error as Error, {
                component: "tracker",
            })
        }
    }
}
