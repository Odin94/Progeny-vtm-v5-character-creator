import ReactGA from "react-ga4"
import posthog from "posthog-js"

type PostHogConsentStatus = ReturnType<typeof posthog.get_explicit_consent_status>

type EventParams = {
    action: string
    category: string
    label?: string
    value?: number
}

type PageViewParams = {
    page: string
    title?: string
}

export const trackEvent = ({ action, category, label, value }: EventParams) => {
    try {
        ReactGA.event({
            action,
            category,
            label,
            value
        })
    } catch (error) {
        console.warn("Google Analytics event tracking failed: ", error)
    }

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

export const trackPageView = ({ page, title }: PageViewParams) => {
    try {
        ReactGA.send({ hitType: "pageview", title })
    } catch (error) {
        console.warn("Google Analytics page view tracking failed: ", error)
    }

    try {
        posthog.capture("$pageview", {
            $current_url: page,
            title
        })
    } catch (error) {
        console.warn("PostHog page view tracking failed: ", error)
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
