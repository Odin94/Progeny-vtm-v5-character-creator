import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import posthog from "posthog-js"
import { showFileSavePrompt } from "~/utils/fileSavePromptStore"
import { downloadFile } from "~/utils/fileDownload"
import type { DownloadFormat } from "~/utils/downloadAnalytics"

vi.mock("posthog-js", () => ({ default: { capture: vi.fn() } }))
vi.mock("~/utils/fileSavePromptStore", () => ({ showFileSavePrompt: vi.fn() }))
const googleApp = "iPad GSA/444.2 Safari/604.1"
const share = vi.fn()
const canShare = vi.fn()
const active = { isActive: true }
const options = {
    filename: "secret-character-name.json",
    format: "progeny-json" as const,
    source: "generator" as const
}
const outcomes = () => vi.mocked(posthog.capture).mock.calls.map(([, props]) => props?.outcome)
const json = () => new Blob(['{"notes":"secret character contents"}'], { type: "application/json" })

beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    active.isActive = true
    share.mockReset().mockResolvedValue(undefined)
    canShare.mockReset().mockReturnValue(true)
    vi.stubGlobal("navigator", { userAgent: "Chrome", share, canShare, userActivation: active })
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {})
})
afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    vi.useRealTimers()
})

describe("shared download helper", () => {
    it.each<DownloadFormat>([
        "pdf",
        "progeny-json",
        "foundry-json",
        "inconnu-json",
        "inconnu-commands",
        "recovery-json",
        "broken-save-json"
    ])("retains regular browser downloads for %s", async (format) => {
        const result = await downloadFile({ ...options, format }, json)
        expect(result.status).toBe("download_requested")
        expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledOnce()
        expect(share).not.toHaveBeenCalled()
        expect(showFileSavePrompt).not.toHaveBeenCalled()
        expect(outcomes()).toEqual(["started", "prepared", "download_requested"])
        const anchor = vi.mocked(HTMLAnchorElement.prototype.click).mock
            .contexts[0] as HTMLAnchorElement
        expect(anchor.download).toBe(options.filename)
        const file = vi.mocked(URL.createObjectURL).mock.lastCall![0] as File
        expect(file.type).toBe("application/json")
        expect(file.name).toBe(options.filename)
    })
    it("shares synchronous iOS exports during the original click, without an extra prompt", async () => {
        Object.assign(navigator, { userAgent: googleApp })
        const pending = downloadFile(options, json)
        expect(share).toHaveBeenCalledOnce()
        expect((await pending).status).toBe("shared")
        expect(showFileSavePrompt).not.toHaveBeenCalled()
        expect(HTMLAnchorElement.prototype.click).not.toHaveBeenCalled()
        expect(outcomes()).toContain("share_requested")
    })
    it("offers a persistent prompt when asynchronous preparation exhausts activation", async () => {
        Object.assign(navigator, { userAgent: googleApp })
        const result = await downloadFile(options, async () => {
            await Promise.resolve()
            active.isActive = false
            return json()
        })
        expect(result.status).toBe("prompt_shown")
        expect(share).not.toHaveBeenCalled()
        expect(showFileSavePrompt).toHaveBeenCalledWith(
            expect.any(File),
            true,
            expect.any(Function)
        )
        expect(outcomes()).toContain("prepared")
        expect(showFileSavePrompt).toHaveBeenCalledOnce()
    })
    it("does not fall back or claim delivery after a cancelled native share", async () => {
        Object.assign(navigator, { userAgent: googleApp })
        share.mockRejectedValue(new DOMException("private message", "AbortError"))
        expect((await downloadFile(options, json)).status).toBe("cancelled")
        expect(showFileSavePrompt).not.toHaveBeenCalled()
        expect(outcomes()).not.toContain("shared")
        expect(outcomes()).not.toContain("failed")
    })
    it("keeps a retryable prompt after sharing is blocked", async () => {
        Object.assign(navigator, { userAgent: googleApp })
        share.mockRejectedValue(new DOMException("private message", "NotAllowedError"))
        expect((await downloadFile(options, json)).status).toBe("prompt_shown")
        expect(outcomes()).toContain("failed")
        expect(showFileSavePrompt).toHaveBeenCalledOnce()
        expect(HTMLAnchorElement.prototype.click).not.toHaveBeenCalled()
    })
    it.each(["missing", "unsupported", "throws"])(
        "handles %s file sharing without losing the file",
        async (mode) => {
            Object.assign(navigator, { userAgent: googleApp })
            if (mode === "missing") Reflect.deleteProperty(navigator, "share")
            if (mode === "unsupported") canShare.mockReturnValue(false)
            if (mode === "throws")
                canShare.mockImplementation(() => {
                    throw new TypeError("private text")
                })
            expect((await downloadFile(options, json)).status).toBe("prompt_shown")
            const [file, supported] = vi.mocked(showFileSavePrompt).mock.lastCall!
            expect(supported).toBe(false)
            expect(file.size).toBeGreaterThan(0)
        }
    )
    it("tracks delivery failures and releases the object URL even when clicking throws", async () => {
        vi.mocked(HTMLAnchorElement.prototype.click).mockImplementation(() => {
            throw new DOMException("private text", "SecurityError")
        })
        await expect(downloadFile(options, json)).rejects.toThrow()
        expect(posthog.capture).toHaveBeenLastCalledWith(
            "file_download",
            expect.objectContaining({ stage: "download", error_name: "SecurityError" })
        )
        vi.advanceTimersByTime(60_000)
        expect(URL.revokeObjectURL).toHaveBeenCalled()
    })
    it("correlates safe metadata across stages and never records file content or names", async () => {
        await downloadFile(options, json)
        const calls = vi.mocked(posthog.capture).mock.calls
        const ids = calls.map(([, props]) => props?.attempt_id)
        expect(new Set(ids).size).toBe(1)
        expect(calls.at(-1)?.[1]).toMatchObject({
            format: "progeny-json",
            source: "generator",
            method: "anchor",
            mime_type: "application/json",
            size_bytes: json().size
        })
        expect(JSON.stringify(calls)).not.toContain("secret")
        await downloadFile(options, json)
        expect(vi.mocked(posthog.capture).mock.lastCall![1]?.attempt_id).not.toBe(ids[0])
    })
    it("continues downloading when the analytics SDK throws", async () => {
        vi.mocked(posthog.capture).mockImplementationOnce(() => {
            throw new Error("SDK failed")
        })
        expect((await downloadFile(options, json)).status).toBe("download_requested")
    })
    it("does not require crypto.randomUUID for downloading", async () => {
        vi.spyOn(crypto, "randomUUID").mockImplementation(() => {
            throw new Error("unavailable")
        })
        expect((await downloadFile(options, json)).status).toBe("download_requested")
    })
})
