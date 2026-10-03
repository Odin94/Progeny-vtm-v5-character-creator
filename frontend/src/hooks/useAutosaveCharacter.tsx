import { useQueryClient } from "@tanstack/react-query"
import { useCallback, useEffect, useMemo, useRef } from "react"
import type { Character } from "~/data/Character"
import type { SetCharacter } from "~/hooks/useCharacterLocalStorage"
import { type ApiError } from "~/utils/api"
import {
    characterPersistence,
    getCharacterSaveKey as getAutosaveKey
} from "~/modules/characterPersistence"
export { isOwnedSavedCharacter } from "~/modules/characterPersistence"

export const CHARACTER_AUTOSAVE_DELAY_MS = 900
export const CHARACTER_AUTOSAVE_RETRY_DELAY_MS = 3000

const shouldRetry = (error: unknown) => {
    const status = (error as ApiError)?.status
    return status === undefined || status === 408 || status === 429 || status >= 500
}

export const useAutosaveCharacter = (
    character: Character,
    setCharacter: SetCharacter,
    enabled: boolean
) => {
    const queryClient = useQueryClient()
    const autosaveKey = useMemo(() => getAutosaveKey(character), [character])
    const latestCharacterRef = useRef(character)
    const latestAutosaveKeyRef = useRef(autosaveKey)
    const setCharacterRef = useRef(setCharacter)
    const enabledRef = useRef(enabled)
    const activeCharacterIdRef = useRef<string | null>(null)
    const lastSavedKeyRef = useRef<string | null>(null)
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
            savedKey === lastSavedKeyRef.current
        ) {
            return
        }

        const saveGeneration = generationRef.current
        saveInFlightRef.current = true
        saveRequestedRef.current = false
        let retryScheduled = false
        let followupSuppressed = false

        try {
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
                console.warn("Failed to autosave character:", error)

                if (shouldRetry(error)) {
                    retryScheduled = true
                    scheduleSaveRef.current(CHARACTER_AUTOSAVE_RETRY_DELAY_MS)
                } else {
                    followupSuppressed = true
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
            lastSavedKeyRef.current = autosaveKey
            saveRequestedRef.current = false
            clearScheduledSave()
            return
        }

        if (!enabled || !characterId) {
            generationRef.current += 1
            lastSavedKeyRef.current = autosaveKey
            saveRequestedRef.current = false
            clearScheduledSave()
            return
        }

        if (lastSavedKeyRef.current === null) {
            lastSavedKeyRef.current = autosaveKey
            return
        }

        if (lastSavedKeyRef.current !== autosaveKey) {
            scheduleSave()
        }
    }, [autosaveKey, character.id, clearScheduledSave, enabled, scheduleSave])
}
