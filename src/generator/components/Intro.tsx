import { faFileArrowUp, faPlay } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Alert, Button, FileButton, Stack, Text } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { IconBrandGithub } from "@tabler/icons-react"
import { useEffect, useState } from "react"
import ReactGA from "react-ga4"
import LoadModal from "../../components/LoadModal"
import { Character } from "../../data/Character"
import { globals } from "../../globals"
import { SocialIcons } from "./SocialIcons"

type IntroProps = {
    setCharacter: (character: Character) => void
    nextStep: () => void
}

const Intro = ({ setCharacter, nextStep }: IntroProps) => {
    useEffect(() => {
        ReactGA.send({ hitType: "pageview", title: "Intro" })
    }, [])

    const [loadedFile, setLoadedFile] = useState<File | null>(null)
    const [loadModalOpened, { open: openLoadModal, close: closeLoadModal }] = useDisclosure(false)

    return (
        <Alert mt={globals.isPhoneScreen ? "75px" : "50px"} color="grape" variant="outline" bg={"rgba(0, 0, 0, 0.6)"}>
            <Text fz={globals.largeFontSize} ta={"center"} mb={"lg"}>
                This is a &apos;Vampire: The Masquerade&apos; v5 character creation tool for beginners
            </Text>
            <Text fz={globals.smallerFontSize} mb={"xs"}>
                It is intentionally streamlined and limited to creating a common type of character following the rules from the source book.
            </Text>
            <Text fz={globals.smallerFontSize} mb={"xs"}>
                You can download your character into a printable PDF when you&apos;re done (PDF template kindly provided by{" "}
                <a href="https://linktr.ee/nerdbert">Nerdbert</a>) and also save it to a local file that you can load into this web app to
                continue editing.
            </Text>
            <Text fz={globals.smallerFontSize} mb={"xl"}>
                Note that none of your data will be sent to or stored on a server and you may lose your character if you don&apos;t download
                it!
            </Text>

            <SocialIcons />
            <Stack align="center" gap="xl">
                <Button leftSection={<FontAwesomeIcon icon={faPlay} />} size="xl" color="grape" onClick={nextStep}>
                    Get Started!
                </Button>

                <FileButton
                    onChange={async (payload: File | null) => {
                        if (!payload) return

                        setLoadedFile(payload)
                        openLoadModal()
                    }}
                    accept="application/json"
                >
                    {(props) => (
                        <Button leftSection={<FontAwesomeIcon icon={faFileArrowUp} />} size="md" color="yellow" variant="light" {...props}>
                            Load from file
                        </Button>
                    )}
                </FileButton>

                <Button
                    component="a"
                    href="https://github.com/Odin94/Progeny-vtm-v5-character-creator"
                    target="_blank"
                    rel="noreferrer"
                    leftSection={<IconBrandGithub />}
                    size="xs"
                    color="gray"
                    variant="filled"
                >
                    View Source Code
                </Button>
                <Button
                    component="a"
                    href="https://ko-fi.com/odin_dev"
                    target="_blank"
                    rel="noreferrer"
                    leftSection={<span>☕</span>}
                    size="xs"
                    color="gray"
                    variant="light"
                >
                    Support me on Ko-Fi
                </Button>
                <Button
                    component="a"
                    href="https://odin-matthias.de"
                    target="_blank"
                    rel="noreferrer"
                    size="xs"
                    color="gray"
                    variant="subtle"
                >
                    <Text color="rgb(190,190,190)">View My Website</Text>
                </Button>
            </Stack>

            <LoadModal
                loadedFile={loadedFile}
                setCharacter={setCharacter}
                loadModalOpened={loadModalOpened}
                closeLoadModal={closeLoadModal}
            />
        </Alert>
    )
}

export default Intro
