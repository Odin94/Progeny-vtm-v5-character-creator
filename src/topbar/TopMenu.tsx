import { faFileExport, faFloppyDisk, faUpload } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Button, Center, Container, FileInput, Menu, Space, Stack } from "@mantine/core"
import { Buffer } from 'buffer'
import { useState } from "react"
import { Character, characterSchema } from "../data/Character"
import { downloadCharacterSheet } from "../generator/pdfCreator"
import { downloadJson, getUploadFile } from "../generator/utils"

export type TopMenuProps = {
    character: Character
    setCharacter: (character: Character) => void
}

const TopMenu = ({ character, setCharacter }: TopMenuProps) => {
    const [loadedCharacter, setLoadedCharacter] = useState<File | null>(null);
    const [opened, setOpened] = useState(false);

    return (<Menu shadow="md" width={200} opened={opened} onChange={setOpened}>
        <Menu.Target>
            <Button>(Down)load</Button>
        </Menu.Target>

        <Menu.Dropdown>
            <Menu.Item icon={<FontAwesomeIcon icon={faFileExport} />} onClick={() => { downloadCharacterSheet(character) }}>Download PDF</Menu.Item>
            <Menu.Item icon={<FontAwesomeIcon icon={faFloppyDisk} />} onClick={() => { downloadJson(character) }}>Download JSON</Menu.Item>

            <Menu.Divider />

            <Menu.Item icon={<FontAwesomeIcon icon={faUpload} />}>Load Character from JSON</Menu.Item>

            <Stack>
                <Center>
                    {/* TODO: Get this functionality into the Menu.Item for uploading somehow..? */}
                    {/* TODO: Make this open the LoadConfirmModal */}
                    <FileInput
                        placeholder="character.json"
                        label="Load character from json"
                        value={loadedCharacter}
                        onChange={async (payload: File | null) => {
                            if (!payload) return

                            const fileData = await getUploadFile(payload)
                            const base64 = fileData.split(",")[1]
                            const json = Buffer.from(base64, "base64").toString()
                            const parsed = JSON.parse(json)
                            console.log({ loadedCharacter: parsed })

                            setCharacter(characterSchema.parse(parsed))
                        }}
                    />
                </Center>
                <Space h={"xs"} />
                {/* <Button color="red" onClick={async () => {
                        if (!loadedCharacter) return

                        const fileData = await getUploadFile(loadedCharacter)
                        const base64 = fileData.split(",")[1]
                        const json = Buffer.from(base64, "base64").toString()
                        const parsed = JSON.parse(json)
                        console.log({ loadedCharacter: parsed })

                        setCharacter(characterSchema.parse(parsed))
                    }}>Load character</Button> */}
            </Stack>
        </Menu.Dropdown>
    </Menu>)
}

export default TopMenu