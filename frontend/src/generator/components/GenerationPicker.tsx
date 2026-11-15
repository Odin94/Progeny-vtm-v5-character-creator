import { Box, Button, ScrollArea, Select, Stack, Text } from "@mantine/core"
import { RAW_GREY, RAW_RED, rgba } from "~/theme/colors"
import { useEffect, useMemo } from "react"
import { Character, getEmptyCharacter } from "../../data/Character"
import { trackEvent } from "../../utils/analytics"
import { calculateBloodPotency } from "../../data/BloodPotency"
import { updateHealthAndWillpowerAndBloodPotencyAndHumanity } from "../utils"
import { globals } from "../../globals"
import { generatorConfirmButtonStyles } from "./sharedGeneratorConfirmButtonStyles"
import {
    generatorScrollableAreaStyle,
    generatorScrollableContentStyle,
    generatorScrollableShellStyle
} from "./sharedGeneratorScrollableLayout"
import { nightfallScrollAreaStyles, nightfallScrollbarSize } from "./sharedScrollAreaStyles"
import {
    GeneratorSectionDivider,
    GeneratorStepHero,
    generatorFieldStyles,
    getGeneratorFieldStyles
} from "./sharedGeneratorUi"

type GenerationPickerProps = {
    character: Character
    setCharacter: (character: Character) => void
    nextStep: () => void
    generation: string | null
    setGeneration: (generation: string | null) => void
}

type GenerationOption = {
    value: string
    label: string
    tier: string
}

const summaryLabelStyle = {
    fontFamily: "Inter, Segoe UI, sans-serif",
    fontSize: "0.84rem",
    letterSpacing: "0.05em",
    color: "rgba(230, 221, 214, 0.72)"
} as const

const summaryValueStyle = {
    color: "rgba(244, 236, 232, 0.95)",
    minWidth: "1.8rem",
    textAlign: "right" as const
} as const

const generationOptions: GenerationOption[] = [
    { value: "14", label: "14th Gen - Childer", tier: "Childer" },
    { value: "13", label: "13th Gen - Neonate", tier: "Neonate" },
    { value: "12", label: "12th Gen - Neonate", tier: "Neonate" },
    { value: "11", label: "11th Gen - Ancilla", tier: "Ancilla" },
    { value: "10", label: "10th Gen - Ancilla", tier: "Ancilla" }
]

export const getGenerationBonusXp = (generation: number) => {
    if (generation === 13 || generation === 12) return 15
    if (generation === 11 || generation === 10) return 35
    return 0
}

export const getCharacterWithGeneration = (character: Character, generation: number) => {
    const updatedCharacter = {
        ...character,
        generation,
        // Changing generation may grant a larger starting budget, but it must never
        // take XP away from an existing character. This makes a 13th-generation
        // character with 15 XP become 35 XP at 10th generation while preserving a
        // character that already has more XP than the newly selected budget.
        experience: Math.max(character.experience, getGenerationBonusXp(generation))
    }
    updateHealthAndWillpowerAndBloodPotencyAndHumanity(updatedCharacter)

    return updatedCharacter
}

const getGenerationSummary = (generation: number) => {
    const baseCharacter = { ...getEmptyCharacter(), generation }
    const bloodPotency = calculateBloodPotency(baseCharacter)
    const bonusXp = getGenerationBonusXp(generation)
    const additionalAdvantageDots = generation === 10 || generation === 11 ? 2 : 0
    const additionalFlawDots = generation === 10 || generation === 11 ? 2 : 0

    return { bloodPotency, bonusXp, additionalAdvantageDots, additionalFlawDots }
}

const GenerationPicker = ({
    character,
    setCharacter,
    nextStep,
    generation,
    setGeneration
}: GenerationPickerProps) => {
    const phoneScreen = globals.isPhoneScreen

    const isThinBlood = character.clan === "Thin-blood"
    const defaultGeneration = isThinBlood ? "14" : "13"
    const selectedGenerationValue =
        generation ??
        (character.generation !== getEmptyCharacter().generation
            ? character.generation.toString()
            : defaultGeneration)

    const availableOptions = useMemo(
        () =>
            isThinBlood
                ? generationOptions.filter((option) => option.value === "14")
                : generationOptions,
        [isThinBlood]
    )

    const selectedGeneration =
        availableOptions.find((option) => option.value === selectedGenerationValue) ?? null
    const generationSummary = selectedGenerationValue
        ? getGenerationSummary(parseInt(selectedGenerationValue, 10))
        : null

    // Generation defaults to Neonate (or Thin-blood) in the UI. Persist that displayed choice
    // immediately so sidebar navigation cannot leave a character with a shown XP bonus that was
    // never written to the sheet.
    useEffect(() => {
        if (!selectedGenerationValue) return

        const selectedGenerationNumber = parseInt(selectedGenerationValue, 10)
        const updatedCharacter = getCharacterWithGeneration(character, selectedGenerationNumber)

        if (
            updatedCharacter.generation !== character.generation ||
            updatedCharacter.experience !== character.experience
        ) {
            setCharacter(updatedCharacter)
        }
    }, [character, selectedGenerationValue, setCharacter])

    const handleGenerationChange = (value: string | null) => {
        if (value === null && selectedGenerationValue !== null) {
            return
        }

        setGeneration(value)
        if (value !== null) {
            setCharacter(getCharacterWithGeneration(character, parseInt(value, 10)))
        }
    }

    const confirmButton = (
        <Button
            data-testid="generation-confirm-button"
            disabled={selectedGenerationValue === null}
            color="grape"
            styles={generatorConfirmButtonStyles}
            onClick={() => {
                const genValue = parseInt(selectedGenerationValue ?? "0")
                setCharacter(getCharacterWithGeneration(character, genValue))
                trackEvent({
                    action: "generation submit clicked",
                    category: "generation",
                    label: selectedGenerationValue ?? "0"
                })
                nextStep()
            }}
        >
            Confirm
        </Button>
    )

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
                            marginBottom={16}
                        />

                        <GeneratorSectionDivider label="Generation" />

                        <Stack align="center" gap="xl">
                            <Select
                                value={selectedGenerationValue}
                                onChange={handleGenerationChange}
                                placeholder="Select your generation"
                                data={availableOptions}
                                color="grape"
                                style={{ width: "100%", maxWidth: phoneScreen ? 320 : 430 }}
                                styles={{
                                    ...getGeneratorFieldStyles("muted"),
                                    input: {
                                        ...generatorFieldStyles.input,
                                        minHeight: 44,
                                        fontFamily: "Crimson Text, Georgia, serif",
                                        fontSize: phoneScreen ? "1rem" : "1.08rem",
                                        textAlign: "center"
                                    },
                                    dropdown: {
                                        background: "rgba(24, 18, 21, 0.98)",
                                        borderColor: "rgba(125, 91, 72, 0.45)"
                                    },
                                    option: {
                                        fontFamily: "Crimson Text, Georgia, serif",
                                        fontSize: "1rem"
                                    }
                                }}
                            />

                            {phoneScreen ? confirmButton : null}

                            {selectedGeneration && generationSummary ? (
                                <Box
                                    maw={phoneScreen ? 320 : 430}
                                    w="100%"
                                    px={phoneScreen ? 18 : 24}
                                    py={phoneScreen ? 16 : 20}
                                    style={{
                                        borderRadius: 18,
                                        border: "1px solid rgba(125, 91, 72, 0.4)",
                                        background:
                                            "linear-gradient(180deg, rgba(30, 21, 24, 0.92) 0%, rgba(18, 13, 16, 0.96) 100%)",
                                        boxShadow:
                                            "0 22px 40px rgba(0, 0, 0, 0.24), inset 0 1px 0 rgba(255, 255, 255, 0.04)"
                                    }}
                                >
                                    <Stack gap={12} align="center">
                                        <Text
                                            ta="center"
                                            style={{
                                                fontFamily: "Cinzel, Georgia, serif",
                                                fontSize: phoneScreen ? "1rem" : "1.12rem",
                                                letterSpacing: "0.08em",
                                                color: "rgba(244, 236, 232, 0.94)"
                                            }}
                                        >
                                            {selectedGeneration.label}
                                        </Text>

                                        <Text
                                            ta="center"
                                            style={{
                                                fontFamily: "Inter, Segoe UI, sans-serif",
                                                fontSize: "0.8rem",
                                                letterSpacing: "0.08em",
                                                textTransform: "uppercase",
                                                color: rgba(RAW_GREY, 0.48)
                                            }}
                                        >
                                            {selectedGeneration.tier}
                                        </Text>

                                        <Box
                                            w="100%"
                                            style={{
                                                display: "grid",
                                                gridTemplateColumns: phoneScreen
                                                    ? "1fr"
                                                    : "repeat(2, minmax(0, 1fr))",
                                                gap: phoneScreen ? "0.55rem" : "0.75rem 1.5rem"
                                            }}
                                        >
                                            <Text
                                                ta={phoneScreen ? "center" : "left"}
                                                style={summaryLabelStyle}
                                            >
                                                <span
                                                    style={{
                                                        display: "inline-flex",
                                                        alignItems: "baseline",
                                                        gap: "0.4rem",
                                                        justifyContent: phoneScreen
                                                            ? "center"
                                                            : "space-between",
                                                        width: "100%"
                                                    }}
                                                >
                                                    <span>Blood Potency:</span>
                                                    <span style={summaryValueStyle}>
                                                        {generationSummary.bloodPotency}
                                                    </span>
                                                </span>
                                            </Text>
                                            {generationSummary.bonusXp > 0 ? (
                                                <Text
                                                    ta={phoneScreen ? "center" : "left"}
                                                    style={summaryLabelStyle}
                                                >
                                                    <span
                                                        style={{
                                                            display: "inline-flex",
                                                            alignItems: "baseline",
                                                            gap: "0.4rem",
                                                            justifyContent: phoneScreen
                                                                ? "center"
                                                                : "space-between",
                                                            width: "100%"
                                                        }}
                                                    >
                                                        <span>Bonus XP:</span>
                                                        <span style={summaryValueStyle}>
                                                            {generationSummary.bonusXp}
                                                        </span>
                                                    </span>
                                                </Text>
                                            ) : phoneScreen ? null : (
                                                <div />
                                            )}
                                            {generationSummary.additionalAdvantageDots > 0 ? (
                                                <Text
                                                    ta={phoneScreen ? "center" : "left"}
                                                    style={summaryLabelStyle}
                                                >
                                                    <span
                                                        style={{
                                                            display: "inline-flex",
                                                            alignItems: "baseline",
                                                            gap: "0.4rem",
                                                            justifyContent: phoneScreen
                                                                ? "center"
                                                                : "space-between",
                                                            width: "100%"
                                                        }}
                                                    >
                                                        <span>Additional Merits:</span>
                                                        <span style={summaryValueStyle}>
                                                            {
                                                                generationSummary.additionalAdvantageDots
                                                            }
                                                        </span>
                                                    </span>
                                                </Text>
                                            ) : phoneScreen ? null : (
                                                <div />
                                            )}
                                            {generationSummary.additionalFlawDots > 0 ? (
                                                <Text
                                                    ta={phoneScreen ? "center" : "left"}
                                                    style={summaryLabelStyle}
                                                >
                                                    <span
                                                        style={{
                                                            display: "inline-flex",
                                                            alignItems: "baseline",
                                                            gap: "0.4rem",
                                                            justifyContent: phoneScreen
                                                                ? "center"
                                                                : "space-between",
                                                            width: "100%"
                                                        }}
                                                    >
                                                        <span>Additional Flaws:</span>
                                                        <span style={summaryValueStyle}>
                                                            {generationSummary.additionalFlawDots}
                                                        </span>
                                                    </span>
                                                </Text>
                                            ) : phoneScreen ? null : (
                                                <div />
                                            )}
                                        </Box>
                                    </Stack>
                                </Box>
                            ) : null}
                        </Stack>
                    </div>
                </ScrollArea>

                {!phoneScreen ? (
                    <Stack gap="xs" align="center">
                        {confirmButton}
                    </Stack>
                ) : null}
            </Stack>
        </div>
    )
}

export default GenerationPicker
