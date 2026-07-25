import { useEffect, useState } from "react"
import posthog from "posthog-js"
import { COOKIE_PREFERENCES_CHANGED_EVENT } from "~/utils/cookiePreferences"

export const useAnalyticsConsent = () => {
    const [hasAnalyticsConsent, setHasAnalyticsConsent] = useState(
        () => posthog.get_explicit_consent_status() === "granted"
    )

    useEffect(() => {
        const updateConsent = () => {
            setHasAnalyticsConsent(posthog.get_explicit_consent_status() === "granted")
        }

        window.addEventListener(COOKIE_PREFERENCES_CHANGED_EVENT, updateConsent)
        return () => window.removeEventListener(COOKIE_PREFERENCES_CHANGED_EVENT, updateConsent)
    }, [])

    return hasAnalyticsConsent
}
