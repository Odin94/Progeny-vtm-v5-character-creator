import { Button, Divider, Group, Modal, Stack, Text } from "@mantine/core"
import { RAW_GREY, RAW_RED, rgba } from "~/theme/colors"
import { useMediaQuery } from "@mantine/hooks"
import { Character, getEmptyCharacter } from "../data/Character"
import { defaultGeneratorStepId, GeneratorStepId } from "../generator/steps"

export type ResetModalProps = {
    setCharacter: (character: Character) => void
    setSelectedStep: (step: GeneratorStepId) => void
    resetModalOpened: boolean
    closeResetModal: () => void
}

const ResetModal = ({ resetModalOpened, closeResetModal, setCharacter, setSelectedStep }: ResetModalProps) => {
    const phoneScreen = useMediaQuery("(max-width: 48em)")

    return (
        <Modal
            opened={resetModalOpened}
            onClose={closeResetModal}
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
                    padding: phoneScreen ? "1.1rem" : "1.35rem",
                },
            }}
        >
            <Stack gap="md">
                <Stack gap={6} align="center">
                    <Text
                        ta="center"
                        style={{
                            fontFamily: "Cinzel, Georgia, serif",
                            fontSize: phoneScreen ? "1.2rem" : "1.35rem",
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            color: "rgba(244, 236, 232, 0.95)",
                        }}
                    >
                        Reset Character?
                    </Text>
                    <Text
                        ta="center"
                        style={{
                            fontFamily: "Inter, Segoe UI, sans-serif",
                            fontSize: "0.9rem",
                            color: rgba(RAW_GREY, 0.62),
                        }}
                    >
                        This will clear the current character and return you to the first generator step. This action cannot be undone.
                    </Text>
                </Stack>

                <Divider color="rgba(125, 91, 72, 0.28)" />

                <Group justify="space-between">
                    <Button
                        color="gray"
                        variant="subtle"
                        onClick={closeResetModal}
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
                    <Button
                        color="red"
                        onClick={async () => {
                            setCharacter(getEmptyCharacter())
                            setSelectedStep(defaultGeneratorStepId)

                            closeResetModal()
                        }}
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
                        Reset
                    </Button>
                </Group>
            </Stack>
        </Modal>
    )
}

export default ResetModal
