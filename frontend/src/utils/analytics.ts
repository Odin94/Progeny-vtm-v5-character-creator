import posthog from "posthog-js"

type PostHogConsentStatus = ReturnType<typeof posthog.get_explicit_consent_status>

type EventParams = {
    action: string
    category: string
    label?: string
    value?: number
}

type FeatureGuideEntryPoint =
    | "account-page"
    | "character-sheet-menu"
    | "character-creation-complete"
    | "landing-page"

type FeatureGuideNavigationTarget = {
    page: string
    section?: string
}

export const trackEvent = ({ action, category, label, value }: EventParams) => {
    try {
        posthog.capture(action, {
            category,
            label,
            value
        })
    } catch (error) {
        console.warn("PostHog event tracking failed:", error)
    }
}

export const trackFeatureGuideOpened = (entryPoint: FeatureGuideEntryPoint) => {
    try {
        posthog.capture("feature_guide_opened", { entry_point: entryPoint })
    } catch (error) {
        console.warn("Feature guide open tracking failed:", error)
    }
}

export const trackFeatureGuideNavigationSelected = ({
    page,
    section
}: FeatureGuideNavigationTarget) => {
    try {
        posthog.capture("feature_guide_navigation_selected", {
            page,
            ...(section ? { section } : {})
        })
    } catch (error) {
        console.warn("Feature guide navigation tracking failed:", error)
    }
}

export const resetPostHogIdentity = () => {
    let consentStatus: PostHogConsentStatus = "pending"

    try {
        consentStatus = posthog.get_explicit_consent_status()
    } catch (error) {
        console.warn("PostHog consent status read failed:", error)
    }

    posthog.reset()

    if (consentStatus === "granted") {
        posthog.opt_in_capturing({ captureEventName: false })
    } else if (consentStatus === "denied") {
        posthog.opt_out_capturing()
    }
}
