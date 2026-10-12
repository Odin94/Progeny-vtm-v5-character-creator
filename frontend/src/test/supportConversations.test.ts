import posthog from "posthog-js"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
    monitorSupportConversationResources,
    monitorUnreadSupportReplies,
    openSupportConversation,
    showSupportUnavailableNotification
} from "~/utils/supportConversations"

const mocks = vi.hoisted(() => ({
    notificationsShow: vi.fn()
}))

describe("unseen support replies", () => {
    let stop: (() => void) | null
    const flush = async () => {
        await new Promise<void>((resolve) => queueMicrotask(resolve))
    }
    const renderLauncher = (count: number) => {
        const container = document.createElement("div")
        container.id = "ph-conversations-widget-container"
        const button = document.createElement("button")
        button.setAttribute("aria-label", count ? `Open chat (${count} unread)` : "Open chat")
        container.append(button)
        document.body.append(container)
        return { container, button, click: vi.spyOn(button, "click") }
    }
    beforeEach(() => {
        document.body.innerHTML = ""
        vi.mocked(posthog.get_explicit_consent_status).mockReturnValue("granted")
    })
    afterEach(() => {
        stop?.()
        vi.restoreAllMocks()
    })
    it("opens for unread replies on load and replies arriving later", async () => {
        const { container, button, click } = renderLauncher(1)
        stop = monitorUnreadSupportReplies()
        expect(click).toHaveBeenCalledOnce()
        expect(container).toHaveAttribute("data-progeny-support-open", "true")
        button.setAttribute("aria-label", "Open chat (1 unread)")
        await flush()
        expect(click).toHaveBeenCalledOnce()
        button.setAttribute("aria-label", "Open chat")
        await flush()
        button.setAttribute("aria-label", "Open chat (1 unread)")
        await flush()
        expect(click).toHaveBeenCalledTimes(2)
    })
    it("observes a widget mounted after monitoring starts and ignores read messages", async () => {
        stop = monitorUnreadSupportReplies()
        const { button, click } = renderLauncher(0)
        await flush()
        expect(click).not.toHaveBeenCalled()
        button.setAttribute("aria-label", "Open chat (2 unread)")
        await flush()
        expect(click).toHaveBeenCalledOnce()
    })
    it("waits for a visible tab and respects revoked consent", async () => {
        const visibility = vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden")
        const { button, click } = renderLauncher(1)
        stop = monitorUnreadSupportReplies()
        expect(click).not.toHaveBeenCalled()
        visibility.mockReturnValue("visible")
        document.dispatchEvent(new Event("visibilitychange"))
        expect(click).toHaveBeenCalledOnce()
        vi.mocked(posthog.get_explicit_consent_status).mockReturnValue("denied")
        button.setAttribute("aria-label", "Open chat (2 unread)")
        await flush()
        expect(click).toHaveBeenCalledOnce()
    })
    it("reveals a restored open panel and hides it when dismissed", async () => {
        vi.useFakeTimers()
        try {
            const { container, button } = renderLauncher(0)
            const close = document.createElement("button")
            close.setAttribute("aria-label", "Close chat")
            button.replaceWith(close)
            stop = monitorUnreadSupportReplies()
            expect(container).toHaveAttribute("data-progeny-support-open", "true")
            close.addEventListener("click", () => close.replaceWith(button))
            close.click()
            await vi.runAllTimersAsync()
            expect(container).not.toHaveAttribute("data-progeny-support-open")
        } finally {
            vi.useRealTimers()
        }
    })
    it("keeps dismissed replies closed when another tab reduces the unread count", async () => {
        vi.useFakeTimers()
        try {
            const { container, button, click } = renderLauncher(2)
            const close = document.createElement("button")
            close.setAttribute("aria-label", "Close chat")
            button.addEventListener("click", () => button.replaceWith(close))
            close.addEventListener("click", () => close.replaceWith(button))
            stop = monitorUnreadSupportReplies()
            await flush()
            close.click()
            await vi.runAllTimersAsync()
            expect(container).not.toHaveAttribute("data-progeny-support-open")
            button.setAttribute("aria-label", "Open chat (1 unread)")
            await flush()
            expect(click).toHaveBeenCalledOnce()
            expect(container).not.toHaveAttribute("data-progeny-support-open")
            button.setAttribute("aria-label", "Open chat (2 unread)")
            await flush()
            expect(click).toHaveBeenCalledTimes(2)
        } finally {
            vi.useRealTimers()
        }
    })
})

vi.mock("@mantine/notifications", () => ({
    notifications: {
        show: mocks.notificationsShow
    }
}))

vi.mock("posthog-js", () => ({
    default: {
        capture: vi.fn(),
        config: {
            api_host: "https://info.odin-matthias.com"
        },
        get_explicit_consent_status: vi.fn(),
        conversations: {
            isAvailable: vi.fn(),
            loadIfEnabled: vi.fn(),
            show: vi.fn(),
            hide: vi.fn()
        }
    }
}))

describe("openSupportConversation", () => {
    beforeEach(() => {
        document.body.innerHTML = ""
        vi.clearAllMocks()
        vi.mocked(posthog.get_explicit_consent_status).mockReturnValue("granted")
    })

    it("shows and expands the PostHog Support widget", async () => {
        vi.mocked(posthog.conversations.isAvailable).mockReturnValue(true)
        const container = document.createElement("div")
        container.id = "ph-conversations-widget-container"
        const openButton = document.createElement("button")
        openButton.setAttribute("aria-label", "Open chat")
        const clickSpy = vi.spyOn(openButton, "click")
        container.append(openButton)
        document.body.append(container)

        await expect(openSupportConversation("landing-page")).resolves.toBe("opened")

        expect(posthog.capture).toHaveBeenCalledWith("support-conversation-opened", {
            source: "landing-page"
        })
        expect(posthog.conversations.show).toHaveBeenCalled()
        expect(posthog.conversations.loadIfEnabled).toHaveBeenCalledOnce()
        expect(clickSpy).toHaveBeenCalledOnce()
    })

    it("does not collapse an already-open widget", async () => {
        vi.mocked(posthog.conversations.isAvailable).mockReturnValue(true)
        const container = document.createElement("div")
        container.id = "ph-conversations-widget-container"
        const closeButton = document.createElement("button")
        closeButton.setAttribute("aria-label", "Close")
        const clickSpy = vi.spyOn(closeButton, "click")
        container.append(closeButton)
        document.body.append(container)

        await expect(openSupportConversation("account-page")).resolves.toBe("opened")

        expect(clickSpy).not.toHaveBeenCalled()
    })

    it("hides the closed launcher while keeping the widget preloaded", async () => {
        vi.useFakeTimers()
        vi.mocked(posthog.conversations.isAvailable).mockReturnValue(true)
        const container = document.createElement("div")
        container.id = "ph-conversations-widget-container"
        const closeButton = document.createElement("button")
        closeButton.setAttribute("aria-label", "Close")
        container.append(closeButton)
        document.body.append(container)

        await expect(openSupportConversation("character-sheet-menu")).resolves.toBe("opened")
        closeButton.click()
        await vi.runAllTimersAsync()

        expect(container).not.toHaveAttribute("data-progeny-support-open")
        expect(posthog.conversations.hide).not.toHaveBeenCalled()
        vi.useRealTimers()
    })

    it("requests consent instead of trying to load Support when tracking is disabled", async () => {
        vi.mocked(posthog.get_explicit_consent_status).mockReturnValue("denied")
        const consentRequest = vi.fn()
        window.addEventListener("progeny:request-posthog-consent", consentRequest)

        await expect(openSupportConversation("landing-page")).resolves.toBe("consent-required")

        expect(consentRequest).toHaveBeenCalledOnce()
        expect(posthog.conversations.show).not.toHaveBeenCalled()
        window.removeEventListener("progeny:request-posthog-consent", consentRequest)
    })

    it("explains that a blocker may be responsible after the Support script fails to load", () => {
        monitorSupportConversationResources()
        const supportScript = document.createElement("script")
        supportScript.src = "https://info.odin-matthias.com/static/conversations.js"
        document.head.append(supportScript)
        supportScript.dispatchEvent(new Event("error"))

        showSupportUnavailableNotification()

        expect(mocks.notificationsShow).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.stringContaining("ad blocker or privacy filter")
            })
        )
    })

    it("does not wait for a widget after its Support script has failed to load", async () => {
        monitorSupportConversationResources()
        const supportScript = document.createElement("script")
        supportScript.src = "https://info.odin-matthias.com/static/conversations.js"
        document.head.append(supportScript)
        supportScript.dispatchEvent(new Event("error"))

        await expect(openSupportConversation("landing-page")).resolves.toBe("unavailable")
        expect(posthog.conversations.isAvailable).not.toHaveBeenCalled()
    })
})
