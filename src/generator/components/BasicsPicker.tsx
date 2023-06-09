import { Button, Stack, Text, TextInput, Textarea } from "@mantine/core"
import { useEffect, useState } from "react"
import { Character } from "../../data/Character"
import ReactGA from "react-ga4"

type BasicsPickerProps = {
    character: Character,
    setCharacter: (character: Character) => void
    nextStep: () => void
}

const BasicsPicker = ({ character, setCharacter, nextStep }: BasicsPickerProps) => {
    useEffect(() => { ReactGA.send({ hitType: "pageview", title: "Basics Picker" }) }, [])

    const [name, setName] = useState(character.name)
    const [sire, setSire] = useState(character.sire)
    const [ambition, setAmbition] = useState(character.ambition)
    const [desire, setDesire] = useState(character.desire)
    const [description, setDescription] = useState(character.description)

    return (
        <div>
            <Text fw={700} fz={"30px"} ta="center">Come up with the basics</Text>

            <Stack mt={"xl"} align="center" spacing="xl">
                <TextInput
                    style={{ width: "300px" }}
                    value={name}
                    onChange={(event) => setName(event.currentTarget.value)}
                    placeholder="Erika Mustermann"
                    label="Full name"
                />

                <TextInput
                    style={{ width: "300px" }}
                    value={sire}
                    onChange={(event) => setSire(event.currentTarget.value)}
                    placeholder="Your sire"
                    label="Sire"
                    description="The vampire that turned you"
                />

                <TextInput
                    style={{ width: "300px" }}
                    value={ambition}
                    onChange={(event) => setAmbition(event.currentTarget.value)}
                    placeholder="Break free from my sire's clutches"
                    label="Your long term ambition"
                />

                <TextInput
                    style={{ width: "300px" }}
                    value={desire}
                    onChange={(event) => setDesire(event.currentTarget.value)}
                    placeholder="Embarrass my rival in court"
                    label="Your short term desire"
                />

                <Textarea
                    style={{ width: "300px" }}
                    value={description}
                    onChange={(event) => setDescription(event.currentTarget.value)}
                    placeholder="Young alt-rock musician with a black vegan-leather jacket and long black hair"
                    label="Description & appearance of your character"
                    autosize
                    minRows={4}
                />

                <Button color="grape" onClick={() => {
                    setCharacter({ ...character, name, sire, ambition, desire, description })
                    nextStep()
                }}>Confirm</Button>
            </Stack>
        </div>
    )
}

export default BasicsPicker