import { faXmark } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Button, Divider, Group, Modal, Stack, Text } from "@mantine/core"
import { Buffer } from "buffer"
import { Character, characterSchema } from "../data/Character"
import { getUploadFile } from "../generator/utils"

export type LoadModalProps = {
    setCharacter: (character: Character) => void
    loadModalOpened: boolean
    closeLoadModal: () => void
    loadedFile: File | null
}

const LoadModal = ({ loadModalOpened, closeLoadModal, setCharacter, loadedFile }: LoadModalProps) => {
    return (
        <Modal opened={loadModalOpened} onClose={closeLoadModal} title="" centered withCloseButton={false}>
            <Stack>
                <Text fz={"xl"} ta={"center"}>
                    Overwrite current character and load from selected file?
                </Text>
                <Divider my="sm" />
                <Group position="apart">
                    <Button color="yellow" variant="subtle" leftIcon={<FontAwesomeIcon icon={faXmark} />} onClick={closeLoadModal}>
                        Cancel
                    </Button>

                    <Button
                        color="red"
                        onClick={async () => {
                            if (!loadedFile) {
                                console.log("Error: No file loaded!")
                                return
                            }
                            const fileData = await getUploadFile(loadedFile)
                            const base64 = fileData.split(",")[1]
                            const json = Buffer.from(base64, "base64").toString()
                            const parsed = JSON.parse(json)
                            console.log({ loadedCharacter: parsed })

                            if (!parsed["rituals"]) parsed["rituals"] = [] // backwards compatibility for characters that were saved before rituals were added

                            setCharacter(characterSchema.parse(parsed))
                            closeLoadModal()
                        }}
                    >
                        Load/Overwrite character
                    </Button>
                </Group>
            </Stack>
        </Modal>
    )
}

export default LoadModal
