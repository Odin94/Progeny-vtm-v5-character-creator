import { notifications } from "@mantine/notifications"
import posthog from "posthog-js"

const WIDGET_CONTAINER_ID = "ph-conversations-widget-container"
const OPEN_CHAT_SELECTOR = 'button[aria-label="Open chat"], button[aria-label^="Open chat ("]'
const CLOSE_CHAT_SELECTOR = 'button[aria-label="Close"], button[aria-label="Close chat"]'
const OPEN_RETRY_COUNT = 20
const OPEN_RETRY_DELAY_MS = 100
const containersWatchingForClose = new WeakSet<HTMLElement>()

export const SUPPORT_CONSENT_REQUEST_EVENT = "progeny:request-posthog-consent"

export type SupportConversationSource =
    | "landing-page"
    | "account-page"
    | "character-sheet-menu"
    | "character-creation-complete"

export const showSupportUnavailableNotification = () => {
    notifications.show({
        title: "Support chat is unavailable",
        message: "Please try again later, or use one of the other contact links.",
        color: "orange"
    })
}

const wait = (duration: number) =>
    new Promise<void>((resolve) => {
        window.setTimeout(resolve, duration)
    })

const hideWidgetAfterConversationCloses = (container: HTMLElement) => {
    if (containersWatchingForClose.has(container)) {
        return
    }

    containersWatchingForClose.add(container)
    const handleWidgetClick = (event: MouseEvent) => {
        const target = event.target
        if (!(target instanceof Element) || !target.closest(CLOSE_CHAT_SELECTOR)) {
            return
        }

        container.removeEventListener("click", handleWidgetClick)
        window.setTimeout(() => posthog.conversations.hide(), 0)
    }

    container.addEventListener("click", handleWidgetClick)
}

const expandRenderedWidget = () => {
    const container = document.getElementById(WIDGET_CONTAINER_ID)
    if (!container) {
        return false
    }

    hideWidgetAfterConversationCloses(container)

    if (container.querySelector(CLOSE_CHAT_SELECTOR)) {
        return true
    }

    const openButton = container.querySelector<HTMLButtonElement>(OPEN_CHAT_SELECTOR)
    if (!openButton) {
        return false
    }

    openButton.click()
    return true
}

/**
 * Opens PostHog Support from one of the app's own entry points.
 *
 * PostHog's public `show()` API renders the widget while preserving its previous
 * open/closed state. When it renders closed, activate its accessible open button
 * so a single click on our UI always opens the conversation panel.
 */
export const openSupportConversation = async (source: SupportConversationSource) => {
    if (posthog.get_explicit_consent_status() !== "granted") {
        window.dispatchEvent(
            new CustomEvent<{ source: SupportConversationSource }>(SUPPORT_CONSENT_REQUEST_EVENT, {
                detail: { source }
            })
        )
        return "consent-required" as const
    }

    try {
        posthog.capture("support-conversation-opened", { source })
    } catch (error) {
        console.warn("PostHog support launcher tracking failed:", error)
    }

    for (let attempt = 0; attempt < OPEN_RETRY_COUNT; attempt += 1) {
        try {
            if (posthog.conversations.isAvailable()) {
                posthog.conversations.show()

                if (expandRenderedWidget()) {
                    return "opened" as const
                }
            }
        } catch (error) {
            console.warn("PostHog Support failed to open:", error)
            return "unavailable" as const
        }

        await wait(OPEN_RETRY_DELAY_MS)
    }

    return "unavailable" as const
}
