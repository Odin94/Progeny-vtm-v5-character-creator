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
        let previousCount = 0
        let messageCount = 0
        vi.mocked(posthog.conversations.getTickets).mockImplementation(async () => {
            const count = Number(
                /\((\d+) unread\)/.exec(button.getAttribute("aria-label") ?? "")?.[1] ?? 0
            )
            if (count > previousCount) messageCount += 1
            previousCount = count
            return {
                count: 1,
                results: [
                    {
                        id: "unit-ticket",
                        status: "open",
                        message_count: messageCount,
                        unread_count: count,
                        created_at: "2026-01-01"
                    }
                ]
            }
        })
        return { container, button, click: vi.spyOn(button, "click") }
    }
    beforeEach(() => {
        document.body.innerHTML = ""
        sessionStorage.clear()
        vi.mocked(posthog.get_explicit_consent_status).mockReturnValue("granted")
        vi.mocked(posthog.get_distinct_id).mockReturnValue("unit-user")
        vi.mocked(posthog.conversations.isAvailable).mockReturnValue(true)
        vi.mocked(posthog.conversations.getCurrentTicketId).mockReturnValue("unit-ticket")
        vi.mocked(posthog.conversations.getWidgetSessionId).mockReturnValue("unit-session")
        vi.mocked(posthog.conversations.getTickets).mockResolvedValue({ count: 0, results: [] })
    })
    afterEach(() => {
        stop?.()
        vi.restoreAllMocks()
    })
    it("opens for unread replies on load and replies arriving later", async () => {
        const { container, button, click } = renderLauncher(1)
        stop = monitorUnreadSupportReplies()
        await flush()
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
    it("discovers existing unread tickets after anonymous startup becomes authenticated", async () => {
        vi.mocked(posthog.conversations.getTickets).mockClear()
        vi.mocked(posthog.conversations.hide).mockClear()
        const { button, click } = renderLauncher(0)
        vi.mocked(posthog.conversations.getCurrentTicketId).mockReturnValue(null)
        vi.mocked(posthog.conversations.getTickets).mockResolvedValue({ count: 0, results: [] })
        stop = monitorUnreadSupportReplies()
        await flush()
        expect(click).not.toHaveBeenCalled()
        vi.mocked(posthog.get_distinct_id).mockReturnValue("returning-user")
        vi.mocked(posthog.conversations.getTickets).mockResolvedValue({
            count: 1,
            results: [
                {
                    id: "existing-ticket",
                    status: "open",
                    unread_count: 1,
                    message_count: 2,
                    created_at: "2026-01-01"
                }
            ]
        })
        button.setAttribute("aria-label", "Open chat (1 unread)")
        await flush()
        expect(posthog.conversations.getTickets).toHaveBeenCalledTimes(2)
        expect(posthog.conversations.hide).toHaveBeenCalledOnce()
    })
    it("waits for a visible tab and respects revoked consent", async () => {
        const visibility = vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden")
        const { button, click } = renderLauncher(1)
        stop = monitorUnreadSupportReplies()
        expect(click).not.toHaveBeenCalled()
        visibility.mockReturnValue("visible")
        document.dispatchEvent(new Event("visibilitychange"))
        await flush()
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
            await vi.advanceTimersByTimeAsync(0)
            expect(container).not.toHaveAttribute("data-progeny-support-open")
        } finally {
            vi.useRealTimers()
        }
    })
    it("closes an open panel in a background tab and restores it on return", async () => {
        vi.useFakeTimers()
        try {
            const visibility = vi
                .spyOn(document, "visibilityState", "get")
                .mockReturnValue("visible")
            const { container, button, click } = renderLauncher(0)
            const close = document.createElement("button")
            close.setAttribute("aria-label", "Close")
            const closeClick = vi.spyOn(close, "click")
            button.addEventListener("click", () => button.replaceWith(close))
            close.addEventListener("click", () => close.replaceWith(button))
            button.replaceWith(close)
            stop = monitorUnreadSupportReplies()
            visibility.mockReturnValue("hidden")
            document.dispatchEvent(new Event("visibilitychange"))
            await vi.advanceTimersByTimeAsync(0)
            expect(closeClick).toHaveBeenCalledOnce()
            expect(container).not.toHaveAttribute("data-progeny-support-open")
            visibility.mockReturnValue("visible")
            document.dispatchEvent(new Event("visibilitychange"))
            await flush()
            expect(click).toHaveBeenCalledOnce()
            expect(container).toHaveAttribute("data-progeny-support-open", "true")
        } finally {
            vi.useRealTimers()
        }
    })
    it("closes a persisted open panel when initially loaded in a background tab", async () => {
        const visibility = vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden")
        const { button, click } = renderLauncher(0)
        const close = document.createElement("button")
        close.setAttribute("aria-label", "Close")
        const closeClick = vi.spyOn(close, "click")
        close.addEventListener("click", () => close.replaceWith(button))
        button.replaceWith(close)
        stop = monitorUnreadSupportReplies()
        expect(closeClick).toHaveBeenCalledOnce()
        visibility.mockReturnValue("visible")
        document.dispatchEvent(new Event("visibilitychange"))
        await flush()
        expect(click).toHaveBeenCalledOnce()
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
            await flush()
            close.click()
            await vi.advanceTimersByTimeAsync(0)
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
        get_distinct_id: vi.fn(),
        conversations: {
            isAvailable: vi.fn(),
            loadIfEnabled: vi.fn(),
            show: vi.fn(),
            hide: vi.fn(),
            getTickets: vi.fn(),
            getCurrentTicketId: vi.fn(),
            getWidgetSessionId: vi.fn()
        }
    }
}))

describe("openSupportConversation", () => {
    afterEach(() => {
        monitorUnreadSupportReplies()?.()
    })
    beforeEach(() => {
        document.body.innerHTML = ""
        sessionStorage.clear()
        vi.clearAllMocks()
        vi.mocked(posthog.get_explicit_consent_status).mockReturnValue("granted")
        vi.mocked(posthog.conversations.isAvailable).mockReturnValue(true)
        vi.mocked(posthog.conversations.getCurrentTicketId).mockReturnValue("unit-ticket")
        vi.mocked(posthog.conversations.getWidgetSessionId).mockReturnValue("unit-session")
        vi.mocked(posthog.conversations.getTickets).mockResolvedValue({ count: 0, results: [] })
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
        await vi.advanceTimersByTimeAsync(0)

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
