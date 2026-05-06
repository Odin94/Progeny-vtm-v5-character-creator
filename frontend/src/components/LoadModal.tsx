import { notifications } from "@mantine/notifications"
import { Buffer } from "buffer"
import { z } from "zod"
import { applyCharacterCompatibilityPatches, Character, characterSchema } from "../data/Character"
import { GeneratorStepId } from "../generator/steps"
import { getUploadFile } from "../generator/utils"
import ConfirmActionModal from "./ConfirmActionModal"

export type LoadModalProps = {
    setCharacter: (character: Character) => void
    loadModalOpened: boolean
    closeLoadModal: () => void
    loadedFile: File | null
    setSelectedStep: (step: GeneratorStepId) => void
}

export const loadCharacterFromJson = async (json: string): Promise<Character> => {
    const parsed = JSON.parse(json)

    applyCharacterCompatibilityPatches(parsed)
    const loadedCharacter = characterSchema.parse(parsed)
    return loadedCharacter
}

const LoadModal = ({
    loadModalOpened,
    closeLoadModal,
    setCharacter,
    loadedFile,
    setSelectedStep
}: LoadModalProps) => {
    return (
        <ConfirmActionModal
            opened={loadModalOpened}
            onClose={closeLoadModal}
            onConfirm={async () => {
                if (!loadedFile) {
                    return
                }
                try {
                    const fileData = await getUploadFile(loadedFile)
                    const base64 = fileData.split(",")[1]
                    if (!base64) {
                        throw new Error("Invalid file format")
                    }

                    let json: string
                    try {
                        json = atob(base64)
                    } catch (_decodeError) {
                        json = Buffer.from(base64, "base64").toString()
                    }

                    const loadedCharacter = await loadCharacterFromJson(json)
                    setCharacter({ ...loadedCharacter, id: "" })
                    setSelectedStep("final")
                    closeLoadModal()
                } catch (e) {
                    if (e instanceof z.ZodError) {
                        notifications.show({
                            title: "JSON content error loading character",
                            message: z.prettifyError(e),
                            color: "red",
                            autoClose: false
                        })
                    } else {
                        notifications.show({
                            title: "Error loading character",
                            message:
                                e instanceof Error
                                    ? e.message
                                    : "Failed to load character from file",
                            color: "red"
                        })
                    }
                }
            }}
            title="Overwrite Character?"
            body="This will overwrite the current character with the selected file. This action cannot be undone."
            confirmLabel="Overwrite"
        />
    )
}

export default LoadModal
