import {
    ActionIcon,
    Badge,
    Box,
    Button,
    Center,
    Group,
    Loader,
    Modal,
    Stack,
    Text,
    Textarea,
    Tooltip
} from "@mantine/core"
import { IconNotebook, IconVersions } from "@tabler/icons-react"
import {
    CHARACTER_NOTE_MAX_BYTES,
    useCharacterNotesController
} from "~/character_sheet/hooks/useCharacterNotesController"
import { memo } from "react"
import { RAW_GOLD, RAW_RED, rgba } from "~/theme/colors"

type CharacterNotesControlProps = {
    characterId: string
    isAuthenticated: boolean
    authLoading: boolean
    characterAccessLoading: boolean
    hasCharacterAccess: boolean
    primaryColor: string
}

const NOTES_MODAL_Z_INDEX = 2200
const NOTES_HISTORY_MODAL_Z_INDEX = NOTES_MODAL_Z_INDEX + 1

const formatDateTime = (value: string) =>
    new Date(value).toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    })

const CharacterNotesControl = memo(
    ({
        characterId,
        isAuthenticated,
        authLoading,
        characterAccessLoading,
        hasCharacterAccess,
        primaryColor
    }: CharacterNotesControlProps) => {
        const {
            disabledReason,
            notesOpened,
            historyOpened,
            openNotes,
            closeNotes,
            openHistory,
            closeHistory,
            notesLoading,
            notesError,
            refetchNotes,
            saveStatus,
            showSavePill,
            displayedNotes,
            setDraftNotes,
            selectedHistoryVersion,
            clearSelectedHistoryVersion,
            isViewingHistory,
            noteBytes,
            versions,
            previewVersion,
            restoreVersion,
            restorePending
        } = useCharacterNotesController({
            characterId,
            isAuthenticated,
            authLoading,
            characterAccessLoading,
            hasCharacterAccess
        })

        return (
            <>
                <Tooltip label={disabledReason ?? "Private notes"} position="left" withArrow>
                    <span>
                        <ActionIcon
                            size="xl"
                            variant="light"
                            color={disabledReason ? "gray" : primaryColor}
                            radius="xl"
                            disabled={!!disabledReason}
                            aria-label={
                                disabledReason
                                    ? `Private notes unavailable: ${disabledReason}`
                                    : "Open private notes"
                            }
                            onClick={openNotes}
                            style={{ boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)" }}
                        >
                            <IconNotebook size={24} />
                        </ActionIcon>
                    </span>
                </Tooltip>

                <Modal
                    opened={notesOpened}
                    onClose={closeNotes}
                    size="min(80rem, calc(100vw - 2rem))"
                    centered
                    zIndex={NOTES_MODAL_Z_INDEX}
                    title={
                        <Box
                            style={{
                                width: "100%",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.75rem"
                            }}
                        >
                            <Group gap="sm" style={{ flex: "1 1 auto", minWidth: 0 }}>
                                <IconNotebook size={20} color={rgba(RAW_GOLD, 0.92)} />
                                <Text fw={700}>Private Notes</Text>
                                {showSavePill ? (
                                    <Badge
                                        color={saveStatus === "saved" ? "green" : "yellow"}
                                        variant="light"
                                        leftSection={
                                            saveStatus === "saving" ? (
                                                <Loader color="yellow" size={10} />
                                            ) : undefined
                                        }
                                    >
                                        {saveStatus === "saved" ? "Saved" : ""}
                                    </Badge>
                                ) : null}
                            </Group>
                            <Box
                                style={{
                                    flex: "0 0 2rem",
                                    display: "flex",
                                    justifyContent: "flex-end",
                                    marginRight: "0.75rem"
                                }}
                            >
                                <ActionIcon
                                    color={primaryColor}
                                    variant="light"
                                    aria-label="Version history"
                                    title="Version history"
                                    disabled={notesLoading || notesError}
                                    onClick={openHistory}
                                >
                                    <IconVersions size={18} />
                                </ActionIcon>
                            </Box>
                        </Box>
                    }
                    styles={{
                        content: {
                            background: "rgba(9, 8, 10, 0.98)",
                            border: `1px solid ${rgba(RAW_GOLD, 0.22)}`
                        },
                        header: {
                            background: "rgba(9, 8, 10, 0.98)",
                            borderBottom: `1px solid ${rgba(RAW_GOLD, 0.14)}`
                        },
                        title: { flex: 1, minWidth: 0 }
                    }}
                >
                    {notesLoading ? (
                        <Center mih={360}>
                            <Loader color={primaryColor} />
                        </Center>
                    ) : notesError ? (
                        <Stack align="center" py="xl">
                            <Text c="red">Private notes could not be loaded.</Text>
                            <Button
                                color={primaryColor}
                                variant="light"
                                onClick={() => void refetchNotes()}
                            >
                                Try again
                            </Button>
                        </Stack>
                    ) : (
                        <Stack gap="sm">
                            {selectedHistoryVersion ? (
                                <Group justify="space-between" gap="sm">
                                    <Badge color={primaryColor} variant="light">
                                        Viewing {formatDateTime(selectedHistoryVersion.createdAt)}
                                    </Badge>
                                    <Button
                                        size="xs"
                                        color="gray"
                                        variant="subtle"
                                        onClick={clearSelectedHistoryVersion}
                                    >
                                        Back to latest
                                    </Button>
                                </Group>
                            ) : null}
                            <Textarea
                                value={displayedNotes}
                                onChange={(event) => {
                                    if (!isViewingHistory) {
                                        setDraftNotes(event.currentTarget.value)
                                    }
                                }}
                                readOnly={isViewingHistory}
                                minRows={18}
                                maxRows={24}
                                autosize
                                placeholder="Plans, clues, debts, boons, suspicions..."
                                styles={{
                                    input: {
                                        background: "rgba(18, 14, 17, 0.92)",
                                        borderColor:
                                            noteBytes > CHARACTER_NOTE_MAX_BYTES
                                                ? rgba(RAW_RED, 0.8)
                                                : rgba(RAW_GOLD, 0.28),
                                        color: "rgba(244, 236, 232, 0.94)",
                                        fontFamily: "Inter, Segoe UI, sans-serif",
                                        lineHeight: 1.6,
                                        fontSize: "0.95rem"
                                    }
                                }}
                            />
                            {selectedHistoryVersion ? (
                                <Group justify="space-between" gap="sm">
                                    <Text size="xs" c="dimmed">
                                        Historical versions are read-only.
                                    </Text>
                                    <Button
                                        size="xs"
                                        color={primaryColor}
                                        variant="light"
                                        leftSection={<IconVersions size={14} />}
                                        loading={restorePending}
                                        onClick={restoreVersion}
                                    >
                                        Restore this version
                                    </Button>
                                </Group>
                            ) : (
                                <Text
                                    size="xs"
                                    c={noteBytes > CHARACTER_NOTE_MAX_BYTES ? "red" : "dimmed"}
                                >
                                    {Math.round(noteBytes / 1024)} KB / 200 KB
                                </Text>
                            )}
                        </Stack>
                    )}
                </Modal>

                <Modal
                    opened={historyOpened}
                    onClose={closeHistory}
                    title={
                        <Group gap="sm">
                            <IconVersions size={20} color={rgba(RAW_GOLD, 0.92)} />
                            <Text fw={700}>Version history</Text>
                        </Group>
                    }
                    centered
                    size="sm"
                    zIndex={NOTES_HISTORY_MODAL_Z_INDEX}
                    styles={{
                        content: {
                            background: "rgba(9, 8, 10, 0.98)",
                            border: `1px solid ${rgba(RAW_GOLD, 0.22)}`
                        },
                        header: {
                            background: "rgba(9, 8, 10, 0.98)",
                            borderBottom: `1px solid ${rgba(RAW_GOLD, 0.14)}`
                        }
                    }}
                >
                    <Stack gap="xs">
                        {versions.slice(1).length > 0 ? (
                            versions.slice(1).map((version) => (
                                <Button
                                    key={version.id}
                                    color={primaryColor}
                                    variant="subtle"
                                    justify="flex-start"
                                    leftSection={<IconVersions size={16} />}
                                    onClick={() => previewVersion(version)}
                                >
                                    {formatDateTime(version.createdAt)}
                                </Button>
                            ))
                        ) : (
                            <Text c="dimmed" size="sm">
                                No past versions yet.
                            </Text>
                        )}
                    </Stack>
                </Modal>
            </>
        )
    }
)

CharacterNotesControl.displayName = "CharacterNotesControl"

export default CharacterNotesControl
