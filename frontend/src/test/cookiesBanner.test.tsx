import { MantineProvider } from "@mantine/core"
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import posthog from "posthog-js"
import { CookiesBanner } from "~/components/CookiesBanner"

const mockUseAuth = vi.fn(() => ({ isAuthenticated: false, isLoading: false }))

vi.mock("~/hooks/useAuth", () => ({
    useAuth: () => mockUseAuth()
}))

vi.mock("posthog-js", () => ({
    default: {
        get_explicit_consent_status: vi.fn(),
        opt_in_capturing: vi.fn(),
        opt_out_capturing: vi.fn()
    }
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

const renderBanner = () =>
    render(
        <MantineProvider>
            <CookiesBanner />
        </MantineProvider>
    )

describe("CookiesBanner", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: false })
        vi.mocked(posthog.get_explicit_consent_status).mockReturnValue("pending")
    })

    afterEach(() => {
        cleanup()
    })

    it("shows the banner while consent is pending", async () => {
        renderBanner()

        expect(await screen.findByText("Sink your fangs into some cookies!")).toBeInTheDocument()
    })

    it("does not show the banner when consent was already granted", async () => {
        vi.mocked(posthog.get_explicit_consent_status).mockReturnValue("granted")

        renderBanner()

        await waitFor(() => {
            expect(posthog.get_explicit_consent_status).toHaveBeenCalledOnce()
        })
        expect(screen.queryByText("Sink your fangs into some cookies!")).not.toBeInTheDocument()
    })

    it("does not read or show consent while auth is still loading", async () => {
        mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: true })

        renderBanner()

        await waitFor(() => {
            expect(posthog.get_explicit_consent_status).not.toHaveBeenCalled()
        })
        expect(screen.queryByText("Sink your fangs into some cookies!")).not.toBeInTheDocument()
    })

    it.each([
        ["Accept", posthog.opt_in_capturing],
        ["Decline", posthog.opt_out_capturing]
    ] as const)(
        "%s updates PostHog consent and closes the banner",
        async (buttonLabel, posthogMethod) => {
            renderBanner()

            fireEvent.click(await screen.findByRole("button", { name: buttonLabel }))

            expect(posthogMethod).toHaveBeenCalledOnce()
            expect(screen.queryByText("Sink your fangs into some cookies!")).not.toBeInTheDocument()
        }
    )
})
