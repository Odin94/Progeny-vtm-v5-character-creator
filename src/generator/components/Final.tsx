import { faCheckSquare } from "@fortawesome/free-regular-svg-icons"
import { faFileExport, faFloppyDisk, faFilePdf, faTrash } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { ActionIcon, Alert, Button, Modal, Stack, Text } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { IconAlertCircle, IconBrandReddit, IconBrandTwitter, IconButterfly } from "@tabler/icons-react"
import ResetModal from "../../components/ResetModal"
import { Character } from "../../data/Character"
import { downloadCharacterSheet } from "../pdfCreator"
import { downloadJson, updateHealthAndWillpowerAndBloodPotencyAndHumanity } from "../utils"
import { createWoD5EVttJson } from "../foundryWoDJsonCreator"
import { useEffect, useState } from "react"
import ReactGA from "react-ga4"

type FinalProps = {
    character: Character
    setCharacter: (character: Character) => void
    setSelectedStep: (step: number) => void
}

const Final = ({ character, setCharacter, setSelectedStep }: FinalProps) => {
    useEffect(() => {
        ReactGA.send({ hitType: "pageview", title: "Final" })
    }, [])

    const [downloadError, setDownloadError] = useState<Error | undefined>()
    const [resetModalOpened, { open: openResetModal, close: closeResetModal }] = useDisclosure(false)
    const [exportModalOpened, { open: openExportModal, close: closeExportModal }] = useDisclosure(false)

    return (
        <div style={{ maxWidth: "440px" }}>
            <Text ta={"center"} fz={"50px"}>
                <FontAwesomeIcon icon={faCheckSquare} color="green" />
            </Text>
            <Text fz={"32px"} ta={"center"} fw={700} mb={20}>
                Character Creation Complete
            </Text>

            <div style={{ background: "rgba(0, 0, 0, 0.6)", padding: "10px", borderRadius: "8px", marginBottom: "20px" }}>
                <Text fz={"xl"} mb={"xl"}>
                    You can now export to a printable PDF or download your character as JSON file, which you can later load again to
                    continue editing
                </Text>
                <Text fz={"xl"}>
                    For feature requests, bug reports and general feedback, message me on:&nbsp;
                    <ActionIcon
                        display={"inline"}
                        component="a"
                        href="https://www.reddit.com/user/ProgenyDev/"
                        variant="default"
                        c={"#ff6314"}
                        target="_blank"
                        rel="noreferrer"
                    >
                        <IconBrandReddit />
                    </ActionIcon>
                    &nbsp;
                    <ActionIcon
                        display={"inline"}
                        component="a"
                        href="https://twitter.com/Odin68092534"
                        variant="default"
                        c={"#1DA1F2"}
                        target="_blank"
                        rel="noreferrer"
                    >
                        <IconBrandTwitter />
                    </ActionIcon>
                    &nbsp;
                    <ActionIcon
                        display={"inline"}
                        component="a"
                        href="https://bsky.app/profile/odinmatthias.bsky.social"
                        variant="default"
                        c={"#208BFE"}
                        target="_blank"
                        rel="noreferrer"
                    >
                        <IconButterfly />
                    </ActionIcon>
                </Text>
            </div>
            <Stack align="center" spacing="xl">
                <Button
                    leftIcon={<FontAwesomeIcon icon={faFilePdf} />}
                    size="xl"
                    color="grape"
                    onClick={() => {
                        downloadCharacterSheet(character).catch((e) => {
                            console.error(e)
                            setDownloadError(e as Error)
                        })

                        ReactGA.event({
                            action: "PDF downloaded",
                            category: "downloads",
                            label: JSON.stringify(character),
                        })
                    }}
                >
                    Download PDF
                </Button>

                <Button
                    leftIcon={<FontAwesomeIcon icon={faFloppyDisk} />}
                    size="lg"
                    color="yellow"
                    variant="light"
                    onClick={() => {
                        updateHealthAndWillpowerAndBloodPotencyAndHumanity(character)
                        downloadJson(character).catch((e) => {
                            console.error(e)
                            setDownloadError(e as Error)
                        })
                        ReactGA.event({ action: "JSON downloaded (progeny)", category: "downloads", label: JSON.stringify(character) })
                    }}
                >
                    Download JSON
                </Button>

                <Button
                    leftIcon={<FontAwesomeIcon icon={faFileExport} />}
                    size="lg"
                    color="blue"
                    variant="light"
                    onClick={() => {
                        openExportModal()
                    }}
                >
                    Export to ...
                </Button>

                <Button
                    component="a"
                    href="https://ko-fi.com/odin_dev"
                    target="_blank"
                    rel="noreferrer"
                    leftIcon={<span>☕</span>}
                    size="xs"
                    color="gray"
                    variant="light"
                >
                    Support me on Ko-Fi
                </Button>

                <Button
                    leftIcon={<FontAwesomeIcon icon={faTrash} />}
                    size="md"
                    color="red"
                    variant="subtle"
                    onClick={() => {
                        openResetModal()
                    }}
                >
                    Reset
                </Button>
            </Stack>

            {downloadError ? (
                <Alert mt={"50px"} icon={<IconAlertCircle size="1rem" />} color="red" variant="outline" bg={"rgba(0, 0, 0, 0.6)"}>
                    <Text fz={"xl"} ta={"center"}>
                        There was a download-error: {downloadError.message}
                    </Text>
                    <Text fz={"lg"} ta={"center"} mb={"xl"}>
                        Send a screenshot of this to me on{" "}
                        <a target="_blank" rel="noreferrer" href="https://twitter.com/Odin68092534">
                            Twitter
                        </a>{" "}
                        to help me fix it
                    </Text>
                    <Text fz={"xs"} ta={"center"}>
                        {downloadError.stack}
                    </Text>
                </Alert>
            ) : null}

            <Alert mt={"50px"} icon={<IconAlertCircle size="1rem" />} color="violet" variant="outline" bg={"rgba(0, 0, 0, 0.6)"}>
                <Text fz={"lg"} ta={"center"}>
                    You may need to refresh your browser to trigger multiple downloads!
                </Text>
            </Alert>

            <ResetModal
                setCharacter={setCharacter}
                setSelectedStep={setSelectedStep}
                resetModalOpened={resetModalOpened}
                closeResetModal={closeResetModal}
            />

            <Modal opened={exportModalOpened} onClose={closeExportModal} title="Export to other platforms" centered withCloseButton={true}>
                <Stack>
                    <Text fz={"lg"} mb="md">
                        Progeny can export file formats compatible with the following platforms:
                    </Text>

                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "12px",
                            borderRadius: "8px",
                            backgroundColor: "rgba(0, 0, 0, 0.4)",
                        }}
                    >
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", maxWidth: "60%" }}>
                            <Text fw={600} size="md">
                                <a
                                    href="https://foundryvtt.com/packages/vtm5e"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: "#1976d2", textDecoration: "underline" }}
                                >
                                    Foundry WoD5E VTT
                                </a>
                            </Text>
                            <Text fz={"sm"} c="dimmed">
                                Use your character in the foundry virtual tabletop
                            </Text>
                        </div>
                        <Button
                            color="grape"
                            size="sm"
                            onClick={() => {
                                updateHealthAndWillpowerAndBloodPotencyAndHumanity(character)
                                try {
                                    const vtt = createWoD5EVttJson(character)
                                    const blob = new Blob([JSON.stringify(vtt, null, 2)], { type: "application/json" })
                                    const link = document.createElement("a")
                                    link.href = window.URL.createObjectURL(blob)
                                    link.download = `foundry_wod5e_${character.name}.json`
                                    link.click()

                                    // Clean up the object URL to prevent memory leaks
                                    setTimeout(() => {
                                        window.URL.revokeObjectURL(link.href)
                                    }, 100)

                                    ReactGA.event({
                                        action: "JSON downloaded (foundry_wod5e vtt)",
                                        category: "downloads",
                                        label: JSON.stringify(character),
                                    })
                                    closeExportModal()
                                } catch (e) {
                                    console.error(e)
                                    setDownloadError(e as Error)
                                }
                            }}
                        >
                            Export JSON
                        </Button>
                    </div>
                </Stack>
            </Modal>
        </div>
    )
}

export default Final
