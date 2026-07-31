import { ActionIcon, Button, Group, Modal, Stack, Text } from "@mantine/core"
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react"
import { useEffect, useState } from "react"
import ReactMarkdown from "react-markdown"
import type { RecentChange } from "~/utils/api"
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

    return (
        <Modal
            opened={opened && !!currentChange}
            onClose={onClose}
            title="Progeny Update 🩸"
            centered
            size="lg"
            zIndex={2500}
        >
            {currentChange ? (
                <Stack gap="md">
                    <div>
                        <Text fw={700} size="xl">
                            {currentChange.title}
                        </Text>
                        <Text c="dimmed" size="sm">
                            {formatPublishedDate(currentChange.publishedAt)}
                        </Text>
                    </div>
                    <div className="recent-changes__body">
                        <ReactMarkdown>{currentChange.body}</ReactMarkdown>
                    </div>
                    <Group justify="space-between" align="center">
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
                    </Group>
                </Stack>
            ) : null}
        </Modal>
    )
}

export default RecentChangesModal
