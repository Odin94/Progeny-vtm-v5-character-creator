import { useLocalStorage } from "@mantine/hooks"
import { z } from "zod"
import {
    characterIntake,
    BROKEN_SAVE_KEY,
    BROKEN_SAVE_ERROR_KEY,
    CHARACTER_RECOVERY_KEY,
    recoverySavesSchema
} from "~/modules/characterIntake"
export { CHARACTER_RECOVERY_KEY }

export const useCharacterRecoverySaves = () =>
    useLocalStorage<z.infer<typeof recoverySavesSchema>>({
        key: CHARACTER_RECOVERY_KEY,
        defaultValue: []
    })

export const recordBrokenCharacter = (data: string, error: string) => {
    characterIntake.preserve(data, error)
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
        if (brokenData) setRecoverySaves(characterIntake.archive(brokenData, brokenError))
    }

    const clearBrokenCharacter = () => {
        characterIntake.clear(brokenData, brokenError)
        setBrokenData("")
        setBrokenError("")
    }

    const setBrokenCharacter = (data: string, error: string) => {
        characterIntake.preserve(data, error)
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
