import { Alert, Button, Modal } from "@mantine/core"
import { IconAlertTriangle, IconCopy } from "@tabler/icons-react"
import classes from "./AppModals.module.css"
import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { characterPersistence } from "~/modules/characterPersistence"
import posthog from "posthog-js"
import type { Character } from "~/data/Character"
import type { SetCharacter } from "~/hooks/useCharacterLocalStorage"
import { useCreateCharacter } from "~/hooks/useCharacters"

export type CharacterCopySource = {
    character: Character
    ownerId?: string
    sharedBy?: string | null
    classification: "shared" | "unknown"
    viewerId?: string
}

export default function SaveCharacterCopyModal({
    source,
    onClose,
    setCharacter
}: {
    source: CharacterCopySource | null
    onClose: () => void
    setCharacter: SetCharacter
}) {
    const create = useCreateCharacter()
    const persistence = characterPersistence(useQueryClient())
    const [error, setError] = useState<string | null>(null)
    const close = () => {
        if (!create.isPending) {
            setError(null)
            onClose()
        }
    }
    const saveCopy = async () => {
        if (!source || create.isPending) return
        const isCurrent = persistence.replacementGuard()
        const properties = {
            source_character_id: source.character.id,
            source_owner_id: source.ownerId ?? null,
            source_shared_by: source.sharedBy ?? null,
            ownership_classification: source.classification,
            viewer_user_id: source.viewerId ?? null
        }
        const track = (event: string, extra = {}) => {
            try {
                posthog.capture(event, { ...properties, ...extra })
            } catch {
                /* Analytics must not block recovery. */
            }
        }
        track("character_save_as_copy_requested")
        setError(null)
        try {
            const data = { ...source.character, id: "", characterVersion: 0 }
            const saved = await create.mutateAsync({
                name: data.name.trim() || "Unnamed character",
                data,
                version: data.version,
                newDocument: true
            })
            if (!isCurrent()) return
            persistence.startDraft()
            setCharacter({ ...saved.data, id: saved.id, characterVersion: saved.characterVersion })
            track("character_save_as_copy_applied", { new_character_id: saved.id })
            onClose()
        } catch (cause) {
            setError(
                cause instanceof Error ? cause.message : "Unable to save a copy. Please try again."
            )
            track("character_save_as_copy_failed")
        }
    }
    return (
        <Modal
            opened={!!source}
            onClose={close}
            title="Save character"
            closeOnClickOutside={!create.isPending}
            closeOnEscape={!create.isPending}
            withCloseButton={!create.isPending}
        >
            <div className={classes.body}>
                <p className={classes.lede}>
                    {source?.classification === "shared"
                        ? "You're viewing somebody else's character and can't save changes to the original."
                        : "We couldn't verify this character's saved copy, so your changes will be saved as a new character."}
                </p>
                <p className={classes.note}>
                    Save as copy creates a character in your account and opens it for editing.
                </p>
                {error && (
                    <Alert color="red" icon={<IconAlertTriangle size={16} />}>
                        {error}
                    </Alert>
                )}
                <hr className={classes.rule} />
                <div className={classes.actions}>
                    <Button
                        variant="subtle"
                        color="gray"
                        onClick={close}
                        disabled={create.isPending}
                    >
                        OK
                    </Button>
                    <Button
                        leftSection={<IconCopy size={16} />}
                        onClick={saveCopy}
                        loading={create.isPending}
                    >
                        Save as copy
                    </Button>
                </div>
            </div>
        </Modal>
    )
}
