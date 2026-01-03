import ReactGA from "react-ga4"
import posthog from "posthog-js"

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
            value,
        })
    } catch (error) {
        console.warn("Google Analytics event tracking failed: ", error)
    }

    try {
        posthog.capture(action, {
            category,
            label,
            value,
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
            title,
        })
    } catch (error) {
        console.warn("PostHog page view tracking failed: ", error)
    }
}
