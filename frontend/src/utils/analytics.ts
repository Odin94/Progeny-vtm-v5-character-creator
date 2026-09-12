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

/**
 * Cleans campaign parameters from the address bar after PostHog has read them
 * during initialization. `replaceState` updates the displayed URL without a
 * navigation, so it neither reloads the page nor adds a history entry.
 */
export const removeUtmParametersFromCurrentUrl = () => {
    const url = new URL(window.location.href)
    const utmParameters = [...url.searchParams.keys()].filter((parameter) =>
        parameter.toLowerCase().startsWith("utm_")
    )

    if (utmParameters.length === 0) {
        return false
    }

    for (const parameter of utmParameters) {
        url.searchParams.delete(parameter)
    }

    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`)
    return true
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

// Records when the profile page holds back a character switch because the
// current draft has unsaved changes but no name. The failure path was
// previously invisible in analytics.
export const trackCharacterSwitchBlockedUnnamed = () => {
    try {
        posthog.capture("character_switch_blocked_unnamed", { surface: "profile" })
    } catch (error) {
        console.warn("Character switch blocked tracking failed:", error)
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
