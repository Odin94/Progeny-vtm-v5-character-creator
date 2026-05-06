import { Anchor, Loader, Stack, Text } from "@mantine/core"
import { useEffect, useState } from "react"
import { CONTACT_LINKS } from "~/constants/contactLinks"
import { getSourceMappedStack, type SourceMappedStack } from "~/utils/sourceMappedStack"

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

    const sourceFrame = mappedStack?.frames.find((frame) => frame.sourceExcerpt)

    return (
        <Stack gap="sm">
            <Text fz="xl" ta="center">
                There was an error: {error.message}
            </Text>
            <Text fz="lg" ta="center">
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
            </Text>
            {loading ? (
                <Stack gap={4} align="center">
                    <Loader size="sm" />
                    <Text size="sm" c="dimmed">
                        Resolving original TypeScript source...
                    </Text>
                </Stack>
            ) : null}
            {mappedStack?.frames.length ? (
                <Text
                    size="xs"
                    c="dimmed"
                    style={{
                        fontFamily: "monospace",
                        wordBreak: "break-word",
                        whiteSpace: "pre-wrap"
                    }}
                >
                    {mappedStack.frames.map(renderFrameLabel).join("\n")}
                </Text>
            ) : (
                <Text
                    size="xs"
                    c="dimmed"
                    style={{
                        fontFamily: "monospace",
                        wordBreak: "break-word",
                        whiteSpace: "pre-wrap"
                    }}
                >
                    {error.stack}
                </Text>
            )}
            {sourceFrame?.sourceExcerpt ? (
                <Text
                    size="xs"
                    c="dimmed"
                    style={{ fontFamily: "monospace", whiteSpace: "pre-wrap", overflowX: "auto" }}
                >
                    {sourceFrame.sourceExcerpt}
                </Text>
            ) : null}
        </Stack>
    )
}

export default ErrorDetails
