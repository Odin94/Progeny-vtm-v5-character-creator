import { Badge, Button, Divider, Group, Modal, Stack, Text, TextInput } from "@mantine/core"
import { IconDeviceFloppy, IconPencil } from "@tabler/icons-react"
import { COLOR_MODAL_DIVIDER } from "~/theme/colors"

type StartNewCharacterModalProps = {
    opened: boolean
    characterName: string
    setCharacterName: (value: string) => void
    isCharacterNameEditable: boolean
    isSaving: boolean
    onClose: () => void
    onContinueCurrent: () => void
    onSaveAndStartNew: () => void
}

const StartNewCharacterModal = ({
    opened,
    characterName,
    setCharacterName,
    isCharacterNameEditable,
    isSaving,
    onClose,
    onContinueCurrent,
    onSaveAndStartNew
}: StartNewCharacterModalProps) => {
    return (
        <Modal
            opened={opened}
            onClose={onClose}
            centered
            title="Start a new character?"
            radius="xl"
            padding="xl"
            size="lg"
            overlayProps={{ backgroundOpacity: 0.72, blur: 8 }}
            classNames={{
                content: "landing-page__modal",
                header: "landing-page__modal-header",
                title: "landing-page__modal-title",
                body: "landing-page__modal-body"
            }}
        >
            <Stack gap="lg">
                <Group justify="space-between" align="center" gap="sm">
                    <Text className="landing-page__body">
                        You already have a character in progress.
                    </Text>
                    <Badge color="green" variant="light">
                        Signed in
                    </Badge>
                </Group>

                <Text className="landing-page__body">
                    Keep editing the current character, or save it to your account before starting
                    over.
                </Text>

                {isCharacterNameEditable ? (
                    <TextInput
                        value={characterName}
                        onChange={(event) => setCharacterName(event.currentTarget.value)}
                        label="Current character name"
                        placeholder="Name your character before saving"
                        color="red"
                    />
                ) : (
                    <Stack gap={4}>
                        <Text fw={700} size="sm">
                            Current character name
                        </Text>
                        <Text className="landing-page__body">{characterName}</Text>
                    </Stack>
                )}

                <Divider color={COLOR_MODAL_DIVIDER} />

                <Group justify="space-between" align="center">
                    <Button
                        variant="subtle"
                        color="gray"
                        leftSection={<IconPencil size={18} />}
                        onClick={onContinueCurrent}
                        disabled={isSaving}
                    >
                        Keep editing
                    </Button>

                    <Group gap="sm">
                        <Button
                            color="red"
                            leftSection={<IconDeviceFloppy size={18} />}
                            onClick={onSaveAndStartNew}
                            loading={isSaving}
                        >
                            Save and start new
                        </Button>
                    </Group>
                </Group>
            </Stack>
        </Modal>
    )
}

export default StartNewCharacterModal
