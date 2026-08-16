import { Suspense } from "react"
import { cleanup, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
    capture: vi.fn()
}))

vi.mock("posthog-js", () => ({
    default: {
        capture: mocks.capture
    }
}))

import ErrorBoundary from "~/components/ErrorBoundary"
import { lazyWithRetry } from "~/utils/lazyWithRetry"

const reloadMock = vi.fn()

beforeEach(() => {
    mocks.capture.mockClear()
    reloadMock.mockClear()
    sessionStorage.clear()
    Object.defineProperty(window, "location", {
        writable: true,
        value: { ...window.location, reload: reloadMock }
    })
})

afterEach(() => {
    cleanup()
})

const Loaded = () => <div>sheet loaded</div>

describe("lazyWithRetry", () => {
    it("retries once and renders after a transient failure", async () => {
        const factory = vi
            .fn()
            .mockRejectedValueOnce(new TypeError("Load failed"))
            .mockResolvedValueOnce({ default: Loaded })

        const Component = lazyWithRetry(factory, "test-chunk")

        render(
            <Suspense fallback={<div>loading</div>}>
                <Component />
            </Suspense>
        )

        expect(await screen.findByText("sheet loaded")).toBeInTheDocument()
        expect(factory).toHaveBeenCalledTimes(2)
        expect(reloadMock).not.toHaveBeenCalled()
        expect(mocks.capture).not.toHaveBeenCalled()
    })

    it("captures a named event and reloads once when both attempts fail", async () => {
        const factory = vi.fn().mockRejectedValue(new TypeError("Load failed"))

        const Component = lazyWithRetry(factory, "test-chunk")

        render(
            <ErrorBoundary fallback={<div>load error</div>}>
                <Suspense fallback={<div>loading</div>}>
                    <Component />
                </Suspense>
            </ErrorBoundary>
        )

        await waitFor(() => expect(reloadMock).toHaveBeenCalledTimes(1))
        expect(factory).toHaveBeenCalledTimes(2)
        expect(mocks.capture).toHaveBeenCalledWith("chunk-load-failed", {
            chunk: "test-chunk",
            error: "Load failed"
        })
        expect(sessionStorage.getItem("chunk-reload-test-chunk")).toBe("1")
    })
})
