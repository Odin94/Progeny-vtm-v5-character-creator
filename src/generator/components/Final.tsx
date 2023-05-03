import { faFileExport, faFloppyDisk, faTrash } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Button, Stack } from "@mantine/core"
import { Character } from "../../data/Character"
import { downloadCharacterSheet } from "../pdfCreator"
import { downloadJson } from "../utils"
import { useDisclosure } from "@mantine/hooks"
import ResetModal from "../../components/ResetModal"


type FinalProps = {
    character: Character,
    setCharacter: (character: Character) => void
    setSelectedStep: (step: number) => void
}

const Final = ({ character, setCharacter, setSelectedStep }: FinalProps) => {
    const [resetModalOpened, { open: openResetModal, close: closeResetModal }] = useDisclosure(false)

    return (
        <div>
            <h1>Character Creation Complete</h1>
            <Stack align="center" spacing="xl">

                <Button leftIcon={<FontAwesomeIcon icon={faFileExport} />} size="xl" color="grape" onClick={() => { downloadCharacterSheet(character) }}>Download PDF</Button>
                <Button leftIcon={<FontAwesomeIcon icon={faFloppyDisk} />} size="xl" color="yellow" variant="light" onClick={() => { downloadJson(character) }}>Download JSON</Button>
                <Button leftIcon={<FontAwesomeIcon icon={faTrash} />} size="md" color="red" variant="subtle" onClick={() => { openResetModal() }}>Reset</Button>

            </Stack>

            <ResetModal setCharacter={setCharacter} setSelectedStep={setSelectedStep} resetModalOpened={resetModalOpened} closeResetModal={closeResetModal} />
        </div>
    )
}

export default Final