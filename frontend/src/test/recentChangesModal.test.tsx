import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MantineProvider } from "@mantine/core"
import posthog from "posthog-js"
import { describe, expect, it, vi } from "vitest"
import RecentChangesModal from "~/components/RecentChangesModal"

vi.mock("posthog-js", () => ({
    default: { capture: vi.fn() }
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

describe("RecentChangesModal", () => {
    it("tracks optional announcement link clicks with the update title", async () => {
        const user = userEvent.setup()
        render(
            <MantineProvider>
                <RecentChangesModal
                    opened
                    onClose={vi.fn()}
                    changes={[
                        {
                            id: "homebrew-update",
                            title: "Homebrew Collections",
                            body: "Create a collection.",
                            linkText: "Explore homebrew",
                            linkUrl: "https://progeny.example/homebrew",
                            imageUrl: null,
                            hasImage: false,
                            status: "published",
                            publishedAt: "2026-08-02T00:00:00.000Z",
                            createdAt: "2026-08-02T00:00:00.000Z",
                            updatedAt: "2026-08-02T00:00:00.000Z"
                        }
                    ]}
                />
            </MantineProvider>
        )

        await user.click(screen.getByRole("link", { name: "Explore homebrew" }))

        expect(posthog.capture).toHaveBeenCalledWith("recent_change_link_clicked", {
            recent_change_title: "Homebrew Collections"
        })
    })
})
