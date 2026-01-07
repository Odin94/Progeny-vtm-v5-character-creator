import { posthogLogger } from "./posthogLogger.js"

type LogAttributes = Record<string, string | number | boolean | string[] | number[] | boolean[] | null>

export const logger = {
    trace: (message: string, attributes?: LogAttributes) => {
        posthogLogger.emit({
            severityText: "trace",
            body: message,
            attributes: attributes ?? {},
        })
    },

    debug: (message: string, attributes?: LogAttributes) => {
        posthogLogger.emit({
            severityText: "debug",
            body: message,
            attributes: attributes ?? {},
        })
    },

    info: (message: string, attributes?: LogAttributes) => {
        posthogLogger.emit({
            severityText: "info",
            body: message,
            attributes: attributes ?? {},
        })
    },

    warn: (message: string, attributes?: LogAttributes) => {
        posthogLogger.emit({
            severityText: "warn",
            body: message,
            attributes: attributes ?? {},
        })
    },

    error: (message: string, error?: Error | unknown, attributes?: LogAttributes) => {
        const errorAttributes: LogAttributes = {
            ...attributes,
        }

        if (error instanceof Error) {
            errorAttributes.error_name = error.name
            errorAttributes.error_message = error.message
            errorAttributes.error_stack = error.stack ?? ""
        } else if (error) {
            errorAttributes.error = String(error)
        }

        posthogLogger.emit({
            severityText: "error",
            body: message,
            attributes: errorAttributes,
        })
    },

    fatal: (message: string, error?: Error | unknown, attributes?: LogAttributes) => {
        const errorAttributes: LogAttributes = {
            ...attributes,
        }

        if (error instanceof Error) {
            errorAttributes.error_name = error.name
            errorAttributes.error_message = error.message
            errorAttributes.error_stack = error.stack ?? ""
        } else if (error) {
            errorAttributes.error = String(error)
        }

        posthogLogger.emit({
            severityText: "fatal",
            body: message,
            attributes: errorAttributes,
        })
    },
}
