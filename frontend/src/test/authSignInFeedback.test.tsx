import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MantineProvider } from "@mantine/core"
import { act, cleanup, render, renderHook, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { ReactNode } from "react"

const mocks = vi.hoisted(() => ({
    handleAuthCallback: vi.fn(),
    getCurrentUser: vi.fn(),
    capture: vi.fn(),
    identify: vi.fn(),
    notificationsShow: vi.fn()
}))

vi.mock("~/utils/api", () => ({
    API_URL: "http://api.test",
    AUTH_UNAUTHORIZED_EVENT: "progeny:auth-unauthorized",
    api: {
        handleAuthCallback: mocks.handleAuthCallback,
        getCurrentUser: mocks.getCurrentUser,
        logout: vi.fn()
    }
}))

vi.mock("posthog-js", () => ({
    default: {
        capture: mocks.capture,
        identify: mocks.identify,
        reset: vi.fn(),
        get_explicit_consent_status: vi.fn(() => "pending"),
        opt_in_capturing: vi.fn(),
        opt_out_capturing: vi.fn()
    }
}))

vi.mock("@mantine/notifications", () => ({
    notifications: { show: mocks.notificationsShow }
}))

vi.mock("~/components/RenderProfiler", () => ({
    default: ({ children }: { children: ReactNode }) => children
}))

import { AuthCallback } from "~/routes/auth.callback"
import { AuthSignInConfirmation } from "~/components/AuthSignInConfirmation"
import { clearSignInPending, readAuthSignInSeed, useAuth } from "~/hooks/useAuth"
import type { CurrentUser } from "~/utils/api"

const testUser: CurrentUser = {
    id: "user-123",
    email: "ann@example.com",
    firstName: "Ann",
    isSuperadmin: false,
    nameTagEnabled: false,
    nameTagVisible: false,
    actorIsSuperadmin: false,
    impersonation: { active: false }
}

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

let replaceSpy: ReturnType<typeof vi.fn>
const originalLocation = window.location

const stubLocation = () => {
    replaceSpy = vi.fn()
    delete (window as { location?: Location }).location
    ;(window as unknown as { location: unknown }).location = {
        origin: "http://localhost",
        href: "http://localhost/auth/callback?code=test-code",
        pathname: "/auth/callback",
        search: "?code=test-code",
        hash: "",
        replace: replaceSpy,
        assign: vi.fn()
    }
}

const restoreLocation = () => {
    delete (window as { location?: Location }).location
    ;(window as unknown as { location: Location }).location = originalLocation
}

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

const wrapper = ({ children }: { children: ReactNode }) => {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } }
    })
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

describe("auth callback success feedback + telemetry", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        clearSignInPending()
        sessionStorage.clear()
        stubLocation()
    })

    afterEach(() => {
        cleanup()
        vi.useRealTimers()
        restoreLocation()
    })

    it("seeds the auth cache, confirms the sign-in and captures sign_in_completed", async () => {
        mocks.handleAuthCallback.mockResolvedValue({
            success: true,
            returnTo: "/sheet",
            user: testUser
        })

        renderCallback()

        await waitFor(() => expect(replaceSpy).toHaveBeenCalledWith("/sheet"))

        expect(readAuthSignInSeed()).toEqual(testUser)
        expect(sessionStorage.getItem("auth:signInConfirm")).toBe("1")
        expect(mocks.identify).toHaveBeenCalledWith("user-123", expect.any(Object))
        expect(mocks.capture).toHaveBeenCalledWith("sign_in_completed", { userId: "user-123" })
    })

    it("captures auth_callback_failure on the error branch", async () => {
        const error = Object.assign(new Error("boom"), { status: 500 })
        mocks.handleAuthCallback.mockRejectedValue(error)

        renderCallback()

        await waitFor(() => expect(screen.getByText("Sign-in didn't finish")).toBeInTheDocument())

        expect(mocks.capture).toHaveBeenCalledWith("auth_callback_failure", {
            reason: "error",
            status: 500,
            message: "boom"
        })
        expect(replaceSpy).not.toHaveBeenCalled()
    })

    it("captures a single auth_callback_failure with reason timeout", async () => {
        vi.useFakeTimers()
        mocks.handleAuthCallback.mockReturnValue(new Promise(() => undefined))

        renderCallback()

        await act(async () => {
            await vi.advanceTimersByTimeAsync(15_000)
        })

        const failureCalls = mocks.capture.mock.calls.filter(
            (call) => call[0] === "auth_callback_failure"
        )
        expect(failureCalls).toHaveLength(1)
        expect(failureCalls[0][1]).toMatchObject({ reason: "timeout" })
    })
})

describe("useAuth sign-in seed", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        sessionStorage.clear()
        window.history.replaceState(null, "", "/sheet")
    })

    afterEach(() => cleanup())

    it("renders authenticated without a loading flash when a seed is present", async () => {
        sessionStorage.setItem("auth:signInSeed", JSON.stringify(testUser))
        mocks.getCurrentUser.mockResolvedValue(testUser)

        const { result } = renderHook(() => useAuth(), { wrapper })

        // The seeded reload must not start from an unauthenticated / loading state,
        // which is exactly what made the topbar flash after sign-in.
        expect(result.current.isLoading).toBe(false)
        expect(result.current.isAuthenticated).toBe(true)
        expect(result.current.user?.id).toBe("user-123")
    })

    it("settles immediately when the local auth proxy has no backend", async () => {
        mocks.getCurrentUser.mockRejectedValue(Object.assign(new Error("nope"), { status: 502 }))

        const { result } = renderHook(() => useAuth(), { wrapper })

        await waitFor(() => expect(result.current.isLoading).toBe(false))

        expect(mocks.getCurrentUser).toHaveBeenCalledTimes(1)
        expect(mocks.capture).toHaveBeenCalledWith("auth_me_failure", {
            status: 502,
            message: "nope"
        })
    })
})

describe("useAuth sign-in pending state", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        clearSignInPending()
        sessionStorage.clear()
        window.history.replaceState(null, "", "/sheet")
        stubLocation()
        mocks.getCurrentUser.mockResolvedValue(null)
    })

    afterEach(() => {
        cleanup()
        restoreLocation()
    })

    it("flips isSigningIn and captures sign_in_started on the first click", () => {
        const { result } = renderHook(() => useAuth(), { wrapper })

        expect(result.current.isSigningIn).toBe(false)

        act(() => {
            result.current.signIn()
        })

        expect(result.current.isSigningIn).toBe(true)
        expect(mocks.capture).toHaveBeenCalledWith("sign_in_started")
    })

    it("ignores repeat clicks while the redirect is in flight", () => {
        const { result } = renderHook(() => useAuth(), { wrapper })

        act(() => {
            result.current.signIn()
            result.current.signIn()
            result.current.signIn()
        })

        const startedCalls = mocks.capture.mock.calls.filter((call) => call[0] === "sign_in_started")
        expect(startedCalls).toHaveLength(1)
    })

    it("shares the pending state across useAuth callers", () => {
        const first = renderHook(() => useAuth(), { wrapper })
        const second = renderHook(() => useAuth(), { wrapper })

        act(() => first.result.current.signIn())

        expect(second.result.current.isSigningIn).toBe(true)
    })

    it("clears pending state when a page is restored from BFCache", () => {
        const { result } = renderHook(() => useAuth(), { wrapper })
        act(() => result.current.signIn())

        const pageShow = new Event("pageshow")
        Object.defineProperty(pageShow, "persisted", { value: true })
        act(() => window.dispatchEvent(pageShow))

        expect(result.current.isSigningIn).toBe(false)
    })
})

describe("AuthSignInConfirmation", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        sessionStorage.clear()
    })

    afterEach(() => cleanup())

    it("shows a one-time toast and clears the confirmation flag", () => {
        sessionStorage.setItem("auth:signInSeed", JSON.stringify(testUser))
        sessionStorage.setItem("auth:signInConfirm", "1")

        const { unmount } = render(<AuthSignInConfirmation />)

        expect(mocks.notificationsShow).toHaveBeenCalledTimes(1)
        expect(mocks.notificationsShow).toHaveBeenCalledWith(
            expect.objectContaining({
                title: "Signed in",
                message: "You're signed in.",
                color: "green"
            })
        )
        expect(sessionStorage.getItem("auth:signInConfirm")).toBeNull()

        unmount()
        render(<AuthSignInConfirmation />)
        expect(mocks.notificationsShow).toHaveBeenCalledTimes(1)
    })
})
