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
import { useEffect, useState } from "react"
import ReactGA from "react-ga4"


type FinalProps = {
    character: Character,
    setCharacter: (character: Character) => void
    setSelectedStep: (step: number) => void
}

const Final = ({ character, setCharacter, setSelectedStep }: FinalProps) => {
    useEffect(() => { ReactGA.send({ hitType: "pageview", title: "Final" }) }, [])

    const [downloadError, setDownloadError] = useState<Error | undefined>()
    const [resetModalOpened, { open: openResetModal, close: closeResetModal }] = useDisclosure(false)

    return (
        <div style={{ maxWidth: "440px" }}>
            <Text ta={"center"} fz={"50px"}><FontAwesomeIcon icon={faCheckSquare} color="green" /></Text>
            <Text fz={"32px"} ta={"center"} fw={700} mb={20}>Character Creation Complete</Text>

            <div style={{ background: "rgba(0, 0, 0, 0.6)" }}>
                <Text fz={"xl"} mb={"xl"}>You can now export to a printable PDF or download your character as JSON file, which you can later load again to continue editing</Text>
            </div>
            <Stack align="center" spacing="xl">

                <Button leftIcon={<FontAwesomeIcon icon={faFileExport} />} size="xl" color="grape"
                    onClick={() => {
                        downloadCharacterSheet(character).catch((e) => { console.error(e); setDownloadError(e as Error) })

                        ReactGA.event({
                            action: "PDF downloaded",
                            category: "downloads",
                            label: JSON.stringify(character),
                        })
                    }}>
                    Download PDF
                </Button>

                <Button leftIcon={<FontAwesomeIcon icon={faFloppyDisk} />} size="lg" color="yellow" variant="light"
                    onClick={() => {
                        downloadJson(character).catch((e) => { console.error(e); setDownloadError(e as Error); })

                        ReactGA.event({
                            action: "JSON downloaded",
                            category: "downloads",
                            label: JSON.stringify(character),
                        })
                    }}>
                    Download JSON
                </Button>

                <Button leftIcon={<FontAwesomeIcon icon={faTrash} />} size="md" color="red" variant="subtle"
                    onClick={() => { openResetModal() }}>
                    Reset
                </Button>

            </Stack>

            {downloadError
                ? <Alert mt={"50px"} icon={<IconAlertCircle size="1rem" />} color="red" variant="outline" bg={"rgba(0, 0, 0, 0.6)"}>
                    <Text fz={"xl"} ta={"center"}>There was a download-error: {downloadError.message}</Text>
                    <Text fz={"lg"} ta={"center"} mb={"xl"}>Send a screenshot of this to me on <a target="_blank" rel="noreferrer" href="https://twitter.com/Odin68092534">Twitter</a> to help me fix it</Text>
                    <Text fz={"xs"} ta={"center"}>{downloadError.stack}</Text>
                </Alert>
                : null
            }

            <Alert mt={"50px"} icon={<IconAlertCircle size="1rem" />} color="violet" variant="outline" bg={"rgba(0, 0, 0, 0.6)"}>
                <Text fz={"lg"} ta={"center"}>You may need to refresh your browser to trigger multiple downloads!</Text>
            </Alert>

            <ResetModal setCharacter={setCharacter} setSelectedStep={setSelectedStep} resetModalOpened={resetModalOpened} closeResetModal={closeResetModal} />
        </div>
    )
}

export default Final