import { Button, Badge, Box, Grid, Group, Modal, Stack, Text, Title } from "@mantine/core"
import { useState, useEffect } from "react"
import { DisciplineName } from "~/data/NameSchemas"
import { disciplines, Power } from "~/data/Disciplines"
import { clans } from "~/data/Clans"
import { upcase, updateHealthAndWillpowerAndBloodPotencyAndHumanity } from "~/generator/utils"
import { SheetOptions } from "../constants"
import DisciplinePowerCard from "./DisciplinePowerCard"
import { getDisciplineCost } from "../utils/xp"

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

    const disciplinesAlreadyHave = new Set(character.disciplines.map((power) => power.discipline))
    const clanDisciplines = new Set(clans[character.clan]?.nativeDisciplines || [])

    const allDisciplines = Object.keys(disciplines) as DisciplineName[]
    const availableDisciplines = allDisciplines
        .filter((disciplineName) => disciplineName !== "" && !disciplinesAlreadyHave.has(disciplineName))
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

    const getCurrentDisciplineLevel = (disciplineName: DisciplineName): number => {
        const disciplinePowers = character.disciplines.filter((p) => p.discipline === disciplineName)
        if (disciplinePowers.length === 0) return 0
        return Math.max(...disciplinePowers.map((p) => p.level))
    }

    const getAvailablePowers = (disciplineName: DisciplineName): Power[] => {
        const discipline = disciplines[disciplineName]
        if (!discipline) return []

        const currentLevel = getCurrentDisciplineLevel(disciplineName)
        const maxLevel = currentLevel === 0 ? 1 : currentLevel + 1
        const characterPowerNames = new Set(character.disciplines.map((p) => p.name))

        return discipline.powers.filter((power) => !characterPowerNames.has(power.name) && power.level <= maxLevel)
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
                    </>
                ) : null}
            </Stack>
        </Modal>
    )
}

type PowerPickerProps = {
    availablePowers: Power[]
    primaryColor: string
    onSelectPower: (power: Power) => void
    onBack: () => void
    hideBackButton?: boolean
}

const PowerPicker = ({ availablePowers, primaryColor, onSelectPower, onBack, hideBackButton }: PowerPickerProps) => {
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
                                    {powers.map((power) => (
                                        <Grid.Col key={power.name} span={{ base: 12, sm: 6 }}>
                                            <DisciplinePowerCard
                                                power={power}
                                                primaryColor={primaryColor}
                                                onClick={() => onSelectPower(power)}
                                                inModal={true}
                                            />
                                        </Grid.Col>
                                    ))}
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
