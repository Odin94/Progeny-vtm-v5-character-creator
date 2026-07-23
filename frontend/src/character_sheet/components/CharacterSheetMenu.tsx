import { ActionIcon, Button, FileButton, Modal, Stack, Text } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { notifications } from "@mantine/notifications"
import {
    IconMenu2,
    IconAlertCircle,
    IconPalette,
    IconChevronLeft,
    IconFileTypePdf,
    IconDownload,
    IconUpload,
    IconShare,
    IconHeart,
    IconDeviceGamepad2,
    IconBrandDiscord,
    IconExternalLink,
    IconHelpHexagon,
    IconMessageCircle
} from "@tabler/icons-react"
import { Buffer } from "buffer"
import { AnimatePresence, motion } from "framer-motion"
import { useRef, useState } from "react"
import { z } from "zod"
import ErrorDetails from "~/components/ErrorDetails"
import ConfirmActionModal from "~/components/ConfirmActionModal"
import SupportConversationButton from "~/components/SupportConversationButton"
import { CONTACT_LINKS } from "~/constants/contactLinks"
import { loadCharacterFromJson } from "~/components/LoadModal"
import { createWoD5EVttJson } from "~/generator/foundryWoDJsonCreator"
import { createInconnuJson } from "~/generator/inconnuJsonCreator"
import { downloadCharacterSheet } from "~/generator/pdfCreator"
import {
    downloadJson,
    getUploadFile,
    updateHealthAndWillpowerAndBloodPotencyAndHumanity
} from "~/generator/utils"
import { SheetOptions } from "../CharacterSheet"
import PreferencesContent from "./PreferencesModal"
import "./CharacterSheetMenu.css"

type MenuView = "menu" | "preferences" | "disclaimer" | "export"

type CharacterSheetMenuProps = {
    options: SheetOptions
}

const slideVariants = {
    enter: (dir: number) => ({ x: dir * 40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir * -40, opacity: 0 })
}

const CharacterSheetMenu = ({ options }: CharacterSheetMenuProps) => {
    const { character, setCharacter, primaryColor, preferences, onUpdatePreferences } = options
    const [menuOpened, { open: openMenu, close: closeMenu }] = useDisclosure(false)
    const [loadModalOpened, { open: openLoadModal, close: closeLoadModal }] = useDisclosure(false)
    const [downloadError, setDownloadError] = useState<Error | undefined>()
    const [loadedFile, setLoadedFile] = useState<File | null>(null)
    const [foundryHelpOpen, setFoundryHelpOpen] = useState(false)

    const [view, setView] = useState<MenuView>("menu")
    const direction = useRef<1 | -1>(1)
    const wrapperRef = useRef<HTMLDivElement>(null)
    const [wrapperMinHeight, setWrapperMinHeight] = useState<number | undefined>(undefined)

    const navigateTo = (nextView: MenuView) => {
        direction.current = nextView === "menu" ? -1 : 1
        if (nextView !== "menu" && wrapperRef.current) {
            setWrapperMinHeight(wrapperRef.current.offsetHeight)
        }
        setView(nextView)
    }

    const handleMenuClose = () => {
        closeMenu()
        setView("menu")
        setFoundryHelpOpen(false)
    }

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
            const blob = new Blob([JSON.stringify(vtt, null, 2)], {
                type: "application/json"
            })
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
                    autoClose: 10000
                })
            }

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
            const blob = new Blob([JSON.stringify(inconnuJson, null, 2)], {
                type: "application/json"
            })
            const link = document.createElement("a")
            link.href = window.URL.createObjectURL(blob)
            link.download = `inconnu_${character.name}.json`
            link.click()

            setTimeout(() => {
                window.URL.revokeObjectURL(link.href)
            }, 100)

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
                autoClose: 3000
            })
        } catch (e) {
            if (e instanceof z.ZodError) {
                notifications.show({
                    title: "JSON content error loading character",
                    message: z.prettifyError(e),
                    color: "red",
                    autoClose: false
                })
            } else {
                notifications.show({
                    title: "Error loading character",
                    message: e instanceof Error ? e.message : "Unknown error occurred",
                    color: "red",
                    autoClose: false
                })
            }
            console.error(e)
        }
    }

    const menuTitle =
        view === "menu" ? (
            <div>
                <Text className="sheet-menu__title">Character sheet</Text>
            </div>
        ) : (
            <Button
                leftSection={<IconChevronLeft size={16} />}
                size="sm"
                variant="subtle"
                onClick={() => navigateTo("menu")}
                className="sheet-menu__back"
            >
                Back to menu
            </Button>
        )

    return (
        <>
            <ActionIcon
                aria-label="Open character sheet menu"
                size="xl"
                variant="light"
                color={primaryColor}
                radius="xl"
                onClick={openMenu}
                style={{
                    position: "fixed",
                    bottom: "2rem",
                    right: "2rem",
                    zIndex: 100
                }}
            >
                <IconMenu2 size={24} />
            </ActionIcon>

            {menuOpened ? (
                <Modal
                    opened={menuOpened}
                    onClose={handleMenuClose}
                    title={menuTitle}
                    centered
                    size="lg"
                    zIndex={2000}
                    classNames={{
                        overlay: "sheet-menu__overlay",
                        content: "sheet-menu__modal",
                        header: "sheet-menu__header",
                        body: "sheet-menu__body",
                        close: "sheet-menu__close"
                    }}
                >
                    <div
                        ref={wrapperRef}
                        style={{
                            overflow: "hidden",
                            position: "relative",
                            minHeight: wrapperMinHeight
                        }}
                    >
                        <AnimatePresence mode="wait" custom={direction.current} initial={false}>
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
                                    <Stack gap="xl">
                                        <section>
                                            <Text className="sheet-menu__section-label">
                                                Export & save
                                            </Text>
                                            <div className="sheet-menu__action-grid">
                                                <Button
                                                    leftSection={<IconFileTypePdf size={22} />}
                                                    onClick={handleDownloadPDF}
                                                    className="sheet-menu__action sheet-menu__action--featured"
                                                    justify="flex-start"
                                                >
                                                    <div className="sheet-menu__action-copy">
                                                        <strong>Download PDF</strong>
                                                        <small>Print-ready character sheet</small>
                                                    </div>
                                                </Button>
                                                <Button
                                                    leftSection={<IconDownload size={22} />}
                                                    onClick={handleDownloadJSON}
                                                    className="sheet-menu__action"
                                                    justify="flex-start"
                                                >
                                                    <div className="sheet-menu__action-copy">
                                                        <strong>Save file</strong>
                                                        <small>Keep a JSON backup</small>
                                                    </div>
                                                </Button>
                                                <FileButton
                                                    onChange={handleLoadFromFile}
                                                    accept="application/json"
                                                >
                                                    {(props) => (
                                                        <Button
                                                            leftSection={<IconUpload size={22} />}
                                                            {...props}
                                                            className="sheet-menu__action"
                                                            justify="flex-start"
                                                        >
                                                            <div className="sheet-menu__action-copy">
                                                                <strong>Load file</strong>
                                                                <small>
                                                                    Restore a saved character
                                                                </small>
                                                            </div>
                                                        </Button>
                                                    )}
                                                </FileButton>
                                                <Button
                                                    leftSection={<IconShare size={22} />}
                                                    onClick={() => navigateTo("export")}
                                                    className="sheet-menu__action"
                                                    justify="flex-start"
                                                >
                                                    <div className="sheet-menu__action-copy">
                                                        <strong>Export</strong>
                                                        <small>Foundry, Inconnu & more</small>
                                                    </div>
                                                </Button>
                                            </div>
                                        </section>

                                        <div className="sheet-menu__utility-row">
                                            <Button
                                                leftSection={<IconPalette size={18} />}
                                                variant="subtle"
                                                onClick={() => navigateTo("preferences")}
                                            >
                                                Preferences
                                            </Button>
                                            <Button
                                                component="a"
                                                href={CONTACT_LINKS.kofi.href}
                                                target="_blank"
                                                rel="noreferrer"
                                                leftSection={<IconHeart size={18} />}
                                                variant="subtle"
                                            >
                                                Support the project
                                            </Button>
                                            <Button
                                                leftSection={<IconAlertCircle size={18} />}
                                                variant="subtle"
                                                onClick={() => navigateTo("disclaimer")}
                                            >
                                                Disclaimer
                                            </Button>
                                            <SupportConversationButton
                                                source="character-sheet-menu"
                                                leftSection={<IconMessageCircle size={18} />}
                                                variant="subtle"
                                                onClickStart={handleMenuClose}
                                            >
                                                Feedback & support
                                            </SupportConversationButton>
                                        </div>
                                    </Stack>
                                ) : view === "preferences" ? (
                                    <Stack gap="md">
                                        <PreferencesContent
                                            preferences={preferences}
                                            onUpdate={onUpdatePreferences}
                                            primaryColor={primaryColor}
                                        />
                                    </Stack>
                                ) : view === "export" ? (
                                    <Stack gap="md" className="sheet-menu__export-view">
                                        <div>
                                            <Text className="sheet-menu__section-label">
                                                Export
                                            </Text>
                                            <Text className="sheet-menu__view-title">
                                                Download a character file prepared for your platform
                                                of choice.
                                            </Text>
                                        </div>

                                        <div className="sheet-menu__export-options">
                                            <div className="sheet-menu__export-card">
                                                <div className="sheet-menu__export-icon">
                                                    <IconDeviceGamepad2 size={24} />
                                                </div>
                                                <div className="sheet-menu__export-copy">
                                                    <div className="sheet-menu__export-heading">
                                                        <a
                                                            href="https://foundryvtt.com/packages/vtm5e"
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            Foundry WoD5E VTT{" "}
                                                            <IconExternalLink size={14} />
                                                        </a>
                                                        <button
                                                            type="button"
                                                            className="sheet-menu__help-button"
                                                            aria-label="How to import into Foundry"
                                                            aria-expanded={foundryHelpOpen}
                                                            onClick={() =>
                                                                setFoundryHelpOpen((open) => !open)
                                                            }
                                                        >
                                                            <IconHelpHexagon size={18} />
                                                        </button>
                                                    </div>
                                                    <Text>
                                                        Import your character into the Foundry
                                                        virtual tabletop.
                                                    </Text>
                                                </div>
                                                <Button
                                                    leftSection={<IconDownload size={17} />}
                                                    onClick={handleExportToFoundry}
                                                >
                                                    Export JSON
                                                </Button>
                                                {foundryHelpOpen ? (
                                                    <div className="sheet-menu__foundry-help">
                                                        <Text className="sheet-menu__foundry-help-title">
                                                            Import into Foundry
                                                        </Text>
                                                        <ol>
                                                            <li>Export the character to JSON.</li>
                                                            <li>
                                                                Create a Vampire character in
                                                                Foundry.
                                                            </li>
                                                            <li>
                                                                Right-click that character under
                                                                Actors.
                                                            </li>
                                                            <li>
                                                                Select Import Data and upload the
                                                                JSON file.
                                                            </li>
                                                        </ol>
                                                    </div>
                                                ) : null}
                                            </div>

                                            <div className="sheet-menu__export-card">
                                                <div className="sheet-menu__export-icon">
                                                    <IconBrandDiscord size={24} />
                                                </div>
                                                <div className="sheet-menu__export-copy">
                                                    <a
                                                        href="https://docs.inconnu.app"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        Inconnu Discord Bot{" "}
                                                        <IconExternalLink size={14} />
                                                    </a>
                                                    <Text>
                                                        Use your character with the Inconnu Discord
                                                        manager.
                                                    </Text>
                                                </div>
                                                <Button
                                                    leftSection={<IconDownload size={17} />}
                                                    onClick={handleExportToInconnu}
                                                >
                                                    Export JSON
                                                </Button>
                                            </div>
                                        </div>
                                    </Stack>
                                ) : (
                                    <Stack gap="md" className="sheet-menu__disclaimer">
                                        <Text>
                                            This is an independent production and is not affiliated
                                            with or endorsed by World of Darkness, Paradox
                                            Interactive, or any of their subsidiaries.
                                        </Text>
                                        <Text>
                                            This tool is created under the{" "}
                                            <a
                                                href="https://www.worldofdarkness.com/dark-pack"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                Dark Pack License
                                            </a>
                                            .
                                        </Text>
                                        <Text>
                                            Vampire: The Masquerade and World of Darkness are
                                            trademarks of Paradox Interactive. All rights reserved.
                                        </Text>
                                        <Text c="dimmed" size="sm">
                                            The PDF template used for exporting is kindly provided
                                            by{" "}
                                            <a
                                                href="https://linktr.ee/nerdbert"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                Nerdbert
                                            </a>
                                            .
                                        </Text>
                                    </Stack>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </Modal>
            ) : null}

            {loadModalOpened ? (
                <ConfirmActionModal
                    opened
                    onClose={closeLoadModal}
                    onConfirm={handleConfirmLoad}
                    title="Overwrite Character?"
                    body="This will overwrite the current character with the selected file. This action cannot be undone."
                    confirmLabel="Overwrite"
                />
            ) : null}

            {downloadError ? (
                <Modal
                    opened={!!downloadError}
                    onClose={() => setDownloadError(undefined)}
                    title="Download Error"
                    centered
                >
                    <ErrorDetails error={downloadError} linkColor="#9c36b5" />
                </Modal>
            ) : null}
        </>
    )
}

export default CharacterSheetMenu
