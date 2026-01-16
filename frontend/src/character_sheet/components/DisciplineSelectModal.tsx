import { Button, Badge, Box, Divider, Grid, Group, Modal, Stack, Text, Title } from "@mantine/core"
import { useState, useEffect } from "react"
import { DisciplineName } from "~/data/NameSchemas"
import { disciplines, Power } from "~/data/Disciplines"
import { clans } from "~/data/Clans"
import { upcase, updateHealthAndWillpowerAndBloodPotencyAndHumanity } from "~/generator/utils"
import { Character } from "~/data/Character"
import { SheetOptions } from "../CharacterSheet"
import DisciplinePowerCard from "./DisciplinePowerCard"
import CustomDisciplineModal from "./CustomDisciplineModal"
import { getDisciplineCost } from "../utils/xp"
import posthog from "posthog-js"

type DisciplineSelectModalProps = {
    opened: boolean
    onClose: () => void
    options: SheetOptions
    initialDiscipline?: DisciplineName | null
    hideBackButton?: boolean
}

// TODOdin: Fix discipline card height
const DisciplineSelectModal = ({ opened, onClose, options, initialDiscipline, hideBackButton }: DisciplineSelectModalProps) => {
    const { character, primaryColor, setCharacter } = options
    const [selectedDiscipline, setSelectedDiscipline] = useState<DisciplineName | null>(initialDiscipline || null)
    const [customDisciplineModalOpened, setCustomDisciplineModalOpened] = useState(false)

    useEffect(() => {
        if (opened && initialDiscipline) {
            setSelectedDiscipline(initialDiscipline)
        }
    }, [opened, initialDiscipline])

    useEffect(() => {
        if (!opened) {
            const timer = setTimeout(() => {
                setSelectedDiscipline(null)
            }, 200)
            return () => clearTimeout(timer)
        }
    }, [opened])

    const getCurrentDisciplineLevel = (disciplineName: DisciplineName): number => {
        const disciplinePowers = character.disciplines.filter((p) => p.discipline === disciplineName)
        return disciplinePowers.length
    }

    const getAvailablePowers = (disciplineName: DisciplineName): Power[] => {
        const discipline = disciplines[disciplineName]
        if (!discipline) return []

        const currentLevel = getCurrentDisciplineLevel(disciplineName)
        const maxLevel = currentLevel === 0 ? 1 : currentLevel + 1
        const characterPowerNames = new Set(character.disciplines.map((p) => p.name))

        return discipline.powers.filter((power) => !characterPowerNames.has(power.name) && power.level <= maxLevel)
    }

    const hasAmalgamPrerequisites = (power: Power): boolean => {
        for (const { discipline: requiredDiscipline, level: requiredLevel } of power.amalgamPrerequisites) {
            const characterDisciplineLevel = getCurrentDisciplineLevel(requiredDiscipline)
            if (characterDisciplineLevel < requiredLevel) {
                return false
            }
        }
        return true
    }

    const getAmalgamTooltip = (power: Power): string | null => {
        const missingPrereqs: string[] = []
        for (const { discipline: requiredDiscipline, level: requiredLevel } of power.amalgamPrerequisites) {
            const characterDisciplineLevel = getCurrentDisciplineLevel(requiredDiscipline)
            if (characterDisciplineLevel < requiredLevel) {
                missingPrereqs.push(`${upcase(requiredDiscipline)} Level ${requiredLevel}`)
            }
        }
        return missingPrereqs.length > 0 ? `Requires: ${missingPrereqs.join(", ")}` : null
    }

    const clanDisciplines = new Set(clans[character.clan]?.nativeDisciplines || [])

    const allDisciplines = Object.keys(disciplines) as DisciplineName[]
    const availableDisciplines = allDisciplines
        .filter((disciplineName) => {
            if (disciplineName === "") return false
            const discipline = disciplines[disciplineName]
            if (!discipline) return false
            const hasAvailablePowers = getAvailablePowers(disciplineName).length > 0
            return hasAvailablePowers
        })
        .sort((a, b) => {
            const aIsClan = clanDisciplines.has(a)
            const bIsClan = clanDisciplines.has(b)
            if (aIsClan && !bIsClan) return -1
            if (!aIsClan && bIsClan) return 1
            return a.localeCompare(b)
        })

    const handleSelectDiscipline = (disciplineName: DisciplineName) => {
        setSelectedDiscipline(disciplineName)
    }

    const handleSelectPower = (power: Power) => {
        const updatedCharacter = {
            ...character,
            disciplines: [...character.disciplines, power],
        }
        updateHealthAndWillpowerAndBloodPotencyAndHumanity(updatedCharacter)

        if (options.mode === "xp") {
            const cost = getDisciplineCost(character, power.discipline)
            updatedCharacter.ephemeral = {
                ...updatedCharacter.ephemeral,
                experienceSpent: updatedCharacter.ephemeral.experienceSpent + cost,
            }
        }

        setCharacter(updatedCharacter)

        try {
            posthog.capture("sheet-power-pick", {
                power_name: power.name,
                discipline: power.discipline,
                level: power.level,
                mode: options.mode,
            })
        } catch (error) {
            console.warn("PostHog sheet-power-pick tracking failed:", error)
        }

        onClose()
        setSelectedDiscipline(null)
    }

    const handleBack = () => {
        setSelectedDiscipline(null)
    }

    const availablePowers = selectedDiscipline ? getAvailablePowers(selectedDiscipline) : []

    return (
        <Modal
            opened={opened}
            onClose={() => {
                onClose()
                setSelectedDiscipline(null)
            }}
            title={selectedDiscipline ? `Select a Power - ${upcase(selectedDiscipline)}` : "Select a Discipline"}
            size="lg"
        >
            <Stack gap="md">
                {opened && selectedDiscipline ? (
                    <PowerPicker
                        availablePowers={availablePowers}
                        primaryColor={primaryColor}
                        onSelectPower={handleSelectPower}
                        onBack={handleBack}
                        hideBackButton={hideBackButton}
                        character={character}
                        hasAmalgamPrerequisites={hasAmalgamPrerequisites}
                        getAmalgamTooltip={getAmalgamTooltip}
                    />
                ) : opened ? (
                    <>
                        {availableDisciplines.length === 0 ? (
                            <Text c="dimmed" ta="center" py="xl">
                                No available disciplines to add.
                            </Text>
                        ) : (
                            <Grid gutter="md">
                                {availableDisciplines.map((disciplineName) => {
                                    const discipline = disciplines[disciplineName]
                                    if (!discipline) return null

                                    return (
                                        <Grid.Col key={disciplineName} span={{ base: 12, sm: 6 }}>
                                            <Box style={{ position: "relative", minHeight: "180px" }}>
                                                <Button
                                                    variant="light"
                                                    color={primaryColor}
                                                    fullWidth
                                                    h="auto"
                                                    p="md"
                                                    onClick={() => handleSelectDiscipline(disciplineName)}
                                                    style={{ height: "100%", minHeight: "180px" }}
                                                >
                                                    <Stack gap="xs" align="center" style={{ width: "100%" }}>
                                                        <Box
                                                            style={{
                                                                width: "60px",
                                                                height: "60px",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                            }}
                                                        >
                                                            {discipline.logo ? (
                                                                <img
                                                                    src={discipline.logo}
                                                                    alt={upcase(disciplineName)}
                                                                    style={{
                                                                        width: "60px",
                                                                        height: "60px",
                                                                    }}
                                                                />
                                                            ) : null}
                                                        </Box>
                                                        <Title order={4} style={{ margin: 0 }}>
                                                            {upcase(disciplineName)}
                                                        </Title>
                                                        <Box
                                                            style={{
                                                                minHeight: "40px",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                            }}
                                                        >
                                                            {discipline.summary ? (
                                                                <Text size="sm" c="dimmed" ta="center" lineClamp={2}>
                                                                    {discipline.summary}
                                                                </Text>
                                                            ) : null}
                                                        </Box>
                                                    </Stack>
                                                </Button>
                                                {clanDisciplines.has(disciplineName) ? (
                                                    <Badge
                                                        size="sm"
                                                        variant="light"
                                                        color={primaryColor}
                                                        style={{
                                                            position: "absolute",
                                                            top: "8px",
                                                            right: "8px",
                                                        }}
                                                    >
                                                        Clan
                                                    </Badge>
                                                ) : null}
                                            </Box>
                                        </Grid.Col>
                                    )
                                })}
                            </Grid>
                        )}
                        <Divider my="md" />
                        <Button
                            variant="filled"
                            color="black"
                            fullWidth
                            onClick={() => {
                                setCustomDisciplineModalOpened(true)
                            }}
                        >
                            Create Custom Discipline
                        </Button>
                    </>
                ) : null}
            </Stack>
            <CustomDisciplineModal
                opened={customDisciplineModalOpened}
                onClose={() => {
                    setCustomDisciplineModalOpened(false)
                }}
                options={options}
                editingDisciplineName={null}
                onSave={() => {
                    setCustomDisciplineModalOpened(false)
                    onClose()
                }}
            />
        </Modal>
    )
}

type PowerPickerProps = {
    availablePowers: Power[]
    primaryColor: string
    onSelectPower: (power: Power) => void
    onBack: () => void
    hideBackButton?: boolean
    character: Character
    hasAmalgamPrerequisites: (power: Power) => boolean
    getAmalgamTooltip: (power: Power) => string | null
}

const PowerPicker = ({
    availablePowers,
    primaryColor,
    onSelectPower,
    onBack,
    hideBackButton,
    character,
    hasAmalgamPrerequisites,
    getAmalgamTooltip,
}: PowerPickerProps) => {
    const powersByLevel = new Map<number, Power[]>()
    availablePowers.forEach((power) => {
        const level = power.level
        if (!powersByLevel.has(level)) {
            powersByLevel.set(level, [])
        }
        powersByLevel.get(level)!.push(power)
    })

    const sortedLevels = Array.from(powersByLevel.keys()).sort((a, b) => a - b)

    return (
        <>
            {!hideBackButton ? (
                <Group>
                    <Button variant="subtle" onClick={onBack} color={primaryColor}>
                        ← Back
                    </Button>
                </Group>
            ) : null}
            {availablePowers.length === 0 ? (
                <Text c="dimmed" ta="center" py="xl">
                    No available powers to add for this discipline.
                </Text>
            ) : (
                <Stack gap="lg">
                    {sortedLevels.map((level) => {
                        const powers = powersByLevel.get(level)!
                        return (
                            <Stack key={level} gap="md">
                                <Title order={4} c={primaryColor}>
                                    Level {level}
                                </Title>
                                <Grid gutter="md">
                                    {powers.map((power) => {
                                        const hasAmalgams = hasAmalgamPrerequisites(power)
                                        const amalgamTooltip = getAmalgamTooltip(power)
                                        return (
                                            <Grid.Col key={power.name} span={{ base: 12, sm: 6 }}>
                                                <DisciplinePowerCard
                                                    power={power}
                                                    primaryColor={primaryColor}
                                                    onClick={hasAmalgams ? () => onSelectPower(power) : undefined}
                                                    inModal={true}
                                                    character={character}
                                                    disabled={!hasAmalgams}
                                                    disabledTooltip={amalgamTooltip}
                                                />
                                            </Grid.Col>
                                        )
                                    })}
                                </Grid>
                            </Stack>
                        )
                    })}
                </Stack>
            )}
        </>
    )
}

export default DisciplineSelectModal
