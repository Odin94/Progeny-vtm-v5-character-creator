import { MantineProvider } from "@mantine/core"
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import SupportConversationButton from "~/components/SupportConversationButton"

const mocks = vi.hoisted(() => ({
    hasAnalyticsConsent: vi.fn(),
    openCookiePreferences: vi.fn(),
    openSupportConversation: vi.fn(),
    showSupportUnavailableNotification: vi.fn()
}))

Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn()
    }))
})

vi.mock("~/hooks/useAnalyticsConsent", () => ({
    useAnalyticsConsent: () => mocks.hasAnalyticsConsent()
}))

vi.mock("~/utils/cookiePreferences", () => ({
    openCookiePreferences: mocks.openCookiePreferences
}))

vi.mock("~/utils/supportConversations", () => ({
    openSupportConversation: mocks.openSupportConversation,
    showSupportUnavailableNotification: mocks.showSupportUnavailableNotification
}))

const renderButton = () =>
    render(
        <MantineProvider>
            <SupportConversationButton source="account-page" />
        </MantineProvider>
    )

describe("SupportConversationButton", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mocks.openSupportConversation.mockResolvedValue("opened")
    })

    afterEach(cleanup)

    it("opens cookie preferences until analytics consent is granted", () => {
        mocks.hasAnalyticsConsent.mockReturnValue(false)
        renderButton()

        fireEvent.click(screen.getByRole("button", { name: "Cookie preferences" }))

        expect(mocks.openCookiePreferences).toHaveBeenCalledOnce()
        expect(mocks.openSupportConversation).not.toHaveBeenCalled()
    })

    it("opens Support after analytics consent is granted", async () => {
        mocks.hasAnalyticsConsent.mockReturnValue(true)
        renderButton()

        fireEvent.click(screen.getByRole("button", { name: "Message Odin" }))

        await waitFor(() => {
            expect(mocks.openSupportConversation).toHaveBeenCalledWith("account-page")
        })
    })
})
