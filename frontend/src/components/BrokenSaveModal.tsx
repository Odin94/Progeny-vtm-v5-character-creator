import { useFileSavePromptOpen } from "~/utils/fileSavePromptStore"
import { downloadFile } from "~/utils/fileDownload"
import { Alert, Anchor, Button, Modal, ScrollArea } from "@mantine/core"
import { IconAlertTriangle, IconChevronDown, IconDownload, IconTool } from "@tabler/icons-react"
import classes from "./AppModals.module.css"
import { useBrokenCharacter } from "~/hooks/useBrokenCharacter"
import { useCharacterLocalStorage } from "~/hooks/useCharacterLocalStorage"
import { useEffect, useMemo, useState } from "react"
import { CONTACT_LINKS } from "~/constants/contactLinks"
import SupportConversationButton from "~/components/SupportConversationButton"
import { trackCharacterRepair } from "~/utils/characterRecoveryAnalytics"
import { characterIntake } from "~/modules/characterIntake"
import { useQueryClient } from "@tanstack/react-query"
import { characterPersistence } from "~/modules/characterPersistence"

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
    const fileSaveOpen = useFileSavePromptOpen()
    const queryClient = useQueryClient()
    const [recoveryError, setRecoveryError] = useState("")
    const [detailsOpened, setDetailsOpened] = useState(false)
    const { brokenData, brokenError, hasBrokenCharacter, clearBrokenCharacter } =
        useBrokenCharacter()
    const repair = useMemo(() => characterIntake.preview(brokenData), [brokenData])
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
            void downloadFile(
                {
                    filename: `broken_character_save_${new Date().toISOString()}.json`,
                    format: "broken-save-json",
                    source: "broken-save"
                },
                () => new Blob([brokenData], { type: "application/json" })
            ).catch(() => {
                setRecoveryError(
                    "Could not prepare your backup. Your original save is still kept in this browser. Please retry."
                )
            })
        }
    }

    const onRepair = () => {
        if (!repair.success) return
        try {
            characterIntake.applyApprovedRepair(brokenData, brokenError)
        } catch {
            setRecoveryError(
                "Could not save the repair and its recovery copy. Download your original save before freeing browser storage and trying again."
            )
            return
        }
        characterPersistence(queryClient).startDraft()
        setCharacter(repair.character)
        clearBrokenCharacter()
        trackCharacterRepair("applied", repairId, repair.changes, repair.character)
        setRecoveryError("")
    }

    return (
        <Modal
            opened={hasBrokenCharacter}
            trapFocus={!fileSaveOpen}
            aria-hidden={fileSaveOpen || undefined}
            onClose={() => {}}
            title="Character Data Error"
            centered
            size="xl"
            withCloseButton={false}
            closeOnClickOutside={false}
            closeOnEscape={false}
        >
            <div className={classes.body}>
                <div className={classes.fileRow}>
                    <span className={classes.fileIcon} aria-hidden="true">
                        <IconAlertTriangle size={20} stroke={1.6} />
                    </span>
                    <div>
                        <p className={classes.fileName}>Failed to load character from saved data</p>
                        <p className={classes.note}>
                            <strong>Error details:</strong> {describeBrokenAttribute(brokenError)}
                        </p>
                    </div>
                </div>
                {recoveryError && (
                    <Alert color="red" icon={<IconAlertTriangle size={16} />}>
                        {recoveryError}
                    </Alert>
                )}
                <div>
                    <Button
                        size="compact-sm"
                        variant="subtle"
                        color="gray"
                        rightSection={
                            <IconChevronDown
                                size={14}
                                className={classes.chevron}
                                data-open={detailsOpened || undefined}
                            />
                        }
                        aria-expanded={detailsOpened}
                        onClick={() => setDetailsOpened((value) => !value)}
                    >
                        {detailsOpened ? "Hide technical details" : "Show technical details"}
                    </Button>
                    {detailsOpened ? (
                        <pre className={classes.code} data-spaced>
                            {brokenError || "No error message"}
                        </pre>
                    ) : null}
                </div>
                <hr className={classes.rule} />
                {repair.success ? (
                    <div className={classes.body}>
                        <Alert
                            color="yellow"
                            icon={<IconAlertTriangle size={16} />}
                            title="Automatic repair may cause partial data loss"
                        >
                            {repair.changes.length === 0 ? (
                                "This save now passes validation. No data needs to be removed."
                            ) : (
                                <ScrollArea.Autosize mah={240} offsetScrollbars>
                                    <ul className={classes.list}>
                                        {repair.changes.map((change, index) => (
                                            <li key={index}>{change.description}</li>
                                        ))}
                                    </ul>
                                </ScrollArea.Autosize>
                            )}
                        </Alert>
                        <Button
                            color="orange"
                            leftSection={<IconTool size={16} />}
                            onClick={onRepair}
                        >
                            Auto-repair
                        </Button>
                    </div>
                ) : (
                    <p className={classes.note}>{repair.error}</p>
                )}
                <hr className={classes.rule} />
                <div className={classes.body}>
                    <SupportConversationButton
                        source="broken-save-modal"
                        variant="default"
                        fullWidth
                    >
                        Get help in support chat
                    </SupportConversationButton>
                    <Button
                        color="gray"
                        variant="subtle"
                        leftSection={<IconDownload size={16} />}
                        onClick={onDownload}
                    >
                        Download Broken Save Data
                    </Button>
                    <p className={classes.links}>
                        Find Odin on{" "}
                        <Anchor href={CONTACT_LINKS.reddit.href} target="_blank" rel="noreferrer">
                            {CONTACT_LINKS.reddit.label}
                        </Anchor>{" "}
                        or{" "}
                        <Anchor href={CONTACT_LINKS.bluesky.href} target="_blank" rel="noreferrer">
                            {CONTACT_LINKS.bluesky.label}
                        </Anchor>
                    </p>
                </div>
            </div>
        </Modal>
    )
}

export default BrokenSaveModal
