import { Button, Divider, Group, Modal, Stack, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

const LoadConfirmModal = () => {
    const [opened, { open, close }] = useDisclosure(false);

    return (
        <>
            <Modal opened={opened} onClose={close} title="Load character" centered>
                <Stack>
                    <Title>Loading the character will overwrite your current character!</Title>
                    <Divider my="sm" />
                    <Group></Group>
                </Stack>
            </Modal>

            <Group position="center">
                <Button onClick={open}>Open centered Modal</Button>
            </Group>
        </>
    )
}

export default LoadConfirmModal