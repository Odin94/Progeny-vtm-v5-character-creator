import { CharacterOperationError } from "~/utils/characterOperationError"
import { Alert, Button, Group, Modal, Stack, Text } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import type { Character } from "~/data/Character"
import { useAuth } from "~/hooks/useAuth"
import { characterHttp } from "~/utils/http/characters"
import { useCharacterLocalStorage } from "~/hooks/useCharacterLocalStorage"
import { getCharacterSaveKey } from "~/modules/characterPersistence"
import { transitionCharacter } from "~/modules/characterTransition"
import { reportCharacterOperationFailure } from "~/utils/characterOperationAnalytics"

export default function DeletedCharacterDraftModal() {
    const client = useQueryClient()
    const { user, isAuthenticated, isLoading: authLoading } = useAuth()
    const [character, setCharacter, clearCharacter] = useCharacterLocalStorage()
    const accountId = user?.id
    const remote = useQuery({
        queryKey: ["deleted-draft-check", accountId, character.id],
        queryFn: () => characterHttp.get(character.id),
        enabled: isAuthenticated && !authLoading && !!accountId && !!character.id
    })
    const missing = remote.isError && (remote.error as { status?: number })?.status === 404
    const [pending, setPending] = useState(false)
    const [failure, setFailure] = useState("")
    const latest = useRef(character)
    latest.current = character
    // A cloud restore can succeed before local storage fails. Retry the local
    // installation using that same copy rather than creating another character.
    const restored = useRef<{
        accountId: string
        sourceId: string
        key: string
        character: Character
    } | null>(null)

    useEffect(() => {
        if (missing && isAuthenticated && character.id) {
            reportCharacterOperationFailure("restore-deleted-draft", undefined, {
                severity: "warning",
                reason: "not_found",
                characterId: character.id
            })
        }
    }, [missing, isAuthenticated, character.id, accountId])

    useEffect(() => {
        setFailure("")
        restored.current = null
    }, [accountId, character.id])

    const recover = (action: "restore" | "delete") => {
        if (!missing || !character.id || !accountId || pending) return
        const draft = structuredClone(character)
        const sourceKey = getCharacterSaveKey(draft)
        const matchesDraft = () =>
            latest.current.id === draft.id && getCharacterSaveKey(latest.current) === sourceKey
        void transitionCharacter(client, async (isCurrent, persistence) => {
            setPending(true)
            setFailure("")
            try {
                if (client.getQueryData<{ id: string }>(["auth", "me"])?.id !== accountId) {
                    throw new CharacterOperationError(
                        "account_changed",
                        "Your account changed. Try again."
                    )
                }
                await persistence.settle(draft.id)
                if (!isCurrent() || !matchesDraft()) return
                if (action === "restore") {
                    const previous = restored.current
                    const copy =
                        previous?.accountId === accountId && previous.sourceId === draft.id
                            ? previous.key === sourceKey
                                ? previous.character
                                : await persistence.save(
                                      {
                                          ...draft,
                                          id: previous.character.id,
                                          characterVersion: previous.character.characterVersion
                                      },
                                      { owned: true }
                                  )
                            : await persistence.save(draft, { owned: false, newDocument: true })
                    if (!isCurrent()) return
                    restored.current = {
                        accountId,
                        sourceId: draft.id,
                        key: sourceKey,
                        character: copy
                    }
                    if (!matchesDraft()) return
                    let installed = false
                    setCharacter((current) => {
                        if (current.id !== draft.id || getCharacterSaveKey(current) !== sourceKey)
                            return current
                        installed = true
                        return copy
                    })
                    if (!installed) return
                    notifications.show({
                        title: "Character restored",
                        message: "Your draft was saved as a new character in your account.",
                        color: "green"
                    })
                } else {
                    if (
                        !clearCharacter(
                            (current) =>
                                current.id === draft.id && getCharacterSaveKey(current) === sourceKey
                        )
                    )
                        return
                    notifications.show({
                        title: "Local draft deleted",
                        message: "The missing character's draft was removed from this browser.",
                        color: "green"
                    })
                }
                persistence.startDraft()
            } catch (error) {
                reportCharacterOperationFailure(
                    action === "restore" ? "restore-deleted-draft" : "delete-local-draft",
                    error,
                    { characterId: draft.id }
                )
                if (isCurrent() && matchesDraft())
                    setFailure(
                        action === "restore"
                            ? "Could not finish restoring this draft. Your local draft is still here. Try again."
                            : "Could not remove this draft from browser storage. Your draft is still here. Try again."
                    )
            } finally {
                setPending(false)
            }
        })
    }

    return (
        <Modal
            opened={!!character.id && isAuthenticated && missing}
            title="Saved character is missing"
            onClose={() => {}}
            withCloseButton={false}
            closeOnClickOutside={false}
            closeOnEscape={false}
            centered
        >
            <Stack>
                <Text>
                    The saved character for “{character.name}” no longer exists. This browser still
                    has its draft.
                </Text>
                <Text>
                    Restore it as a new saved copy, or delete the local draft to start fresh.
                </Text>
                {failure && (
                    <Alert color="red" role="alert">
                        {failure}
                    </Alert>
                )}
                <Group justify="flex-end">
                    <Button
                        color="red"
                        variant="outline"
                        disabled={pending}
                        onClick={() => recover("delete")}
                    >
                        Delete local draft
                    </Button>
                    <Button loading={pending} onClick={() => recover("restore")}>
                        Restore character
                    </Button>
                </Group>
            </Stack>
        </Modal>
    )
}
