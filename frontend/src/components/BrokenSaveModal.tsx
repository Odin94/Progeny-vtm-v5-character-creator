import { faDownload, faTrash } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Button, Code, Divider, Group, Modal, Stack, Text } from "@mantine/core"
import { useLocalStorage } from "@mantine/hooks"
import { useBrokenCharacter } from "~/hooks/useBrokenCharacter"
import { useCharacterLocalStorage } from "~/hooks/useCharacterLocalStorage"
import { getEmptyCharacter } from "~/data/Character"

const BrokenSaveModal = () => {
    const { brokenData, brokenError, hasBrokenCharacter, clearBrokenCharacter } = useBrokenCharacter()
    const [, setCharacter] = useCharacterLocalStorage()
    const [, setSelectedStep] = useLocalStorage({ key: "selectedStep", defaultValue: 0 })

    const onDownload = () => {
        if (brokenData) {
            const blob = new Blob([brokenData], { type: "application/json" })
            const link = document.createElement("a")
            link.href = window.URL.createObjectURL(blob)
            link.download = `broken_character_save_${new Date().toISOString()}.json`
            link.click()
            setTimeout(() => {
                window.URL.revokeObjectURL(link.href)
            }, 100)
        }
    }

    const onReset = () => {
        clearBrokenCharacter()
        setCharacter(getEmptyCharacter())
        setSelectedStep(0)
    }

    return (
        <Modal
            opened={hasBrokenCharacter}
            onClose={() => {}}
            title="Character Data Error"
            centered
            withCloseButton={false}
            closeOnClickOutside={false}
            closeOnEscape={false}
        >
            <Stack>
                <Text fz="lg" fw={700}>
                    Failed to load character from saved data
                </Text>
                <Text size="sm" c="dimmed">
                    The saved character data could not be parsed, even after applying compatibility patches. This may happen if the data
                    format has changed significantly.
                </Text>
                <Text size="sm" c="dimmed">
                    {`(You can safely refresh this page if download isn't working)`}
                </Text>
                <Divider my="sm" />
                <Text fw={700} size="sm">
                    Error details:
                </Text>
                <Code block style={{ maxHeight: "200px", overflow: "auto" }}>
                    {brokenError}
                </Code>
                <Divider my="sm" />
                <Group justify="space-between">
                    <Button color="grape" leftSection={<FontAwesomeIcon icon={faDownload} />} onClick={onDownload}>
                        Download Broken Save Data
                    </Button>
                    <Group>
                        <Button color="red" leftSection={<FontAwesomeIcon icon={faTrash} />} onClick={onReset}>
                            Reset to Empty Character
                        </Button>
                    </Group>
                </Group>
            </Stack>
        </Modal>
    )
}

export default BrokenSaveModal
