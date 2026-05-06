import { Button, Divider, Group, Modal, Stack, Text, TextInput } from "@mantine/core"
import {
    ConfirmationModalStyle,
    confirmationModalBodyStyle,
    confirmationModalHeadingStyle
} from "./ConfirmActionModal"
import {
    confirmationModalDangerConfirmButtonStyles,
    generatorOutlineActionButtonStyles
} from "~/generator/components/sharedGeneratorConfirmButtonStyles"
import { getGeneratorFieldStyles } from "~/generator/components/sharedGeneratorUi"
import { COLOR_MODAL_DIVIDER } from "~/theme/colors"

type NameCharacterBeforeSwitchModalProps = {
    opened: boolean
    pendingActionLabel: string
    nameValue: string
    setNameValue: (value: string) => void
    onClose: () => void
    onSaveAndContinue: () => void
    onDiscardAndContinue: () => void
    isSaving: boolean
}

const NameCharacterBeforeSwitchModal = ({
    opened,
    pendingActionLabel,
    nameValue,
    setNameValue,
    onClose,
    onSaveAndContinue,
    onDiscardAndContinue,
    isSaving
}: NameCharacterBeforeSwitchModalProps) => {
    const fieldStyles = getGeneratorFieldStyles("gold")
    const hasEnteredName = nameValue.trim().length > 0

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title=""
            centered
            size="lg"
            withCloseButton={false}
            overlayProps={{ backgroundOpacity: 0.72, blur: 8 }}
            styles={ConfirmationModalStyle(false)}
        >
            <Stack gap="md">
                <Stack gap={6} align="center">
                    <Text ta="center" style={confirmationModalHeadingStyle(false)}>
                        Name Current Character?
                    </Text>
                    <Text ta="center" style={confirmationModalBodyStyle}>
                        Before you {pendingActionLabel}, either give this character a name and save
                        it, or discard it and continue.
                    </Text>
                </Stack>
                <TextInput
                    value={nameValue}
                    onChange={(event) => setNameValue(event.currentTarget.value)}
                    label="Character Name"
                    placeholder="Name your character"
                    color="grape"
                    style={{ width: "100%" }}
                    styles={fieldStyles}
                />

                <Divider m={"sm"} color={COLOR_MODAL_DIVIDER} />

                <Group justify="space-between" gap="sm" wrap="nowrap">
                    <Button
                        color="red"
                        variant="outline"
                        onClick={onDiscardAndContinue}
                        disabled={isSaving || hasEnteredName}
                        styles={{
                            root: {
                                ...generatorOutlineActionButtonStyles.root
                            }
                        }}
                    >
                        Delete Current
                    </Button>
                    <Button
                        color="red"
                        onClick={onSaveAndContinue}
                        loading={isSaving}
                        styles={confirmationModalDangerConfirmButtonStyles}
                    >
                        Save and continue
                    </Button>
                </Group>
            </Stack>
        </Modal>
    )
}

export default NameCharacterBeforeSwitchModal
