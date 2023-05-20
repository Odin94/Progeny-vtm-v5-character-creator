import { faFileArrowUp, faPlay } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Alert, Button, FileButton, Group, Stack, Text } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { useState } from "react"
import LoadModal from "../../components/LoadModal"
import { Character } from "../../data/Character"
import { IconBrandGithub } from "@tabler/icons-react"


type IntroProps = {
    setCharacter: (character: Character) => void
    nextStep: () => void
}

const Intro = ({ setCharacter, nextStep }: IntroProps) => {
    const [loadedFile, setLoadedFile] = useState<File | null>(null)
    const [loadModalOpened, { open: openLoadModal, close: closeLoadModal }] = useDisclosure(false)

    return (
        <Alert mt={"50px"} color="grape" variant="outline" bg={"rgba(0, 0, 0, 0.6)"}>

            <Text fz={"30px"} ta={"center"}>This is a 'Vampire: The Masquerade' v5 character creation tool for beginners</Text>
            <Text fz={"xl"} mb={"xs"}>It is intentionally streamlined and limited to creating a common type of character following the rules from the source book.</Text>
            <Text fz={"xl"} mb={"xs"}>You can download your character into a printable PDF when you're done (PDF template kindly provided by <a href="https://linktr.ee/nerdbert">Nerdbert</a>) and also save it to a local file that you can load into this web app to continue editing.</Text>
            <Text fz={"xl"} mb={"xl"}>Note that none of your data will be sent to or stored on a server and you may lose your character if you don't download it!</Text>
            <Stack align="center" spacing="xl">
                <Button leftIcon={<FontAwesomeIcon icon={faPlay} />} size="xl" color="grape" onClick={nextStep}>Get Started!</Button>

                <FileButton onChange={async (payload: File | null) => {
                    if (!payload) return

                    setLoadedFile(payload)
                    openLoadModal()
                }} accept="application/json">
                    {(props) => <Button leftIcon={<FontAwesomeIcon icon={faFileArrowUp} />} size="md" color="yellow" variant="light"  {...props}>Load from file</Button>}
                </FileButton>

                <Button component="a" href="https://github.com/Odin94/Vampire-v5-character-generator" target="_blank" rel="noreferrer" leftIcon={<IconBrandGithub />} size="xs" color="gray" variant="filled">View Source Code</Button>
            </Stack>

            <LoadModal loadedFile={loadedFile} setCharacter={setCharacter} loadModalOpened={loadModalOpened} closeLoadModal={closeLoadModal} />
        </Alert>
    )
}

export default Intro