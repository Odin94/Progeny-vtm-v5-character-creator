import { Button, Center, Divider, Grid, Stack, TextInput, Textarea } from "@mantine/core"
import { useState } from "react"
import { Character, Touchstone } from "../../data/Character"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser } from "@fortawesome/free-regular-svg-icons"

type TouchstonePickerProps = {
    character: Character,
    setCharacter: (character: Character) => void
    nextStep: () => void
}

const TouchstonePicker = ({ character, setCharacter, nextStep }: TouchstonePickerProps) => {
    const [touchtones, setTouchstones] = useState<Touchstone[]>([{ name: "", description: "", conviction: "" }])

    const updateTouchstone = (i: number, updatedTouchstone: { name?: string, description?: string, conviction?: string }) => {
        const newTouchstones = [...touchtones]
        newTouchstones[i] = { ...touchtones[i], ...updatedTouchstone }
        setTouchstones(newTouchstones)
    }

    return (
        <div>
            <h1>Pick your Touchstones & Convictions</h1>
            <Stack align="center" spacing="xl">

                {
                    touchtones.map((touchstone, i) => {
                        return (
                            <Grid key={i} style={{ width: "100%" }}>
                                {i !== 0 ? <Divider style={{ width: "100%" }} /> : null}

                                <Grid.Col span={2}>
                                    <Center style={{ height: "100%" }}>
                                        <FontAwesomeIcon icon={faUser} className="fa-6x" />
                                    </Center>
                                </Grid.Col>

                                <Grid.Col span={4}>
                                    <TextInput
                                        style={{ width: "300px" }}
                                        value={touchstone.name}
                                        onChange={(event) => updateTouchstone(i, { name: event.currentTarget.value })}
                                        placeholder="Max Mustermann"
                                        label="Full name"
                                    />

                                    <TextInput
                                        style={{ width: "300px" }}
                                        value={touchstone.conviction}
                                        onChange={(event) => updateTouchstone(i, { conviction: event.currentTarget.value })}
                                        placeholder="Never betray your friends and acquaintances"
                                        label="Conviction"
                                    />
                                </Grid.Col>

                                <Grid.Col span={4} offset={1}>
                                    <Textarea
                                        style={{ width: "300px" }}
                                        value={touchstone.description}
                                        onChange={(event) => updateTouchstone(i, { description: event.currentTarget.value })}
                                        placeholder="Your childhoood friend to whom you have made a promise to always be there for each other"
                                        label="Description"
                                        autosize
                                        minRows={4}
                                    />
                                </Grid.Col>

                            </Grid>
                        )
                    })
                }

                <Button color="grape" onClick={() => {
                    setTouchstones([...touchtones, { name: "", description: "", conviction: "" }])
                }}>Add Touchstone</Button>

                <Button color="grape" onClick={() => {
                    setCharacter({ ...character, touchstones: touchtones })
                    nextStep()
                }}>Confirm</Button>
            </Stack>
        </div>
    )
}

export default TouchstonePicker