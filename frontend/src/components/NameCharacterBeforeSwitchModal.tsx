import { Button, Divider, Group, Modal, Stack, Text, TextInput, useMantineTheme } from "@mantine/core"
import { RAW_GOLD, RAW_GREY, RAW_RED, rgba } from "~/theme/colors"
import FocusBorderWrapper from "~/character_sheet/components/FocusBorderWrapper"

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
    isSaving,
}: NameCharacterBeforeSwitchModalProps) => {
    const theme = useMantineTheme()

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title=""
            centered
            withCloseButton={false}
            overlayProps={{ backgroundOpacity: 0.72, blur: 8 }}
            styles={{
                content: {
                    border: "1px solid rgba(125, 91, 72, 0.38)",
                    background: "linear-gradient(180deg, rgba(24, 17, 20, 0.98) 0%, rgba(14, 10, 12, 0.98) 100%)",
                    boxShadow: "0 24px 54px rgba(0, 0, 0, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.04)",
                },
                body: {
                    padding: "1.35rem",
                },
            }}
        >
            <Stack gap="md">
                <Stack gap={6} align="center">
                    <Text
                        ta="center"
                        style={{
                            fontFamily: "Cinzel, Georgia, serif",
                            fontSize: "1.35rem",
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            color: "rgba(244, 236, 232, 0.95)",
                        }}
                    >
                        Name Current Character?
                    </Text>
                    <Text
                        ta="center"
                        style={{
                            fontFamily: "Inter, Segoe UI, sans-serif",
                            fontSize: "0.9rem",
                            color: rgba(RAW_GREY, 0.62),
                        }}
                    >
                        Before you {pendingActionLabel}, either give this character a name and save it, or discard it and continue.
                    </Text>
                </Stack>

                <FocusBorderWrapper colorValue={theme.colors.grape[6]} style={{ width: "100%" }}>
                    <TextInput
                        value={nameValue}
                        onChange={(event) => setNameValue(event.currentTarget.value)}
                        label="Character Name"
                        placeholder="Name your character"
                        styles={{
                            label: {
                                fontFamily: "Cinzel, Georgia, serif",
                                fontSize: "0.9rem",
                                letterSpacing: "0.1em",
                                textTransform: "uppercase",
                                color: rgba(RAW_GOLD, 1),
                                marginBottom: 8,
                            },
                            input: {
                                background: "rgba(20, 16, 18, 0.82)",
                                borderColor: "rgba(125, 91, 72, 0.4)",
                                color: "rgba(244, 236, 232, 0.95)",
                                fontFamily: "Inter, Segoe UI, sans-serif",
                            },
                        }}
                    />
                </FocusBorderWrapper>

                <Divider color="rgba(125, 91, 72, 0.28)" />

                <Group justify="space-between">
                    <Button
                        color="gray"
                        variant="subtle"
                        onClick={onClose}
                        disabled={isSaving}
                        styles={{
                            root: {
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                                fontFamily: "Cinzel, Georgia, serif",
                            },
                        }}
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
                                    letterSpacing: "0.08em",
                                    textTransform: "uppercase",
                                    fontFamily: "Cinzel, Georgia, serif",
                                },
                            }}
                        >
                            Delete Current
                        </Button>
                        <Button
                            color="red"
                            onClick={onSaveAndContinue}
                            loading={isSaving}
                            styles={{
                                root: {
                                    background: `linear-gradient(180deg, ${rgba(RAW_RED, 0.92)} 0%, rgba(186, 38, 38, 0.95) 100%)`,
                                    letterSpacing: "0.08em",
                                    textTransform: "uppercase",
                                    fontFamily: "Cinzel, Georgia, serif",
                                    boxShadow: `0 10px 24px ${rgba(RAW_RED, 0.24)}`,
                                },
                            }}
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
