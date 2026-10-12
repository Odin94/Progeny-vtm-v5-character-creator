import { notifications } from "@mantine/notifications"
import posthog from "posthog-js"
import { z } from "zod"

const WIDGET_CONTAINER_ID = "ph-conversations-widget-container"
const WIDGET_OPEN_ATTRIBUTE = "data-progeny-support-open"
const OPEN_CHAT_SELECTOR = 'button[aria-label="Open chat"], button[aria-label^="Open chat ("]'
const CLOSE_CHAT_SELECTOR = 'button[aria-label="Close"], button[aria-label="Close chat"]'
const UNREAD_REPLY_POLL_MS = 15_000
const NOTIFIED_REPLIES_KEY = "progeny:support-notified-replies"
const notifiedRepliesSchema = z.array(z.tuple([z.string(), z.string()]))
const REOPEN_WHEN_VISIBLE_KEY = "progeny:support-reopen-when-visible"
// Support is preloaded on app startup. Three seconds is enough to absorb a
// slow remote-config response without making a failed user action feel stuck.
const OPEN_RETRY_COUNT = 30
const OPEN_RETRY_DELAY_MS = 100
const SUPPORT_RESOURCE_FAILURE_RETENTION_MS = OPEN_RETRY_COUNT * OPEN_RETRY_DELAY_MS + 1_000
const containersWatchingForClose = new WeakSet<HTMLElement>()
let warmupRetryId: number | null = null
let warmupAttempt = 0
let supportResourceFailureAt: number | null = null
let isMonitoringSupportResources = false
let stopUnreadMonitoring: (() => void) | null = null

export const SUPPORT_CONSENT_REQUEST_EVENT = "progeny:request-posthog-consent"

export type SupportConversationSource =
    | "landing-page"
    | "features-page"
    | "account-page"
    | "broken-save-modal"
    | "character-sheet-menu"
    | "character-creation-complete"

const isSupportScript = (target: EventTarget | null) => {
    if (!(target instanceof HTMLScriptElement)) {
        return false
    }

    try {
        const supportApiHost = new URL(posthog.config.api_host)
        const scriptUrl = new URL(target.src)

        return (
            scriptUrl.origin === supportApiHost.origin &&
            /\/static\/(?:[^/]+\/)?conversations\.js$/.test(scriptUrl.pathname)
        )
    } catch {
        return false
    }
}

/**
 * Records a browser-reported failure for PostHog's lazily-loaded Support script.
 * Browsers deliberately don't expose whether the cause was an ad blocker, a
 * privacy filter, CSP, or a network failure, so callers must not claim a more
 * specific cause than this signal supports.
 */
export const monitorSupportConversationResources = () => {
    if (isMonitoringSupportResources || typeof document === "undefined") {
        return
    }

    isMonitoringSupportResources = true
    document.addEventListener(
        "error",
        (event) => {
            if (isSupportScript(event.target)) {
                supportResourceFailureAt = Date.now()
            }
        },
        true
    )
}

const supportResourceFailedRecently = () =>
    supportResourceFailureAt !== null &&
    Date.now() - supportResourceFailureAt <= SUPPORT_RESOURCE_FAILURE_RETENTION_MS

export const showSupportUnavailableNotification = () => {
    const resourceLoadFailed = supportResourceFailedRecently()

    notifications.show({
        title: "Support chat is unavailable",
        message: resourceLoadFailed
            ? "Your browser couldn't load a required support component. An ad blocker or privacy filter can cause this. Allow info.odin-matthias.com, reload, and try again; otherwise use one of the other contact links."
            : "Please try again later, or use one of the other contact links.",
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

        window.setTimeout(() => container.removeAttribute(WIDGET_OPEN_ATTRIBUTE), 0)
    }

    container.addEventListener("click", handleWidgetClick)
}

/**
 * Starts loading the Support module ahead of a user opening the chat. The default
 * launcher remains hidden because PostHog's widget setting is disabled.
 */
export const warmSupportConversation = () => {
    if (posthog.get_explicit_consent_status() !== "granted") {
        return false
    }

    try {
        monitorUnreadSupportReplies()
        posthog.conversations.loadIfEnabled()

        if (posthog.conversations.isAvailable()) {
            posthog.conversations.show()
            warmupAttempt = 0
            if (warmupRetryId !== null) {
                window.clearTimeout(warmupRetryId)
                warmupRetryId = null
            }
            return true
        }

        if (warmupRetryId === null && warmupAttempt < OPEN_RETRY_COUNT) {
            warmupAttempt += 1
            warmupRetryId = window.setTimeout(() => {
                warmupRetryId = null
                warmSupportConversation()
            }, OPEN_RETRY_DELAY_MS)
        }

        return true
    } catch (error) {
        console.warn("PostHog Support failed to start loading:", error)
        return false
    }
}

const expandRenderedWidget = () => {
    const container = document.getElementById(WIDGET_CONTAINER_ID)
    if (!container) {
        return false
    }

    hideWidgetAfterConversationCloses(container)
    container.setAttribute(WIDGET_OPEN_ATTRIBUTE, "true")

    if (container.querySelector(CLOSE_CHAT_SELECTOR)) {
        return true
    }

    const openButton = container.querySelector<HTMLButtonElement>(OPEN_CHAT_SELECTOR)
    if (!openButton) {
        container.removeAttribute(WIDGET_OPEN_ATTRIBUTE)
        return false
    }

    openButton.click()
    return true
}

/** Open unseen replies using ticket versions, so concurrent reads cannot mask them. */
export const monitorUnreadSupportReplies = () => {
    if (stopUnreadMonitoring || !document.body) {
        return stopUnreadMonitoring
    }

    const isTabHidden = () => document.visibilityState === "hidden"
    let stopped = false
    let checkingReplies = false
    let hasTickets: boolean | null = null
    let checkedSession: string | null = null
    let checkedIdentity: string | null = null
    let refreshedTicketSet: string | null = null
    let lastLauncherLabel: string | null = null
    let notifiedSession: string | null = null
    let notifiedReplies = new Map<string, string>()
    const checkReplies = async () => {
        if (
            stopped ||
            checkingReplies ||
            isTabHidden() ||
            posthog.get_explicit_consent_status() !== "granted" ||
            !posthog.conversations.isAvailable()
        )
            return
        const session = posthog.conversations.getWidgetSessionId()
        if (!session) return
        const identity = posthog.get_distinct_id()
        if (session !== checkedSession || identity !== checkedIdentity) hasTickets = null
        // The initial lookup discovers multiple-ticket sessions. Thereafter,
        // idle visitors generate no polling until they start a conversation
        // or authentication changes which tickets this session can access.
        if (hasTickets === false && !posthog.conversations.getCurrentTicketId()) return
        checkingReplies = true
        try {
            const tickets = []
            let offset = 0
            while (true) {
                const response = await posthog.conversations.getTickets({ limit: 100, offset })
                if (!response) return
                tickets.push(...response.results)
                offset += response.results.length
                if (offset >= response.count || response.results.length === 0) break
            }
            if (
                stopped ||
                isTabHidden() ||
                posthog.get_explicit_consent_status() !== "granted" ||
                posthog.conversations.getWidgetSessionId() !== session ||
                posthog.get_distinct_id() !== identity
            )
                return
            hasTickets = tickets.length > 0
            checkedSession = session
            checkedIdentity = identity
            if (notifiedSession !== session) {
                notifiedSession = session
                notifiedReplies = new Map()
                try {
                    const parsed = notifiedRepliesSchema.safeParse(
                        JSON.parse(
                            sessionStorage.getItem(`${NOTIFIED_REPLIES_KEY}:${session}`) ?? "[]"
                        )
                    )
                    if (parsed.success) notifiedReplies = new Map(parsed.data)
                } catch {
                    // In-memory dismissal tracking still works without storage.
                }
            }
            const unread = tickets.filter((ticket) => (ticket.unread_count ?? 0) > 0)
            const version = (ticket: (typeof unread)[number]) =>
                `${ticket.message_count}:${ticket.last_message_at ?? ""}`
            if (!unread.some((ticket) => notifiedReplies.get(ticket.id) !== version(ticket))) return
            const currentTicket = posthog.conversations.getCurrentTicketId()
            const container = document.getElementById(WIDGET_CONTAINER_ID)
            if (currentTicket === null || unread.some((ticket) => ticket.id !== currentTicket)) {
                // Another tab can create tickets while this SDK still holds its
                // old view in memory. Re-render a closed widget to load the list.
                // Preserve a conversation the user is actively writing in.
                if (container?.querySelector(CLOSE_CHAT_SELECTOR) && currentTicket !== null) return
                const ticketSet = tickets
                    .map((ticket) => ticket.id)
                    .sort()
                    .join(",")
                if (
                    !container?.querySelector(CLOSE_CHAT_SELECTOR) &&
                    refreshedTicketSet !== ticketSet
                ) {
                    refreshedTicketSet = ticketSet
                    lastLauncherLabel = null
                    posthog.conversations.hide()
                    posthog.conversations.show()
                    return
                }
            }
            posthog.conversations.show()
            if (!expandRenderedWidget()) return
            for (const ticket of unread) notifiedReplies.set(ticket.id, version(ticket))
            try {
                sessionStorage.setItem(
                    `${NOTIFIED_REPLIES_KEY}:${session}`,
                    JSON.stringify([...notifiedReplies])
                )
            } catch {
                // In-memory dismissal tracking still works without storage.
            }
        } catch (error) {
            console.warn("PostHog Support unread check failed:", error)
        } finally {
            checkingReplies = false
        }
    }
    let reopenWhenVisible = false
    try {
        reopenWhenVisible = sessionStorage.getItem(REOPEN_WHEN_VISIBLE_KEY) === "true"
    } catch {
        // Keep the in-memory fallback when browser storage is unavailable.
    }
    const setReopenWhenVisible = (reopen: boolean) => {
        reopenWhenVisible = reopen
        try {
            if (reopen) sessionStorage.setItem(REOPEN_WHEN_VISIBLE_KEY, "true")
            else sessionStorage.removeItem(REOPEN_WHEN_VISIBLE_KEY)
        } catch {
            // Background replies still remain unread without storage access.
        }
    }
    const checkUnread = () => {
        if (posthog.get_explicit_consent_status() !== "granted") {
            setReopenWhenVisible(false)
            return
        }

        const container = document.getElementById(WIDGET_CONTAINER_ID)
        if (!container) return
        if (isTabHidden()) {
            const closeButton = container.querySelector<HTMLButtonElement>(CLOSE_CHAT_SELECTOR)
            if (closeButton) {
                // The SDK marks replies read whenever its panel is open, even
                // in a background tab. Close through its UI to stop those reads.
                // Per-tab storage preserves this intent through a reload,
                // since clicking Close also changes the SDK's saved state.
                setReopenWhenVisible(true)
                closeButton.click()
            }
            return
        }
        if (reopenWhenVisible && expandRenderedWidget()) {
            setReopenWhenVisible(false)
            return
        }
        if (container.querySelector(CLOSE_CHAT_SELECTOR)) {
            // The SDK restores its persisted open state on return. Keep that
            // panel visible: it marks replies read while internally open.
            hideWidgetAfterConversationCloses(container)
            container.setAttribute(WIDGET_OPEN_ATTRIBUTE, "true")
            return
        }
        const button = container.querySelector(OPEN_CHAT_SELECTOR)
        if (!button) return

        const label = button.getAttribute("aria-label")
        if (label !== lastLauncherLabel) {
            lastLauncherLabel = label
            void checkReplies()
        }
    }

    const observer = new MutationObserver(checkUnread)
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["aria-label"]
    })
    const onVisibilityChange = () => {
        hasTickets = null
        checkUnread()
        void checkReplies()
    }
    const onStorage = (event: StorageEvent) => {
        // The SDK's dedicated conversation persistence changes when another
        // tab starts/restores a ticket. Its in-memory ticket ID does not sync.
        if (event.key === `ph_conv_${posthog.config.token}`) {
            hasTickets = null
            void checkReplies()
        }
    }
    const pollId = window.setInterval(() => void checkReplies(), UNREAD_REPLY_POLL_MS)
    document.addEventListener("visibilitychange", onVisibilityChange)
    window.addEventListener("storage", onStorage)
    stopUnreadMonitoring = () => {
        stopped = true
        window.clearInterval(pollId)
        observer.disconnect()
        document.removeEventListener("visibilitychange", onVisibilityChange)
        window.removeEventListener("storage", onStorage)
        stopUnreadMonitoring = null
    }
    checkUnread()
    return stopUnreadMonitoring
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

    // The current PostHog SDK can report conversations as available after its
    // external script has failed to load. Avoid waiting for a widget that
    // cannot appear in that case.
    if (supportResourceFailedRecently()) {
        return "unavailable" as const
    }

    warmSupportConversation()

    try {
        posthog.capture("support-conversation-opened", { source })
    } catch (error) {
        console.warn("PostHog support launcher tracking failed:", error)
    }

    for (let attempt = 0; attempt < OPEN_RETRY_COUNT; attempt += 1) {
        if (supportResourceFailedRecently()) {
            return "unavailable" as const
        }

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
