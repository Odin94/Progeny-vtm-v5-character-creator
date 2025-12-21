import { Button, Center, Divider, Grid, Group, Modal, ScrollArea, Space, Stack, Text, TextInput, Textarea } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { useEffect, useState } from "react"
import { Character, Touchstone } from "../../data/Character"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faUser } from "@fortawesome/free-regular-svg-icons"
import ReactGA from "react-ga4"
import { trackEvent } from "../../utils/analytics"
import { faTrash, faXmark } from "@fortawesome/free-solid-svg-icons"
import { globals } from "../../globals"

type TouchstonePickerProps = {
    character: Character
    setCharacter: (character: Character) => void
    nextStep: () => void
}

const TouchstonePicker = ({ character, setCharacter, nextStep }: TouchstonePickerProps) => {
    useEffect(() => {
        ReactGA.send({ hitType: "pageview", title: "Touchstone Picker" })
    }, [])

    const initial = character.touchstones.length > 0 ? character.touchstones : [{ name: "", description: "", conviction: "" }]
    const [touchstones, setTouchstones] = useState<Touchstone[]>(initial)
    const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false)
    const [touchstoneToDelete, setTouchstoneToDelete] = useState<number | null>(null)

    const updateTouchstone = (i: number, updatedTouchstone: { name?: string; description?: string; conviction?: string }) => {
        const newTouchstones = [...touchstones]
        newTouchstones[i] = { ...touchstones[i], ...updatedTouchstone }
        setTouchstones(newTouchstones)
    }

    return (
        <div>
            <Text mt={90} fw={700} fz={globals.isSmallScreen ? "xl" : "28px"} ta="center">
                Pick your Touchstones & Convictions
            </Text>
            <Text fz={globals.isSmallScreen ? "md" : "23px"} c={"grey"} ta="center">
                Touchstones are humans in your life that tie you to your humanity
                <br />
                Connect a conviction to each relationship
            </Text>

            <Text mt={"md"} ta="center" fz="xl" fw={700} c="red">
                Touchstones
            </Text>
            <hr color="#e03131" />
            <Space h={"sm"} />

            <Stack align="center" gap={globals.isPhoneScreen ? "xs" : "xl"}>
                <ScrollArea h={globals.viewportHeightPx - 420} w={globals.isSmallScreen ? "100%" : "110%"}>
                    {touchstones.map((touchstone, i) => {
                        return (
                            <Stack key={i} mt={"20px"}>
                                <Grid style={{ width: "100%" }}>
                                    {i !== 0 ? <Divider style={{ width: "100%" }} /> : null}

                                    {globals.isPhoneScreen ? null : (
                                        <Grid.Col span={2}>
                                            <Center style={{ height: "100%" }}>
                                                <FontAwesomeIcon icon={faUser} className="fa-6x" />
                                            </Center>
                                        </Grid.Col>
                                    )}

                                    <Grid.Col span={globals.isPhoneScreen ? 12 : 4}>
                                        <TextInput
                                            style={{ width: globals.isPhoneScreen ? "100%" : "250px" }}
                                            value={touchstone.name}
                                            onChange={(event) => updateTouchstone(i, { name: event.currentTarget.value })}
                                            placeholder="Max Mustermann"
                                            label="Touchstone name"
                                        />

                                        <TextInput
                                            style={{ width: globals.isPhoneScreen ? "100%" : "250px" }}
                                            value={touchstone.conviction}
                                            onChange={(event) => updateTouchstone(i, { conviction: event.currentTarget.value })}
                                            placeholder="Never betray your friends"
                                            label="Conviction"
                                        />
                                    </Grid.Col>

                                    <Grid.Col span={globals.isSmallScreen ? 12 : 4} offset={globals.isSmallScreen ? 0 : 1}>
                                        <Textarea
                                            style={{ width: globals.isSmallScreen ? "100%" : "300px" }}
                                            value={touchstone.description}
                                            onChange={(event) => updateTouchstone(i, { description: event.currentTarget.value })}
                                            placeholder="Your childhoood friend to whom you have made a promise to always be there for each other"
                                            label="Description"
                                            autosize
                                            minRows={4}
                                        />
                                    </Grid.Col>
                                </Grid>
                                <Group>
                                    <Button
                                        leftSection={<FontAwesomeIcon icon={faTrash} />}
                                        size="xs"
                                        color="red"
                                        variant="subtle"
                                        onClick={() => {
                                            const hasContent =
                                                touchstone.name.trim() !== "" ||
                                                touchstone.description.trim() !== "" ||
                                                touchstone.conviction.trim() !== ""
                                            if (hasContent) {
                                                setTouchstoneToDelete(i)
                                                openDeleteModal()
                                            } else {
                                                const newTouchstones = [...touchstones]
                                                newTouchstones.splice(i, 1)
                                                setTouchstones(newTouchstones)
                                            }
                                        }}
                                    >
                                        Remove
                                    </Button>
                                </Group>
                            </Stack>
                        )
                    })}
                </ScrollArea>

                <Button
                    color="grape"
                    onClick={() => {
                        setTouchstones([...touchstones, { name: "", description: "", conviction: "" }])
                    }}
                >
                    Add Touchstone
                </Button>

                <Button
                    color="grape"
                    onClick={() => {
                        setCharacter({ ...character, touchstones: touchstones })

                        trackEvent({
                            action: "touchstone confirm clicked",
                            category: "touchstones",
                            label: `${touchstones.length}`,
                        })

                        nextStep()
                    }}
                >
                    Confirm
                </Button>
            </Stack>

            <Modal opened={deleteModalOpened} onClose={closeDeleteModal} title="" centered withCloseButton={false}>
                <Stack>
                    <Text fz={"xl"} ta="center">
                        Delete this touchstone?
                    </Text>
                    {touchstoneToDelete !== null && touchstones[touchstoneToDelete]?.name && (
                        <Text fz={"md"} ta="center" c="dimmed">
                            {touchstones[touchstoneToDelete].name}
                        </Text>
                    )}
                    <Divider my="sm" />
                    <Group justify="space-between">
                        <Button color="yellow" variant="subtle" leftSection={<FontAwesomeIcon icon={faXmark} />} onClick={closeDeleteModal}>
                            Cancel
                        </Button>

                        <Button
                            color="red"
                            leftSection={<FontAwesomeIcon icon={faTrash} />}
                            onClick={() => {
                                if (touchstoneToDelete !== null) {
                                    const newTouchstones = [...touchstones]
                                    newTouchstones.splice(touchstoneToDelete, 1)
                                    setTouchstones(newTouchstones)
                                }
                                setTouchstoneToDelete(null)
                                closeDeleteModal()
                            }}
                        >
                            Delete
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </div>
    )
}

export default TouchstonePicker
