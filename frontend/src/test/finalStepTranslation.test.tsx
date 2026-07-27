import { MantineProvider } from "@mantine/core"
import { cleanup, render } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import Final from "~/generator/components/Final"
import { getBasicTestCharacter } from "./testUtils"

const mocks = vi.hoisted(() => ({
    useAuth: vi.fn(),
    useAnalyticsConsent: vi.fn()
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

vi.mock("~/hooks/useAuth", () => ({
    useAuth: () => mocks.useAuth()
}))

vi.mock("~/hooks/useAnalyticsConsent", () => ({
    useAnalyticsConsent: () => mocks.useAnalyticsConsent()
}))

const renderFinal = () =>
    render(
        <MantineProvider>
            <Final
                character={getBasicTestCharacter()}
                setCharacter={vi.fn()}
                setSelectedStep={vi.fn()}
            />
        </MantineProvider>
    )

describe("Final step translation guard", () => {
    afterEach(cleanup)

    // Regression guard: the final step re-renders after mount (async auth-gated account card,
    // analytics-consent action card, download-error alert) and its Mantine chrome animates, so
    // browser page-translation (Chrome/Safari/Edge) must be kept off this subtree — otherwise the
    // translator swaps text nodes out from under React and the reconciler / Web Animations throw a
    // DOMException (InvalidStateError / insertBefore-removeChild NotFoundError) on /create#final.
    // Mirrors the mitigation added for the generator prompt in commit 876b86f.
    it("marks the final step subtree as non-translatable", () => {
        mocks.useAuth.mockReturnValue({
            isAuthenticated: false,
            signIn: vi.fn(),
            isLoading: false
        })
        mocks.useAnalyticsConsent.mockReturnValue(true)

        const { container } = renderFinal()

        const guarded = container.querySelector('[translate="no"]')
        expect(guarded).not.toBeNull()
        expect(guarded).toHaveClass("notranslate")
    })
})
