import { useEffect, useRef, useState } from "react"
import { Button, Stack, Text } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { useQueryClient } from "@tanstack/react-query"
import type { Character } from "~/data/Character"
import { api } from "~/utils/api"
import { characterPersistence, getCharacterSaveKey } from "~/modules/characterPersistence"
import { createRecoveredCharacterCopy, preserveCharacterDraft } from "~/utils/characterDraft"
import { downloadJson } from "~/generator/utils"
import ConfirmActionModal from "./ConfirmActionModal"

export const CHARACTER_CONFLICT_EVENT = "progeny:character-conflict"
export type CharacterConflictRequest = {
    characterId: string
    browser?: Character
    backend?: Character
    onResolved?: (character: Character) => void
    onClose?: () => void
}
export type ConflictChoice = "browser" | "backend" | "copy"

export default function CharacterConflictModal({
    opened,
    browser,
    originalBackend,
    onClose,
    onResolved
}: {
    opened: boolean
    browser: Character
    originalBackend?: Character
    onClose: () => void
    onResolved: (character: Character) => void
}) {
    const client = useQueryClient()
    const persistence = characterPersistence(client)
    const [backend, setBackend] = useState<Character | null>(null)
    const [reviewedRevision, setReviewedRevision] = useState<number | null>(null)
    const [error, setError] = useState("")
    const [busy, setBusy] = useState(false)
    const [confirmOverwrite, setConfirmOverwrite] = useState(false)
    const latest = useRef(browser)
    latest.current = browser
    const operation = useRef(0)
    useEffect(() => {
        const generation = ++operation.current
        setBackend(null)
        setReviewedRevision(null)
        setError("")
        setBusy(false)
        setConfirmOverwrite(false)
        if (!opened || !browser.id) return
        const isCurrent = persistence.replacementGuard()
        api.getCharacter(browser.id, isCurrent)
            .then((saved) => {
                if (generation !== operation.current || !isCurrent()) return
                if (saved.shared === true || saved.canEdit !== true) {
                    setError(
                        "This character is read-only. Close this dialog and save a copy instead."
                    )
                    return
                }
                setReviewedRevision(saved.characterVersion)
                setBackend(
                    originalBackend ?? {
                        ...saved.data,
                        id: saved.id,
                        name: saved.name,
                        characterVersion: saved.characterVersion
                    }
                )
            })
            .catch(() => {
                if (generation === operation.current)
                    setError(
                        "Could not load the backend version. Close and retry; your browser draft is unchanged."
                    )
            })
        return () => {
            operation.current += 1
        }
    }, [opened, browser.id, persistence, originalBackend])

    const resolve = async (choice: ConflictChoice) => {
        if (!backend || reviewedRevision === null || busy) return
        const generation = operation.current
        const isCurrent = persistence.replacementGuard()
        const draft = structuredClone(latest.current)
        setBusy(true)
        setError("")
        try {
            // Review again if another device saved since the dialog opened.
            const fresh = await api.getCharacter(draft.id, isCurrent)
            if (!isCurrent() || generation !== operation.current) return
            if (fresh.shared === true || fresh.canEdit !== true)
                throw new Error("This character is now read-only.")
            if (fresh.characterVersion !== reviewedRevision) {
                setReviewedRevision(fresh.characterVersion)
                setBackend(
                    originalBackend ?? {
                        ...fresh.data,
                        id: fresh.id,
                        name: fresh.name,
                        characterVersion: fresh.characterVersion
                    }
                )
                throw new Error(
                    "The backend version changed. Review the updated version and choose again."
                )
            }
            if (getCharacterSaveKey(latest.current) !== getCharacterSaveKey(draft))
                throw new Error("The browser version changed. Review it and choose again.")
            preserveCharacterDraft(draft, "Before resolving a save conflict")
            preserveCharacterDraft(backend, "Backend version before resolving a save conflict")
            const resolved =
                choice === "backend" && !originalBackend
                    ? backend
                    : await persistence.save(
                          choice === "copy"
                              ? createRecoveredCharacterCopy(draft)
                              : {
                                    ...(choice === "backend" ? backend : draft),
                                    characterVersion: reviewedRevision
                                },
                          choice === "copy"
                              ? { owned: false, newDocument: true, force: true }
                              : { owned: true, force: true }
                      )
            if (!isCurrent() || generation !== operation.current) return
            // Keep edits made while saving on top of the acknowledged revision.
            const next =
                choice === "backend"
                    ? resolved
                    : {
                          ...latest.current,
                          id: resolved.id,
                          characterVersion: resolved.characterVersion
                      }
            // Keep successful write acknowledgements so autosave cannot mistake
            // this resolution for an external write or save the same draft again.
            if (choice === "backend" && !originalBackend) persistence.startDraft()
            onResolved(next)
            onClose()
            if (choice === "copy") {
                notifications.show({
                    title: "Character saved",
                    message: "Browser version saved as a new character.",
                    color: "green"
                })
            } else {
                const snapshots = {
                    characterId: draft.id,
                    browser: structuredClone(draft),
                    backend: structuredClone(backend)
                }
                const toastId = notifications.show({
                    title: "Character version kept",
                    color: "green",
                    autoClose: false,
                    message: (
                        <Stack gap="xs">
                            <Text size="sm">
                                {choice === "browser"
                                    ? "Browser version saved over the backend version."
                                    : "Backend version replaced the browser version."}
                            </Text>
                            <Button
                                size="xs"
                                variant="light"
                                onClick={() => {
                                    if (!persistence.isCurrentSession()) return
                                    notifications.hide(toastId)
                                    window.dispatchEvent(
                                        new CustomEvent(CHARACTER_CONFLICT_EVENT, {
                                            detail: snapshots
                                        })
                                    )
                                }}
                            >
                                Undo
                            </Button>
                        </Stack>
                    )
                })
            }
        } catch (failure) {
            if (generation === operation.current)
                setError(
                    failure instanceof Error
                        ? failure.message
                        : "Could not resolve the conflict. Your browser draft is unchanged."
                )
        } finally {
            if (generation === operation.current) setBusy(false)
        }
    }
    const backup = async (value: Character, source: "browser" | "backend") => {
        try {
            await downloadJson(value, `progeny_${source}_v${value.characterVersion ?? 0}.json`)
        } catch {
            setError("Could not download the JSON backup. Please retry.")
        }
    }
    if (opened && confirmOverwrite) {
        return (
            <ConfirmActionModal
                opened
                title="Overwrite backend version?"
                body="Keeping the browser version will overwrite the backend version of this character. Go back and download the backend JSON first if you want a backup."
                confirmLabel="Overwrite backend"
                cancelLabel="Back"
                onClose={() => setConfirmOverwrite(false)}
                onConfirm={() => {
                    setConfirmOverwrite(false)
                    void resolve("browser")
                }}
                disabled={!backend || busy}
            />
        )
    }
    return (
        <ConfirmActionModal
            opened={opened}
            onClose={() => {
                if (!busy) onClose()
            }}
            title="Choose a character version"
            body={
                originalBackend
                    ? "Choose again between the original versions. Your choice replaces the current active version. Download backups first if you want both."
                    : "Keeping one version replaces the other active version. Download backups first if you want both."
            }
            confirmLabel="Keep browser"
            onConfirm={() => setConfirmOverwrite(true)}
            loading={busy}
            disabled={!backend || busy}
        >
            <Stack gap="sm">
                <Text ta="center">
                    Browser version: {browser.characterVersion ?? 0} · Backend version:{" "}
                    {backend?.characterVersion ?? (error ? "Unavailable" : "Loading…")}
                </Text>
                <Stack gap="xs">
                    <Button variant="light" onClick={() => void backup(browser, "browser")}>
                        Download browser JSON
                    </Button>
                    <Button
                        variant="light"
                        disabled={!backend}
                        onClick={() => backend && void backup(backend, "backend")}
                    >
                        Download backend JSON
                    </Button>
                </Stack>
                <Button disabled={!backend || busy} onClick={() => void resolve("backend")}>
                    Keep backend
                </Button>
                <Button
                    variant="light"
                    disabled={!backend || busy || !browser.name.trim()}
                    onClick={() => void resolve("copy")}
                >
                    Save browser as new
                </Button>
                <Text size="sm" ta="center">
                    Save as new keeps the existing backend character too.
                </Text>
                {error && (
                    <Text role="alert" c="red">
                        {error}
                    </Text>
                )}
            </Stack>
        </ConfirmActionModal>
    )
}
