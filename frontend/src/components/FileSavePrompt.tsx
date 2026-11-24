import { Button, Group, Modal, Stack } from "@mantine/core"
import { IconExternalLink, IconFile, IconFileTypePdf, IconShare } from "@tabler/icons-react"
import classes from "./AppModals.module.css"
import {
    dismissFileSavePrompt,
    dismissFileSavePrompts,
    useFileSavePrompts
} from "~/utils/fileSavePromptStore"
import { useRef, useState } from "react"
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
        <Stack gap="sm">
            <div className={classes.fileRow}>
                <span className={classes.fileIcon} aria-hidden="true">
                    {isPdf ? (
                        <IconFileTypePdf size={20} stroke={1.6} />
                    ) : (
                        <IconFile size={20} stroke={1.6} />
                    )}
                </span>
                <p className={classes.fileName}>{file.name}</p>
            </div>
            <p className={classes.lede}>
                {canShare
                    ? `Tap Save or share ${label}, then choose Save to Files.`
                    : "This app cannot share this file. Try opening it, or open Progeny in Safari and download again."}
            </p>
            <div className={classes.versionGrid}>
                {canShare && (
                    <Button leftSection={<IconShare size={16} />} loading={sharing} onClick={share}>
                        Save or share {label}
                    </Button>
                )}
                <Button
                    component="a"
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="default"
                    leftSection={<IconExternalLink size={16} />}
                    onClick={() =>
                        track("preview_requested", { stage: "preview", method: "preview" })
                    }
                >
                    Open {label}
                </Button>
            </div>
            {message && (
                <p className={classes.lede} role="status">
                    {message}
                </p>
            )}
            <p className={classes.note}>
                If saving does not work, open Progeny in Safari and download again.
            </p>
            {isPdf && (
                <p className={classes.note}>
                    PDF template kindly provided by Nerdbert (linktr.ee/nerdbert).
                </p>
            )}
            {!feedback && (
                <Group gap="xs">
                    <Button
                        variant="subtle"
                        color="gray"
                        size="compact-sm"
                        onClick={() => {
                            track("reported_saved", { stage: "feedback" })
                            setFeedback(true)
                        }}
                    >
                        I saved the file
                    </Button>
                    <Button
                        variant="subtle"
                        color="gray"
                        size="compact-sm"
                        onClick={() => {
                            track("reported_failed", { stage: "feedback" })
                            setFeedback(true)
                            setMessage(
                                "Thanks for reporting it. Open Progeny in Safari and download again. Your file remains available here to retry."
                            )
                        }}
                    >
                        Saving didn&apos;t work
                    </Button>
                </Group>
            )}
        </Stack>
    )
}

/** Own focus above recovery/conflict dialogs instead of placing controls outside their traps. */
export const FileSaveDialog = () => {
    const prompts = useFileSavePrompts()
    const returnFocusTarget = useRef<HTMLElement | null>(null)
    const close = () => {
        returnFocusTarget.current = prompts[0]?.trigger ?? null
        dismissFileSavePrompts()
    }
    const restoreFocus = () => {
        // Covered dialogs re-enable their own trap during dismissal. Return
        // focus after those effects and our closing transition have finished.
        if (returnFocusTarget.current?.isConnected)
            returnFocusTarget.current.focus({ preventScroll: true })
        returnFocusTarget.current = null
    }
    const single = prompts.length === 1 ? prompts[0] : undefined
    const title = single
        ? single.file.type === "application/pdf"
            ? "Your PDF is ready"
            : "Your file is ready"
        : "Your files are ready"
    return (
        <Modal
            opened={prompts.length > 0}
            onClose={close}
            returnFocus={false}
            onExitTransitionEnd={restoreFocus}
            title={title}
            size="md"
            zIndex={4000}
            closeOnClickOutside={false}
        >
            <Stack>
                {prompts.map((prompt, index) => (
                    <Stack key={prompt.id}>
                        {index > 0 && <hr className={classes.rule} />}
                        <FileSavePrompt
                            file={prompt.file}
                            url={prompt.url}
                            canShare={prompt.canShare}
                            track={prompt.track}
                        />
                        {prompts.length > 1 && (
                            <Button
                                variant="subtle"
                                color="gray"
                                onClick={() => dismissFileSavePrompt(prompt.id)}
                            >
                                Close this file
                            </Button>
                        )}
                    </Stack>
                ))}
            </Stack>
        </Modal>
    )
}
