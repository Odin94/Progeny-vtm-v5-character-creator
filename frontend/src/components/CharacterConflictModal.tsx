import {
    conflictTelemetryId,
    trackCharacterConflict,
    type ConflictTelemetryContext,
    type ConflictTelemetryDetails
} from "~/utils/characterConflictAnalytics"
import { reportCharacterOperationFailure } from "~/utils/characterOperationAnalytics"
import {
    readBrowserCharacterChangeTime,
    markBrowserCharacterReplacement
} from "~/utils/characterChangeTime"
import { useEffect, useMemo, useRef, useState } from "react"
import { Button, Group, Paper, SimpleGrid, Stack, Text } from "@mantine/core"
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
    undoTelemetry?: { dialogId: string; resolutionId: string }
    browser?: Character
    backend?: Character
    browserChangedAt?: string | null
    backendUpdatedAt?: string | null
    onResolved?: (character: Character) => void
    onClose?: () => void
}
const formatVersionDate = (value: string | null) =>
    value && Number.isFinite(Date.parse(value))
        ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(
              new Date(value)
          )
        : "Date not recorded"

export type ConflictChoice = "browser" | "backend" | "copy"

export default function CharacterConflictModal({
    opened,
    browser,
    originalBackend,
    originalBrowserChangedAt,
    originalBackendUpdatedAt,
    undoTelemetry,
    onClose,
    onResolved
}: {
    opened: boolean
    browser: Character
    originalBackend?: Character
    originalBrowserChangedAt?: string | null
    originalBackendUpdatedAt?: string | null
    undoTelemetry?: CharacterConflictRequest["undoTelemetry"]
    onClose: () => void
    onResolved: (character: Character, choice: ConflictChoice) => void
}) {
    const client = useQueryClient()
    const persistence = characterPersistence(client)
    const [backend, setBackend] = useState<Character | null>(null)
    const [backendUpdatedAt, setBackendUpdatedAt] = useState<string | null>(null)
    const browserChangedAt = useMemo(
        () =>
            originalBrowserChangedAt !== undefined
                ? originalBrowserChangedAt
                : opened
                  ? readBrowserCharacterChangeTime(browser)
                  : null,
        [browser, opened, originalBrowserChangedAt]
    )
    const [reviewedRevision, setReviewedRevision] = useState<number | null>(null)
    const [error, setError] = useState("")
    const [busy, setBusy] = useState(false)
    const [confirmChoice, setConfirmChoice] = useState<"browser" | "backend" | null>(null)
    const latest = useRef(browser)
    latest.current = browser
    const operation = useRef(0)
    const telemetry = useRef<ConflictTelemetryContext | null>(null)
    const readyReported = useRef(false)
    const track = (
        event: Parameters<typeof trackCharacterConflict>[0],
        details: ConflictTelemetryDetails = {}
    ) => {
        if (telemetry.current)
            trackCharacterConflict(event, telemetry.current, {
                local_version: latest.current.characterVersion,
                remote_version: backend?.characterVersion,
                reviewed_version: reviewedRevision ?? undefined,
                ...details
            })
    }
    const selectChoice = (choice: ConflictChoice) => {
        track("choice_selected", { choice })
        if (choice === "copy") void resolve(choice)
        else setConfirmChoice(choice)
    }
    useEffect(() => {
        const generation = ++operation.current
        setBackend(null)
        setBackendUpdatedAt(null)
        setReviewedRevision(null)
        setError("")
        setBusy(false)
        setConfirmChoice(null)
        if (!opened) {
            telemetry.current = null
            readyReported.current = false
            return
        }
        if (!browser.id) return
        if (
            !telemetry.current ||
            telemetry.current.character_id !== browser.id ||
            telemetry.current.parent_resolution_id !== undoTelemetry?.resolutionId
        ) {
            telemetry.current = {
                dialog_id: conflictTelemetryId(),
                character_id: browser.id,
                is_undo: !!originalBackend,
                parent_dialog_id: undoTelemetry?.dialogId,
                parent_resolution_id: undoTelemetry?.resolutionId
            }
            readyReported.current = false
            trackCharacterConflict("opened", telemetry.current, {
                local_version: browser.characterVersion
            })
        }
        const context = telemetry.current
        const isCurrent = persistence.replacementGuard()
        api.getCharacter(browser.id, isCurrent)
            .then((saved) => {
                if (generation !== operation.current || !isCurrent()) return
                if (saved.shared === true || saved.canEdit !== true) {
                    trackCharacterConflict("resolution_outcome", context, {
                        outcome: "blocked",
                        reason: "read_only",
                        phase: "load"
                    })
                    setError(
                        "This character is read-only. Close this dialog and save a copy instead."
                    )
                    return
                }
                setBackendUpdatedAt(
                    originalBackend ? (originalBackendUpdatedAt ?? null) : (saved.updatedAt ?? null)
                )
                if (!readyReported.current) {
                    readyReported.current = true
                    trackCharacterConflict("ready", context, {
                        local_version: browser.characterVersion,
                        remote_version: originalBackend?.characterVersion ?? saved.characterVersion,
                        reviewed_version: saved.characterVersion
                    })
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
            .catch((failure) => {
                if (generation === operation.current && isCurrent()) {
                    reportCharacterOperationFailure("load", failure, {
                        characterId: browser.id,
                        conflictContext: context
                    })
                    trackCharacterConflict("resolution_outcome", context, {
                        outcome: "failure",
                        reason: "request_failed",
                        phase: "load"
                    })
                    setError(
                        "Could not load the backend version. Close and retry; your browser draft is unchanged."
                    )
                }
            })
        return () => {
            operation.current += 1
        }
    }, [opened, browser.id, persistence, originalBackend, originalBackendUpdatedAt, undoTelemetry])

    const resolve = async (choice: ConflictChoice) => {
        if (!backend || reviewedRevision === null || busy) return
        const generation = operation.current
        const context = telemetry.current!
        const resolutionId = conflictTelemetryId()
        const attempt = (
            event: Parameters<typeof trackCharacterConflict>[0],
            details: ConflictTelemetryDetails = {}
        ) =>
            trackCharacterConflict(event, context, {
                choice,
                resolution_id: resolutionId,
                local_version: browser.characterVersion,
                remote_version: backend.characterVersion,
                reviewed_version: reviewedRevision,
                ...details
            })
        attempt("resolution_started")
        let resolutionFinished = false
        let blockedReason: ConflictTelemetryDetails["reason"]
        let phase: ConflictTelemetryDetails["phase"] = "review"
        const isCurrent = persistence.replacementGuard()
        const draft = structuredClone(latest.current)
        setBusy(true)
        setError("")
        let requestOperation: "load" | "save" | "create" | undefined = "load"
        try {
            // Review again if another device saved since the dialog opened.
            const fresh = await api.getCharacter(draft.id, isCurrent)
            requestOperation = undefined
            if (!isCurrent() || generation !== operation.current) {
                attempt("resolution_outcome", {
                    outcome: "interrupted",
                    reason: !isCurrent() ? "account_changed" : "dialog_changed",
                    phase
                })
                return
            }
            if (fresh.shared === true || fresh.canEdit !== true) {
                blockedReason = "read_only"
                throw new Error("This character is now read-only.")
            }
            if (fresh.characterVersion !== reviewedRevision) {
                blockedReason = "backend_changed"
                setBackendUpdatedAt(
                    originalBackend ? (originalBackendUpdatedAt ?? null) : (fresh.updatedAt ?? null)
                )
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
            if (getCharacterSaveKey(latest.current) !== getCharacterSaveKey(draft)) {
                blockedReason = "browser_changed"
                throw new Error("The browser version changed. Review it and choose again.")
            }
            preserveCharacterDraft(draft, "Before resolving a save conflict")
            preserveCharacterDraft(backend, "Backend version before resolving a save conflict")
            requestOperation =
                choice === "backend" && !originalBackend
                    ? undefined
                    : choice === "copy"
                      ? "create"
                      : "save"
            phase = requestOperation ?? "apply"
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
            if (!isCurrent() || generation !== operation.current) {
                attempt("resolution_outcome", {
                    outcome: "interrupted",
                    reason: !isCurrent() ? "account_changed" : "dialog_changed",
                    phase
                })
                return
            }
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
            const sourceChangedAt =
                choice === "backend"
                    ? backendUpdatedAt
                    : (readBrowserCharacterChangeTime(latest.current) ?? browserChangedAt)
            phase = "apply"
            requestOperation = undefined
            onResolved(markBrowserCharacterReplacement(next, sourceChangedAt), choice)
            resolutionFinished = true
            attempt("resolution_outcome", {
                outcome: "success",
                resulting_version: resolved.characterVersion
            })
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
                    undoTelemetry: { dialogId: context.dialog_id, resolutionId },
                    browser: structuredClone(draft),
                    backend: structuredClone(backend),
                    browserChangedAt,
                    backendUpdatedAt
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
                                style={{ alignSelf: "flex-start" }}
                                onClick={() => {
                                    if (!persistence.isCurrentSession()) {
                                        attempt("undo_blocked", { reason: "account_changed" })
                                        return
                                    }
                                    attempt("undo_requested")
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
            const modalConflict =
                requestOperation === "save" && (failure as { status?: number })?.status === 409
            if (!resolutionFinished)
                attempt("resolution_outcome", {
                    outcome:
                        !isCurrent() || generation !== operation.current
                            ? "interrupted"
                            : blockedReason || modalConflict
                              ? "blocked"
                              : "failure",
                    reason: !isCurrent()
                        ? "account_changed"
                        : generation !== operation.current
                          ? "dialog_changed"
                          : (blockedReason ??
                            (modalConflict
                                ? "backend_changed"
                                : requestOperation
                                  ? "request_failed"
                                  : "application_failed")),
                    phase
                })
            if (
                !requestOperation &&
                !blockedReason &&
                generation === operation.current &&
                isCurrent()
            )
                reportCharacterOperationFailure("resolve-conflict", failure, {
                    characterId: draft.id,
                    conflictContext: context,
                    resolutionId,
                    conflictChoice: choice
                })
            if (requestOperation && generation === operation.current && isCurrent()) {
                const modalConflict =
                    requestOperation === "save" && (failure as { status?: number })?.status === 409
                reportCharacterOperationFailure(requestOperation, failure, {
                    characterId: draft.id,
                    conflictContext: context,
                    resolutionId,
                    conflictChoice: choice,
                    ...(modalConflict ? { resolution: "modal" as const } : {})
                })
            }
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
        const context = telemetry.current!
        track("backup_started", { backup_source: source })
        try {
            await downloadJson(value, `progeny_${source}_v${value.characterVersion ?? 0}.json`)
            trackCharacterConflict("backup_outcome", context, {
                backup_source: source,
                outcome: "success"
            })
        } catch (failure) {
            trackCharacterConflict("backup_outcome", context, {
                backup_source: source,
                outcome: "failure",
                reason: "download_failed"
            })
            reportCharacterOperationFailure("download-backup", failure, {
                characterId: value.id,
                conflictContext: context
            })
            setError("Could not download the JSON backup. Please retry.")
        }
    }
    if (opened && confirmChoice) {
        return (
            <ConfirmActionModal
                opened
                title={
                    confirmChoice === "browser"
                        ? "Overwrite backend version?"
                        : "Replace browser version?"
                }
                body={
                    confirmChoice === "browser"
                        ? "Keeping the browser version will delete the current backend version by overwriting it. Go back and download the backend JSON first if you want a backup."
                        : originalBackend
                          ? "Keeping this backend version will delete the current browser version and overwrite the current backend contents. Go back and download backups first if you want to keep them."
                          : "Keeping the backend version will delete the current browser version by replacing it. Go back and download the browser JSON first if you want a backup."
                }
                confirmLabel={confirmChoice === "browser" ? "Overwrite backend" : "Replace browser"}
                cancelLabel="Back"
                onClose={() => {
                    track("confirmation_back", { choice: confirmChoice })
                    setConfirmChoice(null)
                }}
                onConfirm={() => {
                    track("confirmed", { choice: confirmChoice })
                    setConfirmChoice(null)
                    void resolve(confirmChoice)
                }}
                disabled={!backend || busy}
            />
        )
    }
    return (
        <ConfirmActionModal
            opened={opened}
            size="lg"
            footer={
                <Group justify="space-between" wrap="nowrap">
                    <Button
                        disabled={!backend || busy}
                        loading={busy}
                        onClick={() => selectChoice("browser")}
                    >
                        Keep browser
                    </Button>
                    <Button disabled={!backend || busy} onClick={() => selectChoice("backend")}>
                        Keep backend
                    </Button>
                </Group>
            }
            onClose={() => {
                if (!busy) {
                    track("dismissed")
                    onClose()
                }
            }}
            title="Choose a character version"
            body={
                originalBackend
                    ? "Choose again between the original versions. Your choice replaces the current active version. Download backups first if you want both."
                    : "Keeping one version replaces the other active version. Download backups first if you want both."
            }
            confirmLabel="Keep browser"
            onConfirm={() => selectChoice("browser")}
            loading={busy}
            disabled={!backend || busy}
        >
            <Stack gap="md">
                <Text ta="center">
                    Browser version: {browser.characterVersion ?? 0} · Backend version:{" "}
                    {backend?.characterVersion ?? (error ? "Unavailable" : "Loading…")}
                </Text>
                <SimpleGrid cols={2} spacing="sm">
                    <Stack gap={4}>
                        <Text size="sm" fw={600}>
                            Browser last changed
                        </Text>
                        <Text size="sm" c="dimmed">
                            {formatVersionDate(browserChangedAt)}
                        </Text>
                    </Stack>
                    <Stack gap={4}>
                        <Text size="sm" fw={600}>
                            Backend saved
                        </Text>
                        <Text size="sm" c="dimmed">
                            {formatVersionDate(backendUpdatedAt)}
                        </Text>
                    </Stack>
                </SimpleGrid>
                <Paper withBorder p="md" radius="md">
                    <Stack gap="xs">
                        <Text fw={600} ta="center">
                            Keep both versions
                        </Text>
                        <Button
                            color="grape"
                            disabled={!backend || busy || !browser.name.trim()}
                            onClick={() => selectChoice("copy")}
                        >
                            Save browser as new
                        </Button>
                        <Text size="sm" ta="center" c="dimmed">
                            Creates a new character and keeps the existing backend character.
                        </Text>
                    </Stack>
                </Paper>
                <Stack gap="xs">
                    <Text size="sm" c="dimmed">
                        Download backups
                    </Text>
                    <SimpleGrid cols={2} spacing="sm">
                        <Button
                            color="gray"
                            variant="light"
                            size="sm"
                            aria-label="Download browser JSON"
                            onClick={() => void backup(browser, "browser")}
                        >
                            Browser JSON
                        </Button>
                        <Button
                            color="gray"
                            variant="light"
                            size="sm"
                            aria-label="Download backend JSON"
                            disabled={!backend}
                            onClick={() => backend && void backup(backend, "backend")}
                        >
                            Backend JSON
                        </Button>
                    </SimpleGrid>
                </Stack>
                {error && (
                    <Text role="alert" c="red">
                        {error}
                    </Text>
                )}
            </Stack>
        </ConfirmActionModal>
    )
}
