import { Accordion, Badge, Box, Button, Group, Image, List, ScrollArea, Stack, Text } from "@mantine/core"
import { useEffect, useState } from "react"
import ReactGA from "react-ga4"
import { trackEvent } from "../../utils/analytics"
import { Character, containsBloodSorcery } from "../../data/Character"
import { Discipline, Power, disciplines, getAvailableDisciplines } from "../../data/Disciplines"
import { globals } from "../../globals"
import { intersection, upcase, updateHealthAndWillpowerAndBloodPotencyAndHumanity } from "../utils"
import { DisciplineName } from "~/data/NameSchemas"
import { generatorConfirmButtonStyles } from "./sharedGeneratorConfirmButtonStyles"
import { generatorScrollableAreaStyle, generatorScrollableContentStyle, generatorScrollableShellStyle } from "./sharedGeneratorScrollableLayout"
import { nightfallScrollAreaStyles, nightfallScrollbarSize } from "./sharedScrollAreaStyles"

type DisciplinesPickerProps = {
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

const DisciplinesPicker = ({ character, setCharacter, nextStep }: DisciplinesPickerProps) => {
    useEffect(() => {
        ReactGA.send({ hitType: "pageview", title: "Disciplines Picker" })
    }, [])

    const phoneScreen = globals.isPhoneScreen
    const [pickedPowers, setPickedPowers] = useState<Power[]>([])
    const [pickedPredatorTypePower, setPickedPredatorTypePower] = useState<Power | undefined>()

    let allPickedPowers = pickedPredatorTypePower ? [...pickedPowers, pickedPredatorTypePower] : pickedPowers

    const disciplinesForClan = getAvailableDisciplines(character)
    const predatorTypeDiscipline = disciplines[character.predatorType.pickedDiscipline]

    const isPicked = (power: Power) => allPickedPowers.map((p) => p.name).includes(power.name)

    const missingAmalgamPrereq = (power: Power) => {
        for (const { discipline, level } of power.amalgamPrerequisites) {
            const pickedDisciplineLevel = allPickedPowers
                .map((p) => p.discipline)
                .filter((d) => d === discipline).length
            if (pickedDisciplineLevel < level) return true
        }
        return false
    }

    const missingPrerequisites = (power: Power) => {
        const powersOfDiscipline = disciplines[power.discipline].powers
        if (intersection(powersOfDiscipline, allPickedPowers).length < power.level - 1) return true
        if (missingAmalgamPrereq(power)) return true
        return false
    }

    const alreadyPickedTwoPowers = (power: Power) => {
        const powersOfDiscipline = disciplines[power.discipline].powers
        return intersection(powersOfDiscipline, pickedPowers).length === 2
    }

    const alreadyPickedTwoDisciplines = (power: Power) => {
        const pickedDisciplines = pickedPowers.map((p) => p.discipline)
        const uniquePickedDisciplines = [...new Set(pickedDisciplines)]
        return uniquePickedDisciplines.length >= 2 && !uniquePickedDisciplines.includes(power.discipline)
    }

    const allPowersPicked = () => pickedPowers.length >= 3
    const confirmDisabled = !(allPowersPicked() && pickedPredatorTypePower)

    // Check prerequisites using an explicit set of picked powers (not the closure variable)
    const hasMissingPrerequisites = (power: Power, clanPowers: Power[], predPower: Power | undefined): boolean => {
        const all = predPower ? [...clanPowers, predPower] : clanPowers
        const powersOfDiscipline = disciplines[power.discipline]?.powers ?? []
        if (intersection(powersOfDiscipline, all).length < power.level - 1) return true
        for (const { discipline, level } of power.amalgamPrerequisites) {
            if (all.filter((p) => p.discipline === discipline).length < level) return true
        }
        return false
    }

    // Cascade: remove a power and iteratively drop any that now have missing prerequisites
    const cascadeRemove = (toRemove: Power, isForPredatorType: boolean) => {
        let clanPowers = isForPredatorType ? pickedPowers : pickedPowers.filter((p) => p.name !== toRemove.name)
        let predPower: Power | undefined = isForPredatorType ? undefined : pickedPredatorTypePower

        // Fixpoint: keep removing invalidated powers until stable
        let changed = true
        while (changed) {
            changed = false
            // Check predator type power
            if (predPower && hasMissingPrerequisites(predPower, clanPowers, undefined)) {
                predPower = undefined
                changed = true
            }
            // Check clan powers
            const next = clanPowers.filter((p) => !hasMissingPrerequisites(p, clanPowers.filter((q) => q.name !== p.name), predPower) ? true : (changed = true, false))
            if (next.length !== clanPowers.length) {
                clanPowers = next
                changed = true
            }
        }

        setPickedPowers(clanPowers)
        setPickedPredatorTypePower(predPower)
    }

    const renderPowerCard = (power: Power, isForPredatorType = false) => {
        const disabled =
            isPicked(power) ||
            missingPrerequisites(power) ||
            (!isForPredatorType && (alreadyPickedTwoPowers(power) || alreadyPickedTwoDisciplines(power) || allPowersPicked())) ||
            (isForPredatorType && pickedPredatorTypePower !== undefined)

        const picked = isPicked(power)
        const isPickedAsPredatorType = !isForPredatorType && pickedPredatorTypePower?.name === power.name
        const isPickedAsClan = isForPredatorType && pickedPowers.some((p) => p.name === power.name)
        const showUndo = picked && !isPickedAsPredatorType && !isPickedAsClan

        return (
            <div
                key={power.name}
                style={{
                    padding: "12px 14px",
                    borderRadius: 10,
                    border: `1px solid ${picked ? "rgba(224, 49, 49, 0.45)" : "rgba(255, 255, 255, 0.18)"}`,
                    background: picked ? "rgba(224, 49, 49, 0.28)" : "rgba(255, 255, 255, 0.18)",
                    opacity: disabled && !picked ? 0.4 : 1,
                    transition: "background 180ms ease, border-color 180ms ease",
                    marginBottom: 8,
                }}
            >
                <Group justify="space-between" align="flex-start" mb={4}>
                    <Text
                        style={{
                            fontFamily: "Cinzel, Georgia, serif",
                            fontSize: "0.82rem",
                            fontWeight: 600,
                            color: picked ? "rgba(250, 82, 82, 0.95)" : "rgba(244, 236, 232, 0.92)",
                            letterSpacing: "0.03em",
                            flex: 1,
                        }}
                    >
                        {power.name}
                    </Text>
                    <Badge variant="light" color="pink" radius="sm" size="xs" style={{ flexShrink: 0 }}>
                        lv {power.level}
                    </Badge>
                </Group>

                <Text
                    style={{
                        fontFamily: "Crimson Text, Georgia, serif",
                        fontSize: "0.9rem",
                        color: "rgba(214, 204, 198, 0.65)",
                        lineHeight: 1.4,
                        marginBottom: power.amalgamPrerequisites.length > 0 ? 6 : 0,
                    }}
                >
                    {upcase(power.summary)}
                </Text>

                {power.amalgamPrerequisites.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                        <Text style={{ fontFamily: "Inter, sans-serif", fontSize: "0.72rem", color: "rgba(250, 82, 82, 0.7)", marginBottom: 2 }}>
                            Requires:
                        </Text>
                        <List size="xs" styles={{ item: { color: "rgba(214, 204, 198, 0.55)", fontSize: "0.72rem" } }}>
                            {power.amalgamPrerequisites.map((prereq) => (
                                <List.Item key={power.name + prereq.discipline}>
                                    {upcase(prereq.discipline)}: Lv {prereq.level}
                                </List.Item>
                            ))}
                        </List>
                        {!missingAmalgamPrereq(power) && (
                            <Text style={{ fontSize: "0.72rem", color: "rgba(100, 220, 120, 0.8)", marginTop: 2 }}>
                                Requirements met
                            </Text>
                        )}
                    </div>
                )}

                {!picked && (
                    <Button
                        disabled={disabled}
                        size="xs"
                        variant="subtle"
                        color="red"
                        fullWidth
                        mt={4}
                        style={{ fontFamily: "Cinzel, Georgia, serif", letterSpacing: "0.05em", fontSize: "0.72rem" }}
                        onClick={() => {
                            trackEvent({ action: "power clicked", category: "disciplines", label: power.name })
                            if (isForPredatorType) setPickedPredatorTypePower(power)
                            else setPickedPowers([...pickedPowers, power])
                        }}
                    >
                        Take
                    </Button>
                )}
                {isPickedAsClan && (
                    <Button
                        size="xs"
                        variant="subtle"
                        color="gray"
                        fullWidth
                        mt={4}
                        disabled
                        style={{ fontFamily: "Cinzel, Georgia, serif", letterSpacing: "0.05em", fontSize: "0.72rem" }}
                    >
                        Taken as clan
                    </Button>
                )}
                {isPickedAsPredatorType && (
                    <Button
                        size="xs"
                        variant="subtle"
                        color="gray"
                        fullWidth
                        mt={4}
                        disabled
                        style={{ fontFamily: "Cinzel, Georgia, serif", letterSpacing: "0.05em", fontSize: "0.72rem" }}
                    >
                        Taken as predator
                    </Button>
                )}
                {showUndo && (
                    <Button
                        size="xs"
                        variant="subtle"
                        color="gray"
                        fullWidth
                        mt={4}
                        style={{ fontFamily: "Cinzel, Georgia, serif", letterSpacing: "0.05em", fontSize: "0.72rem" }}
                        onClick={() => cascadeRemove(power, isForPredatorType)}
                    >
                        Undo
                    </Button>
                )}
            </div>
        )
    }

    const renderDisciplineAccordionItem = (disciplineName: string, discipline: Discipline, isPredatorType = false) => {
        const clanHasPrereqDisciplines = (power: Power) => {
            for (const disc of power.amalgamPrerequisites.map((p) => p.discipline)) {
                if (disciplinesForClan[disc] === undefined) return false
            }
            return true
        }
        const clanHasDiscipline = (name: DisciplineName) => disciplinesForClan[name] !== undefined

        const eligiblePowers = discipline.powers.filter(clanHasPrereqDisciplines)
        const lvl1 = eligiblePowers.filter((p) => p.level === 1)
        const lvl2 = eligiblePowers.filter((p) => p.level === 2)
        const lvl3 = eligiblePowers.filter((p) => p.level === 3)

        const canReachLvl3 =
            disciplineName === character.predatorType.pickedDiscipline && !(isPredatorType && !clanHasDiscipline(disciplineName))

        const columnGroups = canReachLvl3 ? [lvl1, lvl2, lvl3] : [lvl1, lvl2]
        const colWidth = phoneScreen ? "100%" : `${Math.floor(100 / columnGroups.length)}%`

        return (
            <Accordion.Item key={disciplineName + isPredatorType} value={disciplineName + isPredatorType}>
                <Accordion.Control
                    icon={<Image src={discipline.logo} w={20} h={20} fit="contain" />}
                    styles={{
                        label: {
                            fontFamily: "Cinzel, Georgia, serif",
                            fontSize: "0.88rem",
                            fontWeight: 600,
                            letterSpacing: "0.1em",
                            color: "rgba(244, 236, 232, 0.92)",
                        },
                        control: {
                            borderRadius: 8,
                            "&:hover": { background: "rgba(255, 255, 255, 0.04)" },
                        },
                    }}
                >
                    {upcase(disciplineName)}
                </Accordion.Control>
                <Accordion.Panel>
                    <div
                        style={{
                            display: "flex",
                            gap: 12,
                            flexDirection: phoneScreen ? "column" : "row",
                            alignItems: "flex-start",
                        }}
                    >
                        {columnGroups.map((powers, i) => (
                            <div key={i} style={{ flex: 1, minWidth: 0, width: phoneScreen ? "100%" : colWidth }}>
                                {powers.map((p) => renderPowerCard(p, isPredatorType))}
                            </div>
                        ))}
                    </div>
                </Accordion.Panel>
            </Accordion.Item>
        )
    }

    // Thin-blood
    if (character.clan === "Thin-blood") {
        return (
            <div style={generatorScrollableShellStyle}>
                <Stack align="center" justify="center" gap="md" style={generatorScrollableAreaStyle}>
                    <Text
                        ta="center"
                        style={{
                            fontFamily: "Crimson Text, Georgia, serif",
                            fontSize: phoneScreen ? "1.4rem" : "1.8rem",
                            color: "rgba(244, 236, 232, 0.9)",
                        }}
                    >
                        <b>Thin-bloods</b> do not pick disciplines
                        <br />you gain them from blood resonance
                    </Text>
                    <Button
                        color="red"
                        styles={generatorConfirmButtonStyles}
                        onClick={() => {
                            trackEvent({ action: "power clicked", category: "disciplines", label: "thin-blood - no disciplines" })
                            nextStep()
                        }}
                    >
                        Continue
                    </Button>
                </Stack>
            </div>
        )
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
                        Pick your{" "}
                        <span
                            style={{
                                fontFamily: "Cinzel, Georgia, serif",
                                letterSpacing: "0.05em",
                                color: "rgba(224, 49, 49, 1)",
                            }}
                        >
                            Disciplines
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
                        2 powers in one discipline · 1 in another · 1 from your predator type ({upcase(character.predatorType.pickedDiscipline)})
                    </Text>
                </Stack>

                <Box maw={640} mx="auto" px={phoneScreen ? 4 : 0} pb="xl" w="100%">
                    <SectionDivider label="Clan Disciplines" />

                    <Accordion
                        variant="separated"
                        styles={{
                            item: {
                                background: "rgba(255, 255, 255, 0.03)",
                                border: "1px solid rgba(255, 255, 255, 0.07)",
                                borderRadius: 10,
                                marginBottom: 8,
                            },
                            panel: {
                                paddingTop: 4,
                            },
                        }}
                    >
                        {Object.entries(disciplinesForClan).map(([name, discipline]) =>
                            renderDisciplineAccordionItem(name, discipline)
                        )}
                    </Accordion>

                    <SectionDivider label={`Predator Type · ${upcase(character.predatorType.pickedDiscipline)}`} />

                    <Accordion
                        variant="separated"
                        styles={{
                            item: {
                                background: "rgba(224, 49, 49, 0.04)",
                                border: "1px solid rgba(224, 49, 49, 0.15)",
                                borderRadius: 10,
                            },
                            panel: {
                                paddingTop: 4,
                            },
                        }}
                    >
                        {renderDisciplineAccordionItem(character.predatorType.pickedDiscipline, predatorTypeDiscipline, true)}
                    </Accordion>

                    <Group justify="center" mt="xl">
                        <Button
                            disabled={confirmDisabled}
                            color="grape"
                            styles={{
                                ...generatorConfirmButtonStyles,
                                root: {
                                    ...generatorConfirmButtonStyles.root,
                                    background: confirmDisabled
                                        ? "rgba(80, 80, 80, 0.75)"
                                        : generatorConfirmButtonStyles.root.background,
                                    boxShadow: confirmDisabled ? "none" : generatorConfirmButtonStyles.root.boxShadow,
                                    color: confirmDisabled ? "rgba(214, 204, 198, 0.55)" : undefined,
                                    cursor: confirmDisabled ? "not-allowed" : undefined,
                                },
                            }}
                            onClick={() => {
                                updateHealthAndWillpowerAndBloodPotencyAndHumanity(character)
                                setCharacter({
                                    ...character,
                                    disciplines: allPickedPowers,
                                    rituals: containsBloodSorcery(allPickedPowers) ? character.rituals : [],
                                })
                                nextStep()
                            }}
                        >
                            Confirm
                        </Button>
                    </Group>
                </Box>
                </div>
            </ScrollArea>
        </div>
    )
}

export default DisciplinesPicker
