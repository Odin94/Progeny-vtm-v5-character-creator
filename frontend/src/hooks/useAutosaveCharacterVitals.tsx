import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useMemo, useRef } from "react"
import type { Character } from "~/data/Character"
import type { SetCharacter } from "~/hooks/useCharacterLocalStorage"
import { useAuth } from "~/hooks/useAuth"
import { api } from "~/utils/api"

const AUTOSAVE_DELAY_MS = 750
const RETRY_DELAY_MS = 3000

const getVitalsKey = (character: Character) =>
    JSON.stringify({
        id: character.id || null,
        hunger: character.ephemeral.hunger,
        willpower: character.willpower,
        superficialWillpowerDamage: character.ephemeral.superficialWillpowerDamage,
        aggravatedWillpowerDamage: character.ephemeral.aggravatedWillpowerDamage,
        humanity: character.humanity,
        humanityStains: character.ephemeral.humanityStains
    })

export const useAutosaveCharacterVitals = (character: Character, setCharacter: SetCharacter) => {
    const { isAuthenticated } = useAuth()
    const queryClient = useQueryClient()
    const latestCharacterRef = useRef(character)
    const characterIdRef = useRef<string | null>(character.id || null)
    const lastSavedVitalsKeyRef = useRef<string | null>(null)
    const setCharacterRef = useRef(setCharacter)

    useEffect(() => {
        latestCharacterRef.current = character
    }, [character])

    useEffect(() => {
        setCharacterRef.current = setCharacter
    }, [setCharacter])

    const vitalsKey = useMemo(
        () => getVitalsKey(character),
        [
            character.id,
            character.ephemeral.aggravatedWillpowerDamage,
            character.ephemeral.hunger,
            character.ephemeral.humanityStains,
            character.ephemeral.superficialWillpowerDamage,
            character.humanity,
            character.willpower
        ]
    )

    useEffect(() => {
        const characterId = character.id || null

        if (characterIdRef.current !== characterId) {
            characterIdRef.current = characterId
            lastSavedVitalsKeyRef.current = vitalsKey
            return
        }

        if (!isAuthenticated || !characterId) {
            lastSavedVitalsKeyRef.current = vitalsKey
            return
        }

        if (lastSavedVitalsKeyRef.current === null) {
            lastSavedVitalsKeyRef.current = vitalsKey
            return
        }

        if (lastSavedVitalsKeyRef.current === vitalsKey) return

        let cancelled = false
        let retryTimeout: number | undefined

        const saveLatestVitals = async () => {
            const latestCharacter = latestCharacterRef.current
            if (cancelled || latestCharacter.id !== characterId) return

            const savedVitalsKey = getVitalsKey(latestCharacter)

            try {
                const savedCharacter = await api.updateCharacterVitals(characterId, {
                    willpower: latestCharacter.willpower,
                    humanity: latestCharacter.humanity,
                    ephemeral: {
                        hunger: latestCharacter.ephemeral.hunger,
                        superficialWillpowerDamage:
                            latestCharacter.ephemeral.superficialWillpowerDamage,
                        aggravatedWillpowerDamage:
                            latestCharacter.ephemeral.aggravatedWillpowerDamage,
                        humanityStains: latestCharacter.ephemeral.humanityStains
                    }
                })

                if (cancelled) return
                lastSavedVitalsKeyRef.current = savedVitalsKey

                setCharacterRef.current((currentCharacter) =>
                    currentCharacter.id === characterId
                        ? {
                              ...currentCharacter,
                              characterVersion: savedCharacter.characterVersion
                          }
                        : currentCharacter
                )

                queryClient.invalidateQueries({ queryKey: ["coterieVitals"] })
                queryClient.invalidateQueries({ queryKey: ["characters", characterId] })
            } catch (error) {
                if (cancelled) return
                console.warn("Failed to autosave character vitals:", error)
                retryTimeout = window.setTimeout(saveLatestVitals, RETRY_DELAY_MS)
            }
        }

        const timeout = window.setTimeout(saveLatestVitals, AUTOSAVE_DELAY_MS)

        return () => {
            cancelled = true
            window.clearTimeout(timeout)
            if (retryTimeout !== undefined) {
                window.clearTimeout(retryTimeout)
            }
        }
    }, [character.id, isAuthenticated, queryClient, vitalsKey])
}
