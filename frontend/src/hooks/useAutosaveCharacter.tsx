import { reportCharacterOperationFailure } from "~/utils/characterOperationAnalytics"
import { notifications } from "@mantine/notifications"
import { preserveCharacterDraft } from "~/utils/characterDraft"
import type { CharacterApiResponse } from "~/utils/characterApi"
import { useQueryClient } from "@tanstack/react-query"
import { useCallback, useEffect, useMemo, useRef } from "react"
import { type Character } from "~/data/Character"
import type { SetCharacter } from "~/hooks/useCharacterLocalStorage"
import { type ApiError } from "~/utils/api"
import {
    characterPersistence,
    getCharacterSaveKey as getAutosaveKey
} from "~/modules/characterPersistence"
export {
    getCharacterSaveKey as getAutosaveKey,
    isOwnedSavedCharacter
} from "~/modules/characterPersistence"

export const CHARACTER_AUTOSAVE_DELAY_MS = 900
export const CHARACTER_AUTOSAVE_RETRY_DELAY_MS = 3000

const shouldRetry = (error: unknown) => {
    const status = (error as ApiError)?.status
    return status === undefined || status === 408 || status === 429 || status >= 500
}

const confirmedBaseKey = (id: string) => `progeny-character-confirmed:${id}`
const readConfirmedBase = (id: string): Character | null => {
    try {
        return JSON.parse(localStorage.getItem(confirmedBaseKey(id)) ?? "null")
    } catch {
        return null
    }
}
const writeConfirmedBase = (id: string, character: Character) => {
    try {
        localStorage.setItem(confirmedBaseKey(id), JSON.stringify(character))
    } catch {
        /* Remote revision comparison still protects the active local draft. */
    }
}
// A save can reach the server after this tab stops waiting for the response,
// e.g. on reload. Remember what was sent so the next load can recognize that
// cloud revision as this device's own write instead of a conflict.
const pendingWriteKey = (id: string) => `progeny-character-pending:${id}`
const readPendingWrite = (id: string) => {
    try {
        return localStorage.getItem(pendingWriteKey(id))
    } catch {
        return null
    }
}
const writePendingWrite = (id: string, saveKey: string) => {
    try {
        localStorage.setItem(pendingWriteKey(id), saveKey)
    } catch {
        /* Without it, a lost save response is reported as a conflict. */
    }
}
const conflictReportKey = (id: string) => `progeny-character-conflict-reported:${id}`
const notifyConflict = (
    characterId: string,
    versions: { localVersion?: number; remoteVersion?: number; hasConfirmedBase?: boolean }
) => {
    // The guard runs again on every load. Report each blocked draft once.
    const signature = `${versions.localVersion ?? ""}:${versions.remoteVersion ?? ""}`
    let reported = false
    try {
        reported = localStorage.getItem(conflictReportKey(characterId)) === signature
        if (!reported) localStorage.setItem(conflictReportKey(characterId), signature)
    } catch {
        /* Report again rather than lose the conflict. */
    }
    if (!reported)
        reportCharacterOperationFailure("autosave", undefined, {
            reason: "version_conflict",
            characterId,
            ...versions
        })
    notifications.show({
        id: "character-save-conflict",
        title: "Newer cloud changes found",
        message:
            "Your local draft is kept on this device. Use Recover interrupted drafts in the sheet menu to download a separate copy before loading the cloud version.",
        color: "yellow",
        autoClose: false
    })
}

export const useAutosaveCharacter = (
    character: Character,
    setCharacter: SetCharacter,
    enabled: boolean,
    remoteCharacter?: CharacterApiResponse
) => {
    const queryClient = useQueryClient()
    const autosaveKey = useMemo(() => getAutosaveKey(character), [character])
    const latestCharacterRef = useRef(character)
    const latestAutosaveKeyRef = useRef(autosaveKey)
    const setCharacterRef = useRef(setCharacter)
    const enabledRef = useRef(enabled)
    const activeCharacterIdRef = useRef<string | null>(null)
    const lastSavedKeyRef = useRef<string | null>(null)
    const savedVersionRef = useRef<number | null>(null)
    const blockedKeyRef = useRef<string | null>(null)
    const saveInFlightRef = useRef(false)
    const saveRequestedRef = useRef(false)
    const timeoutRef = useRef<number | undefined>(undefined)
    const mountedRef = useRef(false)
    const generationRef = useRef(0)
    const saveLatestRef = useRef<() => Promise<void>>(async () => undefined)
    const scheduleSaveRef = useRef<(delay?: number) => void>(() => undefined)

    latestCharacterRef.current = character
    latestAutosaveKeyRef.current = autosaveKey
    setCharacterRef.current = setCharacter
    enabledRef.current = enabled

    const clearScheduledSave = useCallback(() => {
        if (timeoutRef.current !== undefined) {
            window.clearTimeout(timeoutRef.current)
            timeoutRef.current = undefined
        }
    }, [])

    const scheduleSave = useCallback(
        (delay = CHARACTER_AUTOSAVE_DELAY_MS) => {
            clearScheduledSave()
            timeoutRef.current = window.setTimeout(() => {
                timeoutRef.current = undefined
                void saveLatestRef.current()
            }, delay)
        },
        [clearScheduledSave]
    )

    scheduleSaveRef.current = scheduleSave

    const saveLatest = useCallback(async () => {
        const characterId = activeCharacterIdRef.current

        if (!mountedRef.current || !enabledRef.current || !characterId) return

        if (saveInFlightRef.current) {
            saveRequestedRef.current = true
            return
        }

        const characterToSave = latestCharacterRef.current
        const savedKey = getAutosaveKey(characterToSave)

        if (
            characterToSave.id !== characterId ||
            !characterToSave.name.trim() ||
            savedKey === lastSavedKeyRef.current ||
            blockedKeyRef.current !== null ||
            savedVersionRef.current === null
        ) {
            return
        }

        const saveGeneration = generationRef.current
        saveInFlightRef.current = true
        saveRequestedRef.current = false
        let retryScheduled = false
        let followupSuppressed = false

        try {
            writePendingWrite(characterId, savedKey)
            const savedCharacter = await characterPersistence(queryClient).save(characterToSave, {
                owned: true
            })

            if (
                !mountedRef.current ||
                generationRef.current !== saveGeneration ||
                activeCharacterIdRef.current !== characterId
            ) {
                return
            }

            lastSavedKeyRef.current = savedKey
            const savedVersion =
                savedCharacter.characterVersion ?? characterToSave.characterVersion ?? 0

            savedVersionRef.current = savedVersion
            writeConfirmedBase(characterId, { ...characterToSave, characterVersion: savedVersion })
            setCharacterRef.current((currentCharacter) =>
                currentCharacter.id === characterId
                    ? { ...currentCharacter, characterVersion: savedVersion }
                    : currentCharacter
            )
        } catch (error) {
            if (
                mountedRef.current &&
                generationRef.current === saveGeneration &&
                activeCharacterIdRef.current === characterId
            ) {
                if ((error as ApiError)?.status !== 409) {
                    reportCharacterOperationFailure("autosave", error, {
                        severity: shouldRetry(error) ? "warning" : undefined,
                        characterId
                    })
                }
                console.warn("Failed to autosave character:", error)

                if (shouldRetry(error)) {
                    retryScheduled = true
                    scheduleSaveRef.current(CHARACTER_AUTOSAVE_RETRY_DELAY_MS)
                } else {
                    followupSuppressed = true
                    if ((error as ApiError)?.status === 409) {
                        blockedKeyRef.current = savedKey
                        preserveCharacterDraft(latestCharacterRef.current, "Cloud save conflict")
                        notifyConflict(characterId, {
                            localVersion: characterToSave.characterVersion
                        })
                        void queryClient.invalidateQueries({ queryKey: ["characters"] })
                    }
                }
            }
        } finally {
            saveInFlightRef.current = false

            if (
                mountedRef.current &&
                enabledRef.current &&
                activeCharacterIdRef.current &&
                !retryScheduled &&
                !followupSuppressed &&
                (saveRequestedRef.current ||
                    latestAutosaveKeyRef.current !== lastSavedKeyRef.current)
            ) {
                saveRequestedRef.current = false
                scheduleSaveRef.current()
            }
        }
    }, [queryClient])

    saveLatestRef.current = saveLatest

    useEffect(() => {
        mountedRef.current = true

        return () => {
            mountedRef.current = false
            generationRef.current += 1
            clearScheduledSave()
        }
    }, [clearScheduledSave])

    useEffect(() => {
        const characterId = character.id || null
        if (activeCharacterIdRef.current !== characterId) {
            generationRef.current += 1
            activeCharacterIdRef.current = characterId
            lastSavedKeyRef.current = null
            savedVersionRef.current = null
            blockedKeyRef.current = null
            saveRequestedRef.current = false
            clearScheduledSave()
        }
        if (!enabled || !characterId) {
            clearScheduledSave()
            return
        }
        if (remoteCharacter?.id === characterId && !saveInFlightRef.current) {
            const remote = {
                ...remoteCharacter.data,
                id: characterId,
                name: remoteCharacter.name,
                characterVersion: remoteCharacter.characterVersion
            }
            const remoteKey = getAutosaveKey(remote)
            if (
                remoteKey === autosaveKey &&
                remote.characterVersion >=
                    (savedVersionRef.current ?? character.characterVersion ?? 0)
            ) {
                blockedKeyRef.current = null
                lastSavedKeyRef.current = remoteKey
                savedVersionRef.current = remote.characterVersion
                writeConfirmedBase(characterId, remote)
                if (character.characterVersion !== remote.characterVersion)
                    setCharacterRef.current(remote)
                return
            }
            if (
                savedVersionRef.current !== null &&
                remote.characterVersion > savedVersionRef.current
            ) {
                if (autosaveKey === lastSavedKeyRef.current) {
                    lastSavedKeyRef.current = remoteKey
                    savedVersionRef.current = remote.characterVersion
                    writeConfirmedBase(characterId, remote)
                    setCharacterRef.current(remote)
                    return
                }
                if (blockedKeyRef.current === null) {
                    blockedKeyRef.current = autosaveKey
                    preserveCharacterDraft(
                        character,
                        "Cloud revision changed while local draft was pending"
                    )
                    notifyConflict(characterId, {
                        localVersion: savedVersionRef.current ?? undefined,
                        remoteVersion: remote.characterVersion
                    })
                }
            }
        }
        if (blockedKeyRef.current !== null) return
        if (lastSavedKeyRef.current === null) {
            if (!remoteCharacter || remoteCharacter.id !== characterId) return
            const remote = {
                ...remoteCharacter.data,
                id: characterId,
                name: remoteCharacter.name,
                characterVersion: remoteCharacter.characterVersion
            }
            const remoteKey = getAutosaveKey(remote)
            const localVersion = character.characterVersion ?? 0
            const confirmedBase = readConfirmedBase(characterId)
            if (remote.characterVersion !== localVersion && remoteKey !== autosaveKey) {
                if (confirmedBase && getAutosaveKey(confirmedBase) === autosaveKey) {
                    lastSavedKeyRef.current = remoteKey
                    savedVersionRef.current = remote.characterVersion
                    writeConfirmedBase(characterId, remote)
                    setCharacterRef.current(remote)
                    return
                }
                if (readPendingWrite(characterId) !== remoteKey) {
                    blockedKeyRef.current = autosaveKey
                    preserveCharacterDraft(
                        character,
                        "Cloud revision changed while local draft was pending"
                    )
                    notifyConflict(characterId, {
                        localVersion,
                        remoteVersion: remote.characterVersion,
                        hasConfirmedBase: confirmedBase !== null
                    })
                    return
                }
                // The cloud holds this device's last sent save. Keep the newer local
                // edits and save them on top of that revision.
            }
            lastSavedKeyRef.current = remoteKey
            savedVersionRef.current = remote.characterVersion
            writeConfirmedBase(characterId, remote)
            if (localVersion !== remote.characterVersion) {
                setCharacterRef.current((current) =>
                    current.id === characterId
                        ? { ...current, characterVersion: remote.characterVersion }
                        : current
                )
            }
        }
        if (blockedKeyRef.current === null && lastSavedKeyRef.current !== autosaveKey)
            scheduleSave()
    }, [autosaveKey, character, clearScheduledSave, enabled, remoteCharacter, scheduleSave])
}
