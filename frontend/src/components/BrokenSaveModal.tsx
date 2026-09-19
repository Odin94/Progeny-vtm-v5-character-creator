import { faDownload, faTrash } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
    Alert,
    Button,
    Code,
    Divider,
    Group,
    List,
    Modal,
    ScrollArea,
    Stack,
    Text
} from "@mantine/core"
import { useLocalStorage } from "@mantine/hooks"
import { defaultGeneratorStepId, type GeneratorStepId } from "~/generator/steps"
import { useBrokenCharacter } from "~/hooks/useBrokenCharacter"
import { useCharacterLocalStorage } from "~/hooks/useCharacterLocalStorage"
import { getEmptyCharacter } from "~/data/Character"
import { useMemo, useState } from "react"
import { trackCharacterRepair } from "~/utils/characterRecoveryAnalytics"
import { previewCharacterRepair } from "~/utils/repairCharacter"

const BrokenSaveModal = () => {
    const [recoveryError, setRecoveryError] = useState("")
    const [reviewedSave, setReviewedSave] = useState<{ data: string; id: string } | null>(null)
    const {
        brokenData,
        brokenError,
        hasBrokenCharacter,
        clearBrokenCharacter,
        archiveBrokenCharacter
    } = useBrokenCharacter()
    const repair = useMemo(() => previewCharacterRepair(brokenData), [brokenData])
    const reviewingRepair = reviewedSave?.data === brokenData && repair.success
    const [, setCharacter] = useCharacterLocalStorage()
    const [, setSelectedStep] = useLocalStorage<GeneratorStepId>({
        key: "selectedGeneratorStep",
        defaultValue: defaultGeneratorStepId
    })

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
        try {
            clearBrokenCharacter()
        } catch {
            setRecoveryError(
                "Could not preserve a recovery copy. Download your saved data before freeing browser storage and trying again."
            )
            return
        }
        setCharacter(getEmptyCharacter())
        setSelectedStep(defaultGeneratorStepId)
    }

    const onRepair = () => {
        if (!repair.success || reviewedSave?.data !== brokenData) return
        try {
            archiveBrokenCharacter()
            // Mantine's storage hook catches write failures. Verify the repaired save can
            // be persisted before dismissing the recovery UI or changing React state.
            localStorage.setItem("character", JSON.stringify(repair.character))
        } catch {
            setRecoveryError(
                "Could not save the repair and its recovery copy. Download your original save before freeing browser storage and trying again."
            )
            return
        }
        setCharacter(repair.character)
        clearBrokenCharacter()
        trackCharacterRepair("applied", reviewedSave.id, repair.changes, repair.character)
        setReviewedSave(null)
        setRecoveryError("")
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
                    The saved character data could not be parsed, even after applying compatibility
                    patches. This may happen if the data format has changed significantly.
                </Text>
                <Text size="sm" c="dimmed">
                    {`(You can safely refresh this page if download isn't working)`}
                </Text>
                <Text size="sm">
                    Starting over replaces only the character in this browser. Characters saved to
                    your account are unaffected. A recovery copy will remain in this browser and can
                    be downloaded from your account page.
                </Text>
                {recoveryError && (
                    <Text c="red" role="alert">
                        {recoveryError}
                    </Text>
                )}
                <Divider my="sm" />
                <Text fw={700} size="sm">
                    Error details:
                </Text>
                <Code block style={{ maxHeight: "200px", overflow: "auto" }}>
                    {brokenError}
                </Code>
                <Divider my="sm" />
                {reviewingRepair && repair.success ? (
                    <Stack>
                        <Alert color="yellow" title="Automatic repair may cause partial data loss">
                            Invalid values will be reset and invalid entries removed as listed
                            below. Valid entries will be kept. The original save will be preserved
                            as a recovery copy. Confirm only if you accept these changes.
                        </Alert>
                        <ScrollArea.Autosize mah={300}>
                            <List size="sm" spacing="xs">
                                {repair.changes.map((change, index) => (
                                    <List.Item key={index}>{change.description}</List.Item>
                                ))}
                            </List>
                        </ScrollArea.Autosize>
                        {repair.changes.length === 0 && (
                            <Text size="sm">
                                This save now passes validation. No data needs to be removed.
                            </Text>
                        )}
                        <Text size="sm" c="dimmed">
                            The repaired character will be loaded in this browser. Normal account
                            saving applies when you edit it.
                        </Text>
                        <Group justify="space-between">
                            <Button variant="default" onClick={() => setReviewedSave(null)}>
                                Cancel repair
                            </Button>
                            <Button color="orange" onClick={onRepair}>
                                Confirm repair and load character
                            </Button>
                        </Group>
                    </Stack>
                ) : (
                    <Stack gap="xs">
                        <Button
                            color="orange"
                            disabled={!repair.success}
                            onClick={() => {
                                setRecoveryError("")
                                if (!repair.success) return
                                const id = crypto.randomUUID()
                                setReviewedSave({ data: brokenData, id })
                                trackCharacterRepair(
                                    "suggested",
                                    id,
                                    repair.changes,
                                    repair.character
                                )
                            }}
                        >
                            Preview automatic repair
                        </Button>
                        {!repair.success && (
                            <Text size="sm" c="dimmed">
                                {repair.error}
                            </Text>
                        )}
                    </Stack>
                )}
                <Divider my="sm" />
                <Group justify="space-between">
                    <Button
                        color="grape"
                        leftSection={<FontAwesomeIcon icon={faDownload} />}
                        onClick={onDownload}
                    >
                        Download Broken Save Data
                    </Button>
                    <Group>
                        <Button
                            color="red"
                            leftSection={<FontAwesomeIcon icon={faTrash} />}
                            onClick={onReset}
                        >
                            Reset to Empty Character
                        </Button>
                    </Group>
                </Group>
            </Stack>
        </Modal>
    )
}

export default BrokenSaveModal
