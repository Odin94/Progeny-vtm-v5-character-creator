import { faFileArrowUp, faFileExport, faFilePdf, faFloppyDisk } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { ActionIcon, Button, FileButton, Modal, Stack, Text, Divider, Group } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { notifications } from "@mantine/notifications"
import { IconMenu2, IconAlertCircle, IconExternalLink, IconArrowRight, IconPalette, IconChevronLeft } from "@tabler/icons-react"
import { Link, useNavigate } from "@tanstack/react-router"
import { Buffer } from "buffer"
import { AnimatePresence, motion } from "framer-motion"
import { useRef, useState } from "react"
import { z } from "zod"
import ErrorDetails from "~/components/ErrorDetails"
import ConfirmActionModal from "~/components/ConfirmActionModal"
import { CONTACT_LINKS } from "~/constants/contactLinks"
import { loadCharacterFromJson } from "~/components/LoadModal"
import { createWoD5EVttJson } from "~/generator/foundryWoDJsonCreator"
import { createInconnuJson } from "~/generator/inconnuJsonCreator"
import { downloadCharacterSheet } from "~/generator/pdfCreator"
import { downloadJson, getUploadFile, updateHealthAndWillpowerAndBloodPotencyAndHumanity } from "~/generator/utils"
import { SheetOptions } from "../CharacterSheet"
import { useAuth } from "~/hooks/useAuth"
import PreferencesContent from "./PreferencesModal"

type MenuView = "menu" | "preferences"

type CharacterSheetMenuProps = {
    options: SheetOptions
}

const slideVariants = {
    enter: (dir: number) => ({ x: dir * 40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir * -40, opacity: 0 }),
}

const CharacterSheetMenu = ({ options }: CharacterSheetMenuProps) => {
    const { character, setCharacter, primaryColor, preferences, onUpdatePreferences } = options
    const { isLoading: authLoading, isAuthenticated, signIn } = useAuth()
    const [menuOpened, { open: openMenu, close: closeMenu }] = useDisclosure(false)
    const [exportModalOpened, { open: openExportModal, close: closeExportModal }] = useDisclosure(false)
    const [disclaimerOpened, { open: openDisclaimer, close: closeDisclaimer }] = useDisclosure(false)
    const [loadModalOpened, { open: openLoadModal, close: closeLoadModal }] = useDisclosure(false)
    const [downloadError, setDownloadError] = useState<Error | undefined>()
    const [loadedFile, setLoadedFile] = useState<File | null>(null)

    const [view, setView] = useState<MenuView>("menu")
    const direction = useRef<1 | -1>(1)
    const wrapperRef = useRef<HTMLDivElement>(null)
    const [wrapperMinHeight, setWrapperMinHeight] = useState<number | undefined>(undefined)

    const navigateTo = (nextView: MenuView) => {
        direction.current = nextView === "preferences" ? 1 : -1
        if (nextView === "preferences" && wrapperRef.current) {
            setWrapperMinHeight(wrapperRef.current.offsetHeight)
        }
        setView(nextView)
    }

    const handleMenuClose = () => {
        closeMenu()
        setView("menu")
    }

    const navigate = useNavigate()

    const handleDownloadPDF = () => {
        downloadCharacterSheet(character).catch((e) => {
            console.error(e)
            setDownloadError(e as Error)
        })
        handleMenuClose()
    }

    const handleDownloadJSON = () => {
        updateHealthAndWillpowerAndBloodPotencyAndHumanity(character)
        downloadJson(character).catch((e) => {
            console.error(e)
            setDownloadError(e as Error)
        })
        handleMenuClose()
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
            handleMenuClose()
        } catch (e) {
            console.error(e)
            setDownloadError(e as Error)
        }
    }

    const handleExportToInconnu = () => {
        updateHealthAndWillpowerAndBloodPotencyAndHumanity(character)
        try {
            const inconnuJson = createInconnuJson(character)
            const blob = new Blob([JSON.stringify(inconnuJson, null, 2)], { type: "application/json" })
            const link = document.createElement("a")
            link.href = window.URL.createObjectURL(blob)
            link.download = `inconnu_${character.name}.json`
            link.click()

            setTimeout(() => {
                window.URL.revokeObjectURL(link.href)
            }, 100)

            closeExportModal()
            handleMenuClose()
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
            handleMenuClose()
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

    const menuTitle = view === "menu" ? "Menu" : <Button
        leftSection={<IconChevronLeft size={16} />}
        size="sm"
        color="gray"
        variant="subtle"
        onClick={() => navigateTo("menu")}
        style={{ alignSelf: "flex-start" }}
    >
    </Button>

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

            <Modal
                opened={menuOpened}
                onClose={handleMenuClose}
                title={menuTitle}
                centered
            >
                <div
                    ref={wrapperRef}
                    style={{ overflow: "hidden", position: "relative", minHeight: wrapperMinHeight }}
                >
                    <AnimatePresence mode="wait" custom={direction.current}>
                        <motion.div
                            key={view}
                            custom={direction.current}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ type: "tween", duration: 0.18, ease: "easeInOut" }}
                        >
                            {view === "menu" ? (
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
                                        onClick={() => openExportModal()}
                                        fullWidth
                                    >
                                        Export to...
                                    </Button>

                                    <Group gap="md" grow>
                                        <Button
                                            component={Link}
                                            to="/"
                                            size="lg"
                                            color="grape"
                                            variant="outline"
                                            leftSection={<IconArrowRight size={18} />}
                                        >
                                            Generator
                                        </Button>
                                        {authLoading ? (
                                            <Button size="lg" color="gray" variant="outline" loading leftSection={<IconArrowRight size={18} />}>
                                                Loading...
                                            </Button>
                                        ) : !isAuthenticated ? (
                                            <Button
                                                size="lg"
                                                color="grape"
                                                variant="outline"
                                                leftSection={<IconArrowRight size={18} />}
                                                onClick={() => {
                                                    signIn()
                                                    handleMenuClose()
                                                }}
                                            >
                                                Sign In
                                            </Button>
                                        ) : (
                                            <Button
                                                component={Link}
                                                to="/me"
                                                size="lg"
                                                color="grape"
                                                variant="outline"
                                                leftSection={<IconArrowRight size={18} />}
                                            >
                                                Account
                                            </Button>
                                        )}
                                    </Group>

                                    <Button
                                        leftSection={<IconPalette size={18} />}
                                        size="lg"
                                        color={primaryColor}
                                        variant="light"
                                        onClick={() => navigateTo("preferences")}
                                        fullWidth
                                    >
                                        Preferences
                                    </Button>

                                    <Divider />

                                    <Button
                                        component="a"
                                        href={CONTACT_LINKS.kofi.href}
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
                                        onClick={() => openDisclaimer()}
                                        fullWidth
                                    >
                                        Disclaimer
                                    </Button>
                                </Stack>
                            ) : (
                                <Stack gap="md">
                                    <PreferencesContent
                                        preferences={preferences}
                                        onUpdate={onUpdatePreferences}
                                        primaryColor={primaryColor}
                                    />
                                </Stack>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
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

                    <Group
                        justify="space-between"
                        align="center"
                        p="md"
                        style={{ backgroundColor: "rgba(0, 0, 0, 0.4)", borderRadius: "8px" }}
                    >
                        <Stack gap="xs" style={{ flex: 1 }}>
                            <Text fw={600} size="md">
                                <a
                                    href="https://docs.inconnu.app"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: "#1976d2", textDecoration: "underline" }}
                                >
                                    Inconnu Discord Bot
                                </a>
                            </Text>
                            <Text fz="sm" c="dimmed">
                                Export for use with the Inconnu Discord character manager
                            </Text>
                        </Stack>
                        <Button color="grape" size="sm" onClick={handleExportToInconnu}>
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

            <ConfirmActionModal
                opened={loadModalOpened}
                onClose={closeLoadModal}
                onConfirm={handleConfirmLoad}
                title="Load Character?"
                body="This will overwrite the current character with the selected file. This action cannot be undone."
                confirmLabel="Load"
            />

            {downloadError ? (
                <Modal opened={!!downloadError} onClose={() => setDownloadError(undefined)} title="Download Error" centered>
                    <ErrorDetails error={downloadError} linkColor="#9c36b5" />
                </Modal>
            ) : null}
        </>
    )
}

export default CharacterSheetMenu
