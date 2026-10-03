import { Character, getEmptyCharacter } from "../data/Character"
import { defaultGeneratorStepId, GeneratorStepId } from "../generator/steps"
import ConfirmActionModal from "./ConfirmActionModal"
import { useQueryClient } from "@tanstack/react-query"
import { characterPersistence } from "~/modules/characterPersistence"

export type ResetModalProps = {
    setCharacter: (character: Character) => void
    setSelectedStep: (step: GeneratorStepId) => void
    resetModalOpened: boolean
    closeResetModal: () => void
    onCharacterReset?: () => void
}

const ResetModal = ({
    resetModalOpened,
    closeResetModal,
    setCharacter,
    setSelectedStep,
    onCharacterReset
}: ResetModalProps) => {
    const client = useQueryClient()
    return (
        <ConfirmActionModal
            opened={resetModalOpened}
            onClose={closeResetModal}
            onConfirm={() => {
                setCharacter(characterPersistence(client).replaceDraft(getEmptyCharacter()))
                onCharacterReset?.()
                setSelectedStep(defaultGeneratorStepId)
                closeResetModal()
            }}
            title="Reset Character?"
            body="This will clear the current character and return you to the first generator step. This action cannot be undone."
            confirmLabel="Reset"
        />
    )
}

export default ResetModal
