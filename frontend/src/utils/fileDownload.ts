import { showFileSavePrompt } from "~/components/FileSavePrompt"
import {
    createDownloadTracker,
    downloadErrorName,
    type DownloadFormat,
    type DownloadSource
} from "./downloadAnalytics"

// App tokens take precedence over Safari: Google's app includes Safari/ too.
export const isIosInAppBrowser = () => {
    const ua = navigator.userAgent
    const ios =
        /iPad|iPhone|iPod/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1)
    return (
        ios &&
        (/\b(GSA|FBAN|FBAV|FBIOS|Instagram|Line|Twitter|LinkedInApp|Snapchat|Pinterest|musical_ly|BytedanceWebview)[/\s:]/i.test(
            ua
        ) ||
            !/Safari\//i.test(ua))
    )
}

export type DownloadResult = {
    status: "download_requested" | "shared" | "cancelled" | "prompt_shown"
}
export type DownloadOptions = { filename: string; format: DownloadFormat; source: DownloadSource }

/** Resolves at a browser handoff or when a retryable prompt is offered, never at a confirmed disk save.
 * Keep synchronous producers synchronous so sharing can use the original click.
 * The producer also places serialization/template errors inside the tracked attempt.
 */
export const downloadFile = async (
    options: DownloadOptions,
    produce: () => Blob | Promise<Blob>
): Promise<DownloadResult> => {
    const iosInApp = isIosInAppBrowser()
    const track = createDownloadTracker(options.format, options.source, iosInApp)
    track("started", { stage: "prepare" })
    let stage: "prepare" | "download" | "prompt" = "prepare"
    try {
        const pending = produce()
        const blob = pending instanceof Blob ? pending : await pending
        const file = new File([blob], options.filename, { type: blob.type })
        // MIME values originate in application code, never in imported character data.
        track("prepared", { stage, mime_type: file.type, size_bytes: file.size })
        if (iosInApp) {
            let canShare = false
            try {
                canShare =
                    typeof navigator.share === "function" &&
                    navigator.canShare?.({ files: [file] }) === true
                track("capabilities_checked", {
                    stage: "capability",
                    file_share_supported: canShare
                })
            } catch (error) {
                track("failed", { stage: "capability", error_name: downloadErrorName(error) })
            }
            if (canShare && navigator.userActivation?.isActive === true) {
                try {
                    track("share_requested", { stage: "share", method: "share" })
                    await navigator.share({ files: [file] })
                    track("shared", { stage: "share", method: "share" })
                    return { status: "shared" }
                } catch (error) {
                    const errorName = downloadErrorName(error)
                    if (errorName === "AbortError") {
                        track("cancelled", {
                            stage: "share",
                            method: "share",
                            error_name: errorName
                        })
                        return { status: "cancelled" }
                    }
                    track("failed", { stage: "share", method: "share", error_name: errorName })
                    // Keep the file available for retry after a blocked native share.
                }
            }
            stage = "prompt"
            showFileSavePrompt(file, canShare, track)
            return { status: "prompt_shown" }
        }
        stage = "download"
        const url = URL.createObjectURL(file)
        try {
            const link = document.createElement("a")
            link.href = url
            link.download = options.filename
            link.click()
            track("download_requested", { stage, method: "anchor" })
            return { status: "download_requested" }
        } finally {
            setTimeout(() => URL.revokeObjectURL(url), 60_000)
        }
    } catch (error) {
        track("failed", { stage, error_name: downloadErrorName(error) })
        throw error
    }
}
