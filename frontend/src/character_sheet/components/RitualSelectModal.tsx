import { Badge, Box, Button, Grid, Group, Modal, Stack, Text, Title, Tooltip } from "@mantine/core"
import posthog from "posthog-js"
import { useMemo, useState } from "react"
import { Character } from "~/data/Character"
import { Ritual, Rituals } from "~/data/Disciplines"
import { SheetOptions } from "../CharacterSheet"
import { canAffordUpgrade, getAvailableXP, getRitualCost } from "../utils/xp"
import CustomRitualModal from "./CustomRitualModal"

type RitualSelectModalProps = {
    opened: boolean
    onClose: () => void
    options: SheetOptions
}

const getBloodSorceryLevel = (character: Character): number =>
    character.disciplines.filter((power) => power.discipline === "blood sorcery").length

const RitualSelectModal = ({ opened, onClose, options }: RitualSelectModalProps) => {
    const { character, mode, primaryColor, setCharacter } = options
    const availableXP = getAvailableXP(character)
    const knownRitualNames = useMemo(
        () => new Set(character.rituals.map((ritual) => ritual.name)),
        [character.rituals]
    )
    const bloodSorceryLevel = getBloodSorceryLevel(character)
    const availableRituals = Rituals.filter(
        (ritual) => ritual.level <= bloodSorceryLevel && !knownRitualNames.has(ritual.name)
    )
    const ritualsByLevel = new Map<number, Ritual[]>()

    availableRituals.forEach((ritual) => {
        const existing = ritualsByLevel.get(ritual.level) ?? []
        ritualsByLevel.set(ritual.level, [...existing, ritual])
    })

    const sortedLevels = Array.from(ritualsByLevel.keys()).sort((a, b) => a - b)

    const handleSelectRitual = (ritual: Ritual) => {
        const updatedCharacter = {
            ...character,
            rituals: [...character.rituals, ritual]
        }

        if (mode === "xp") {
            updatedCharacter.ephemeral = {
                ...updatedCharacter.ephemeral,
                experienceSpent:
                    updatedCharacter.ephemeral.experienceSpent + getRitualCost(ritual.level)
            }
        }

        setCharacter(updatedCharacter)

        try {
            posthog.capture("sheet-ritual-pick", {
                ritual_name: ritual.name,
                level: ritual.level,
                mode
            })
        } catch (error) {
            console.warn("PostHog sheet-ritual-pick tracking failed:", error)
        }

        onClose()
    }

    return (
        <Modal opened={opened} onClose={onClose} title="Select a Ritual" size="lg">
            <Stack gap="lg">
                {availableRituals.length === 0 ? (
                    <Text c="dimmed" ta="center" py="xl">
                        No available rituals to add.
                    </Text>
                ) : (
                    <>
                        {sortedLevels.map((level) => (
                            <Stack key={level} gap="md">
                                <Title order={4} c={primaryColor}>
                                    Level {level}
                                </Title>
                                <Grid gutter="md">
                                    {ritualsByLevel.get(level)!.map((ritual) => {
                                        const cost = getRitualCost(ritual.level)
                                        const canAfford =
                                            mode !== "xp" || canAffordUpgrade(availableXP, cost)
                                        const tooltipLabel =
                                            mode === "xp"
                                                ? canAfford
                                                    ? `${cost} XP`
                                                    : `Insufficient XP. Need ${cost}, have ${availableXP}`
                                                : undefined

                                        const card = (
                                            <Box
                                                p="xs"
                                                style={{
                                                    border: "1px solid var(--mantine-color-gray-8)",
                                                    borderRadius: "var(--mantine-radius-sm)",
                                                    minHeight: "180px",
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    opacity: canAfford ? 1 : 0.6
                                                }}
                                            >
                                                <Group justify="space-between" align="flex-start">
                                                    <Text fw={600} size="sm">
                                                        {ritual.name}
                                                    </Text>
                                                    <Badge
                                                        size="sm"
                                                        variant="dot"
                                                        color={primaryColor}
                                                    >
                                                        Lv.{ritual.level}
                                                    </Badge>
                                                </Group>
                                                {ritual.summary ? (
                                                    <Text
                                                        size="xs"
                                                        c="dimmed"
                                                        mt="xs"
                                                        lineClamp={4}
                                                    >
                                                        {ritual.summary}
                                                    </Text>
                                                ) : null}
                                                <Stack gap={2} mt="sm">
                                                    {ritual.dicePool ? (
                                                        <Text size="xs">
                                                            {ritual.dicePool.toUpperCase()}
                                                        </Text>
                                                    ) : null}
                                                    <Text size="xs">
                                                        Time: {ritual.requiredTime}
                                                    </Text>
                                                </Stack>
                                                <Button
                                                    size="xs"
                                                    variant="light"
                                                    color={primaryColor}
                                                    mt="auto"
                                                    disabled={!canAfford}
                                                    onClick={() => handleSelectRitual(ritual)}
                                                >
                                                    Add Ritual
                                                </Button>
                                            </Box>
                                        )

                                        return (
                                            <Grid.Col key={ritual.name} span={{ base: 12, sm: 6 }}>
                                                {tooltipLabel ? (
                                                    <Tooltip label={tooltipLabel}>
                                                        <div>{card}</div>
                                                    </Tooltip>
                                                ) : (
                                                    card
                                                )}
                                            </Grid.Col>
                                        )
                                    })}
                                </Grid>
                            </Stack>
                        ))}
                    </>
                )}
                <CustomRitualModalTrigger options={options} onSave={onClose} />
            </Stack>
        </Modal>
    )
}

const CustomRitualModalTrigger = ({
    options,
    onSave
}: {
    options: SheetOptions
    onSave: () => void
}) => {
    const [opened, setOpened] = useState(false)

    return (
        <>
            <Button variant="filled" color="black" fullWidth onClick={() => setOpened(true)}>
                Create Custom Ritual
            </Button>
            <CustomRitualModal
                opened={opened}
                onClose={() => setOpened(false)}
                options={options}
                onSave={() => {
                    setOpened(false)
                    onSave()
                }}
            />
        </>
    )
}

export default RitualSelectModal
