import { reportCharacterOperationFailure } from "~/utils/characterOperationAnalytics"
import { useQueryClient } from "@tanstack/react-query"
import { characterPersistence } from "~/modules/characterPersistence"
import { notifications } from "@mantine/notifications"
import { IconBraces } from "@tabler/icons-react"
import { useEffect, useState } from "react"
import { z } from "zod"
import type { Character } from "../data/Character"
import { GeneratorStepId } from "../generator/steps"
import { characterIntake } from "~/modules/characterIntake"
import ConfirmActionModal from "./ConfirmActionModal"
import FileDropZone from "./FileDropZone"

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

/** Pasted clipboard text becomes a JSON file when it looks like a JSON object. */
const pastedJsonToFile = (text: string) =>
    text.trim().startsWith("{")
        ? new File([text], "pasted-character.json", { type: "application/json" })
        : null

const formatFileSize = (bytes: number) =>
    bytes < 1024 ? `${bytes} B` : `${Math.max(1, Math.round(bytes / 1024))} KB`

const LoadModal = ({
    loadModalOpened,
    closeLoadModal,
    setCharacter,
    loadedFile,
    setSelectedStep,
    onCharacterReplaced
}: LoadModalProps) => {
    const persistence = characterPersistence(useQueryClient())
    // A file dropped or pasted into the dialog replaces the one picked from the menu.
    const [replacementFile, setReplacementFile] = useState<File | null>(null)
    const file = replacementFile ?? loadedFile

    useEffect(() => {
        setReplacementFile(null)
    }, [loadedFile, loadModalOpened])

    return (
        <ConfirmActionModal
            opened={loadModalOpened}
            onClose={closeLoadModal}
            onConfirm={async () => {
                const isCurrent = persistence.replacementGuard()
                if (!file) {
                    return
                }
                try {
                    const loadedCharacter = await loadCharacterFromFile(file)
                    if (!isCurrent()) return
                    setCharacter({ ...loadedCharacter, id: "" })
                    onCharacterReplaced?.()
                    setSelectedStep("final")
                    closeLoadModal()
                } catch (e) {
                    reportCharacterOperationFailure("import", e)
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
            disabled={!file}
        >
            <FileDropZone
                accept="application/json,.json"
                listenToPaste={loadModalOpened}
                textToFile={pastedJsonToFile}
                onFile={setReplacementFile}
                icon={<IconBraces size={18} stroke={1.6} />}
                title={file ? file.name : "Choose a character file"}
                hint={
                    file
                        ? `${formatFileSize(file.size)} · Drop, paste or click to use a different file`
                        : "Drop a .json file here, paste it, or click to browse"
                }
                aria-label={
                    file ? `Selected file ${file.name}. Choose a different file` : "Choose a file"
                }
            />
        </ConfirmActionModal>
    )
}

export default LoadModal
