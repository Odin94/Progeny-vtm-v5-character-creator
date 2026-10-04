import {
    ActionIcon,
    Box,
    Button,
    Group,
    Modal,
    Stack,
    Text,
    Textarea,
    Tooltip
} from "@mantine/core"
import { useMediaQuery } from "@mantine/hooks"
import { IconArrowBackUp, IconArrowForwardUp, IconArrowsMaximize } from "@tabler/icons-react"
import { memo, useState } from "react"
import { confirmationModalWithHeaderStyles } from "~/components/ConfirmActionModal"
import { getCharacterDraftIdentity } from "~/utils/characterDraft"
import type { SheetOptions } from "../CharacterSheet"
import { useDebouncedUncontrolledStringField } from "../utils/useDebouncedUncontrolledField"
import { useDescriptionUndo } from "../hooks/useDescriptionUndo"

type CharacterDescriptionProps = Pick<
    SheetOptions,
    "character" | "setCharacter" | "primaryColor" | "canEdit" | "editDisabledReason"
>

// Keep buffered edits mounted when the modal closes so its last keystroke still saves.
const CharacterDescription = memo(
    ({
        character,
        setCharacter,
        primaryColor,
        canEdit,
        editDisabledReason
    }: CharacterDescriptionProps) => {
        const [opened, setOpened] = useState(false)
        const phoneScreen = useMediaQuery("(max-width: 48em)")
        const description = useDebouncedUncontrolledStringField({
            character,
            setCharacter,
            field: "description"
        })
        const descriptionUndo = useDescriptionUndo({
            identity: getCharacterDraftIdentity(character),
            value: description.value,
            onChange: description.onChange
        })
        const hasDescription = !!description.value.trim()
        const close = () => {
            descriptionUndo.finishGroup()
            setOpened(false)
        }

        if (!hasDescription && !canEdit) return null

        return (
            <>
                <Box miw={0}>
                    <Group gap="xs" wrap="nowrap" align="flex-start">
                        <Text
                            lineClamp={2}
                            style={{ flex: 1, minWidth: 0, overflowWrap: "anywhere" }}
                        >
                            <Text component="span" fw={700}>
                                Description:
                            </Text>{" "}
                            {hasDescription ? description.value : "—"}
                        </Text>
                        <Tooltip label="Expand description & appearance" withArrow>
                            <ActionIcon
                                variant="subtle"
                                color="gray"
                                c="dimmed"
                                size={phoneScreen ? 44 : 28}
                                radius="sm"
                                aria-label="Expand description & appearance"
                                aria-haspopup="dialog"
                                onClick={() => setOpened(true)}
                                style={{ flexShrink: 0 }}
                            >
                                <IconArrowsMaximize size={14} stroke={1.5} />
                            </ActionIcon>
                        </Tooltip>
                    </Group>
                </Box>
                <Modal
                    opened={opened}
                    onClose={close}
                    title="Description & appearance"
                    size="lg"
                    zIndex={2200}
                    centered
                    fullScreen={phoneScreen}
                    closeButtonProps={{ size: 44, "aria-label": "Close description & appearance" }}
                    overlayProps={{ backgroundOpacity: 0.72, blur: 8 }}
                    styles={confirmationModalWithHeaderStyles(phoneScreen)}
                >
                    <Stack gap="md">
                        {canEdit ? (
                            <Textarea
                                aria-label="Description & appearance"
                                placeholder="Describe your character’s appearance, mannerisms, and story…"
                                value={description.value}
                                onChange={(event) => descriptionUndo.onChange(event.target.value)}
                                onBlur={descriptionUndo.finishGroup}
                                color={primaryColor}
                                styles={{
                                    input: {
                                        height: "clamp(12rem, 50dvh, 28rem)",
                                        fontSize: "1rem",
                                        lineHeight: 1.6
                                    }
                                }}
                            />
                        ) : (
                            <Text
                                style={{
                                    whiteSpace: "pre-wrap",
                                    overflowWrap: "anywhere"
                                }}
                            >
                                {description.value}
                            </Text>
                        )}
                        <Text c="dimmed" size="sm">
                            {canEdit
                                ? "Changes save automatically."
                                : editDisabledReason || "This character is read-only."}
                        </Text>
                        <Group justify={canEdit ? "space-between" : "flex-end"} align="center">
                            {canEdit ? (
                                <Group gap="md" wrap="nowrap">
                                    <Tooltip label="Undo" withArrow zIndex={2300}>
                                        <Box component="span" style={{ display: "inline-flex" }}>
                                            <ActionIcon
                                                color="gray"
                                                c="dimmed"
                                                variant="subtle"
                                                size={phoneScreen ? 44 : 28}
                                                radius="sm"
                                                aria-label="Undo description change"
                                                disabled={!descriptionUndo.canUndo}
                                                onClick={descriptionUndo.undo}
                                                style={
                                                    !descriptionUndo.canUndo
                                                        ? {
                                                              backgroundColor: "transparent",
                                                              opacity: 0.35,
                                                              pointerEvents: "none"
                                                          }
                                                        : undefined
                                                }
                                            >
                                                <IconArrowBackUp size={16} stroke={1.5} />
                                            </ActionIcon>
                                        </Box>
                                    </Tooltip>
                                    <Tooltip label="Redo" withArrow zIndex={2300}>
                                        <Box component="span" style={{ display: "inline-flex" }}>
                                            <ActionIcon
                                                color="gray"
                                                c="dimmed"
                                                variant="subtle"
                                                size={phoneScreen ? 44 : 28}
                                                radius="sm"
                                                aria-label="Redo description change"
                                                disabled={!descriptionUndo.canRedo}
                                                onClick={descriptionUndo.redo}
                                                style={
                                                    !descriptionUndo.canRedo
                                                        ? {
                                                              backgroundColor: "transparent",
                                                              opacity: 0.35,
                                                              pointerEvents: "none"
                                                          }
                                                        : undefined
                                                }
                                            >
                                                <IconArrowForwardUp size={16} stroke={1.5} />
                                            </ActionIcon>
                                        </Box>
                                    </Tooltip>
                                </Group>
                            ) : null}
                            <Button color={primaryColor} mih={44} onClick={close}>
                                {canEdit ? "Done" : "Close"}
                            </Button>
                        </Group>
                    </Stack>
                </Modal>
            </>
        )
    },
    (prev, next) =>
        getCharacterDraftIdentity(prev.character) === getCharacterDraftIdentity(next.character) &&
        prev.character.description === next.character.description &&
        prev.setCharacter === next.setCharacter &&
        prev.primaryColor === next.primaryColor &&
        prev.canEdit === next.canEdit &&
        prev.editDisabledReason === next.editDisabledReason
)

export default CharacterDescription
