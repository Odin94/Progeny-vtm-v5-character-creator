import { MantineProvider } from "@mantine/core"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
    DeleteIconButton,
    EmptyState,
    PageHeader,
    Panel,
    SectionHeader,
    useContextMenu
} from "~/components/ui"
import { progenyTheme } from "~/theme/theme"

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

const renderWithTheme = (node: React.ReactNode) =>
    render(
        <MantineProvider theme={progenyTheme} env="test">
            {node}
        </MantineProvider>
    )

afterEach(() => cleanup())

describe("shared UI primitives", () => {
    it("renders page and section headings with the right levels", () => {
        renderWithTheme(
            <>
                <PageHeader eyebrow="Homebrew" title="Library" description="Shared rules." />
                <SectionHeader title="Collections" order={3} />
            </>
        )

        expect(screen.getByRole("heading", { level: 1, name: "Library" })).toBeInTheDocument()
        expect(screen.getByRole("heading", { level: 3, name: "Collections" })).toBeInTheDocument()
        expect(screen.getByText("Shared rules.")).toBeInTheDocument()
    })

    it("exposes the delete label as the accessible name and fires onClick", () => {
        const onClick = vi.fn()
        renderWithTheme(<DeleteIconButton label="Delete Lucius" onClick={onClick} />)

        fireEvent.click(screen.getByRole("button", { name: "Delete Lucius" }))
        expect(onClick).toHaveBeenCalledTimes(1)
    })

    it("disables an icon button that has a disabled reason", () => {
        const onClick = vi.fn()
        renderWithTheme(
            <DeleteIconButton
                label="Delete Lucius"
                disabledReason="Shared characters are read-only"
                onClick={onClick}
            />
        )

        const button = screen.getByRole("button", { name: "Delete Lucius" })
        expect(button).toBeDisabled()
        fireEvent.click(button)
        expect(onClick).not.toHaveBeenCalled()
    })

    it("renders empty state actions", () => {
        renderWithTheme(
            <EmptyState title="No coteries yet" actions={<button type="button">Create</button>} />
        )

        expect(screen.getByText("No coteries yet")).toBeInTheDocument()
        expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument()
    })

    it("opens a context menu on right-click and runs the chosen action", async () => {
        const onOpen = vi.fn()
        const Row = () => {
            const contextMenu = useContextMenu()
            return (
                <>
                    <Panel
                        data-testid="row"
                        onContextMenu={(event) =>
                            contextMenu.open(event, [
                                { key: "open", label: "Open sheet", onClick: onOpen },
                                { type: "divider", key: "divider" },
                                { key: "delete", label: "Delete…", color: "red", onClick: vi.fn() }
                            ])
                        }
                    >
                        Lucius
                    </Panel>
                    {contextMenu.menu}
                </>
            )
        }

        renderWithTheme(<Row />)
        fireEvent.contextMenu(screen.getByTestId("row"), { clientX: 40, clientY: 40 })

        fireEvent.click(await screen.findByRole("menuitem", { name: "Open sheet" }))
        expect(onOpen).toHaveBeenCalledTimes(1)
    })
})
