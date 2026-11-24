import { ScrollArea, Select, Stack } from "@mantine/core"
import { IconDroplet, IconSparkles, IconStar, IconSkull } from "@tabler/icons-react"
import { Panel } from "~/components/ui"
import { useEffect, useMemo } from "react"
import { Character, getEmptyCharacter } from "../../data/Character"
import { trackEvent } from "../../utils/analytics"
import { calculateBloodPotency } from "../../data/BloodPotency"
import { getGenerationBonusXp } from "~/data/Generation"
import { getCharacterWithGeneration } from "../generation"
import { globals } from "../../globals"
import {
    generatorScrollableAreaStyle,
    generatorScrollableContentStyle,
    generatorScrollableShellStyle
} from "./sharedGeneratorScrollableLayout"
import { nightfallScrollAreaStyles, nightfallScrollbarSize } from "./sharedScrollAreaStyles"
import {
    GeneratorConfirmButton,
    GeneratorSectionDivider,
    GeneratorStepFooter,
    GeneratorStepHero,
    getGeneratorFieldStyles
} from "./sharedGeneratorUi"
import classes from "./GenerationPicker.module.css"

type GenerationPickerProps = {
    character: Character
    setCharacter: (character: Character) => void
    nextStep: () => void
}

type GenerationOption = {
    value: string
    label: string
    tier: string
}

const generationOptions: GenerationOption[] = [
    { value: "14", label: "14th Gen - Childer", tier: "Childer" },
    { value: "13", label: "13th Gen - Neonate", tier: "Neonate" },
    { value: "12", label: "12th Gen - Neonate", tier: "Neonate" },
    { value: "11", label: "11th Gen - Ancilla", tier: "Ancilla" },
    { value: "10", label: "10th Gen - Ancilla", tier: "Ancilla" }
]

const getGenerationSummary = (generation: number) => {
    const baseCharacter = { ...getEmptyCharacter(), generation }
    const bloodPotency = calculateBloodPotency(baseCharacter)
    const bonusXp = getGenerationBonusXp(generation)
    const additionalAdvantageDots = generation === 10 || generation === 11 ? 2 : 0
    const additionalFlawDots = generation === 10 || generation === 11 ? 2 : 0

    return { bloodPotency, bonusXp, additionalAdvantageDots, additionalFlawDots }
}

const GenerationPicker = ({ character, setCharacter, nextStep }: GenerationPickerProps) => {
    const phoneScreen = globals.isPhoneScreen

    const isThinBlood = character.clan === "Thin-blood"
    const selectedGenerationValue = isThinBlood ? "14" : String(character.generation || 13)

    const availableOptions = useMemo(
        () =>
            isThinBlood
                ? generationOptions.filter((option) => option.value === "14")
                : generationOptions,
        [isThinBlood]
    )

    const selectedGeneration =
        availableOptions.find((option) => option.value === selectedGenerationValue) ?? null
    const selectedNumber = Number(selectedGenerationValue)
    const generationSummary = getGenerationSummary(selectedNumber)

    // Generation defaults to Neonate (or Thin-blood) in the UI. Persist that displayed choice
    // immediately so sidebar navigation cannot leave a character with a shown XP bonus that was
    // never written to the sheet.
    useEffect(() => {
        const updated = getCharacterWithGeneration(character, Number(selectedGenerationValue))
        if (updated !== character) setCharacter(updated)
    }, [character, selectedGenerationValue, setCharacter])

    const handleGenerationChange = (value: string | null) => {
        if (value !== null) setCharacter(getCharacterWithGeneration(character, Number(value)))
    }

    const confirmButton = (
        <GeneratorConfirmButton
            data-testid="generation-confirm-button"
            onClick={() => {
                setCharacter(getCharacterWithGeneration(character, selectedNumber))
                trackEvent({
                    action: "generation submit clicked",
                    category: "generation",
                    label: selectedGenerationValue
                })
                nextStep()
            }}
        />
    )

    const ladder = [14, 13, 12, 11, 10]

    return (
        <div style={generatorScrollableShellStyle}>
            <Stack
                align="center"
                gap="md"
                style={{ ...generatorScrollableAreaStyle, width: "100%" }}
            >
                <ScrollArea
                    style={generatorScrollableAreaStyle}
                    w="100%"
                    px={20}
                    pt={4}
                    pb={8}
                    type="always"
                    scrollbarSize={nightfallScrollbarSize}
                    styles={nightfallScrollAreaStyles}
                >
                    <div style={generatorScrollableContentStyle}>
                        <GeneratorStepHero
                            leadText="Pick your"
                            accentText="Generation"
                            description={
                                isThinBlood
                                    ? "Thin-bloods can only begin at 14th generation."
                                    : "Default choice is '13th Gen - Neonate'"
                            }
                            marginBottom={phoneScreen ? 12 : 16}
                        />

                        <GeneratorSectionDivider
                            label="Generation"
                            marginY={phoneScreen ? "sm" : "md"}
                        />

                        <Stack align="center" gap={phoneScreen ? "md" : "lg"}>
                            <Select
                                value={selectedGenerationValue}
                                onChange={handleGenerationChange}
                                placeholder="Select your generation"
                                aria-label="Generation"
                                data={availableOptions}
                                color="grape"
                                size="md"
                                allowDeselect={false}
                                className={classes.select}
                                classNames={{ input: classes.selectInput }}
                                styles={{ label: getGeneratorFieldStyles("muted").label }}
                            />

                            {phoneScreen ? confirmButton : null}

                            {selectedGeneration ? (
                                <Panel
                                    tone="ornate"
                                    p={phoneScreen ? "md" : "lg"}
                                    className={classes.summary}
                                >
                                    <div className={classes.numeralRow}>
                                        <span className={classes.tier}>
                                            {selectedGeneration.tier}
                                        </span>
                                        <span className={classes.numeral}>
                                            {selectedNumber}
                                            <sup>th</sup>
                                        </span>
                                        <span className={classes.numeralLabel}>Generation</span>
                                        <div className={classes.ladder} aria-hidden="true">
                                            {ladder.map((rung, index) => (
                                                <span key={rung} style={{ display: "contents" }}>
                                                    {index > 0 ? (
                                                        <span className={classes.rungLine} />
                                                    ) : null}
                                                    <span
                                                        className={classes.rung}
                                                        data-reached={
                                                            rung >= selectedNumber || undefined
                                                        }
                                                        data-current={
                                                            rung === selectedNumber || undefined
                                                        }
                                                    />
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className={classes.stats}>
                                        <div
                                            className={classes.stat}
                                            data-wide={generationSummary.bonusXp === 0 || undefined}
                                        >
                                            <span className={classes.statValue}>
                                                {generationSummary.bloodPotency}
                                            </span>
                                            <span className={classes.statLabel}>
                                                <IconDroplet
                                                    size={12}
                                                    className={classes.statIcon}
                                                />
                                                Blood Potency
                                            </span>
                                        </div>
                                        {generationSummary.bonusXp > 0 ? (
                                            <div className={classes.stat}>
                                                <span className={classes.statValue}>
                                                    +{generationSummary.bonusXp}
                                                </span>
                                                <span className={classes.statLabel}>
                                                    <IconSparkles
                                                        size={12}
                                                        className={classes.statIcon}
                                                    />
                                                    Bonus XP
                                                </span>
                                            </div>
                                        ) : null}
                                        {generationSummary.additionalAdvantageDots > 0 ? (
                                            <div className={classes.stat}>
                                                <span className={classes.statValue}>
                                                    +{generationSummary.additionalAdvantageDots}
                                                </span>
                                                <span className={classes.statLabel}>
                                                    <IconStar
                                                        size={12}
                                                        className={classes.statIcon}
                                                    />
                                                    Additional Merits
                                                </span>
                                            </div>
                                        ) : null}
                                        {generationSummary.additionalFlawDots > 0 ? (
                                            <div className={classes.stat}>
                                                <span className={classes.statValue}>
                                                    +{generationSummary.additionalFlawDots}
                                                </span>
                                                <span className={classes.statLabel}>
                                                    <IconSkull
                                                        size={12}
                                                        className={classes.statIcon}
                                                    />
                                                    Additional Flaws
                                                </span>
                                            </div>
                                        ) : null}
                                    </div>
                                </Panel>
                            ) : null}
                        </Stack>
                    </div>
                </ScrollArea>

                {!phoneScreen ? <GeneratorStepFooter>{confirmButton}</GeneratorStepFooter> : null}
            </Stack>
        </div>
    )
}

export default GenerationPicker
