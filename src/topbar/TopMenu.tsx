import { faAnkh, faFileExport, faFloppyDisk, faTrash, faXmark } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Button, Divider, FileInput, Group, Menu, Modal, Stack, Text } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { Buffer } from 'buffer'
import { useState } from "react"
import { Character, characterSchema, getEmptyCharacter } from "../data/Character"
import { downloadCharacterSheet } from "../generator/pdfCreator"
import { downloadJson, getUploadFile } from "../generator/utils"

export type TopMenuProps = {
    character: Character
    setCharacter: (character: Character) => void
    setSelectedStep: (step: number) => void,
}

const TopMenu = ({ character, setCharacter, setSelectedStep }: TopMenuProps) => {
    const [loadedFile, setLoadedFile] = useState<File | null>(null);
    const [menuOpened, setMenuOpened] = useState(false);
    const [loadModalOpened, { open: openLoadModal, close: closeLoadModal }] = useDisclosure(false);
    const [resetModalOpened, { open: openResetModal, close: closeResetModal }] = useDisclosure(false);

    return (
        <Menu shadow="md" width={200} opened={menuOpened} onChange={setMenuOpened}>
            <Menu.Target>
                <Button color="grape" variant="light" leftIcon={<FontAwesomeIcon icon={faAnkh} />}>(Down)load</Button>
            </Menu.Target>

            <Menu.Dropdown>
                <Menu.Item icon={<FontAwesomeIcon icon={faFileExport} />} onClick={() => { downloadCharacterSheet(character) }}>Download PDF</Menu.Item>
                <Menu.Item icon={<FontAwesomeIcon icon={faFloppyDisk} />} onClick={() => { downloadJson(character) }}>Download JSON</Menu.Item>

                <Menu.Divider />

                <FileInput
                    placeholder="character.json"
                    label="Load character from json"
                    value={loadedFile}
                    onChange={async (payload: File | null) => {
                        if (!payload) return

                        setLoadedFile(payload)
                        openLoadModal()
                    }}
                />

                <Menu.Divider />

                <Menu.Item icon={<FontAwesomeIcon icon={faTrash} />} onClick={() => { openResetModal() }}>Reset</Menu.Item>

            </Menu.Dropdown>


            {/* Load Modal */}
            <Modal opened={loadModalOpened} onClose={closeLoadModal} title="Load" centered>
                <Stack>
                    <Text fz={"xl"}>Overwrite current character and load from selected file?</Text>
                    <Divider my="sm" />
                    <Group position="apart">
                        <Button color="yellow" variant="subtle" leftIcon={<FontAwesomeIcon icon={faXmark} />} onClick={closeLoadModal}>Cancel</Button>

                        <Button color="red" onClick={async () => {
                            if (!loadedFile) {
                                console.log("Error: No file loaded!")
                                return
                            }
                            const fileData = await getUploadFile(loadedFile)
                            const base64 = fileData.split(",")[1]
                            const json = Buffer.from(base64, "base64").toString()
                            const parsed = JSON.parse(json)
                            console.log({ loadedCharacter: parsed })

                            setCharacter(characterSchema.parse(parsed))
                            closeLoadModal()
                        }}>Load/Overwrite character</Button>
                    </Group>
                </Stack>
            </Modal>

            {/* Reset Modal */}
            <Modal opened={resetModalOpened} onClose={closeResetModal} title="Reset" centered>
                <Stack>
                    <Text fz={"xl"}>Reset current character?</Text>
                    <Divider my="sm" />
                    <Group position="apart">
                        <Button color="yellow" variant="subtle" leftIcon={<FontAwesomeIcon icon={faXmark} />} onClick={closeResetModal}>Cancel</Button>

                        <Button color="red" onClick={async () => {
                            setCharacter(getEmptyCharacter())
                            setSelectedStep(0)

                            closeResetModal()
                        }}>Reset character</Button>
                    </Group>
                </Stack>
            </Modal>
        </Menu>
    )
}

export default TopMenu