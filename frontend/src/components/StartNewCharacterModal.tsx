import { Badge, Button, Divider, Group, Modal, Stack, Text, TextInput } from "@mantine/core"
import { IconDeviceFloppy, IconPencil, IconPlus } from "@tabler/icons-react"

type StartNewCharacterModalProps = {
    opened: boolean
    characterName: string
    setCharacterName: (value: string) => void
    isSaving: boolean
    onClose: () => void
    onContinueCurrent: () => void
    onStartWithoutSaving: () => void
    onSaveAndStartNew: () => void
}

const StartNewCharacterModal = ({
    opened,
    characterName,
    setCharacterName,
    isSaving,
    onClose,
    onContinueCurrent,
    onStartWithoutSaving,
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
                <Group gap="sm">
                    <Badge color="green" variant="light">
                        Signed in
                    </Badge>
                    <Text className="landing-page__body">
                        You already have a character in progress.
                    </Text>
                </Group>

                <Text className="landing-page__body">
                    Keep editing the current character, or save it to your account before starting
                    over.
                </Text>

                <TextInput
                    value={characterName}
                    onChange={(event) => setCharacterName(event.currentTarget.value)}
                    label="Current character name"
                    placeholder="Name your character before saving"
                    color="red"
                />

                <Divider color="rgba(125, 91, 72, 0.28)" />

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
                            variant="outline"
                            color="red"
                            leftSection={<IconPlus size={18} />}
                            onClick={onStartWithoutSaving}
                            disabled={isSaving}
                        >
                            Start without saving
                        </Button>
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
