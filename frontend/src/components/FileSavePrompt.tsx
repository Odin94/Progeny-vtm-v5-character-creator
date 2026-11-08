import { Button, Group, Stack, Text } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { useState } from "react"
import { downloadErrorName, type DownloadTracker } from "~/utils/downloadAnalytics"

export const FileSavePrompt = ({
    file,
    url,
    canShare,
    track
}: {
    file: File
    url: string
    canShare: boolean
    track: DownloadTracker
}) => {
    const [sharing, setSharing] = useState(false)
    const [message, setMessage] = useState("")
    const [feedback, setFeedback] = useState(false)
    const isPdf = file.type === "application/pdf"
    const label = isPdf ? "PDF" : "file"
    const share = async () => {
        setSharing(true)
        try {
            track("share_requested", { stage: "share", method: "share" })
            // No await before the native call: this tap supplies fresh activation.
            await navigator.share({ files: [file] })
            track("shared", { stage: "share", method: "share" })
            setMessage(
                `${isPdf ? "PDF" : "File"} shared. You can share it again or close this message.`
            )
        } catch (error) {
            const name = downloadErrorName(error)
            if (name === "AbortError") {
                track("cancelled", { stage: "share", method: "share", error_name: name })
                setMessage(`Sharing cancelled. Tap Save or share ${label} to try again.`)
            } else {
                track("failed", { stage: "share", method: "share", error_name: name })
                setMessage(
                    "This browser blocked sharing. Try opening the file, or open Progeny in Safari and download again."
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
                    ? `Tap Save or share ${label}, then choose Save to Files.`
                    : "This app cannot share this file. Try opening it, or open Progeny in Safari and download again."}
            </Text>
            <Group gap="xs">
                {canShare && (
                    <Button size="xs" loading={sharing} onClick={share}>
                        Save or share {label}
                    </Button>
                )}
                <Button
                    component="a"
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="xs"
                    variant="light"
                    onClick={() =>
                        track("preview_requested", { stage: "preview", method: "preview" })
                    }
                >
                    Open {label}
                </Button>
            </Group>
            {message && (
                <Text size="sm" role="status">
                    {message}
                </Text>
            )}
            <Text size="xs">
                If saving does not work, open Progeny in Safari and download again.
            </Text>
            {isPdf && (
                <Text size="xs" c="dimmed">
                    PDF template kindly provided by Nerdbert (linktr.ee/nerdbert).
                </Text>
            )}
            {!feedback && (
                <Group gap="xs">
                    <Button
                        variant="subtle"
                        size="compact-xs"
                        onClick={() => {
                            track("reported_saved", { stage: "feedback" })
                            setFeedback(true)
                        }}
                    >
                        I saved the file
                    </Button>
                    <Button
                        variant="subtle"
                        size="compact-xs"
                        onClick={() => {
                            track("reported_failed", { stage: "feedback" })
                            setFeedback(true)
                            setMessage(
                                "Thanks for reporting it. Open Progeny in Safari and download again. Your file remains available here to retry."
                            )
                        }}
                    >
                        Saving didn't work
                    </Button>
                </Group>
            )}
        </Stack>
    )
}

export const showFileSavePrompt = (file: File, canShare: boolean, track: DownloadTracker) => {
    const url = URL.createObjectURL(file)
    try {
        notifications.show({
            title: file.type === "application/pdf" ? "Your PDF is ready" : "Your file is ready",
            message: <FileSavePrompt file={file} url={url} canShare={canShare} track={track} />,
            autoClose: false,
            withCloseButton: true,
            color: "grape",
            onClose: () => {
                track("dismissed", { stage: "prompt", method: "prompt" })
                setTimeout(() => URL.revokeObjectURL(url), 60_000)
            }
        })
        track("prompt_shown", { stage: "prompt", method: "prompt", file_share_supported: canShare })
    } catch (error) {
        URL.revokeObjectURL(url)
        throw error
    }
}
