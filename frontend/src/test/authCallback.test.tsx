import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MantineProvider } from "@mantine/core"
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
    handleAuthCallback: vi.fn()
}))

vi.mock("~/utils/api", () => ({
    api: {
        handleAuthCallback: mocks.handleAuthCallback
    }
}))

vi.mock("posthog-js", () => ({
    default: {
        identify: vi.fn()
    }
}))

vi.mock("~/components/RenderProfiler", () => ({
    default: ({ children }: { children: React.ReactNode }) => children
}))

import { AUTH_CALLBACK_TIMEOUT_MS, AuthCallback } from "~/routes/auth.callback"

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

const renderCallback = () => {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } }
    })

    return render(
        <QueryClientProvider client={queryClient}>
            <MantineProvider>
                <AuthCallback />
            </MantineProvider>
        </QueryClientProvider>
    )
}

describe("auth callback recovery", () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.clearAllMocks()
        window.history.replaceState(null, "", "/auth/callback?code=test-code")
        mocks.handleAuthCallback.mockReturnValue(new Promise(() => undefined))
    })

    afterEach(() => {
        cleanup()
        vi.useRealTimers()
    })

    it("shows recovery actions after the callback times out and can retry", async () => {
        renderCallback()

        expect(screen.getByText("Completing sign in...")).toBeInTheDocument()
        expect(mocks.handleAuthCallback).toHaveBeenCalledOnce()

        await act(async () => {
            await vi.advanceTimersByTimeAsync(AUTH_CALLBACK_TIMEOUT_MS)
        })

        expect(screen.getByText("Sign-in didn't finish")).toBeInTheDocument()
        expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument()
        expect(screen.getByRole("button", { name: "Return home" })).toBeInTheDocument()

        fireEvent.click(screen.getByRole("button", { name: "Try again" }))

        expect(screen.getByText("Completing sign in...")).toBeInTheDocument()
        expect(mocks.handleAuthCallback).toHaveBeenCalledTimes(2)
    })
})
