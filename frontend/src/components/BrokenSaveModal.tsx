import { faDownload } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
    Alert,
    Anchor,
    Button,
    Divider,
    List,
    Modal,
    ScrollArea,
    Stack,
    Text
} from "@mantine/core"
import { useBrokenCharacter } from "~/hooks/useBrokenCharacter"
import { useCharacterLocalStorage } from "~/hooks/useCharacterLocalStorage"
import { useEffect, useMemo, useState } from "react"
import { CONTACT_LINKS } from "~/constants/contactLinks"
import SupportConversationButton from "~/components/SupportConversationButton"
import { trackCharacterRepair } from "~/utils/characterRecoveryAnalytics"
import { previewCharacterRepair } from "~/utils/repairCharacter"

const describeBrokenAttribute = (error: string) => {
    const property = error.match(/(?:property|field)\s+['"`]([^'"`]+)['"`]/i)?.[1]
    if (property) return `can't load ${property}`

    try {
        const issues = JSON.parse(error) as { path?: unknown[] }[]
        const attribute = issues[0]?.path?.at(-1)
        if (typeof attribute === "string") return `can't load ${attribute}`
    } catch {
        // The error is not a Zod issue list. Use the concise fallback below.
    }

    return "can't load this saved character data"
}

const BrokenSaveModal = () => {
    const [recoveryError, setRecoveryError] = useState("")
    const {
        brokenData,
        brokenError,
        hasBrokenCharacter,
        clearBrokenCharacter,
        archiveBrokenCharacter
    } = useBrokenCharacter()
    const repair = useMemo(() => previewCharacterRepair(brokenData), [brokenData])
    const repairId = useMemo(() => crypto.randomUUID(), [brokenData])
    const [, setCharacter] = useCharacterLocalStorage()

    useEffect(() => {
        if (!hasBrokenCharacter) return
        console.error("Full character save error:", brokenError)
        if (repair.success)
            trackCharacterRepair("suggested", repairId, repair.changes, repair.character)
    }, [brokenError, hasBrokenCharacter, repair, repairId])

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

    const onRepair = () => {
        if (!repair.success) return
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
        trackCharacterRepair("applied", repairId, repair.changes, repair.character)
        setRecoveryError("")
    }

    return (
        <Modal
            opened={hasBrokenCharacter}
            onClose={() => {}}
            title="Character Data Error"
            centered
            size="xl"
            withCloseButton={false}
            closeOnClickOutside={false}
            closeOnEscape={false}
        >
            <Stack>
                <Text fz="lg" fw={700}>
                    Failed to load character from saved data
                </Text>
                {recoveryError && (
                    <Text c="red" role="alert">
                        {recoveryError}
                    </Text>
                )}
                <Text size="sm">
                    <strong>Error details:</strong> {describeBrokenAttribute(brokenError)}
                </Text>
                <Divider my="sm" />
                {repair.success ? (
                    <Stack>
                        <Alert color="yellow" title="Automatic repair may cause partial data loss" />
                        <ScrollArea.Autosize mah={300} offsetScrollbars>
                            <List
                                size="sm"
                                spacing="xs"
                                styles={{
                                    itemWrapper: { maxWidth: "100%" },
                                    itemLabel: { overflowWrap: "anywhere" }
                                }}
                            >
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
                        <Button color="orange" onClick={onRepair}>
                            Auto-repair
                        </Button>
                    </Stack>
                ) : (
                    <Stack gap="xs">
                        <Text size="sm" c="dimmed">
                            {repair.error}
                        </Text>
                    </Stack>
                )}
                <Divider my="sm" />
                <Stack gap="sm">
                    <SupportConversationButton source="broken-save-modal" color="orange" fullWidth>
                        Get help in support chat
                    </SupportConversationButton>
                    <Button
                        color="gray"
                        variant="subtle"
                        leftSection={<FontAwesomeIcon icon={faDownload} />}
                        onClick={onDownload}
                    >
                        Download Broken Save Data
                    </Button>
                    <Text size="xs" c="dimmed" ta="center">
                        Find Odin on{" "}
                        <Anchor href={CONTACT_LINKS.reddit.href} target="_blank" rel="noreferrer">
                            {CONTACT_LINKS.reddit.label}
                        </Anchor>{" "}
                        or{" "}
                        <Anchor href={CONTACT_LINKS.bluesky.href} target="_blank" rel="noreferrer">
                            {CONTACT_LINKS.bluesky.label}
                        </Anchor>
                    </Text>
                </Stack>
            </Stack>
        </Modal>
    )
}

export default BrokenSaveModal
