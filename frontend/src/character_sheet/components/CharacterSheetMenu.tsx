import { faFileArrowUp, faFileExport, faFilePdf, faFloppyDisk, faXmark } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { ActionIcon, Button, FileButton, Modal, Stack, Text, Divider, Group } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { notifications } from "@mantine/notifications"
import { IconMenu2, IconAlertCircle, IconExternalLink, IconArrowRight } from "@tabler/icons-react"
import { Buffer } from "buffer"
import { useState } from "react"
import { z } from "zod"
import { loadCharacterFromJson } from "~/components/LoadModal"
import { createWoD5EVttJson } from "~/generator/foundryWoDJsonCreator"
import { downloadCharacterSheet } from "~/generator/pdfCreator"
import { downloadJson, getUploadFile, updateHealthAndWillpowerAndBloodPotencyAndHumanity } from "~/generator/utils"
import { SheetOptions } from "../CharacterSheet"
import { useAuth } from "~/hooks/useAuth"
import { isBackendDisabled } from "~/utils/backend"

type CharacterSheetMenuProps = {
    options: SheetOptions
}

const CharacterSheetMenu = ({ options }: CharacterSheetMenuProps) => {
    const { character, setCharacter, primaryColor } = options
    const { user, loading: authLoading, isAuthenticated, signIn, signOut } = useAuth()
    const [menuOpened, { open: openMenu, close: closeMenu }] = useDisclosure(false)
    const [exportModalOpened, { open: openExportModal, close: closeExportModal }] = useDisclosure(false)
    const [disclaimerOpened, { open: openDisclaimer, close: closeDisclaimer }] = useDisclosure(false)
    const [loadModalOpened, { open: openLoadModal, close: closeLoadModal }] = useDisclosure(false)
    const [downloadError, setDownloadError] = useState<Error | undefined>()
    const [loadedFile, setLoadedFile] = useState<File | null>(null)

    const handleGoBack = () => {
        window.history.pushState({}, "", "/")
        window.location.reload()
    }

    const handleDownloadPDF = () => {
        downloadCharacterSheet(character).catch((e) => {
            console.error(e)
            setDownloadError(e as Error)
        })
        closeMenu()
    }

    const handleDownloadJSON = () => {
        updateHealthAndWillpowerAndBloodPotencyAndHumanity(character)
        downloadJson(character).catch((e) => {
            console.error(e)
            setDownloadError(e as Error)
        })
        closeMenu()
    }

    const handleExportToFoundry = () => {
        updateHealthAndWillpowerAndBloodPotencyAndHumanity(character)
        try {
            const { json: vtt, validationErrors } = createWoD5EVttJson(character)
            const blob = new Blob([JSON.stringify(vtt, null, 2)], { type: "application/json" })
            const link = document.createElement("a")
            link.href = window.URL.createObjectURL(blob)
            link.download = `foundry_wod5e_${character.name}.json`
            link.click()

            setTimeout(() => {
                window.URL.revokeObjectURL(link.href)
            }, 100)

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

            closeExportModal()
            closeMenu()
        } catch (e) {
            console.error(e)
            setDownloadError(e as Error)
        }
    }

    const handleLoadFromFile = async (file: File | null) => {
        if (!file) return
        setLoadedFile(file)
        openLoadModal()
    }

    const handleConfirmLoad = async () => {
        if (!loadedFile) {
            console.log("Error: No file loaded!")
            return
        }
        try {
            const fileData = await getUploadFile(loadedFile)
            const base64 = fileData.split(",")[1]
            const json = Buffer.from(base64, "base64").toString()
            const loadedCharacter = await loadCharacterFromJson(json)
            setCharacter(loadedCharacter)
            closeLoadModal()
            closeMenu()
            notifications.show({
                title: "Character loaded",
                message: `Successfully loaded ${loadedCharacter.name}`,
                color: "green",
                autoClose: 3000,
            })
        } catch (e) {
            if (e instanceof z.ZodError) {
                notifications.show({
                    title: "JSON content error loading character",
                    message: z.prettifyError(e),
                    color: "red",
                    autoClose: false,
                })
            } else {
                notifications.show({
                    title: "Error loading character",
                    message: e instanceof Error ? e.message : "Unknown error occurred",
                    color: "red",
                    autoClose: false,
                })
            }
            console.error(e)
        }
    }

    return (
        <>
            <ActionIcon
                size="xl"
                variant="light"
                color={primaryColor}
                radius="xl"
                onClick={openMenu}
                style={{
                    position: "fixed",
                    bottom: "2rem",
                    right: "2rem",
                    zIndex: 1000,
                }}
            >
                <IconMenu2 size={24} />
            </ActionIcon>

            <Modal opened={menuOpened} onClose={closeMenu} title="Menu" centered>
                <Stack gap="md">
                    <Button
                        leftSection={<FontAwesomeIcon icon={faFilePdf} />}
                        size="lg"
                        color="grape"
                        onClick={handleDownloadPDF}
                        fullWidth
                    >
                        Download as PDF
                    </Button>

                    <Group gap="md" grow>
                        <Button
                            leftSection={<FontAwesomeIcon icon={faFloppyDisk} />}
                            size="lg"
                            color="yellow"
                            variant="light"
                            onClick={handleDownloadJSON}
                        >
                            Save JSON
                        </Button>
                        <FileButton onChange={handleLoadFromFile} accept="application/json">
                            {(props) => (
                                <Button
                                    leftSection={<FontAwesomeIcon icon={faFileArrowUp} />}
                                    size="lg"
                                    color="green"
                                    variant="light"
                                    {...props}
                                >
                                    Load JSON
                                </Button>
                            )}
                        </FileButton>
                    </Group>

                    <Button
                        leftSection={<FontAwesomeIcon icon={faFileExport} />}
                        size="lg"
                        color="blue"
                        variant="light"
                        onClick={() => {
                            openExportModal()
                        }}
                        fullWidth
                    >
                        Export to...
                    </Button>

                    <Group gap="md" grow>
                        <Button component="a" href="/" size="lg" color="grape" variant="outline" leftSection={<IconArrowRight size={18} />}>
                            Generator
                        </Button>
                        <Button
                            component="a"
                            href="/me"
                            size="lg"
                            color="grape"
                            variant="outline"
                            leftSection={<IconArrowRight size={18} />}
                        >
                            Account
                        </Button>
                    </Group>

                    {!isBackendDisabled() ? (
                        <>
                            <Divider />

                            {authLoading ? (
                                <Button size="lg" color="gray" variant="light" loading fullWidth>
                                    Loading...
                                </Button>
                            ) : isAuthenticated && user ? (
                                <Button
                                    size="lg"
                                    color="red"
                                    variant="light"
                                    onClick={() => {
                                        signOut()
                                        closeMenu()
                                    }}
                                    fullWidth
                                >
                                    Sign Out {user.firstName ? `(${user.firstName})` : ""}
                                </Button>
                            ) : (
                                <Button
                                    size="lg"
                                    color="blue"
                                    variant="light"
                                    onClick={() => {
                                        signIn()
                                        closeMenu()
                                    }}
                                    fullWidth
                                >
                                    Sign In
                                </Button>
                            )}
                        </>
                    ) : null}

                    <Divider />

                    <Button
                        component="a"
                        href="https://ko-fi.com/odin_dev"
                        target="_blank"
                        rel="noreferrer"
                        leftSection={<IconExternalLink size={18} />}
                        size="lg"
                        color="gray"
                        variant="light"
                        fullWidth
                    >
                        Support Odin on Ko-fi
                    </Button>

                    <Divider />

                    <Button
                        leftSection={<IconAlertCircle size={18} />}
                        size="sm"
                        color="gray"
                        variant="subtle"
                        onClick={() => {
                            openDisclaimer()
                        }}
                        fullWidth
                    >
                        Disclaimer
                    </Button>
                </Stack>
            </Modal>

            <Modal opened={exportModalOpened} onClose={closeExportModal} title="Export to other platforms" centered>
                <Stack gap="md">
                    <Text fz="lg" mb="md">
                        Progeny can export file formats compatible with the following platforms:
                    </Text>

                    <Group
                        justify="space-between"
                        align="center"
                        p="md"
                        style={{ backgroundColor: "rgba(0, 0, 0, 0.4)", borderRadius: "8px" }}
                    >
                        <Stack gap="xs" style={{ flex: 1 }}>
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
                            <Text fz="sm" c="dimmed">
                                Use your character in the foundry virtual tabletop
                            </Text>
                        </Stack>
                        <Button color="grape" size="sm" onClick={handleExportToFoundry}>
                            Export JSON
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            <Modal opened={disclaimerOpened} onClose={closeDisclaimer} title="Disclaimer" centered size="lg">
                <Stack gap="md">
                    <Text>
                        This is an independent production and is not affiliated with or endorsed by World of Darkness, Paradox Interactive,
                        or any of their subsidiaries.
                    </Text>
                    <Text>
                        This tool is created under the{" "}
                        <a
                            href="https://www.worldofdarkness.com/dark-pack"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "#9c36b5" }}
                        >
                            Dark Pack License
                        </a>
                        .
                    </Text>
                    <Text>Vampire: The Masquerade and World of Darkness are trademarks of Paradox Interactive. All rights reserved.</Text>
                    <Text c="dimmed" size="sm">
                        The PDF template used for exporting is kindly provided by{" "}
                        <a href="https://linktr.ee/nerdbert" target="_blank" rel="noopener noreferrer" style={{ color: "#9c36b5" }}>
                            Nerdbert
                        </a>
                        .
                    </Text>
                </Stack>
            </Modal>

            <Modal opened={loadModalOpened} onClose={closeLoadModal} title="" centered withCloseButton={false}>
                <Stack>
                    <Text fz="xl" ta="center">
                        Overwrite current character and load from selected file?
                    </Text>
                    <Divider my="sm" />
                    <Group justify="space-between">
                        <Button color="yellow" variant="subtle" leftSection={<FontAwesomeIcon icon={faXmark} />} onClick={closeLoadModal}>
                            Cancel
                        </Button>
                        <Button color="red" onClick={handleConfirmLoad}>
                            Load/Overwrite character
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            {downloadError ? (
                <Modal opened={!!downloadError} onClose={() => setDownloadError(undefined)} title="Download Error" centered>
                    <Stack gap="md">
                        <Text c="red" fw={600}>
                            There was a download error: {downloadError.message}
                        </Text>
                        <Text size="sm" c="dimmed">
                            Send a screenshot of this to me on{" "}
                            <a target="_blank" rel="noreferrer" href="https://twitter.com/Odin68092534" style={{ color: "#9c36b5" }}>
                                Twitter
                            </a>{" "}
                            to help me fix it
                        </Text>
                        <Text size="xs" c="dimmed" style={{ fontFamily: "monospace", wordBreak: "break-all" }}>
                            {downloadError.stack}
                        </Text>
                    </Stack>
                </Modal>
            ) : null}
        </>
    )
}

export default CharacterSheetMenu
