import { MantineProvider } from "@mantine/core"
import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import NameCharacterBeforeSwitchModal from "~/components/NameCharacterBeforeSwitchModal"

Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
        matches: false,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
    }))
})

afterEach(cleanup)

describe("NameCharacterBeforeSwitchModal", () => {
    it("prevents dismissal and edits during a save, then allows recovery after a failure", async () => {
        const user = userEvent.setup()
        const onClose = vi.fn()
        const onSave = vi.fn()
        const onDiscard = vi.fn()
        const modal = (isSaving: boolean) => (
            <MantineProvider>
                <NameCharacterBeforeSwitchModal
                    opened
                    pendingActionLabel="switch characters"
                    nameValue="Pearl"
                    setNameValue={vi.fn()}
                    onClose={onClose}
                    onSaveAndContinue={onSave}
                    onDiscardAndContinue={onDiscard}
                    isSaving={isSaving}
                />
            </MantineProvider>
        )
        const { baseElement, rerender } = render(modal(true))

        await user.click(baseElement.querySelector(".mantine-Overlay-root")!)
        await user.keyboard("{Escape}")
        await user.click(screen.getByRole("button", { name: "Save and continue" }))
        await user.click(screen.getByRole("button", { name: "Delete Current" }))
        expect(onClose).not.toHaveBeenCalled()
        expect(onSave).not.toHaveBeenCalled()
        expect(onDiscard).not.toHaveBeenCalled()
        expect(screen.getByRole("textbox", { name: "Character Name" })).toBeDisabled()

        rerender(modal(false))
        expect(screen.getByRole("textbox", { name: "Character Name" })).toBeEnabled()
        expect(screen.getByRole("textbox", { name: "Character Name" })).toHaveValue("Pearl")
        await user.click(screen.getByRole("button", { name: "Save and continue" }))
        expect(onSave).toHaveBeenCalledOnce()
        await user.keyboard("{Escape}")
        expect(onClose).toHaveBeenCalledOnce()
    })
})
