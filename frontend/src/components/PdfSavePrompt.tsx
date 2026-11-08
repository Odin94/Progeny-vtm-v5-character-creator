import { Button, Group, Stack, Text } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { useState } from "react"
import { trackPdfExport } from "~/utils/analytics"

// iPadOS can identify itself as a Mac. App tokens must take precedence over
// Safari: the Google app includes Safari/ in its user agent too.
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

const supportsFileSharing = (file: File) => {
    try {
        return (
            typeof navigator.share === "function" &&
            navigator.canShare?.({ files: [file] }) === true
        )
    } catch {
        return false
    }
}

export const PdfSavePrompt = ({ file, url }: { file: File; url: string }) => {
    const [sharing, setSharing] = useState(false)
    const [message, setMessage] = useState("")
    const canShare = supportsFileSharing(file)

    const share = async () => {
        setSharing(true)
        try {
            // Call before any await: PDF creation and lazy loading have already
            // finished, and this button supplies a fresh user activation.
            await navigator.share({ files: [file] })
            trackPdfExport("shared")
            setMessage("PDF shared. You can share it again or close this message.")
        } catch (error) {
            if (
                typeof error === "object" &&
                error !== null &&
                "name" in error &&
                error.name === "AbortError"
            ) {
                trackPdfExport("cancelled")
                setMessage("Sharing cancelled. Tap Save or share PDF to try again.")
            } else {
                trackPdfExport("failed")
                setMessage(
                    "This browser blocked sharing. Try Open PDF, or open Progeny in Safari and download again."
                )
            }
        } finally {
            setSharing(false)
        }
    }

    return (
        <Stack gap="xs">
            <Text size="sm">{file.name}</Text>
            <Text size="sm">
                {canShare
                    ? "Tap Save or share PDF, then choose Save to Files."
                    : "Open the PDF and use the viewer’s share button to save it."}{" "}
                If this app cannot save the PDF, open Progeny in Safari and download again.
            </Text>
            <Group gap="xs">
                {canShare && (
                    <Button size="xs" loading={sharing} onClick={share}>
                        Save or share PDF
                    </Button>
                )}
                <Button
                    component="a"
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="xs"
                    variant="light"
                    onClick={() => trackPdfExport("preview_requested")}
                >
                    Open PDF
                </Button>
            </Group>
            {message && (
                <Text size="sm" role="status">
                    {message}
                </Text>
            )}
            <Text size="xs" c="dimmed">
                PDF template kindly provided by Nerdbert (linktr.ee/nerdbert).
            </Text>
        </Stack>
    )
}

export const showIosPdfSavePrompt = (file: File) => {
    const url = URL.createObjectURL(file)
    try {
        notifications.show({
            title: "Your PDF is ready",
            message: <PdfSavePrompt file={file} url={url} />,
            autoClose: false,
            withCloseButton: true,
            color: "grape",
            // Keep the source document alive while a new tab consumes the Blob.
            onClose: () => {
                setTimeout(() => URL.revokeObjectURL(url), 60_000)
            }
        })
        trackPdfExport("ready")
    } catch (error) {
        URL.revokeObjectURL(url)
        throw error
    }
}
