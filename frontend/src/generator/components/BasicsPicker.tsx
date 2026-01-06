import { Button, Stack, Text, TextInput, Textarea, useMantineTheme } from "@mantine/core"
import { useEffect, useState } from "react"
import { Character } from "../../data/Character"
import ReactGA from "react-ga4"
import FocusBorderWrapper from "../../character_sheet/components/FocusBorderWrapper"

type BasicsPickerProps = {
    character: Character
    setCharacter: (character: Character) => void
    nextStep: () => void
}

const BasicsPicker = ({ character, setCharacter, nextStep }: BasicsPickerProps) => {
    useEffect(() => {
        ReactGA.send({ hitType: "pageview", title: "Basics Picker" })
    }, [])

    const theme = useMantineTheme()
    const colorValue = theme.colors.grape[6]

    const [name, setName] = useState(character.name)
    const [sire, setSire] = useState(character.sire)
    const [ambition, setAmbition] = useState(character.ambition)
    const [desire, setDesire] = useState(character.desire)
    const [description, setDescription] = useState(character.description)

    return (
        <div>
            <Text fw={700} fz={"30px"} ta="center">
                Come up with the basics
            </Text>

            <Stack mt={"xl"} align="center" gap="xl">
                <FocusBorderWrapper colorValue={colorValue} style={{ width: "300px" }}>
                    <TextInput
                        style={{ width: "100%" }}
                        value={name}
                        onChange={(event) => setName(event.currentTarget.value)}
                        placeholder="Erika Mustermann"
                        label="Full name"
                    />
                </FocusBorderWrapper>

                <FocusBorderWrapper colorValue={colorValue} style={{ width: "300px" }}>
                    <TextInput
                        style={{ width: "100%" }}
                        value={sire}
                        onChange={(event) => setSire(event.currentTarget.value)}
                        placeholder="Your sire"
                        label="Sire"
                        description="The vampire that turned you"
                    />
                </FocusBorderWrapper>

                <FocusBorderWrapper colorValue={colorValue} style={{ width: "300px" }}>
                    <TextInput
                        style={{ width: "100%" }}
                        value={ambition}
                        onChange={(event) => setAmbition(event.currentTarget.value)}
                        placeholder="Break free from my sire's clutches"
                        label="Your long term ambition"
                    />
                </FocusBorderWrapper>

                <FocusBorderWrapper colorValue={colorValue} style={{ width: "300px" }}>
                    <TextInput
                        style={{ width: "100%" }}
                        value={desire}
                        onChange={(event) => setDesire(event.currentTarget.value)}
                        placeholder="Embarrass my rival in court"
                        label="Your short term desire"
                    />
                </FocusBorderWrapper>

                <FocusBorderWrapper colorValue={colorValue} style={{ width: "300px" }}>
                    <Textarea
                        value={description}
                        onChange={(event) => setDescription(event.currentTarget.value)}
                        placeholder="Young alt-rock musician with a black vegan-leather jacket and long black hair"
                        label="Description & appearance of your character"
                        autosize
                        minRows={4}
                    />
                </FocusBorderWrapper>

                <Button
                    color="grape"
                    onClick={() => {
                        setCharacter({ ...character, name, sire, ambition, desire, description })
                        nextStep()
                    }}
                >
                    Confirm
                </Button>
            </Stack>
        </div>
    )
}

export default BasicsPicker
