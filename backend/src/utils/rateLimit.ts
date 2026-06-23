export const authRedirectRateLimit = {
    max: 30,
    timeWindow: "1 minute"
} as const

export const authCallbackRateLimit = {
    max: 10,
    timeWindow: "1 minute"
} as const

export const authSessionRateLimit = {
    max: 30,
    timeWindow: "1 minute"
} as const

export const authProfileMutationRateLimit = {
    max: 20,
    timeWindow: "1 minute"
} as const

export const websocketConnectionRateLimit = {
    max: 60,
    timeWindow: "1 minute"
} as const
