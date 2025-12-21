import { faCheckSquare } from "@fortawesome/free-regular-svg-icons"
import { faFileExport, faFilePdf, faFloppyDisk, faTrash } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Alert, Button, Modal, Popover, ScrollArea, Stack, Text } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { notifications } from "@mantine/notifications"
import { IconAlertCircle, IconHelpHexagon } from "@tabler/icons-react"
import { useEffect, useState } from "react"
import ReactGA from "react-ga4"
import ResetModal from "../../components/ResetModal"
import { Character } from "../../data/Character"
import { trackEvent } from "../../utils/analytics"
import { createWoD5EVttJson } from "../foundryWoDJsonCreator"
import { downloadCharacterSheet } from "../pdfCreator"
import { downloadJson, updateHealthAndWillpowerAndBloodPotencyAndHumanity } from "../utils"
import { SocialIcons } from "./SocialIcons"
import { globals } from "~/globals"

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
    const [popoverOpened, { open: openPopover, close: closePopover }] = useDisclosure(false)

    const height = globals.viewportHeightPx

    return (
        <div style={{ maxWidth: height < globals.heightBreakPoint ? "730px" : "440px" }}>
            {height >= globals.heightBreakPoint ? (
                <Text ta={"center"} fz={"50px"}>
                    <FontAwesomeIcon icon={faCheckSquare} color="green" />
                </Text>
            ) : null}
            <Text fz={"32px"} ta={"center"} fw={700} mb={20}>
                Character Creation Complete
            </Text>

            <div style={{ background: "rgba(0, 0, 0, 0.6)", padding: "10px", borderRadius: "8px", marginBottom: "20px" }}>
                <Text fz={"xl"} mb={"xl"}>
                    You can now export to a printable PDF or download your character as JSON file, which you can later load again to
                    continue editing
                </Text>
                <SocialIcons />
            </div>
            <Stack align="center" gap="lg">
                <Button
                    leftSection={<FontAwesomeIcon icon={faFilePdf} />}
                    size="xl"
                    color="grape"
                    onClick={() => {
                        downloadCharacterSheet(character).catch((e) => {
                            console.error(e)
                            setDownloadError(e as Error)
                        })

                        trackEvent({
                            action: "PDF downloaded",
                            category: "downloads",
                            label: JSON.stringify(character),
                        })
                    }}
                >
                    Download PDF
                </Button>

                <Button
                    leftSection={<FontAwesomeIcon icon={faFloppyDisk} />}
                    size="lg"
                    color="yellow"
                    variant="light"
                    onClick={() => {
                        updateHealthAndWillpowerAndBloodPotencyAndHumanity(character)
                        downloadJson(character).catch((e) => {
                            console.error(e)
                            setDownloadError(e as Error)
                        })
                        trackEvent({
                            action: "JSON downloaded (progeny)",
                            category: "downloads",
                            label: JSON.stringify(character),
                        })
                    }}
                >
                    Download JSON
                </Button>

                <Button
                    leftSection={<FontAwesomeIcon icon={faFileExport} />}
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
                    leftSection={<span>☕</span>}
                    size="xs"
                    color="gray"
                    variant="light"
                >
                    Support me on Ko-Fi
                </Button>

                <Button
                    leftSection={<FontAwesomeIcon icon={faTrash} />}
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
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
                                <Popover
                                    width={220}
                                    position="top"
                                    withArrow
                                    shadow="md"
                                    withinPortal
                                    opened={popoverOpened}
                                    onClose={closePopover}
                                >
                                    <Popover.Target>
                                        <div
                                            style={{ cursor: "pointer", display: "inline-flex", alignItems: "center" }}
                                            onClick={() => (popoverOpened ? closePopover() : openPopover())}
                                        >
                                            <IconHelpHexagon size={22} color="#9c36b5" stroke={2} />
                                        </div>
                                    </Popover.Target>
                                    <Popover.Dropdown>
                                        <Stack gap="xs">
                                            <Text size="sm">1. Export to JSON</Text>
                                            <Text size="sm">2. Create Vampire character in Foundry</Text>
                                            <Text size="sm">3. Right click that character in &quot;Actors&quot;</Text>
                                            <Text size="sm">4. Select &quot;Import Data&quot; and upload JSON</Text>
                                        </Stack>
                                    </Popover.Dropdown>
                                </Popover>
                            </div>
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
                                    const { json: vtt, validationErrors } = createWoD5EVttJson(character)
                                    const blob = new Blob([JSON.stringify(vtt, null, 2)], { type: "application/json" })
                                    const link = document.createElement("a")
                                    link.href = window.URL.createObjectURL(blob)
                                    link.download = `foundry_wod5e_${character.name}.json`
                                    link.click()

                                    // Clean up the object URL to prevent memory leaks
                                    setTimeout(() => {
                                        window.URL.revokeObjectURL(link.href)
                                    }, 100)

                                    // Show warning toast if validation failed
                                    if (validationErrors.length > 0) {
                                        const errorCount = validationErrors.length
                                        const firstError = validationErrors[0]
                                        const message =
                                            errorCount === 1
                                                ? `Validation error: ${firstError}`
                                                : `${errorCount} validation errors found. First error: ${firstError}`

                                        notifications.show({
                                            title: "Validation Warning",
                                            message: `The exported JSON may not be fully compatible with Foundry VTT. ${message}`,
                                            color: "orange",
                                            autoClose: 10000,
                                        })
                                    }

                                    trackEvent({
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
