import { useLocalStorage } from "@mantine/hooks"
import { z } from "zod"

const BROKEN_SAVE_KEY = "character_broken_save"
const BROKEN_SAVE_ERROR_KEY = "character_broken_save_error"
export const CHARACTER_RECOVERY_KEY = "character_recovery_saves"

const recoverySavesSchema = z.array(
    z.object({
        savedAt: z.string(),
        data: z.string(),
        error: z.string()
    })
)

export const useCharacterRecoverySaves = () =>
    useLocalStorage<z.infer<typeof recoverySavesSchema>>({
        key: CHARACTER_RECOVERY_KEY,
        defaultValue: []
    })

export const recordBrokenCharacter = (data: string, error: string) => {
    localStorage.setItem(BROKEN_SAVE_KEY, JSON.stringify(data))
    localStorage.setItem(BROKEN_SAVE_ERROR_KEY, JSON.stringify(error))
}

export const useBrokenCharacter = () => {
    const [, setRecoverySaves] = useCharacterRecoverySaves()
    const [brokenData, setBrokenData] = useLocalStorage<string>({
        key: BROKEN_SAVE_KEY,
        defaultValue: ""
    })

    const [brokenError, setBrokenError] = useLocalStorage<string>({
        key: BROKEN_SAVE_ERROR_KEY,
        defaultValue: ""
    })

    const archiveBrokenCharacter = () => {
        if (brokenData) {
            const recoverySaves = recoverySavesSchema.parse(
                JSON.parse(localStorage.getItem(CHARACTER_RECOVERY_KEY) || "[]")
            )
            if (!recoverySaves.some((save) => save.data === brokenData)) {
                recoverySaves.push({
                    savedAt: new Date().toISOString(),
                    data: brokenData,
                    error: brokenError
                })
            }
            // Write synchronously first: Mantine swallows storage quota errors. Never clear
            // the only recovery copy unless the archive has actually been persisted.
            localStorage.setItem(CHARACTER_RECOVERY_KEY, JSON.stringify(recoverySaves))
            setRecoverySaves(recoverySaves)
        }
    }

    const clearBrokenCharacter = () => {
        archiveBrokenCharacter()
        setBrokenData("")
        setBrokenError("")
    }

    const setBrokenCharacter = (data: string, error: string) => {
        setBrokenData(data)
        setBrokenError(error)
    }

    const hasBrokenCharacter = !!brokenData && !!brokenError

    return {
        brokenData,
        brokenError,
        hasBrokenCharacter,
        setBrokenCharacter,
        archiveBrokenCharacter,
        clearBrokenCharacter
    }
}
