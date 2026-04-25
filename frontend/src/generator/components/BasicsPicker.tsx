import { Button, ScrollArea, Stack, Text, Textarea, TextInput } from "@mantine/core"
import { RAW_RED, RAW_GOLD, RAW_GREY, rgba } from "~/theme/colors"
import { useEffect, useState } from "react"
import { Character } from "../../data/Character"
import ReactGA from "react-ga4"
import { globals } from "../../globals"
import { generatorConfirmButtonStyles } from "./sharedGeneratorConfirmButtonStyles"
import {
    GeneratorStepHero,
    generatorFieldStyles,
    getGeneratorFieldStyles
} from "./sharedGeneratorUi"
import { nightfallScrollAreaStyles, nightfallScrollbarSize } from "./sharedScrollAreaStyles"

type BasicsPickerProps = {
    character: Character
    setCharacter: (character: Character) => void
    nextStep: () => void
}

const inputStyles = {
    ...getGeneratorFieldStyles("gold"),
    label: {
        ...generatorFieldStyles.goldLabel,
        fontWeight: 800,
        letterSpacing: "0.16em",
        color: rgba(RAW_GOLD, 0.9),
        marginBottom: 6
    },
    input: {
        ...generatorFieldStyles.input,
        background: "rgba(33, 33, 33, 0.18)",
        backdropFilter: "blur(2px)",
        WebkitBackdropFilter: "blur(2px)",
        border: "1px solid rgba(255, 255, 255, 0.16)",
        borderRadius: 10,
        color: "rgba(244, 236, 232, 0.92)",
        fontSize: "1rem",
        transition: "border-color 180ms ease",
        ":focus": {
            borderColor: "rgba(190, 75, 219, 1)"
        }
    }
}

const BasicsPicker = ({ character, setCharacter, nextStep }: BasicsPickerProps) => {
    useEffect(() => {
        ReactGA.send({ hitType: "pageview", title: "Basics Picker" })
    }, [])

    const phoneScreen = globals.isPhoneScreen
    const height = globals.viewportHeightPx

    const [name, setName] = useState(character.name)
    const [sire, setSire] = useState(character.sire)
    const [ambition, setAmbition] = useState(character.ambition)
    const [desire, setDesire] = useState(character.desire)
    const [description, setDescription] = useState(character.description)

    return (
        <div style={{ width: "100%", marginTop: height < 1250 ? "50px" : "55px" }}>
            <style>{`
                .basics-picker-input::placeholder {
                    color: ${rgba(RAW_GREY, 0.5)};
                    opacity: 1;
                }
            `}</style>
            <ScrollArea
                h={height - 230}
                type="always"
                scrollbarSize={nightfallScrollbarSize}
                styles={nightfallScrollAreaStyles}
            >
                <GeneratorStepHero
                    leadText="Come up with the"
                    accentText="Basics"
                    marginBottom={phoneScreen ? 18 : 26}
                />

                <Stack gap="lg" maw={420} mx="auto" px={phoneScreen ? 12 : 0} pb="xl">
                    <TextInput
                        value={name}
                        onChange={(e) => setName(e.currentTarget.value)}
                        placeholder="Erika Mustermann"
                        label="Full name"
                        styles={inputStyles}
                        classNames={{ input: "basics-picker-input" }}
                    />

                    <TextInput
                        value={sire}
                        onChange={(e) => setSire(e.currentTarget.value)}
                        placeholder="Your sire"
                        label="Sire"
                        description="The vampire that turned you"
                        styles={inputStyles}
                        classNames={{ input: "basics-picker-input" }}
                    />

                    <TextInput
                        value={ambition}
                        onChange={(e) => setAmbition(e.currentTarget.value)}
                        placeholder="Break free from my sire's clutches"
                        label="Long term ambition"
                        styles={inputStyles}
                        classNames={{ input: "basics-picker-input" }}
                    />

                    <TextInput
                        value={desire}
                        onChange={(e) => setDesire(e.currentTarget.value)}
                        placeholder="Embarrass my rival in court"
                        label="Short term desire"
                        styles={inputStyles}
                        classNames={{ input: "basics-picker-input" }}
                    />

                    <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.currentTarget.value)}
                        placeholder="Young alt-rock musician with a black vegan-leather jacket and long black hair"
                        label="Description & appearance"
                        autosize
                        minRows={4}
                        styles={inputStyles}
                        classNames={{ input: "basics-picker-input" }}
                    />

                    <Button
                        color="grape"
                        mt="sm"
                        mx="auto"
                        display="block"
                        styles={generatorConfirmButtonStyles}
                        onClick={() => {
                            setCharacter({
                                ...character,
                                name,
                                sire,
                                ambition,
                                desire,
                                description
                            })
                            nextStep()
                        }}
                    >
                        Confirm
                    </Button>
                </Stack>
            </ScrollArea>
        </div>
    )
}

export default BasicsPicker
