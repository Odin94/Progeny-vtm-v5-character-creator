import { useLocalStorage } from "@mantine/hooks"

const BROKEN_SAVE_KEY = "character_broken_save"
const BROKEN_SAVE_ERROR_KEY = "character_broken_save_error"

export const useBrokenCharacter = () => {
    const [brokenData, setBrokenData] = useLocalStorage<string>({
        key: BROKEN_SAVE_KEY,
        defaultValue: "",
    })

    const [brokenError, setBrokenError] = useLocalStorage<string>({
        key: BROKEN_SAVE_ERROR_KEY,
        defaultValue: "",
    })

    const clearBrokenCharacter = () => {
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
        clearBrokenCharacter,
    }
}
