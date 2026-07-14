import { notifications } from "@mantine/notifications"
import posthog from "posthog-js"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
    useCharacterNotes,
    useRestoreCharacterNoteVersion,
    useSaveCharacterNotes
} from "~/hooks/useCharacters"
import type { CharacterNoteVersionResponse } from "~/utils/api"

type SaveStatus = "idle" | "dirty" | "saving" | "saved" | "error" | "too-large"

type UseCharacterNotesControllerOptions = {
    characterId: string
    isAuthenticated: boolean
    authLoading: boolean
    characterAccessLoading: boolean
    hasCharacterAccess: boolean
}

export const CHARACTER_NOTE_MAX_BYTES = 200 * 1024

const getUtf8ByteLength = (value: string) => new TextEncoder().encode(value).length

export const useCharacterNotesController = ({
    characterId,
    isAuthenticated,
    authLoading,
    characterAccessLoading,
    hasCharacterAccess
}: UseCharacterNotesControllerOptions) => {
    const [notesOpened, setNotesOpened] = useState(false)
    const [historyOpened, setHistoryOpened] = useState(false)
    const [draftNotes, setDraftNotes] = useState("")
    const [lastSavedNotes, setLastSavedNotes] = useState("")
    const [selectedHistoryVersion, setSelectedHistoryVersion] =
        useState<CharacterNoteVersionResponse | null>(null)
    const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")
    const initializedNotesIdRef = useRef<string | null>(null)
    const lastServerContentRef = useRef<string | null>(null)
    const activeCharacterIdRef = useRef(characterId)
    activeCharacterIdRef.current = characterId

    const canUseNotes =
        isAuthenticated && !!characterId && !characterAccessLoading && hasCharacterAccess
    const {
        data: notes,
        isLoading: notesLoading,
        isError: notesError,
        refetch: refetchNotes
    } = useCharacterNotes(canUseNotes ? characterId : null, notesOpened)
    const { mutate: saveNotes, isPending: savePending } = useSaveCharacterNotes()
    const { mutate: restoreNotes, isPending: restorePending } = useRestoreCharacterNoteVersion()

    const noteBytes = useMemo(() => getUtf8ByteLength(draftNotes), [draftNotes])
    const versions = notes?.versions ?? []
    const currentNote = notes?.current ?? null
    const isViewingHistory = !!selectedHistoryVersion
    const displayedNotes = selectedHistoryVersion?.content ?? draftNotes
    const showSavePill = saveStatus === "saving" || saveStatus === "saved"

    const disabledReason = authLoading
        ? "Checking your account..."
        : !isAuthenticated
          ? "Create a free account to use private notes."
          : !characterId
            ? "Save this character to your account to use private notes."
            : characterAccessLoading
              ? "Checking character access..."
              : !hasCharacterAccess
                ? "Load a character from your account to use private notes."
                : undefined

    useEffect(() => {
        if (canUseNotes) {
            return
        }

        // Do not leave private content visible if the session or character access ends.
        initializedNotesIdRef.current = null
        lastServerContentRef.current = null
        setNotesOpened(false)
        setHistoryOpened(false)
        setDraftNotes("")
        setLastSavedNotes("")
        setSelectedHistoryVersion(null)
        setSaveStatus("idle")
    }, [canUseNotes])

    useEffect(() => {
        initializedNotesIdRef.current = null
        lastServerContentRef.current = null
        setDraftNotes("")
        setLastSavedNotes("")
        setSelectedHistoryVersion(null)
        setSaveStatus("idle")
    }, [characterId])

    useEffect(() => {
        if (!notes || notesLoading) {
            return
        }

        const nextVersionId = currentNote?.id ?? "empty"
        const nextContent = currentNote?.content ?? ""
        const serverChanged =
            initializedNotesIdRef.current !== nextVersionId ||
            lastServerContentRef.current !== nextContent

        if (!serverChanged) {
            return
        }

        // Keep cross-tab refreshes current without overwriting a local edit.
        if (draftNotes === lastSavedNotes) {
            initializedNotesIdRef.current = nextVersionId
            lastServerContentRef.current = nextContent
            setDraftNotes(nextContent)
            setLastSavedNotes(nextContent)
            setSaveStatus(currentNote ? "saved" : "idle")
        }
    }, [currentNote, draftNotes, lastSavedNotes, notes, notesLoading])

    const saveDraft = useCallback(
        (source: "debounce" | "close") => {
            if (!canUseNotes || draftNotes === lastSavedNotes || savePending) {
                return
            }

            if (noteBytes > CHARACTER_NOTE_MAX_BYTES) {
                setSaveStatus("too-large")
                posthog.capture("character-notes-save-blocked", {
                    characterId,
                    reason: "too-large",
                    noteBytes,
                    limitBytes: CHARACTER_NOTE_MAX_BYTES,
                    source
                })
                return
            }

            const savedContent = draftNotes
            setSaveStatus("saving")
            saveNotes(
                { characterId, content: savedContent },
                {
                    onSuccess: (data) => {
                        if (activeCharacterIdRef.current !== characterId) {
                            return
                        }
                        initializedNotesIdRef.current = data.current?.id ?? null
                        lastServerContentRef.current = data.current?.content ?? savedContent
                        setLastSavedNotes(savedContent)
                        setSaveStatus("saved")
                        posthog.capture("character-notes-saved", {
                            characterId,
                            noteBytes,
                            versionCount: data.versions.length,
                            createdNewVersion: data.createdNewVersion,
                            source
                        })
                    },
                    onError: (error) => {
                        if (activeCharacterIdRef.current !== characterId) {
                            return
                        }
                        setSaveStatus("error")
                        posthog.capture("character-notes-save-failed", {
                            characterId,
                            noteBytes,
                            source
                        })
                        notifications.show({
                            title: "Notes not saved",
                            message: error instanceof Error ? error.message : "Please try again.",
                            color: "red"
                        })
                    }
                }
            )
        },
        [canUseNotes, characterId, draftNotes, lastSavedNotes, noteBytes, saveNotes, savePending]
    )

    useEffect(() => {
        if (draftNotes === lastSavedNotes) {
            return
        }

        setSaveStatus(noteBytes > CHARACTER_NOTE_MAX_BYTES ? "too-large" : "dirty")

        if (noteBytes > CHARACTER_NOTE_MAX_BYTES) {
            return
        }

        const timeout = window.setTimeout(() => saveDraft("debounce"), 900)
        return () => window.clearTimeout(timeout)
    }, [draftNotes, lastSavedNotes, noteBytes, saveDraft])

    const openNotes = useCallback(() => {
        if (!canUseNotes) {
            return
        }

        setSelectedHistoryVersion(null)
        setNotesOpened(true)
        posthog.capture("character-notes-opened", { characterId })
    }, [canUseNotes, characterId])

    const closeNotes = useCallback(() => {
        saveDraft("close")
        setSelectedHistoryVersion(null)
        setHistoryOpened(false)
        setNotesOpened(false)
    }, [saveDraft])

    const openHistory = useCallback(() => setHistoryOpened(true), [])
    const closeHistory = useCallback(() => setHistoryOpened(false), [])
    const clearSelectedHistoryVersion = useCallback(() => setSelectedHistoryVersion(null), [])

    const previewVersion = useCallback(
        (version: CharacterNoteVersionResponse) => {
            setSelectedHistoryVersion(version)
            setHistoryOpened(false)
            posthog.capture("character-notes-version-previewed", {
                characterId,
                versionId: version.id,
                versionCreatedAt: version.createdAt
            })
        },
        [characterId]
    )

    const restoreVersion = useCallback(() => {
        if (!selectedHistoryVersion) {
            return
        }

        const version = selectedHistoryVersion
        setSaveStatus("saving")
        restoreNotes(
            { characterId, versionId: version.id },
            {
                onSuccess: (data) => {
                    if (activeCharacterIdRef.current !== characterId) {
                        return
                    }
                    const restoredContent = data.current?.content ?? version.content
                    initializedNotesIdRef.current = data.current?.id ?? null
                    lastServerContentRef.current = restoredContent
                    setSelectedHistoryVersion(null)
                    setDraftNotes(restoredContent)
                    setLastSavedNotes(restoredContent)
                    setSaveStatus("saved")
                    posthog.capture("character-notes-version-restored", {
                        characterId,
                        versionId: version.id,
                        newVersionId: data.current?.id,
                        versionCount: data.versions.length
                    })
                },
                onError: (error) => {
                    if (activeCharacterIdRef.current !== characterId) {
                        return
                    }
                    setSaveStatus("error")
                    notifications.show({
                        title: "Version not restored",
                        message: error instanceof Error ? error.message : "Please try again.",
                        color: "red"
                    })
                }
            }
        )
    }, [characterId, restoreNotes, selectedHistoryVersion])

    return {
        disabledReason,
        notesOpened,
        historyOpened,
        openNotes,
        closeNotes,
        openHistory,
        closeHistory,
        notesLoading,
        notesError,
        refetchNotes,
        saveStatus,
        showSavePill,
        displayedNotes,
        setDraftNotes,
        selectedHistoryVersion,
        clearSelectedHistoryVersion,
        isViewingHistory,
        noteBytes,
        versions,
        previewVersion,
        restoreVersion,
        restorePending
    }
}
