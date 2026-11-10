import { MantineProvider } from "@mantine/core"
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { FileSavePrompt, FileSaveDialog } from "~/components/FileSavePrompt"
import { isIosInAppBrowser } from "~/utils/fileDownload"
import { showFileSavePrompt, dismissFileSavePrompts } from "~/utils/fileSavePromptStore"
import userEvent from "@testing-library/user-event"
import ConfirmActionModal from "~/components/ConfirmActionModal"
const trackDownload = vi.fn()

const file = new File(["%PDF-1.7"], "progeny_Test.pdf", { type: "application/pdf" })
const share = vi.fn()
const canShare = vi.fn()
const show = () =>
    render(
        <MantineProvider>
            <FileSavePrompt
                file={file}
                url="blob:test-pdf"
                canShare={canShare()}
                track={trackDownload}
            />
        </MantineProvider>
    )
beforeEach(() => {
    vi.stubGlobal("matchMedia", (query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
    }))
    vi.clearAllMocks()
    share.mockReset().mockResolvedValue(undefined)
    canShare.mockReset().mockReturnValue(true)
    vi.stubGlobal("navigator", { share, canShare, userAgent: "", maxTouchPoints: 0 })
})
afterEach(() => {
    cleanup()
    dismissFileSavePrompts()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    vi.useRealTimers()
})
describe("iOS browser detection", () => {
    it.each([
        ["iPad GSA/444.2 Safari/604.1", 0, true],
        ["iPhone [FBAN/FBIOS;FBAV/1.0] Safari/604.1", 0, true],
        ["Macintosh GSA/444.2 Safari/604.1", 5, true],
        ["iPhone AppleWebKit/605.1 Mobile/15E148", 0, true],
        ["iPhone Version/18.7 Mobile/15E148 Safari/604.1", 0, false],
        ["iPhone CriOS/155.0 Mobile/15E148 Safari/604.1", 0, false],
        ["iPhone FxiOS/157.1 Mobile/15E148 Safari/604.1", 0, false],
        ["Macintosh Version/18.7 Safari/604.1", 5, false],
        ["Macintosh Version/18.7 Safari/604.1", 0, false],
        ["Android GSA/444.2 Mobile Safari/604.1", 5, false]
    ])("classifies %s with %s touch points", (userAgent, maxTouchPoints, expected) => {
        Object.assign(navigator, { userAgent, maxTouchPoints })
        expect(isIosInAppBrowser()).toBe(expected)
    })
})
describe("PDF save prompt", () => {
    it("shares the prepared file synchronously from a fresh tap, even long after creation", async () => {
        vi.useFakeTimers()
        show()
        vi.advanceTimersByTime(120_000)
        expect(share).not.toHaveBeenCalled()
        fireEvent.click(screen.getByRole("button", { name: "Save or share PDF" }))
        expect(share).toHaveBeenCalledWith({ files: [file] })
        await act(async () => {})
        expect(trackDownload).toHaveBeenCalledWith("shared", expect.any(Object))
    })
    it("leaves cancellation retryable without reporting a save", async () => {
        share.mockRejectedValueOnce(new DOMException("cancelled", "AbortError"))
        show()
        fireEvent.click(screen.getByRole("button", { name: "Save or share PDF" }))
        expect(await screen.findByRole("status")).toHaveTextContent("Sharing cancelled")
        expect(trackDownload).toHaveBeenCalledWith("cancelled", expect.any(Object))
        expect(trackDownload).not.toHaveBeenCalledWith("shared", expect.any(Object))
        fireEvent.click(screen.getByRole("button", { name: "Save or share PDF" }))
        expect(await screen.findByRole("status")).toHaveTextContent("PDF shared")
    })
    it("shows recovery instructions on share failure without automatic navigation", async () => {
        share.mockRejectedValue(new DOMException("blocked", "NotAllowedError"))
        show()
        fireEvent.click(screen.getByRole("button", { name: "Save or share PDF" }))
        expect(await screen.findByRole("status")).toHaveTextContent("This browser blocked sharing")
        expect(trackDownload).toHaveBeenCalledWith("failed", expect.any(Object))
        expect(trackDownload).not.toHaveBeenCalledWith("shared", expect.any(Object))
    })
    it("offers an explicit preview when file sharing is unavailable", () => {
        canShare.mockReturnValue(false)
        show()
        expect(screen.queryByRole("button", { name: "Save or share PDF" })).toBeNull()
        const preview = screen.getByRole("link", { name: "Open PDF" })
        expect(preview).toHaveAttribute("href", "blob:test-pdf")
        expect(preview).toHaveAttribute("target", "_blank")
        fireEvent.click(preview)
        expect(trackDownload).toHaveBeenCalledWith("preview_requested", expect.any(Object))
    })
    it("records explicit user feedback separately from browser delivery", () => {
        show()
        fireEvent.click(screen.getByRole("button", { name: "Saving didn't work" }))
        expect(trackDownload).toHaveBeenCalledWith("reported_failed", { stage: "feedback" })
        expect(screen.getByRole("status")).toHaveTextContent("Open Progeny in Safari")
        expect(screen.queryByRole("button", { name: "Saving didn't work" })).toBeNull()
    })
    it("labels JSON as a file and records self-reported saves", () => {
        render(
            <MantineProvider>
                <FileSavePrompt
                    file={new File(["{}"], "backup.json", { type: "application/json" })}
                    url="blob:json"
                    canShare={true}
                    track={trackDownload}
                />
            </MantineProvider>
        )
        expect(screen.getByRole("button", { name: "Save or share file" })).toBeVisible()
        fireEvent.click(screen.getByRole("button", { name: "I saved the file" }))
        expect(trackDownload).toHaveBeenCalledWith("reported_saved", { stage: "feedback" })
    })
    it("gives the saving dialog focus above a confirmation modal and restores it on Escape", async () => {
        const user = userEvent.setup()
        const onClose = vi.fn()
        render(
            <MantineProvider>
                <ConfirmActionModal
                    opened
                    onClose={onClose}
                    onConfirm={() => {}}
                    title="Review backup"
                    body={
                        <button onClick={() => showFileSavePrompt(file, true, trackDownload)}>
                            Prepare backup
                        </button>
                    }
                    confirmLabel="Continue"
                />
                <FileSaveDialog />
            </MantineProvider>
        )
        const backup = screen.getByRole("button", { name: "Prepare backup" })
        await user.click(backup)
        const dialog = await screen.findByRole("dialog", { name: "Your PDF is ready" })
        await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true))
        for (let i = 0; i < 8; i++) {
            await user.tab()
            expect(dialog.contains(document.activeElement)).toBe(true)
        }
        await user.keyboard("{Escape}")
        await waitFor(() => expect(backup).toHaveFocus())
        expect(onClose).not.toHaveBeenCalled()
    })
    it("retains both pending backups until each is dismissed", () => {
        vi.useFakeTimers()
        const revoke = vi.fn()
        vi.stubGlobal("URL", {
            createObjectURL: vi
                .fn()
                .mockReturnValueOnce("blob:first")
                .mockReturnValueOnce("blob:second"),
            revokeObjectURL: revoke
        })
        render(
            <MantineProvider>
                <FileSaveDialog />
            </MantineProvider>
        )
        act(() => {
            showFileSavePrompt(new File(["first"], "first.json"), false, trackDownload)
            showFileSavePrompt(new File(["second"], "second.json"), false, trackDownload)
        })
        act(() => vi.advanceTimersByTime(500))
        expect(screen.getByText("first.json")).toBeVisible()
        expect(screen.getByText("second.json")).toBeVisible()
        fireEvent.click(screen.getAllByRole("button", { name: "Close this file" })[0])
        expect(screen.queryByText("first.json")).toBeNull()
        expect(screen.getByText("second.json")).toBeVisible()
        expect(revoke).not.toHaveBeenCalled()
        act(() => vi.advanceTimersByTime(60_000))
        expect(revoke).toHaveBeenCalledExactlyOnceWith("blob:first")
    })
    it("keeps the PDF available until dismissal and releases its URL afterwards", () => {
        vi.useFakeTimers()
        const revoke = vi.fn()
        vi.stubGlobal("URL", {
            createObjectURL: vi.fn().mockReturnValue("blob:test-pdf"),
            revokeObjectURL: revoke
        })
        render(
            <MantineProvider>
                <FileSaveDialog />
            </MantineProvider>
        )
        act(() => showFileSavePrompt(file, true, trackDownload))
        expect(trackDownload).toHaveBeenCalledWith("prompt_shown", expect.any(Object))
        act(() => vi.advanceTimersByTime(120_000))
        expect(revoke).not.toHaveBeenCalled()
        act(() => dismissFileSavePrompts())
        vi.advanceTimersByTime(60_000)
        expect(revoke).toHaveBeenCalledWith("blob:test-pdf")
    })
})
