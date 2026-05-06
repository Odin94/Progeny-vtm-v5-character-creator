import { Box, Button, Group, Select, Stack, Text, Title } from "@mantine/core"
import { RAW_GREY, RAW_RED, rgba } from "~/theme/colors"
import { useEffect, useMemo, useState } from "react"
import { Character, getEmptyCharacter } from "../../data/Character"
import ReactGA from "react-ga4"
import { trackEvent } from "../../utils/analytics"
import { calculateBloodPotency } from "../../data/BloodPotency"
import { updateHealthAndWillpowerAndBloodPotencyAndHumanity } from "../utils"
import { globals } from "../../globals"
import { generatorConfirmButtonStyles } from "./sharedGeneratorConfirmButtonStyles"
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

const getGenerationSummary = (generation: number) => {
    const baseCharacter = { ...getEmptyCharacter(), generation }
    const bloodPotency = calculateBloodPotency(baseCharacter)
    const bonusXp = generation === 14 ? 0 : generation === 13 ? 15 : 35
    const additionalAdvantageDots = generation === 10 || generation === 11 ? 2 : 0
    const additionalFlawDots = generation === 10 || generation === 11 ? 2 : 0

    return { bloodPotency, bonusXp, additionalAdvantageDots, additionalFlawDots }
}

const GenerationPicker = ({ character, setCharacter, nextStep }: GenerationPickerProps) => {
    const phoneScreen = globals.isPhoneScreen

    useEffect(() => {
        ReactGA.send({ hitType: "pageview", title: "Generation Picker" })
    }, [])

    const isThinBlood = character.clan === "Thin-blood"
    const defaultGeneration = isThinBlood ? "14" : "13"
    const initialGeneration =
        character.generation !== getEmptyCharacter().generation
            ? character.generation.toString()
            : defaultGeneration

    const [generation, setGeneration] = useState<string | null>(initialGeneration)

    const availableOptions = useMemo(
        () =>
            isThinBlood
                ? generationOptions.filter((option) => option.value === "14")
                : generationOptions,
        [isThinBlood]
    )

    const selectedGeneration =
        availableOptions.find((option) => option.value === generation) ?? null
    const generationSummary = generation ? getGenerationSummary(parseInt(generation, 10)) : null

    const handleGenerationChange = (value: string | null) => {
        if (value === null && generation !== null) {
            return
        }

        setGeneration(value)
    }

    return (
        <div style={{ width: "100%" }}>
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
                    value={generation}
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
                                                {generationSummary.additionalAdvantageDots}
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

                <Button
                    data-testid="generation-confirm-button"
                    disabled={generation === null}
                    color="grape"
                    styles={generatorConfirmButtonStyles}
                    onClick={() => {
                        const genValue = parseInt(generation ?? "0")
                        let experience = 0
                        if (character.experience === 0) {
                            if (genValue === 14) {
                                experience = 0
                            } else if (genValue === 13) {
                                experience = 15
                            } else if (genValue <= 12) {
                                experience = 35
                            }
                        }
                        updateHealthAndWillpowerAndBloodPotencyAndHumanity(character)
                        setCharacter({ ...character, generation: genValue, experience })
                        trackEvent({
                            action: "generation submit clicked",
                            category: "generation",
                            label: generation ?? "0"
                        })
                        nextStep()
                    }}
                >
                    Confirm
                </Button>
            </Stack>
        </div>
    )
}

export default GenerationPicker
