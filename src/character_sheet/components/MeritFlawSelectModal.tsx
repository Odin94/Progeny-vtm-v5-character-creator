import { Badge, Box, Button, Grid, Group, Modal, Stack, Text, Title, Tooltip } from "@mantine/core"
import { useState, useEffect } from "react"
import { MeritFlaw } from "~/data/Character"
import { MeritOrFlaw, meritsAndFlaws, thinbloodMeritsAndFlaws } from "~/data/MeritsAndFlaws"
import { SheetOptions } from "../utils/constants"
import { getMeritCost, getAvailableXP, canAffordUpgrade } from "../utils/xp"
import PipButton from "./PipButton"

type MeritFlawSelectModalProps = {
    opened: boolean
    onClose: () => void
    options: SheetOptions
    type: "merit" | "flaw"
}

const MeritFlawSelectModal = ({ opened, onClose, options, type }: MeritFlawSelectModalProps) => {
    const { character, primaryColor, mode, setCharacter } = options
    const [selectedMeritFlaw, setSelectedMeritFlaw] = useState<MeritOrFlaw | null>(null)
    const [selectedLevel, setSelectedLevel] = useState<number>(1)

    const allMeritsAndFlaws = character.clan === "Thin-blood" ? [thinbloodMeritsAndFlaws, ...meritsAndFlaws] : meritsAndFlaws
    const characterMeritFlawNames = new Set(type === "merit" ? character.merits.map((m) => m.name) : character.flaws.map((f) => f.name))

    useEffect(() => {
        if (selectedMeritFlaw) {
            setSelectedLevel(1)
        }
    }, [selectedMeritFlaw])

    const getAvailableMeritsOrFlaws = (): MeritOrFlaw[] => {
        const all: MeritOrFlaw[] = []
        allMeritsAndFlaws.forEach((category) => {
            const items = type === "merit" ? category.merits : category.flaws
            items.forEach((item) => {
                if (!characterMeritFlawNames.has(item.name)) {
                    all.push(item)
                }
            })
        })
        return all
    }

    const availableItems = getAvailableMeritsOrFlaws()

    const addMeritFlaw = (meritFlaw: MeritOrFlaw, level: number) => {
        const newMeritFlaw: MeritFlaw = {
            name: meritFlaw.name,
            level: level,
            summary: meritFlaw.summary,
            type,
        }

        if (mode === "xp" && type === "merit") {
            const existingMerit = character.merits.find((m) => m.name === meritFlaw.name)
            const previousLevel = existingMerit ? existingMerit.level : 0
            const cost = getMeritCost(level, previousLevel)
            const availableXP = getAvailableXP(character)
            if (!canAffordUpgrade(availableXP, cost)) {
                return
            }
            if (existingMerit) {
                const updatedMerits = character.merits.map((m) => (m === existingMerit ? newMeritFlaw : m))
                setCharacter({
                    ...character,
                    merits: updatedMerits,
                    ephemeral: {
                        ...character.ephemeral,
                        experienceSpent: character.ephemeral.experienceSpent + cost,
                    },
                })
            } else {
                setCharacter({
                    ...character,
                    merits: [...character.merits, newMeritFlaw],
                    ephemeral: {
                        ...character.ephemeral,
                        experienceSpent: character.ephemeral.experienceSpent + cost,
                    },
                })
            }
        } else {
            if (type === "merit") {
                const existingMerit = character.merits.find((m) => m.name === meritFlaw.name)
                if (existingMerit) {
                    const updatedMerits = character.merits.map((m) => (m === existingMerit ? newMeritFlaw : m))
                    setCharacter({
                        ...character,
                        merits: updatedMerits,
                    })
                } else {
                    setCharacter({
                        ...character,
                        merits: [...character.merits, newMeritFlaw],
                    })
                }
            } else {
                const existingFlaw = character.flaws.find((f) => f.name === meritFlaw.name)
                if (existingFlaw) {
                    const updatedFlaws = character.flaws.map((f) => (f === existingFlaw ? newMeritFlaw : f))
                    setCharacter({
                        ...character,
                        flaws: updatedFlaws,
                    })
                } else {
                    setCharacter({
                        ...character,
                        flaws: [...character.flaws, newMeritFlaw],
                    })
                }
            }
        }

        onClose()
        setSelectedMeritFlaw(null)
        setSelectedLevel(1)
    }

    const handleSelect = () => {
        if (!selectedMeritFlaw) return
        addMeritFlaw(selectedMeritFlaw, selectedLevel)
    }

    const getCostForItem = (item: MeritOrFlaw, level: number): number => {
        if (type === "flaw" || mode !== "xp") return 0
        const existingMerit = character.merits.find((m) => m.name === item.name)
        const previousLevel = existingMerit ? existingMerit.level : 0
        return getMeritCost(level, previousLevel)
    }

    const handleItemClick = (item: MeritOrFlaw) => {
        if (item.cost.length === 1) {
            addMeritFlaw(item, item.cost[0])
        } else {
            if (mode === "xp" && type === "merit") {
                const lowestLevel = item.cost[0]
                const lowestCost = getCostForItem(item, lowestLevel)
                const availableXP = getAvailableXP(character)
                if (!canAffordUpgrade(availableXP, lowestCost)) {
                    return
                }
            }
            setSelectedMeritFlaw(item)
        }
    }

    const getCostForLevel = (level: number): number => {
        if (type === "flaw" || mode !== "xp") return 0
        const existingMerit = character.merits.find((m) => m.name === selectedMeritFlaw?.name)
        const previousLevel = existingMerit ? existingMerit.level : 0
        return getMeritCost(level, previousLevel)
    }

    return (
        <Modal opened={opened} onClose={onClose} title={`Select a ${type === "merit" ? "Merit" : "Flaw"}`} size="lg">
            <Stack gap="md">
                {selectedMeritFlaw ? (
                    <>
                        <Box>
                            <Title order={4} mb="sm" c={primaryColor}>
                                {selectedMeritFlaw.name}
                            </Title>
                            <Text size="sm" c="dimmed" mb="md">
                                {selectedMeritFlaw.summary}
                            </Text>
                            <Text size="sm" fw={600} mb="xs">
                                Select Level:
                            </Text>
                            <Group gap="xs">
                                {selectedMeritFlaw.cost.map((_, index) => {
                                    const level = index + 1
                                    const cost = getCostForLevel(level)
                                    const availableXP = getAvailableXP(character)
                                    const canAfford = type === "flaw" || mode !== "xp" || canAffordUpgrade(availableXP, cost)
                                    const disabledReason =
                                        type === "flaw" || mode !== "xp"
                                            ? undefined
                                            : canAfford
                                              ? undefined
                                              : `Insufficient XP. Need ${cost}, have ${availableXP}`

                                    return (
                                        <PipButton
                                            key={level}
                                            filled={selectedLevel >= level}
                                            onClick={() => setSelectedLevel(level)}
                                            options={options}
                                            disabledReason={disabledReason}
                                            xpCost={type === "flaw" || mode !== "xp" ? undefined : cost}
                                        />
                                    )
                                })}
                            </Group>
                        </Box>
                        <Group justify="flex-end" mt="md">
                            <Button variant="subtle" onClick={() => setSelectedMeritFlaw(null)} color={primaryColor}>
                                Back
                            </Button>
                            <Button
                                onClick={handleSelect}
                                color={primaryColor}
                                disabled={
                                    mode === "xp" &&
                                    type === "merit" &&
                                    !canAffordUpgrade(getAvailableXP(character), getCostForLevel(selectedLevel))
                                }
                            >
                                Add
                            </Button>
                        </Group>
                    </>
                ) : (
                    <>
                        {availableItems.length === 0 ? (
                            <Text c="dimmed" ta="center" py="xl">
                                No available {type === "merit" ? "merits" : "flaws"} to add.
                            </Text>
                        ) : (
                            <Stack gap="lg">
                                {allMeritsAndFlaws.map((category) => {
                                    const items = type === "merit" ? category.merits : category.flaws
                                    const availableCategoryItems = items.filter((item) => !characterMeritFlawNames.has(item.name))

                                    if (availableCategoryItems.length === 0) return null

                                    return (
                                        <Stack key={category.title} gap="md">
                                            <Title order={4} c={primaryColor}>
                                                {category.title}
                                            </Title>
                                            <Grid gutter="md">
                                                {availableCategoryItems.map((item) => {
                                                    const lowestLevel = item.cost[0]
                                                    const lowestCost =
                                                        mode === "xp" && type === "merit" ? getCostForItem(item, lowestLevel) : 0
                                                    const availableXP = getAvailableXP(character)
                                                    const canAffordLowest =
                                                        type === "flaw" || mode !== "xp" || canAffordUpgrade(availableXP, lowestCost)
                                                    const tooltipLabel =
                                                        mode === "xp" && type === "merit" && !canAffordLowest
                                                            ? `Insufficient XP. Need ${lowestCost}, have ${availableXP}`
                                                            : undefined

                                                    const boxContent = (
                                                        <Box
                                                            p="xs"
                                                            onClick={() => handleItemClick(item)}
                                                            style={{
                                                                border: "1px solid var(--mantine-color-gray-8)",
                                                                borderRadius: "var(--mantine-radius-sm)",
                                                                cursor: canAffordLowest ? "pointer" : "default",
                                                                transition: "background-color 0.2s",
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                if (canAffordLowest) {
                                                                    e.currentTarget.style.backgroundColor = `var(--mantine-color-${primaryColor}-light-hover)`
                                                                }
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.backgroundColor = "transparent"
                                                            }}
                                                        >
                                                            <Stack gap="xs">
                                                                <Group justify="space-between" align="flex-start">
                                                                    <Text fw={600} size="sm" style={{ flex: 1 }}>
                                                                        {item.name}
                                                                    </Text>
                                                                    <Badge
                                                                        size="sm"
                                                                        variant="dot"
                                                                        color={type === "flaw" ? "red" : primaryColor}
                                                                    >
                                                                        {item.cost.join("/")}
                                                                    </Badge>
                                                                </Group>
                                                                {item.summary ? (
                                                                    <Text size="xs" c="dimmed" lineClamp={3}>
                                                                        {item.summary}
                                                                    </Text>
                                                                ) : null}
                                                            </Stack>
                                                        </Box>
                                                    )

                                                    if (tooltipLabel) {
                                                        return (
                                                            <Grid.Col key={item.name} span={{ base: 12, sm: 6 }}>
                                                                <Tooltip label={tooltipLabel} withArrow>
                                                                    {boxContent}
                                                                </Tooltip>
                                                            </Grid.Col>
                                                        )
                                                    }

                                                    return (
                                                        <Grid.Col key={item.name} span={{ base: 12, sm: 6 }}>
                                                            {boxContent}
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
                )}
            </Stack>
        </Modal>
    )
}

export default MeritFlawSelectModal
