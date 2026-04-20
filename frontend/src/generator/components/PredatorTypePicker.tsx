import { Box, Button, ScrollArea, SimpleGrid, Stack, Text } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { useEffect, useState } from "react"
import ReactGA from "react-ga4"
import { trackEvent } from "../../utils/analytics"
import { Character } from "../../data/Character"
import { PredatorTypes } from "../../data/PredatorType"
import { globals } from "../../globals"
import PredatorTypeModal from "../../components/PredatorTypeModal"
import { PredatorTypeName } from "~/data/NameSchemas"
import { clans } from "~/data/Clans"
import { generatorConfirmButtonStyles } from "./sharedGeneratorConfirmButtonStyles"
import { generatorScrollableAreaStyle, generatorScrollableContentStyle, generatorScrollableShellStyle } from "./sharedGeneratorScrollableLayout"
import { nightfallScrollAreaStyles, nightfallScrollbarSize } from "./sharedScrollAreaStyles"

type PredatorTypePickerProps = {
    character: Character
    setCharacter: (character: Character) => void
    nextStep: () => void
}

type CategoryMeta = {
    label: string
    accentColor: string
    bgColor: string
    bgActiveColor: string
    borderColor: string
    borderActiveColor: string
    lineColor: string
    predatorTypes: PredatorTypeName[]
}

const CATEGORIES: CategoryMeta[] = [
    {
        label: "Violent",
        accentColor: "rgba(250, 82, 82, 0.95)",
        bgColor: "rgba(224, 49, 49, 0.22)",
        bgActiveColor: "rgba(224, 49, 49, 0.29)",
        borderColor: "rgba(224, 49, 49, 0.18)",
        borderActiveColor: "rgba(250, 82, 82, 0.55)",
        lineColor: "rgba(250, 82, 82, 0.38)",
        predatorTypes: ["Alleycat", "Extortionist", "Roadside Killer", "Montero"],
    },
    {
        label: "Sociable",
        accentColor: "rgba(190, 75, 219, 0.95)",
        bgColor: "rgba(190, 75, 219, 0.3)",
        bgActiveColor: "rgba(190, 75, 219, 0.38)",
        borderColor: "rgba(190, 75, 219, 0.18)",
        borderActiveColor: "rgba(190, 75, 219, 0.55)",
        lineColor: "rgba(190, 75, 219, 0.38)",
        predatorTypes: ["Cleaver", "Consensualist", "Osiris", "Scene Queen", "Siren"],
    },
    {
        label: "Stealth",
        accentColor: "rgba(222, 226, 230, 0.92)",
        bgColor: "rgba(173, 181, 189, 0.32)",
        bgActiveColor: "rgba(173, 181, 189, 0.38)",
        borderColor: "rgba(173, 181, 189, 0.18)",
        borderActiveColor: "rgba(222, 226, 230, 0.55)",
        lineColor: "rgba(173, 181, 189, 0.34)",
        predatorTypes: ["Sandman", "Graverobber", "Grim Reaper", "Pursuer", "Trapdoor"],
    },
    {
        label: "Excluding Mortals",
        accentColor: "rgba(153, 105, 229, 0.95)",
        bgColor: "rgba(132, 94, 247, 0.35)",
        bgActiveColor: "rgba(132, 94, 247, 0.4)",
        borderColor: "rgba(132, 94, 247, 0.18)",
        borderActiveColor: "rgba(132, 94, 247, 0.55)",
        lineColor: "rgba(132, 94, 247, 0.38)",
        predatorTypes: ["Bagger", "Blood Leech", "Farmer"],
    },
]

const titleCase = (str: string) => str.replace(/\b\w/g, (c) => c.toUpperCase())

const PredatorTypePicker = ({ character, setCharacter, nextStep }: PredatorTypePickerProps) => {
    const phoneScreen = globals.isPhoneScreen

    useEffect(() => {
        ReactGA.send({ hitType: "pageview", title: "Predator-Type Picker" })
    }, [])

    const isThinBlood = character.clan === "Thin-blood"

    const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false)
    const [pickedPredatorType, setPickedPredatorType] = useState<PredatorTypeName>("")
    const [specialty, setSpecialty] = useState("")
    const [discipline, setDiscipline] = useState("")

    const createCard = (predatorTypeName: PredatorTypeName, meta: CategoryMeta) => {
        const clanDisabled = clans[character.clan]?.excludedPredatorTypes?.includes(predatorTypeName) ?? false
        const isDisabled = clanDisabled || isThinBlood
        const isSelected = character.predatorType.name === predatorTypeName
        const predatorType = PredatorTypes[predatorTypeName]

        return (
            <div
                key={predatorTypeName}
                onClick={() => {
                    if (isDisabled) return
                    const firstSpecialtyOption = predatorType.specialtyOptions[0]
                    const firstDisciplineOption = predatorType.disciplineOptions[0]
                    setPickedPredatorType(predatorTypeName)
                    setSpecialty(`${firstSpecialtyOption?.skill}_${firstSpecialtyOption?.name}`)
                    setDiscipline(firstDisciplineOption?.name)
                    openModal()
                }}
                onMouseEnter={(e) => {
                    if (!isDisabled && !isSelected) {
                        e.currentTarget.style.background = meta.bgActiveColor
                        e.currentTarget.style.borderColor = meta.borderColor
                        e.currentTarget.style.transform = "translateY(-2px)"
                    }
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = isSelected ? meta.bgActiveColor : meta.bgColor
                    e.currentTarget.style.borderColor = isSelected ? meta.borderActiveColor : meta.borderColor
                    e.currentTarget.style.transform = "translateY(0)"
                }}
                style={{
                    padding: "10px 12px",
                    borderRadius: "12px",
                    border: `1px solid ${isSelected ? meta.borderActiveColor : meta.borderColor}`,
                    background: isSelected ? meta.bgActiveColor : meta.bgColor,
                    cursor: isDisabled ? "not-allowed" : "pointer",
                    opacity: isDisabled ? 0.38 : 1,
                    transition: "background 200ms ease, border-color 200ms ease, transform 160ms ease",
                    display: "flex",
                    flexDirection: "column" as const,
                    gap: "6px",
                    boxShadow: isSelected ? `0 0 18px ${meta.bgActiveColor}` : "none",
                }}
            >
                <Text
                    style={{
                        fontFamily: "Cinzel, Georgia, serif",
                        fontSize: "0.9rem",
                        fontWeight: 600,
                        letterSpacing: "0.04em",
                        color: "rgb(244, 236, 232)",
                    }}
                >
                    {predatorTypeName}
                    {clanDisabled && (
                        <span
                            style={{
                                marginLeft: 8,
                                fontSize: "0.78rem",
                                color: "rgba(244, 236, 232, 0.35)",
                                fontFamily: "Inter, sans-serif",
                                fontWeight: 400,
                                letterSpacing: 0,
                            }}
                        >
                            excluded for {character.clan}
                        </span>
                    )}
                </Text>

                <Text
                    style={{
                        fontFamily: "Crimson Text, Georgia, serif",
                        fontSize: "0.9rem",
                        color: "rgba(214, 204, 198, 0.88)",
                        lineHeight: 1.4,
                    }}
                >
                    {predatorType.summary}
                </Text>

                <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" as const, marginTop: "3px" }}>
                    {predatorType.disciplineOptions.map((disc) => (
                        <span
                            key={disc.name}
                            style={{
                                fontSize: "0.72rem",
                                fontFamily: "Inter, Segoe UI, sans-serif",
                                padding: "2px 8px",
                                borderRadius: "999px",
                                background: meta.bgActiveColor,
                                border: `1px solid ${meta.borderColor}`,
                                letterSpacing: "0.03em",
                            }}
                        >
                            {titleCase(disc.name)}
                        </span>
                    ))}
                </div>
            </div>
        )
    }

    const createPredatorTypeStack = () => (
        <Stack gap="xl">
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
                    Pick your{" "}
                    <span
                        style={{
                            fontFamily: "Cinzel, Georgia, serif",
                            letterSpacing: "0.05em",
                            color: "rgba(224, 49, 49, 1)",
                        }}
                    >
                        Predator Type
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
                    Choose a predator type that defines your feeding habits
                </Text>
            </Stack>

            {CATEGORIES.map((meta) => (
                <Box key={meta.label} px={phoneScreen ? 4 : 12}>
                    <CategoryHeading label={meta.label} color={meta.accentColor} lineColor={meta.lineColor} />
                    <SimpleGrid cols={phoneScreen ? 1 : 2} spacing="sm">
                        {meta.predatorTypes.map((name) => createCard(name, meta))}
                    </SimpleGrid>
                </Box>
            ))}
        </Stack>
    )

    return (
        <div style={generatorScrollableShellStyle}>
            {isThinBlood ? (
                <div style={{ ...generatorScrollableAreaStyle, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
                    <Text fz={globals.largeFontSize} ta={"center"} component="span">
                        <b>Thin-bloods</b> do not have a predator type
                    </Text>
                    <Button
                        ml={"20px"}
                        color={"red"}
                        styles={generatorConfirmButtonStyles}
                        onClick={() => {
                            trackEvent({
                                action: "predatortype confirm clicked",
                                category: "predator type",
                                label: "thin-blood - no predator type",
                            })
                            nextStep()
                        }}
                    >
                        Continue
                    </Button>
                </div>
            ) : (
                <ScrollArea
                    style={generatorScrollableAreaStyle}
                    w="100%"
                    px={20}
                    pt={4}
                    pb={8}
                    type="auto"
                    offsetScrollbars="present"
                    scrollbarSize={nightfallScrollbarSize}
                    styles={nightfallScrollAreaStyles}
                >
                    <div style={generatorScrollableContentStyle}>{createPredatorTypeStack()}</div>
                </ScrollArea>
            )}

            {pickedPredatorType != "" ? (
                <PredatorTypeModal
                    modalOpened={modalOpened}
                    closeModal={closeModal}
                    character={character}
                    pickedPredatorType={pickedPredatorType}
                    setCharacter={setCharacter}
                    nextStep={nextStep}
                    specialty={specialty}
                    setSpecialty={setSpecialty}
                    discipline={discipline}
                    setDiscipline={setDiscipline}
                />
            ) : null}
        </div>
    )
}

const CategoryHeading = ({ label, color, lineColor }: { label: string; color: string; lineColor: string }) => (
    <Box mt="xs" mb="md">
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ flex: 1, height: "1px", background: `linear-gradient(90deg, transparent 0%, ${lineColor} 50%, transparent 100%)` }} />
            <Text
                ta="center"
                style={{
                    fontFamily: "Cinzel, Georgia, serif",
                    fontSize: "0.96rem",
                    fontWeight: 600,
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    color,
                }}
            >
                {label}
            </Text>
            <div style={{ flex: 1, height: "1px", background: `linear-gradient(90deg, transparent 0%, ${lineColor} 50%, transparent 100%)` }} />
        </div>
    </Box>
)

export default PredatorTypePicker
