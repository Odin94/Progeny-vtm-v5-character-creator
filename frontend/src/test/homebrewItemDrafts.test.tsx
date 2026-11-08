import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { MantineProvider } from "@mantine/core"
import HomebrewItemEditor from "~/components/HomebrewItemEditor"
import { createEmptyHomebrewItem, homebrewItemKinds, type HomebrewItemKind } from "~/data/Homebrew"
vi.stubGlobal(
    "ResizeObserver",
    class {
        observe() {}
        unobserve() {}
        disconnect() {}
    }
)
Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn(() => ({
        matches: false,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
    }))
})
Object.defineProperty(window, "visualViewport", {
    configurable: true,
    value: { addEventListener: vi.fn(), removeEventListener: vi.fn() }
})
Object.defineProperty(document, "fonts", {
    configurable: true,
    value: { addEventListener: vi.fn(), removeEventListener: vi.fn() }
})
const nameInput = (kind: HomebrewItemKind) =>
    kind === "power"
        ? screen.getByRole("textbox", { name: "Power name" })
        : screen.getAllByRole("textbox")[0]
const open = (kind: HomebrewItemKind, collection = "one", onSave = vi.fn()) =>
    render(
        <MantineProvider>
            <HomebrewItemEditor
                opened
                isNew
                item={createEmptyHomebrewItem(kind)}
                collectionItems={[]}
                draftStorageKey={`test:${collection}:${kind}`}
                onClose={vi.fn()}
                onSave={onSave}
            />
        </MantineProvider>
    )
beforeEach(() => localStorage.clear())
describe("new homebrew item drafts", () => {
    for (const kind of homebrewItemKinds)
        it(`lists required fixes for ${kind} while keeping field errors`, () => {
            open(kind)
            const label =
                kind === "power"
                    ? "Save power"
                    : kind === "loresheet"
                      ? "Save loresheet"
                      : kind === "predatorType"
                        ? "Save predator type"
                        : "Save item"
            fireEvent.click(screen.getByRole("button", { name: label }))
            expect(screen.getByRole("alert")).toHaveTextContent("Invalid values:")
            expect(screen.getByRole("alert")).toHaveTextContent("Name: Name is required.")
            expect(nameInput(kind)).toHaveAttribute("aria-invalid", "true")
        })

    for (const kind of homebrewItemKinds)
        it(`restores unsaved ${kind} fields after reopening or reloading`, () => {
            const view = open(kind)
            fireEvent.change(nameInput(kind), { target: { value: `Draft ${kind}` } })
            view.unmount()
            const other = open(kind, "different-collection")
            expect(nameInput(kind)).toHaveValue("")
            other.unmount()
            open(kind)
            expect(nameInput(kind)).toHaveValue(`Draft ${kind}`)
        })
    it("isolates types and clears the draft after a successful save", () => {
        const first = open("discipline")
        fireEvent.change(screen.getAllByRole("textbox")[0], { target: { value: "Nightcraft" } })
        first.unmount()
        const other = open("clan")
        expect(screen.getAllByRole("textbox")[0]).toHaveValue("")
        other.unmount()
        const save = vi.fn()
        open("discipline", "one", save)
        fireEvent.click(screen.getByRole("button", { name: "Save item" }))
        expect(save).toHaveBeenCalledWith(expect.objectContaining({ name: "Nightcraft" }))
        expect(localStorage.getItem("test:one:discipline")).toBeNull()
    })
})
