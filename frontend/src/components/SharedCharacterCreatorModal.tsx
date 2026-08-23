import { Button, Divider, Group, Modal, Stack, Text } from "@mantine/core"
import {
    ConfirmationModalStyle,
    confirmationModalBodyStyle,
    confirmationModalHeadingStyle
} from "./ConfirmActionModal"
import {
    generatorOutlineActionButtonStyles,
    confirmationModalDangerConfirmButtonStyles
} from "~/generator/components/sharedGeneratorConfirmButtonStyles"
import { COLOR_MODAL_DIVIDER } from "~/theme/colors"

type SharedCharacterCreatorModalProps = {
    opened: boolean
    characterName: string
    playerName: string
    onGoToSheet: () => void
    onCreateNewCharacter: () => void
}

export const getSharedCharacterLabel = (characterName: string, playerName: string) => {
    const name = characterName.trim() || "Unnamed character"
    const player = playerName.trim()

    return player ? `${name} | ${player}` : name
}

const SharedCharacterCreatorModal = ({
    opened,
    characterName,
    playerName,
    onGoToSheet,
    onCreateNewCharacter
}: SharedCharacterCreatorModalProps) => {
    const characterLabel = getSharedCharacterLabel(characterName, playerName)

    return (
        <Modal
            opened={opened}
            onClose={onGoToSheet}
            title=""
            centered
            size="lg"
            withCloseButton={false}
            closeOnClickOutside={false}
            closeOnEscape={false}
            overlayProps={{ backgroundOpacity: 0.72, blur: 8 }}
            styles={ConfirmationModalStyle(false)}
        >
            <Stack gap="md">
                <Stack gap={6} align="center">
                    <Text ta="center" style={confirmationModalHeadingStyle(false)}>
                        Shared Character Checked Out
                    </Text>
                    <Text ta="center" style={confirmationModalBodyStyle}>
                        You have {characterLabel} checked out. It&apos;s a shared character, so you
                        can&apos;t edit it in the character creator.
                    </Text>
                </Stack>

                <Divider color={COLOR_MODAL_DIVIDER} />

                <Group justify="space-between" gap="sm" wrap="nowrap">
                    <Button
                        color="red"
                        variant="outline"
                        onClick={onGoToSheet}
                        styles={generatorOutlineActionButtonStyles}
                    >
                        Go to Sheet
                    </Button>
                    <Button
                        color="red"
                        onClick={onCreateNewCharacter}
                        styles={confirmationModalDangerConfirmButtonStyles}
                    >
                        Create New Character
                    </Button>
                </Group>
            </Stack>
        </Modal>
    )
}

export default SharedCharacterCreatorModal
