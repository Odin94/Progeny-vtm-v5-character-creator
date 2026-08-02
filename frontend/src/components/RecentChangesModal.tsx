import { ActionIcon, Anchor, Button, Group, Modal, Text } from "@mantine/core"
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react"
import { useEffect, useMemo, useState } from "react"
import ReactMarkdown from "react-markdown"
import ornamentalDivider from "~/assets/ornamental-divider.svg"
import { CONTACT_LINKS } from "~/constants/contactLinks"
import { useRecentChangeViewedTracking } from "~/hooks/useRecentChangeViewedTracking"
import { api, type RecentChange } from "~/utils/api"
import { splitRecentChangeLayout } from "~/utils/recentChangeLayout"
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
    useRecentChangeViewedTracking({
        changeId: currentChange?.id,
        opened: opened && !!currentChange
    })
    const canGoPrevious = currentIndex > 0
    const canGoNext = currentIndex < changes.length - 1
    const { topSection, columns } = useMemo(
        () =>
            currentChange
                ? splitRecentChangeLayout(currentChange.body)
                : { topSection: "", columns: [] },
        [currentChange]
    )

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
                                <ReactMarkdown>{topSection}</ReactMarkdown>
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

                        {columns.length ? (
                            <section
                                className="recent-changes__details"
                                style={{
                                    gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`
                                }}
                            >
                                {columns.map((column, index) => (
                                    <div className="recent-changes__column" key={index}>
                                        <div className="recent-changes__markdown">
                                            <ReactMarkdown>{column}</ReactMarkdown>
                                        </div>
                                    </div>
                                ))}
                            </section>
                        ) : null}

                        <footer className="recent-changes__footer">
                            <Anchor
                                className="recent-changes__support-link"
                                href={CONTACT_LINKS.kofi.href}
                                target="_blank"
                                rel="noreferrer"
                            >
                                Support me
                            </Anchor>
                            <Group className="recent-changes__navigation" gap="xs">
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
                            <Button className="recent-changes__close-button" onClick={onClose}>
                                Got it
                            </Button>
                        </footer>
                    </article>
                </div>
            ) : null}
        </Modal>
    )
}

export default RecentChangesModal
