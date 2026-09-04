import { MantineProvider } from "@mantine/core"
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { ReactNode } from "react"

const mocks = vi.hoisted(() => ({
    captureException: vi.fn()
}))

vi.mock("posthog-js", () => ({
    default: {
        captureException: mocks.captureException
    }
}))

vi.mock("~/components/ErrorDetails", () => ({
    default: ({ error }: { error: Error }) => <div>There was an error: {error.message}</div>
}))

import ErrorBoundary from "~/components/ErrorBoundary"

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

const Boom = () => {
    throw new Error("route crashed")
}

const renderWithProviders = (children: ReactNode) =>
    render(<MantineProvider>{children}</MantineProvider>)

describe("ErrorBoundary", () => {
    afterEach(() => {
        cleanup()
        vi.clearAllMocks()
    })

    it("renders a fallback instead of a blank page when a child throws", () => {
        vi.spyOn(console, "error").mockImplementation(() => {})

        renderWithProviders(
            <ErrorBoundary>
                <Boom />
            </ErrorBoundary>
        )

        expect(screen.getByText("There was an error: route crashed")).toBeInTheDocument()
    })

    it("reports the crash with its component stack", () => {
        vi.spyOn(console, "error").mockImplementation(() => {})

        renderWithProviders(
            <ErrorBoundary>
                <Boom />
            </ErrorBoundary>
        )

        expect(mocks.captureException).toHaveBeenCalledTimes(1)
        const [reportedError, properties] = mocks.captureException.mock.calls[0]
        expect(reportedError).toBeInstanceOf(Error)
        expect(properties.error_boundary).toBe(true)
        expect(properties.react_component_stack).toEqual(expect.stringContaining("Boom"))
    })

    it("renders its children when nothing throws", () => {
        renderWithProviders(
            <ErrorBoundary>
                <div>all good</div>
            </ErrorBoundary>
        )

        expect(screen.getByText("all good")).toBeInTheDocument()
    })
})
