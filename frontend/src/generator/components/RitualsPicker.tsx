import { Badge, Box, Button, Group, ScrollArea, Stack, Text } from "@mantine/core"
import { useEffect, useState } from "react"
import ReactGA from "react-ga4"
import { trackEvent } from "../../utils/analytics"
import { Character, containsBloodSorcery } from "../../data/Character"
import { Ritual, Rituals } from "../../data/Disciplines"
import { upcase } from "../utils"
import { generatorScrollableAreaStyle, generatorScrollableContentStyle, generatorScrollableShellStyle } from "./sharedGeneratorScrollableLayout"
import { nightfallScrollAreaStyles, nightfallScrollbarSize } from "./sharedScrollAreaStyles"
import { globals } from "../../globals"

type RitualsPickerProps = {
    character: Character
    setCharacter: (character: Character) => void
    nextStep: () => void
}

const SectionDivider = ({ label }: { label: string }) => (
    <Box my="sm">
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, transparent 0%, rgba(224, 49, 49, 0.38) 50%, transparent 100%)" }} />
            <Text
                style={{
                    fontFamily: "Cinzel, Georgia, serif",
                    fontSize: "0.88rem",
                    fontWeight: 800,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: "rgba(224, 49, 49, 1)",
                    whiteSpace: "nowrap",
                }}
            >
                {label}
            </Text>
            <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, transparent 0%, rgba(224, 49, 49, 0.38) 50%, transparent 100%)" }} />
        </div>
    </Box>
)

const GOLD_LABEL_COLOR = "rgba(201, 172, 102, 1)"

const RitualCard = ({ ritual, onTake }: { ritual: Ritual; onTake: () => void }) => {
    const [hovered, setHovered] = useState(false)

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                padding: "14px 16px",
                borderRadius: 10,
                border: `1px solid ${hovered ? "rgba(224, 49, 49, 0.45)" : "rgba(125, 91, 72, 0.25)"}`,
                background: hovered
                    ? "linear-gradient(180deg, rgba(40, 14, 18, 0.85) 0%, rgba(20, 7, 10, 0.9) 100%)"
                    : "linear-gradient(180deg, rgba(18, 13, 16, 0.55) 0%, rgba(8, 6, 8, 1) 100%)",
                transition: "background 180ms ease, border-color 180ms ease",
                marginBottom: 10,
            }}
        >
            <Group justify="space-between" align="flex-start" mb={6}>
                <Text
                    style={{
                        fontFamily: "Cinzel, Georgia, serif",
                        fontSize: "0.88rem",
                        fontWeight: 700,
                        color: "rgba(244, 236, 232, 0.95)",
                        letterSpacing: "0.04em",
                        flex: 1,
                    }}
                >
                    {ritual.name}
                </Text>
                <Badge variant="light" color="pink" radius="sm" size="xs" style={{ flexShrink: 0 }}>
                    lv {ritual.level}
                </Badge>
            </Group>

            <Text
                style={{
                    fontFamily: "Crimson Text, Georgia, serif",
                    fontSize: "0.95rem",
                    color: "rgba(214, 204, 198, 0.7)",
                    lineHeight: 1.45,
                    marginBottom: 10,
                    minHeight: "5.6rem",
                }}
            >
                {upcase(ritual.summary)}
            </Text>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "4px 16px",
                    marginBottom: 12,
                    padding: "8px 10px",
                    borderRadius: 6,
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.05)",
                }}
            >
                <DetailRow label="Dice Pool" value={ritual.dicePool} />
                <DetailRow label="Time" value={ritual.requiredTime} />
                <DetailRow label="Ingredients" value={ritual.ingredients} />
                <DetailRow label="Rouse Checks" value={String(ritual.rouseChecks)} />
            </div>

            <Button
                size="xs"
                variant="outline"
                color="red"
                fullWidth
                mt="auto"
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                styles={{
                    root: {
                        borderColor: hovered ? "rgba(250, 82, 82, 0.85)" : "rgba(224, 49, 49, 0.4)",
                        background: hovered ? "rgba(224, 49, 49, 0.24)" : "rgba(224, 49, 49, 0.08)",
                        boxShadow: hovered
                            ? "0 0 0 1px rgba(224, 49, 49, 0.22), 0 0 18px rgba(224, 49, 49, 0.18), 0 10px 24px rgba(224, 49, 49, 0.18)"
                            : "none",
                        transform: hovered ? "translateY(-1px) scale(1.01)" : "translateY(0) scale(1)",
                        transition: "background 120ms ease, border-color 120ms ease, box-shadow 120ms ease, transform 120ms ease",
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        fontFamily: "Cinzel, Georgia, serif",
                        fontSize: "0.72rem",
                    },
                }}
                onClick={onTake}
            >
                Take {ritual.name}
            </Button>
        </div>
    )
}

const DetailRow = ({ label, value }: { label: string; value: string }) => (
    <div style={{ minWidth: 0 }}>
        <Text
            style={{
                fontFamily: "Cinzel, Georgia, serif",
                fontSize: "0.76rem",
                color: GOLD_LABEL_COLOR,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: 2,
            }}
        >
            {label}
        </Text>
        <Text style={{ fontFamily: "Inter, sans-serif", fontSize: "0.78rem", color: "rgba(214, 204, 198, 0.6)" }}>
            {value}
        </Text>
    </div>
)

const RitualsPicker = ({ character, setCharacter, nextStep }: RitualsPickerProps) => {
    useEffect(() => {
        ReactGA.send({ hitType: "pageview", title: "Rituals Picker" })
    }, [])

    if (!containsBloodSorcery(character.disciplines)) {
        return <></>
    }

    const phoneScreen = globals.isPhoneScreen

    const handleTake = (ritual: Ritual) => {
        trackEvent({ action: "ritual clicked", category: "rituals", label: ritual.name })
        setCharacter({ ...character, rituals: [ritual] })
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
                            Pick your free{" "}
                            <span
                                style={{
                                    fontFamily: "Cinzel, Georgia, serif",
                                    letterSpacing: "0.05em",
                                    color: "rgba(224, 49, 49, 1)",
                                }}
                            >
                                Ritual
                            </span>
                        </Text>
                        <Text
                            ta="center"
                            style={{
                                fontFamily: "Inter, Segoe UI, sans-serif",
                                fontSize: phoneScreen ? "0.82rem" : "0.9rem",
                                letterSpacing: "0.04em",
                                color: "rgba(214, 204, 198, 0.5)",
                            }}
                        >
                            Blood Sorcerers begin with one free Level 1 ritual
                        </Text>
                    </Stack>

                    <Box maw={640} mx="auto" px={phoneScreen ? 4 : 0} pb="xl" w="100%">
                        <SectionDivider label="Level 1 Rituals" />

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: phoneScreen ? "1fr" : "1fr 1fr",
                                alignItems: "stretch",
                                gap: 12,
                                columnGap: 12,
                            }}
                        >
                            {Rituals.map((ritual) => (
                                <RitualCard key={ritual.name} ritual={ritual} onTake={() => handleTake(ritual)} />
                            ))}
                        </div>
                    </Box>
                </div>
            </ScrollArea>
        </div>
    )
}

export default RitualsPicker
