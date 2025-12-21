import { faXmark } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Button, Divider, Group, Modal, Stack, Text } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { Buffer } from "buffer"
import { z } from "zod"
import { clans } from "~/data/Clans"
import { clanNameSchema } from "~/data/NameSchemas"
import { Character, characterSchema, containsBloodSorcery } from "../data/Character"
import { getUploadFile } from "../generator/utils"

export type LoadModalProps = {
    setCharacter: (character: Character) => void
    loadModalOpened: boolean
    closeLoadModal: () => void
    loadedFile: File | null
    setSelectedStep: (step: number) => void
}

const LoadModal = ({ loadModalOpened, closeLoadModal, setCharacter, loadedFile, setSelectedStep }: LoadModalProps) => {
    return (
        <Modal opened={loadModalOpened} onClose={closeLoadModal} title="" centered withCloseButton={false}>
            <Stack>
                <Text fz={"xl"} ta={"center"}>
                    Overwrite current character and load from selected file?
                </Text>
                <Divider my="sm" />
                <Group justify="space-between">
                    <Button color="yellow" variant="subtle" leftSection={<FontAwesomeIcon icon={faXmark} />} onClick={closeLoadModal}>
                        Cancel
                    </Button>

                    <Button
                        color="red"
                        onClick={async () => {
                            if (!loadedFile) {
                                console.log("Error: No file loaded!")
                                return
                            }
                            try {
                                const fileData = await getUploadFile(loadedFile)
                                const base64 = fileData.split(",")[1]
                                const json = Buffer.from(base64, "base64").toString()
                                const parsed = JSON.parse(json)
                                console.log({ loadedCharacter: parsed })

                                if (!parsed["rituals"]) parsed["rituals"] = [] // backwards compatibility for characters that were saved before rituals were added
                                if (!parsed["predatorType"]["pickedMeritsAndFlaws"]) parsed["predatorType"]["pickedMeritsAndFlaws"] = [] // backwards compatibility for characters that were saved before pickedMeritsAndFlaws were added
                                if (!parsed["availableDisciplineNames"]) {
                                    // backwards compatibility for characters that were saved before Caitiff were added
                                    const clan = clanNameSchema.parse(parsed["clan"])
                                    const clanDisciplines = clans[clan].nativeDisciplines

                                    parsed["availableDisciplineNames"] = Array.from(new Set(clanDisciplines))
                                }
                                const loadedCharacter = characterSchema.parse(parsed)
                                setCharacter(loadedCharacter)
                                // Navigate to Final step
                                // Final is at case 11, but due to patching logic:
                                // - If character has blood sorcery: step 11 → case 11 (Final)
                                // - If character doesn't have blood sorcery: step 10 → case 11 (Final) after patching
                                const finalStep = containsBloodSorcery(loadedCharacter.disciplines) ? 11 : 10
                                setSelectedStep(finalStep)
                                closeLoadModal()
                            } catch (e) {
                                if (e instanceof z.ZodError) {
                                    notifications.show({
                                        title: "JSON content error loading character",
                                        message: z.prettifyError(e),
                                        color: "red",
                                        autoClose: false,
                                    })
                                }
                                console.log({ e })
                            }
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
