import posthog from "posthog-js"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { openSupportConversation } from "~/utils/supportConversations"

vi.mock("posthog-js", () => ({
    default: {
        capture: vi.fn(),
        conversations: {
            isAvailable: vi.fn(),
            show: vi.fn()
        }
    }
}))

describe("openSupportConversation", () => {
    beforeEach(() => {
        document.body.innerHTML = ""
        vi.clearAllMocks()
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

        await expect(openSupportConversation("landing-page")).resolves.toBe(true)

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
        closeButton.setAttribute("aria-label", "Close chat")
        const clickSpy = vi.spyOn(closeButton, "click")
        container.append(closeButton)
        document.body.append(container)

        await expect(openSupportConversation("account-page")).resolves.toBe(true)

        expect(clickSpy).not.toHaveBeenCalled()
    })
})
