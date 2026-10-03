import { useQueryClient } from "@tanstack/react-query"
import { characterPersistence } from "~/modules/characterPersistence"
import { notifications } from "@mantine/notifications"
import { z } from "zod"
import type { Character } from "../data/Character"
import { GeneratorStepId } from "../generator/steps"
import { characterIntake } from "~/modules/characterIntake"
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
    const result = characterIntake.read(json, "json-import")
    if (!result.success) throw result.error
    return result.character
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
    const persistence = characterPersistence(useQueryClient())
    return (
        <ConfirmActionModal
            opened={loadModalOpened}
            onClose={closeLoadModal}
            onConfirm={async () => {
                const isCurrent = persistence.replacementGuard()
                if (!loadedFile) {
                    return
                }
                try {
                    const loadedCharacter = await loadCharacterFromFile(loadedFile)
                    if (!isCurrent()) return
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
