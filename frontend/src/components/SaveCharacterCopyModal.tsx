import { Alert, Button, Group, Modal, Stack, Text } from "@mantine/core"
import { useState } from "react"
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
    const [error, setError] = useState<string | null>(null)
    const close = () => {
        if (!create.isPending) {
            setError(null)
            onClose()
        }
    }
    const saveCopy = async () => {
        if (!source || create.isPending) return
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
                version: data.version
            })
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
            <Stack>
                <Text>
                    {source?.classification === "shared"
                        ? "You're viewing somebody else's character and can't save changes to the original."
                        : "We couldn't verify this character's saved copy, so your changes will be saved as a new character."}
                </Text>
                <Text size="sm">
                    Save as copy creates a character in your account and opens it for editing.
                </Text>
                {error && <Alert color="red">{error}</Alert>}
                <Group justify="flex-end">
                    <Button variant="default" onClick={close} disabled={create.isPending}>
                        OK
                    </Button>
                    <Button onClick={saveCopy} loading={create.isPending}>
                        Save as copy
                    </Button>
                </Group>
            </Stack>
        </Modal>
    )
}
