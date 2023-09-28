import { faAnkh, faFileArrowUp, faFileExport, faFloppyDisk, faTrash } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Button, FileButton, Menu } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { useState } from "react"
import LoadModal from "../components/LoadModal"
import ResetModal from "../components/ResetModal"
import { Character } from "../data/Character"
import { downloadCharacterSheet } from "../generator/pdfCreator"
import { downloadJson } from "../generator/utils"
import { notifications } from "@mantine/notifications"

export type TopMenuProps = {
    character: Character
    setCharacter: (character: Character) => void
    setSelectedStep: (step: number) => void
}

const TopMenu = ({ character, setCharacter, setSelectedStep }: TopMenuProps) => {
    const [loadedFile, setLoadedFile] = useState<File | null>(null)
    const [menuOpened, setMenuOpened] = useState(false)
    const [loadModalOpened, { open: openLoadModal, close: closeLoadModal }] = useDisclosure(false)
    const [resetModalOpened, { open: openResetModal, close: closeResetModal }] = useDisclosure(false)

    const disabled = true
    if (disabled) return <></>

    return (
        <Menu shadow="md" width={200} opened={menuOpened} onChange={setMenuOpened}>
            <Menu.Target>
                <Button color="grape" variant="light" leftIcon={<FontAwesomeIcon icon={faAnkh} />}>
                    (Down)load
                </Button>
            </Menu.Target>

            <Menu.Dropdown>
                {/* TODO: test error handling */}
                <Menu.Item
                    icon={<FontAwesomeIcon icon={faFileExport} />}
                    onClick={() => {
                        downloadCharacterSheet(character).catch((e) => {
                            console.error(e)
                            notifications.show({
                                title: "Error when downloading",
                                message: e.message,
                                autoClose: 6000,
                                color: "red",
                            })
                        })
                    }}
                >
                    Download PDF
                </Menu.Item>
                <Menu.Item
                    icon={<FontAwesomeIcon icon={faFloppyDisk} />}
                    onClick={() => {
                        downloadJson(character).catch((e) => {
                            console.error(e)
                            notifications.show({
                                title: "Error when downloading",
                                message: e.message,
                                autoClose: 6000,
                                color: "red",
                            })
                        })
                    }}
                >
                    Download JSON
                </Menu.Item>

                <Menu.Divider />

                <FileButton
                    onChange={async (payload: File | null) => {
                        if (!payload) return

                        setLoadedFile(payload)
                        openLoadModal()
                    }}
                    accept="application/json"
                >
                    {(props) => (
                        <Button
                            leftIcon={<FontAwesomeIcon icon={faFileArrowUp} />}
                            ml={"11px"}
                            fw={400}
                            size="s"
                            color="dark"
                            variant="subtle"
                            {...props}
                        >
                            Load from file
                        </Button>
                    )}
                </FileButton>

                <Menu.Divider />

                <Menu.Item
                    icon={<FontAwesomeIcon icon={faTrash} />}
                    onClick={() => {
                        openResetModal()
                    }}
                >
                    Reset
                </Menu.Item>
            </Menu.Dropdown>

            <LoadModal
                loadedFile={loadedFile}
                setCharacter={setCharacter}
                loadModalOpened={loadModalOpened}
                closeLoadModal={closeLoadModal}
            />
            <ResetModal
                setCharacter={setCharacter}
                setSelectedStep={setSelectedStep}
                resetModalOpened={resetModalOpened}
                closeResetModal={closeResetModal}
            />
        </Menu>
    )
}

export default TopMenu
