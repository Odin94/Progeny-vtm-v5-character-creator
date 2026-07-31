import { ActionIcon, Button, Group, Modal, Text } from "@mantine/core"
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react"
import { useEffect, useMemo, useState } from "react"
import ReactMarkdown from "react-markdown"
import ornamentalDivider from "~/assets/ornamental-divider.svg"
import { api, type RecentChange } from "~/utils/api"
import "./RecentChangesModal.css"

type RecentChangesModalProps = {
    opened: boolean
    onClose: () => void
    changes: RecentChange[]
    initialChangeId?: string
}

const formatPublishedDate = (publishedAt: string | null) => {
    if (!publishedAt) return "Draft"
    return new Date(publishedAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric"
    })
}

const splitMarkdownBlocks = (markdown: string) =>
    markdown
        .trim()
        .split(/\n\s*\n/)
        .map((block) => block.trim())
        .filter(Boolean)

const getTitleLetterSpacing = (title: string) => {
    if (title.length <= 10) return "0.32em"
    if (title.length <= 18) return "0.22em"
    if (title.length <= 30) return "0.14em"
    return "0.08em"
}

const RecentChangeImage = ({ change }: { change: RecentChange }) => {
    const [imageSrc, setImageSrc] = useState<string | null>(
        change.hasImage ? null : change.imageUrl
    )

    useEffect(() => {
        if (!change.hasImage) {
            setImageSrc(change.imageUrl)
            return
        }

        let objectUrl: string | null = null
        let cancelled = false
        void api
            .getRecentChangeImage(change.id)
            .then((image) => {
                if (cancelled) return
                objectUrl = URL.createObjectURL(image)
                setImageSrc(objectUrl)
            })
            .catch(() => {
                if (!cancelled) setImageSrc(null)
            })

        return () => {
            cancelled = true
            if (objectUrl) URL.revokeObjectURL(objectUrl)
        }
    }, [change.hasImage, change.id, change.imageUrl])

    return imageSrc ? <img className="recent-changes__image" src={imageSrc} alt="" /> : null
}

const RecentChangesModal = ({
    opened,
    onClose,
    changes,
    initialChangeId
}: RecentChangesModalProps) => {
    const initialIndex = Math.max(
        0,
        initialChangeId
            ? changes.findIndex((change) => change.id === initialChangeId)
            : changes.length - 1
    )
    const [currentIndex, setCurrentIndex] = useState(initialIndex)

    useEffect(() => {
        setCurrentIndex(initialIndex)
    }, [initialChangeId, initialIndex])

    const currentChange = changes[currentIndex]
    const canGoPrevious = currentIndex > 0
    const canGoNext = currentIndex < changes.length - 1
    const { introBlock, detailColumns } = useMemo(() => {
        if (!currentChange) return { introBlock: "", detailColumns: [] as string[][] }

        const [introBlock = "", ...detailBlocks] = splitMarkdownBlocks(currentChange.body)
        const columnCount = Math.min(3, detailBlocks.length)
        const detailColumns = Array.from({ length: columnCount }, () => [] as string[])

        detailBlocks.forEach((block, index) => detailColumns[index % columnCount].push(block))

        return { introBlock, detailColumns }
    }, [currentChange])

    return (
        <Modal
            opened={opened && !!currentChange}
            onClose={onClose}
            centered
            size="xl"
            zIndex={2500}
            withCloseButton={false}
            classNames={{ content: "recent-changes__modal", body: "recent-changes__modal-body" }}
        >
            {currentChange ? (
                <div className="recent-changes__sheet-shell">
                    <article className="recent-changes__sheet">
                        <header className="recent-changes__header">
                            <Text
                                className="recent-changes__title"
                                style={{
                                    letterSpacing: getTitleLetterSpacing(currentChange.title),
                                    textIndent: getTitleLetterSpacing(currentChange.title)
                                }}
                            >
                                {currentChange.title}
                            </Text>
                            <Text className="recent-changes__date">
                                {formatPublishedDate(currentChange.publishedAt)}
                            </Text>
                        </header>

                        <section
                            className={`recent-changes__intro ${currentChange.hasImage || currentChange.imageUrl ? "recent-changes__intro--with-image" : ""}`}
                        >
                            <div className="recent-changes__markdown recent-changes__intro-copy">
                                <ReactMarkdown>{introBlock}</ReactMarkdown>
                            </div>
                            {currentChange.hasImage || currentChange.imageUrl ? (
                                <RecentChangeImage change={currentChange} />
                            ) : null}
                        </section>

                        <div className="recent-changes__divider" aria-label="Progeny Update">
                            <img src={ornamentalDivider} alt="" />
                            <Text>Progeny Update</Text>
                            <img src={ornamentalDivider} alt="" />
                        </div>

                        {detailColumns.length ? (
                            <section
                                className="recent-changes__details"
                                style={{
                                    gridTemplateColumns: `repeat(${detailColumns.length}, minmax(0, 1fr))`
                                }}
                            >
                                {detailColumns.map((column, index) => (
                                    <div className="recent-changes__column" key={index}>
                                        {column.map((block, blockIndex) => (
                                            <div
                                                className="recent-changes__markdown"
                                                key={`${index}-${blockIndex}`}
                                            >
                                                <ReactMarkdown>{block}</ReactMarkdown>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </section>
                        ) : null}

                        <footer className="recent-changes__footer">
                            <Group gap="xs">
                                <ActionIcon
                                    variant="subtle"
                                    aria-label="Previous update"
                                    disabled={!canGoPrevious}
                                    onClick={() => setCurrentIndex((index) => index - 1)}
                                >
                                    <IconChevronLeft size={20} />
                                </ActionIcon>
                                <Text size="sm" c="dimmed">
                                    {currentIndex + 1} of {changes.length}
                                </Text>
                                <ActionIcon
                                    variant="subtle"
                                    aria-label="Next update"
                                    disabled={!canGoNext}
                                    onClick={() => setCurrentIndex((index) => index + 1)}
                                >
                                    <IconChevronRight size={20} />
                                </ActionIcon>
                            </Group>
                            <Button onClick={onClose}>Got it</Button>
                        </footer>
                    </article>
                </div>
            ) : null}
        </Modal>
    )
}

export default RecentChangesModal
