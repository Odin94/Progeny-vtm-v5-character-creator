import { faCheckSquare } from "@fortawesome/free-regular-svg-icons"
import { faFileExport, faFloppyDisk, faTrash } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Alert, Button, Stack, Text } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { IconAlertCircle } from "@tabler/icons-react"
import ResetModal from "../../components/ResetModal"
import { Character } from "../../data/Character"
import { downloadCharacterSheet } from "../pdfCreator"
import { downloadJson } from "../utils"


type FinalProps = {
    character: Character,
    setCharacter: (character: Character) => void
    setSelectedStep: (step: number) => void
}

const Final = ({ character, setCharacter, setSelectedStep }: FinalProps) => {
    const [resetModalOpened, { open: openResetModal, close: closeResetModal }] = useDisclosure(false)

    return (
        <div style={{ maxWidth: "440px" }}>
            <Text ta={"center"} fz={"50px"}><FontAwesomeIcon icon={faCheckSquare} color="green" /></Text>
            <h1>Character Creation Complete</h1>

            <div style={{ background: "rgba(0, 0, 0, 0.6)" }}>
                <Text fz={"xl"} mb={"xl"}>You can now export to a printable PDF or download your character as JSON file, which you can later load again to continue editing</Text>
            </div>
            <Stack align="center" spacing="xl">

                <Button leftIcon={<FontAwesomeIcon icon={faFileExport} />} size="xl" color="grape" onClick={() => { downloadCharacterSheet(character) }}>Download PDF</Button>
                <Button leftIcon={<FontAwesomeIcon icon={faFloppyDisk} />} size="lg" color="yellow" variant="light" onClick={() => { downloadJson(character) }}>Download JSON</Button>
                <Button leftIcon={<FontAwesomeIcon icon={faTrash} />} size="md" color="red" variant="subtle" onClick={() => { openResetModal() }}>Reset</Button>

            </Stack>

            <Alert mt={"50px"} icon={<IconAlertCircle size="1rem" />} color="violet" variant="outline" bg={"rgba(0, 0, 0, 0.6)"}>
                <Text fz={"lg"} ta={"center"}>You may need to refresh your browser to trigger multiple downloads!</Text>
            </Alert>

            <ResetModal setCharacter={setCharacter} setSelectedStep={setSelectedStep} resetModalOpened={resetModalOpened} closeResetModal={closeResetModal} />
        </div>
    )
}

export default Final