import { Button, ScrollArea, Stack, Text, Textarea, TextInput } from "@mantine/core"
import { useEffect, useState } from "react"
import { Character } from "../../data/Character"
import ReactGA from "react-ga4"
import { globals } from "../../globals"
import { nightfallScrollAreaStyles, nightfallScrollbarSize } from "./sharedScrollAreaStyles"

type BasicsPickerProps = {
    character: Character
    setCharacter: (character: Character) => void
    nextStep: () => void
}

const inputStyles = {
    label: {
        fontFamily: "Cinzel, Georgia, serif",
        fontSize: "0.9rem",
        fontWeight: 800,
        letterSpacing: "0.18em",
        textTransform: "uppercase" as const,
        color: "rgba(212, 175, 100, 0.9)",
        marginBottom: 6,
    },
    description: {
        fontFamily: "Inter, Segoe UI, sans-serif",
        fontSize: "0.76rem",
        color: "rgba(214, 204, 198, 0.4)",
        marginBottom: 4,
    },
    input: {
        background: "rgba(255, 255, 255, 0.18)",
        backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
        border: "1px solid rgba(255, 255, 255, 0.16)",
        borderRadius: 10,
        color: "rgba(244, 236, 232, 0.92)",
        fontFamily: "Inter, Segoe UI, sans-serif",
        fontSize: "1rem",
        transition: "border-color 180ms ease",
        ":focus": {
            borderColor: "rgba(190, 75, 219, 1)",
        },
    },
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
                    color: rgba(214, 204, 198, 0.5);
                    opacity: 1;
                }
            `}</style>
            <ScrollArea h={height - 230} type="auto" offsetScrollbars="present" scrollbarSize={nightfallScrollbarSize} styles={nightfallScrollAreaStyles}>
                <Stack gap={6} align="center" mb={phoneScreen ? 18 : 26}>
                    <Text
                        ta="center"
                        style={{
                            fontFamily: "Crimson Text, Georgia, serif",
                            fontSize: phoneScreen ? "1.95rem" : "2.35rem",
                            lineHeight: 1.1,
                            color: "rgba(244, 236, 232, 0.95)",
                        }}
                    >
                        Come up with the{" "}
                        <span
                            style={{
                                fontFamily: "Cinzel, Georgia, serif",
                                letterSpacing: "0.05em",
                                color: "rgba(224, 49, 49, 1)",
                            }}
                        >
                            Basics
                        </span>
                    </Text>
                </Stack>

                <Stack
                    gap="lg"
                    maw={420}
                    mx="auto"
                    px={phoneScreen ? 12 : 0}
                    pb="xl"
                >
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
                        onClick={() => {
                            setCharacter({ ...character, name, sire, ambition, desire, description })
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
