import { Button, ScrollArea, Stack, Text, Textarea, TextInput } from "@mantine/core"
import { RAW_RED, RAW_GOLD, RAW_GRAPE, RAW_GREY, rgba } from "~/theme/colors"
import { useState } from "react"
import { Character } from "../../data/Character"
import type { SetCharacter } from "~/hooks/useCharacterLocalStorage"
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
    setCharacter: SetCharacter
    nextStep: () => void
}

type BasicsFields = Pick<Character, "name" | "sire" | "ambition" | "desire" | "description">

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
            borderColor: rgba(RAW_GRAPE, 1)
        }
    }
}

const BasicsPicker = ({ character, setCharacter, nextStep }: BasicsPickerProps) => {
    const phoneScreen = globals.isPhoneScreen
    const height = globals.viewportHeightPx

    const [name, setName] = useState(character.name)
    const [sire, setSire] = useState(character.sire)
    const [ambition, setAmbition] = useState(character.ambition)
    const [desire, setDesire] = useState(character.desire)
    const [description, setDescription] = useState(character.description)

    // Persist on every keystroke rather than only inside the Confirm button. Previously these
    // fields lived solely in local state until Confirm committed them, so a user who typed their
    // basics and navigated away (or closed the step) without pressing Confirm silently lost
    // everything they had entered. The functional updater merges into the latest character instead
    // of a stale `character` prop snapshot, so it can't clobber concurrent writes (e.g. the
    // autosave version bump).
    const persistBasics = (updates: Partial<BasicsFields>) => {
        setCharacter((current) => ({ ...current, ...updates }))
    }

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
                        data-testid="basic-full-name-input"
                        value={name}
                        onChange={(e) => {
                            const value = e.currentTarget.value
                            setName(value)
                            persistBasics({ name: value })
                        }}
                        placeholder="Erika Mustermann"
                        label="Full name"
                        styles={inputStyles}
                        classNames={{ input: "basics-picker-input" }}
                    />

                    <TextInput
                        data-testid="basic-sire-input"
                        value={sire}
                        onChange={(e) => {
                            const value = e.currentTarget.value
                            setSire(value)
                            persistBasics({ sire: value })
                        }}
                        placeholder="Your sire"
                        label="Sire"
                        description="The vampire that turned you"
                        styles={inputStyles}
                        classNames={{ input: "basics-picker-input" }}
                    />

                    <TextInput
                        data-testid="basic-ambition-input"
                        value={ambition}
                        onChange={(e) => {
                            const value = e.currentTarget.value
                            setAmbition(value)
                            persistBasics({ ambition: value })
                        }}
                        placeholder="Break free from my sire's clutches"
                        label="Long term ambition"
                        styles={inputStyles}
                        classNames={{ input: "basics-picker-input" }}
                    />

                    <TextInput
                        data-testid="basic-desire-input"
                        value={desire}
                        onChange={(e) => {
                            const value = e.currentTarget.value
                            setDesire(value)
                            persistBasics({ desire: value })
                        }}
                        placeholder="Embarrass my rival in court"
                        label="Short term desire"
                        styles={inputStyles}
                        classNames={{ input: "basics-picker-input" }}
                    />

                    <Textarea
                        data-testid="basic-description-input"
                        value={description}
                        onChange={(e) => {
                            const value = e.currentTarget.value
                            setDescription(value)
                            persistBasics({ description: value })
                        }}
                        placeholder="Young alt-rock musician with a black vegan-leather jacket and long black hair"
                        label="Description & appearance"
                        autosize
                        minRows={4}
                        styles={inputStyles}
                        classNames={{ input: "basics-picker-input" }}
                    />

                    <Button
                        data-testid="basics-confirm-button"
                        color="grape"
                        mt="sm"
                        mx="auto"
                        display="block"
                        styles={generatorConfirmButtonStyles}
                        onClick={() => {
                            persistBasics({ name, sire, ambition, desire, description })
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
