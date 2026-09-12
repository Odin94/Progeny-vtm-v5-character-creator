import { MantineProvider } from "@mantine/core"
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { useState, type ReactNode } from "react"
import {
    createMemoryHistory,
    createRootRoute,
    createRoute,
    createRouter,
    Outlet,
    RouterProvider
} from "@tanstack/react-router"
import RouteOutlet from "~/components/RouteOutlet"

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
        vi.restoreAllMocks()
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

describe("RouteOutlet", () => {
    afterEach(() => {
        cleanup()
        vi.restoreAllMocks()
        vi.clearAllMocks()
    })

    it("preserves healthy parent state and recovers when navigating away from a crashed route", async () => {
        vi.spyOn(console, "error").mockImplementation(() => {})
        vi.spyOn(console, "warn").mockImplementation(() => {})
        vi.spyOn(window, "scrollTo").mockImplementation(() => {})
        function Layout() {
            const [count, setCount] = useState(0)
            return (
                <>
                    <button onClick={() => setCount(count + 1)}>Count: {count}</button>
                    <Outlet />
                </>
            )
        }
        const root = createRootRoute({ component: RouteOutlet })
        const layout = createRoute({ getParentRoute: () => root, path: "pages", component: Layout })
        const first = createRoute({
            getParentRoute: () => layout,
            path: "first",
            component: () => <div>First page</div>
        })
        const second = createRoute({
            getParentRoute: () => layout,
            path: "second",
            component: () => <div>Second page</div>
        })
        const broken = createRoute({ getParentRoute: () => root, path: "broken", component: Boom })
        const router = createRouter({
            routeTree: root.addChildren([layout.addChildren([first, second]), broken]),
            history: createMemoryHistory({ initialEntries: ["/pages/first"] })
        })
        renderWithProviders(<RouterProvider router={router} />)
        expect(await screen.findByText("First page")).toBeInTheDocument()
        fireEvent.click(screen.getByRole("button", { name: "Count: 0" }))
        await act(async () => {
            await router.navigate({ href: "/pages/second" })
        })
        expect(await screen.findByText("Second page")).toBeInTheDocument()
        expect(screen.getByRole("button", { name: "Count: 1" })).toBeInTheDocument()

        await act(async () => {
            await router.navigate({ href: "/broken" })
        })
        expect(await screen.findByText("There was an error: route crashed")).toBeInTheDocument()
        expect(mocks.captureException).toHaveBeenCalledOnce()
        expect(mocks.captureException.mock.calls[0][1].react_component_stack).toContain("Boom")
        await act(async () => {
            await router.navigate({ href: "/pages/first" })
        })
        expect(await screen.findByText("First page")).toBeInTheDocument()
        expect(screen.queryByText("There was an error: route crashed")).not.toBeInTheDocument()
    })
})
