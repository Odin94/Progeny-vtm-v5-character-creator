import {
    Button,
    Divider,
    Group,
    Modal,
    Stack,
    Text,
    TextInput,
    useMantineTheme
} from "@mantine/core"
import FocusBorderWrapper from "~/character_sheet/components/FocusBorderWrapper"
import {
    ConfirmationModalStyle,
    confirmationModalBodyStyle,
    confirmationModalCancelButtonStyles,
    confirmationModalHeadingStyle
} from "./ConfirmActionModal"
import {
    confirmationModalDangerConfirmButtonStyles,
    generatorOutlineActionButtonStyles
} from "~/generator/components/sharedGeneratorConfirmButtonStyles"
import { getGeneratorFieldStyles } from "~/generator/components/sharedGeneratorUi"

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
    const theme = useMantineTheme()
    const fieldStyles = getGeneratorFieldStyles("gold")

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title=""
            centered
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

                <FocusBorderWrapper colorValue={theme.colors.grape[6]} style={{ width: "100%" }}>
                    <TextInput
                        value={nameValue}
                        onChange={(event) => setNameValue(event.currentTarget.value)}
                        label="Character Name"
                        placeholder="Name your character"
                        styles={fieldStyles}
                    />
                </FocusBorderWrapper>

                <Divider color="rgba(125, 91, 72, 0.28)" />

                <Group justify="space-between">
                    <Button
                        color="gray"
                        variant="subtle"
                        onClick={onClose}
                        disabled={isSaving}
                        styles={confirmationModalCancelButtonStyles}
                    >
                        Cancel
                    </Button>

                    <Group gap="xs">
                        <Button
                            color="red"
                            variant="outline"
                            onClick={onDiscardAndContinue}
                            disabled={isSaving}
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
                            Save And Continue
                        </Button>
                    </Group>
                </Group>
            </Stack>
        </Modal>
    )
}

export default NameCharacterBeforeSwitchModal
