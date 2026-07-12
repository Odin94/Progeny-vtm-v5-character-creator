import { MantineProvider } from "@mantine/core"
import { cleanup, render } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { GeneratorPhasePrompt } from "~/generator/components/sharedGeneratorUi"

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

afterEach(cleanup)

const renderPrompt = () =>
    render(
        <MantineProvider>
            <GeneratorPhasePrompt
                lines={[
                    {
                        key: "strongest",
                        prompt: "Pick your",
                        bold: "strongest",
                        suffix: "attribute",
                        level: 4,
                        done: false
                    },
                    {
                        key: "weakest",
                        prompt: "Pick your",
                        bold: "weakest",
                        suffix: "attribute",
                        level: 1,
                        done: false
                    }
                ]}
                activeKey="strongest"
                phoneScreen={false}
                footerText="Remaining attributes will be lvl 2"
            />
        </MantineProvider>
    )

describe("GeneratorPhasePrompt", () => {
    // Regression guard: the prompt cascade re-renders its text on every pick, so browser
    // page-translation (Chrome/Safari/Edge) must be kept off this subtree — otherwise the
    // translator mutates text nodes out from under React and the reconciler throws a
    // DOMException (insertBefore/removeChild NotFoundError) on /create#attributes.
    it("marks the animated cascade as non-translatable", () => {
        const { container } = renderPrompt()

        const guarded = container.querySelector('[translate="no"]')
        expect(guarded).not.toBeNull()
        expect(guarded).toHaveClass("notranslate")
    })
})
