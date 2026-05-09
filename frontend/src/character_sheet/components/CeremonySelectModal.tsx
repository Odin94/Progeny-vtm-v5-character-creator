import { Badge, Box, Button, Grid, Group, Modal, Stack, Text, Title, Tooltip } from "@mantine/core"
import posthog from "posthog-js"
import { useMemo, useState } from "react"
import { Character } from "~/data/Character"
import {
    Ceremony,
    Ceremonies,
    characterHasCeremonyPrerequisite,
    getCeremonyPrerequisiteLabel
} from "~/data/Ceremonies"
import { SheetOptions } from "../CharacterSheet"
import { canAffordUpgrade, getAvailableXP, getRitualCost } from "../utils/xp"
import CustomCeremonyModal from "./CustomCeremonyModal"

type CeremonySelectModalProps = {
    opened: boolean
    onClose: () => void
    options: SheetOptions
}

const getOblivionLevel = (character: Character): number =>
    character.disciplines.filter((power) => power.discipline === "oblivion").length

const CeremonySelectModal = ({ opened, onClose, options }: CeremonySelectModalProps) => {
    const { character, mode, primaryColor, setCharacter } = options
    const availableXP = getAvailableXP(character)
    const knownCeremonyNames = useMemo(
        () => new Set(character.ceremonies.map((ceremony) => ceremony.name)),
        [character.ceremonies]
    )
    const oblivionLevel = getOblivionLevel(character)
    const availableCeremonies = Ceremonies.filter(
        (ceremony) =>
            ceremony.level <= oblivionLevel &&
            !knownCeremonyNames.has(ceremony.name) &&
            characterHasCeremonyPrerequisite(character, ceremony)
    )
    const ceremoniesByLevel = new Map<number, Ceremony[]>()

    availableCeremonies.forEach((ceremony) => {
        const existing = ceremoniesByLevel.get(ceremony.level) ?? []
        ceremoniesByLevel.set(ceremony.level, [...existing, ceremony])
    })

    const sortedLevels = Array.from(ceremoniesByLevel.keys()).sort((a, b) => a - b)

    const handleSelectCeremony = (ceremony: Ceremony) => {
        const updatedCharacter = {
            ...character,
            ceremonies: [...character.ceremonies, ceremony]
        }

        if (mode === "xp") {
            updatedCharacter.ephemeral = {
                ...updatedCharacter.ephemeral,
                experienceSpent:
                    updatedCharacter.ephemeral.experienceSpent + getRitualCost(ceremony.level)
            }
        }

        setCharacter(updatedCharacter)

        try {
            posthog.capture("sheet-ceremony-pick", {
                ceremony_name: ceremony.name,
                level: ceremony.level,
                mode
            })
        } catch (error) {
            console.warn("PostHog sheet-ceremony-pick tracking failed:", error)
        }

        onClose()
    }

    return (
        <Modal opened={opened} onClose={onClose} title="Select a Ceremony" size="lg">
            <Stack gap="lg">
                {availableCeremonies.length === 0 ? (
                    <Text c="dimmed" ta="center" py="xl">
                        No available ceremonies to add.
                    </Text>
                ) : (
                    sortedLevels.map((level) => (
                        <Stack key={level} gap="md">
                            <Title order={4} c={primaryColor}>
                                Level {level}
                            </Title>
                            <Grid gutter="md">
                                {ceremoniesByLevel.get(level)!.map((ceremony) => {
                                    const cost = getRitualCost(ceremony.level)
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
                                                height: "220px",
                                                display: "flex",
                                                flexDirection: "column",
                                                opacity: canAfford ? 1 : 0.6
                                            }}
                                        >
                                            <Group
                                                justify="space-between"
                                                align="flex-start"
                                                wrap="nowrap"
                                            >
                                                <Text
                                                    fw={600}
                                                    size="sm"
                                                    pr="xs"
                                                    lineClamp={2}
                                                    style={{ flex: 1 }}
                                                >
                                                    {ceremony.name}
                                                </Text>
                                                <Badge
                                                    size="sm"
                                                    variant="dot"
                                                    color={primaryColor}
                                                    style={{ flexShrink: 0 }}
                                                >
                                                    Lv.{ceremony.level}
                                                </Badge>
                                            </Group>
                                            <Text
                                                size="xs"
                                                c="dimmed"
                                                mt="xs"
                                                lineClamp={4}
                                                style={{ height: 68 }}
                                            >
                                                {ceremony.summary}
                                            </Text>
                                            <Stack gap={2} mt="sm">
                                                <Text size="xs">
                                                    {ceremony.dicePool.toUpperCase()}
                                                </Text>
                                                <Text size="xs">
                                                    Requires:{" "}
                                                    {getCeremonyPrerequisiteLabel(ceremony)}
                                                </Text>
                                                <Text size="xs">Time: {ceremony.requiredTime}</Text>
                                            </Stack>
                                            <Button
                                                size="xs"
                                                variant="light"
                                                color={primaryColor}
                                                mt="auto"
                                                disabled={!canAfford}
                                                onClick={() => handleSelectCeremony(ceremony)}
                                            >
                                                Add Ceremony
                                            </Button>
                                        </Box>
                                    )

                                    return (
                                        <Grid.Col key={ceremony.name} span={{ base: 12, sm: 6 }}>
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
                    ))
                )}
                <CustomCeremonyModalTrigger options={options} onSave={onClose} />
            </Stack>
        </Modal>
    )
}

const CustomCeremonyModalTrigger = ({
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
                Create Custom Ceremony
            </Button>
            <CustomCeremonyModal
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

export default CeremonySelectModal
