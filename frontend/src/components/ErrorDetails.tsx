import { Anchor, Button, Loader } from "@mantine/core"
import { IconCheck, IconCopy } from "@tabler/icons-react"
import { useEffect, useState } from "react"
import { CONTACT_LINKS } from "~/constants/contactLinks"
import { getSourceMappedStack, type SourceMappedStack } from "~/utils/sourceMappedStack"
import classes from "./AppModals.module.css"

type ErrorDetailsProps = {
    error: Error
    linkColor?: string
}

const renderFrameLabel = (frame: SourceMappedStack["frames"][number]) => {
    if (!frame.functionName) {
        return frame.originalLocation
    }

    return `${frame.functionName} (${frame.originalLocation})`
}

const ErrorDetails = ({ error, linkColor }: ErrorDetailsProps) => {
    const [mappedStack, setMappedStack] = useState<SourceMappedStack | null>(null)
    const [loading, setLoading] = useState(true)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        let cancelled = false

        setLoading(true)
        setMappedStack(null)

        getSourceMappedStack(error)
            .then((result) => {
                if (!cancelled) {
                    setMappedStack(result)
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false)
                }
            })

        return () => {
            cancelled = true
        }
    }, [error])

    useEffect(() => {
        if (!copied) return
        const timeout = window.setTimeout(() => setCopied(false), 1800)
        return () => window.clearTimeout(timeout)
    }, [copied])

    const sourceFrame = mappedStack?.frames.find((frame) => frame.sourceExcerpt)
    const stackText = mappedStack?.frames.length
        ? mappedStack.frames.map(renderFrameLabel).join("\n")
        : (error.stack ?? "")

    const copyDetails = async () => {
        const details = [
            `There was an error: ${error.message}`,
            stackText,
            sourceFrame?.sourceExcerpt ?? ""
        ]
            .filter(Boolean)
            .join("\n\n")
        try {
            await navigator.clipboard.writeText(details)
            setCopied(true)
        } catch {
            setCopied(false)
        }
    }

    return (
        <div className={classes.body}>
            <p className={`${classes.fileName} ${classes.centered}`}>
                There was an error: {error.message}
            </p>
            <p className={`${classes.lede} ${classes.centered}`}>
                Send a screenshot of this to me on{" "}
                <Anchor
                    href={CONTACT_LINKS.reddit.href}
                    target="_blank"
                    rel="noreferrer"
                    c={linkColor}
                >
                    {CONTACT_LINKS.reddit.label}
                </Anchor>{" "}
                or{" "}
                <Anchor
                    href={CONTACT_LINKS.bluesky.href}
                    target="_blank"
                    rel="noreferrer"
                    c={linkColor}
                >
                    {CONTACT_LINKS.bluesky.label}
                </Anchor>{" "}
                to help me fix it
            </p>
            {loading ? (
                <div className={`${classes.status} ${classes.centerRow}`}>
                    <Loader size="xs" />
                    <span className={classes.note}>Resolving original TypeScript source...</span>
                </div>
            ) : null}
            <pre className={classes.code}>{stackText}</pre>
            {sourceFrame?.sourceExcerpt ? (
                <pre className={classes.code}>{sourceFrame.sourceExcerpt}</pre>
            ) : null}
            <div className={classes.centerRow}>
                <Button
                    size="xs"
                    variant="default"
                    leftSection={copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                    onClick={() => void copyDetails()}
                >
                    {copied ? "Copied" : "Copy error details"}
                </Button>
            </div>
        </div>
    )
}

export default ErrorDetails
