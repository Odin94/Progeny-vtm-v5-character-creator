import { ScrollArea, SimpleGrid, Stack, Textarea, TextInput } from "@mantine/core"
import { useState } from "react"
import { Panel } from "~/components/ui"
import { Character } from "../../data/Character"
import type { SetCharacter } from "~/hooks/useCharacterLocalStorage"
import { globals } from "../../globals"
import {
    GeneratorConfirmButton,
    GeneratorStepFooter,
    GeneratorStepHero,
    getGeneratorFieldStyles
} from "./sharedGeneratorUi"
import {
    generatorScrollableAreaStyle,
    generatorScrollableContentStyle,
    generatorScrollableShellStyle
} from "./sharedGeneratorScrollableLayout"
import { nightfallScrollAreaStyles, nightfallScrollbarSize } from "./sharedScrollAreaStyles"

type BasicsPickerProps = {
    character: Character
    setCharacter: SetCharacter
    nextStep: () => void
}

type BasicsFields = Pick<Character, "name" | "sire" | "ambition" | "desire" | "description">

const inputStyles = getGeneratorFieldStyles("gold")

const BasicsPicker = ({ character, setCharacter, nextStep }: BasicsPickerProps) => {
    const phoneScreen = globals.isPhoneScreen

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

    const fieldProps = { size: "md" as const, styles: inputStyles }

    return (
        <div style={generatorScrollableShellStyle}>
            <ScrollArea
                style={generatorScrollableAreaStyle}
                w="100%"
                px={phoneScreen ? 12 : 20}
                pt={4}
                pb={8}
                type="always"
                scrollbarSize={nightfallScrollbarSize}
                styles={nightfallScrollAreaStyles}
            >
                <div style={{ ...generatorScrollableContentStyle, maxWidth: 640 }}>
                    <GeneratorStepHero
                        leadText="Come up with the"
                        accentText="Basics"
                        marginBottom={phoneScreen ? 16 : 24}
                    />

                    <Panel tone="glass" p={phoneScreen ? "md" : "xl"} radius="lg">
                        <Stack gap="lg">
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
                                autoFocus={!phoneScreen && !name}
                                {...fieldProps}
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
                                {...fieldProps}
                            />

                            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
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
                                    {...fieldProps}
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
                                    {...fieldProps}
                                />
                            </SimpleGrid>

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
                                {...fieldProps}
                            />
                        </Stack>
                    </Panel>

                    <GeneratorStepFooter>
                        <GeneratorConfirmButton
                            data-testid="basics-confirm-button"
                            onClick={() => {
                                persistBasics({ name, sire, ambition, desire, description })
                                nextStep()
                            }}
                        />
                    </GeneratorStepFooter>
                </div>
            </ScrollArea>
        </div>
    )
}

export default BasicsPicker
