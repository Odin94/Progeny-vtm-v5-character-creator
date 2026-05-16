import { Badge, Box, Button, Group, ScrollArea, Text } from "@mantine/core"
import { RAW_GOLD, RAW_GREY, RAW_RED, rgba } from "~/theme/colors"
import { useEffect, useState } from "react"
import ReactGA from "react-ga4"
import { trackEvent } from "../../utils/analytics"
import { Character, containsOblivion } from "../../data/Character"
import {
    Ceremony,
    Ceremonies,
    characterHasCeremonyPrerequisite,
    getCeremonyPrerequisiteLabel
} from "../../data/Ceremonies"
import { upcase } from "../utils"
import {
    generatorScrollableAreaStyle,
    generatorScrollableContentStyle,
    generatorScrollableShellStyle
} from "./sharedGeneratorScrollableLayout"
import { nightfallScrollAreaStyles, nightfallScrollbarSize } from "./sharedScrollAreaStyles"
import { globals } from "../../globals"
import { GeneratorSectionDivider, GeneratorStepHero } from "./sharedGeneratorUi"

type CeremoniesPickerProps = {
    character: Character
    setCharacter: (character: Character) => void
    nextStep: () => void
}

const GOLD_LABEL_COLOR = rgba(RAW_GOLD, 1)

const DetailRow = ({ label, value }: { label: string; value: string }) => (
    <div style={{ minWidth: 0 }}>
        <Text
            style={{
                fontFamily: "Cinzel, Georgia, serif",
                fontSize: "0.76rem",
                color: GOLD_LABEL_COLOR,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: 2
            }}
        >
            {label}
        </Text>
        <Text
            style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "0.78rem",
                color: rgba(RAW_GREY, 0.6)
            }}
        >
            {value}
        </Text>
    </div>
)

const CeremonyCard = ({
    ceremony,
    canTake,
    onTake
}: {
    ceremony: Ceremony
    canTake: boolean
    onTake: () => void
}) => {
    const [hovered, setHovered] = useState(false)
    const isHighlighted = hovered && canTake
    const prerequisiteLabel = getCeremonyPrerequisiteLabel(ceremony)

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                padding: "14px 16px",
                borderRadius: 10,
                border: `1px solid ${isHighlighted ? rgba(RAW_RED, 0.45) : "rgba(125, 91, 72, 0.25)"}`,
                background: isHighlighted
                    ? "linear-gradient(180deg, rgba(40, 14, 18, 0.85) 0%, rgba(20, 7, 10, 0.9) 100%)"
                    : "linear-gradient(180deg, rgba(18, 13, 16, 0.55) 0%, rgba(8, 6, 8, 1) 100%)",
                transition: "background 180ms ease, border-color 180ms ease",
                marginBottom: 10
            }}
        >
            <Group justify="space-between" align="flex-start" mb={6}>
                <Text
                    style={{
                        fontFamily: "Cinzel, Georgia, serif",
                        fontSize: "0.88rem",
                        fontWeight: 700,
                        color: canTake ? "rgba(244, 236, 232, 0.95)" : rgba(RAW_GREY, 0.54),
                        letterSpacing: "0.04em",
                        flex: 1
                    }}
                >
                    {ceremony.name}
                </Text>
                <Badge variant="light" color="pink" radius="sm" size="xs" style={{ flexShrink: 0 }}>
                    lv {ceremony.level}
                </Badge>
            </Group>

            <Text
                style={{
                    fontFamily: "Crimson Text, Georgia, serif",
                    fontSize: "0.95rem",
                    color: canTake ? rgba(RAW_GREY, 0.7) : rgba(RAW_GREY, 0.46),
                    lineHeight: 1.45,
                    marginBottom: 10,
                    minHeight: "5.6rem"
                }}
            >
                {upcase(ceremony.summary)}
            </Text>
            {!canTake ? (
                <Text
                    style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: "0.78rem",
                        color: "rgb(255, 112, 112)",
                        fontWeight: 700,
                        marginBottom: 10,
                        textShadow: "0 1px 2px rgba(0, 0, 0, 0.75)"
                    }}
                >
                    Requires '{prerequisiteLabel}'
                </Text>
            ) : null}

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "4px 16px",
                    marginBottom: 12,
                    padding: "8px 10px",
                    borderRadius: 6,
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.05)"
                }}
            >
                <DetailRow label="Dice Pool" value={ceremony.dicePool} />
                <DetailRow label="Time" value={ceremony.requiredTime} />
                <DetailRow label="Requires" value={prerequisiteLabel} />
                <DetailRow label="Rouse Checks" value={String(ceremony.rouseChecks)} />
            </div>

            <Button
                size="xs"
                variant="outline"
                color="red"
                fullWidth
                mt="auto"
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                disabled={!canTake}
                styles={{
                    root: {
                        borderColor: isHighlighted ? rgba(RAW_RED, 0.85) : rgba(RAW_RED, 0.4),
                        background: isHighlighted ? rgba(RAW_RED, 0.24) : rgba(RAW_RED, 0.08),
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        fontFamily: "Cinzel, Georgia, serif",
                        fontSize: "0.72rem",
                        cursor: canTake ? "pointer" : "not-allowed"
                    }
                }}
                onClick={onTake}
            >
                Take {ceremony.name}
            </Button>
        </div>
    )
}

const CeremoniesPicker = ({ character, setCharacter, nextStep }: CeremoniesPickerProps) => {
    useEffect(() => {
        ReactGA.send({ hitType: "pageview", title: "Ceremonies Picker" })
    }, [])

    if (!containsOblivion(character.disciplines)) {
        return <></>
    }

    const phoneScreen = globals.isPhoneScreen
    const levelOneCeremonies = Ceremonies.filter((ceremony) => ceremony.level === 1)
    const canTakeAnyCeremony = levelOneCeremonies.some((ceremony) =>
        characterHasCeremonyPrerequisite(character, ceremony)
    )

    const handleTake = (ceremony: Ceremony) => {
        trackEvent({
            action: "ceremony clicked",
            category: "ceremonies",
            label: ceremony.name
        })
        setCharacter({ ...character, ceremonies: [ceremony] })
        nextStep()
    }

    const handleContinueWithoutCeremony = () => {
        trackEvent({
            action: "ceremony skipped",
            category: "ceremonies",
            label: "no valid prerequisite"
        })
        setCharacter({ ...character, ceremonies: [] })
        nextStep()
    }

    return (
        <div style={generatorScrollableShellStyle}>
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
                        leadText="Pick your free"
                        accentText="Ceremony"
                        description="You begin with one free Level 1 ceremony when you know its prerequisite Oblivion power"
                        marginBottom={phoneScreen ? 18 : 26}
                    />

                    <Box maw={640} mx="auto" px={phoneScreen ? 4 : 0} pb="xl" w="100%">
                        <GeneratorSectionDivider
                            label="Level 1 Ceremonies"
                            lineHeight={1}
                            accentAlpha={0.38}
                            titleSize="0.88rem"
                            marginY="sm"
                        />

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: phoneScreen ? "1fr" : "1fr 1fr",
                                alignItems: "stretch",
                                gap: 12,
                                columnGap: 12
                            }}
                        >
                            {levelOneCeremonies.map((ceremony) => {
                                const canTake = characterHasCeremonyPrerequisite(
                                    character,
                                    ceremony
                                )

                                return (
                                    <CeremonyCard
                                        key={ceremony.name}
                                        ceremony={ceremony}
                                        canTake={canTake}
                                        onTake={() => handleTake(ceremony)}
                                    />
                                )
                            })}
                        </div>

                        {!canTakeAnyCeremony ? (
                            <Box
                                mt="md"
                                p="md"
                                style={{
                                    borderRadius: 8,
                                    border: "1px solid rgba(125, 91, 72, 0.25)",
                                    background:
                                        "linear-gradient(180deg, rgba(18, 13, 16, 0.55) 0%, rgba(8, 6, 8, 1) 100%)"
                                }}
                            >
                                <Text
                                    mb="sm"
                                    style={{
                                        fontFamily: "Inter, sans-serif",
                                        fontSize: "0.86rem",
                                        color: rgba(RAW_GREY, 0.7),
                                        lineHeight: 1.45,
                                        textAlign: "center"
                                    }}
                                >
                                    None of these ceremonies match your chosen Oblivion powers.
                                </Text>
                                <Group justify="center">
                                    <Button
                                        color="red"
                                        variant="outline"
                                        onClick={handleContinueWithoutCeremony}
                                        styles={{
                                            root: {
                                                borderColor: rgba(RAW_RED, 0.4),
                                                background: rgba(RAW_RED, 0.08),
                                                letterSpacing: "0.12em",
                                                textTransform: "uppercase",
                                                fontFamily: "Cinzel, Georgia, serif",
                                                fontSize: "0.74rem"
                                            }
                                        }}
                                    >
                                        Continue without a ceremony
                                    </Button>
                                </Group>
                            </Box>
                        ) : null}
                    </Box>
                </div>
            </ScrollArea>
        </div>
    )
}

export default CeremoniesPicker
