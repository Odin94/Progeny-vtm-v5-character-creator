import posthog from "posthog-js"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { openSupportConversation } from "~/utils/supportConversations"

vi.mock("posthog-js", () => ({
    default: {
        capture: vi.fn(),
        get_explicit_consent_status: vi.fn(),
        conversations: {
            isAvailable: vi.fn(),
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
        expect(posthog.conversations.show).toHaveBeenCalledOnce()
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

    it("removes the widget entirely when the conversation is closed", async () => {
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

        expect(posthog.conversations.hide).toHaveBeenCalledOnce()
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
})
