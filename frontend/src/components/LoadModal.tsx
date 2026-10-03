import { notifications } from "@mantine/notifications"
import { z } from "zod"
import { applyCharacterCompatibilityPatches, Character, characterSchema } from "../data/Character"
import { GeneratorStepId } from "../generator/steps"
import { reportCharacterValidationError } from "~/utils/characterRecoveryAnalytics"
import ConfirmActionModal from "./ConfirmActionModal"

export type LoadModalProps = {
    setCharacter: (character: Character) => void
    loadModalOpened: boolean
    closeLoadModal: () => void
    loadedFile: File | null
    setSelectedStep: (step: GeneratorStepId) => void
    onCharacterReplaced?: () => void
}

export const loadCharacterFromJson = async (json: string): Promise<Character> => {
    let parsed: unknown
    let phase: "json" | "compatibility" | "schema" = "json"
    try {
        parsed = JSON.parse(json)
        phase = "compatibility"
        applyCharacterCompatibilityPatches(parsed as Record<string, unknown>)
        phase = "schema"
        return characterSchema.parse(parsed)
    } catch (error) {
        reportCharacterValidationError(error, "json-import", phase, parsed)
        throw error
    }
}

export const loadCharacterFromFile = async (file: File): Promise<Character> =>
    loadCharacterFromJson(await file.text())

const LoadModal = ({
    loadModalOpened,
    closeLoadModal,
    setCharacter,
    loadedFile,
    setSelectedStep,
    onCharacterReplaced
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
                    const loadedCharacter = await loadCharacterFromFile(loadedFile)
                    setCharacter({ ...loadedCharacter, id: "" })
                    onCharacterReplaced?.()
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
