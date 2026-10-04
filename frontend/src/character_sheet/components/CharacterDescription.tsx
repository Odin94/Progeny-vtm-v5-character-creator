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
import { IconArrowsMaximize, IconPlus } from "@tabler/icons-react"
import { memo, useState } from "react"
import { confirmationModalWithHeaderStyles } from "~/components/ConfirmActionModal"
import { getCharacterDraftIdentity } from "~/utils/characterDraft"
import type { SheetOptions } from "../CharacterSheet"
import { useDebouncedUncontrolledStringField } from "../utils/useDebouncedUncontrolledField"
import classes from "./CharacterDescription.module.css"

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
        const hasDescription = !!description.value.trim()

        if (!hasDescription && !canEdit) return null

        return (
            <>
                <Box maw="min(70ch, calc(100% - 64px))" mx="auto" mb="lg">
                    {hasDescription ? (
                        <Group className={classes.preview} gap="xs" wrap="nowrap" align="center">
                            <Text
                                c="dimmed"
                                ta="center"
                                lineClamp={2}
                                style={{ flex: 1, minWidth: 0, overflowWrap: "anywhere" }}
                            >
                                {description.value}
                            </Text>
                            <Tooltip label="Expand description & appearance" withArrow>
                                <ActionIcon
                                    variant="subtle"
                                    color={primaryColor}
                                    size={44}
                                    radius="md"
                                    aria-label="Expand description & appearance"
                                    aria-haspopup="dialog"
                                    onClick={() => setOpened(true)}
                                    style={{ flexShrink: 0 }}
                                >
                                    <IconArrowsMaximize size={18} />
                                </ActionIcon>
                            </Tooltip>
                        </Group>
                    ) : (
                        <Group justify="center">
                            <Button
                                variant="subtle"
                                color={primaryColor}
                                leftSection={<IconPlus size={16} />}
                                aria-haspopup="dialog"
                                onClick={() => setOpened(true)}
                                styles={{
                                    root: { maxWidth: "100%", height: "auto", minHeight: 44 },
                                    label: { whiteSpace: "normal", lineHeight: 1.4 }
                                }}
                            >
                                Add description & appearance
                            </Button>
                        </Group>
                    )}
                </Box>
                <Modal
                    opened={opened}
                    onClose={() => setOpened(false)}
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
                                onChange={(event) => description.onChange(event.target.value)}
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
                        <Group justify="space-between" align="center">
                            <Text c="dimmed" size="sm" style={{ flex: 1 }}>
                                {canEdit
                                    ? "Changes save automatically."
                                    : editDisabledReason || "This character is read-only."}
                            </Text>
                            <Button color={primaryColor} mih={44} onClick={() => setOpened(false)}>
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
