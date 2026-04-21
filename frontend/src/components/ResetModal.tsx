import { Character, getEmptyCharacter } from "../data/Character"
import { defaultGeneratorStepId, GeneratorStepId } from "../generator/steps"
import ConfirmActionModal from "./ConfirmActionModal"

export type ResetModalProps = {
    setCharacter: (character: Character) => void
    setSelectedStep: (step: GeneratorStepId) => void
    resetModalOpened: boolean
    closeResetModal: () => void
}

const ResetModal = ({ resetModalOpened, closeResetModal, setCharacter, setSelectedStep }: ResetModalProps) => {
    return (
        <ConfirmActionModal
            opened={resetModalOpened}
            onClose={closeResetModal}
            onConfirm={() => {
                setCharacter(getEmptyCharacter())
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
