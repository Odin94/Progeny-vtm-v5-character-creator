import { Badge, Box, Divider, Grid, Group, Paper, Stack, Text, Title } from "@mantine/core"
import { Character } from "~/data/Character"
import { clans } from "~/data/Clans"
import { potencyEffects } from "~/data/BloodPotency"
import Pips from "~/character_sheet/components/Pips"

type TheBloodProps = {
    character: Character
    setCharacter: (character: Character) => void
    primaryColor: string
}

const TheBlood = ({ character, setCharacter, primaryColor }: TheBloodProps) => {
    const effects = potencyEffects[Math.min(character.bloodPotency, 5)] || potencyEffects[0]
    const clan = clans[character.clan] || clans[""]
    const baneText = clan.bane ? clan.bane.replace(/BANE_SEVERITY/g, `${effects.bane} (bane severity)`) : ""

    return (
        <Paper p="lg" withBorder>
            <Title order={2} mb="md" c={primaryColor}>
                The Blood
            </Title>

            <Box mb="lg">
                <Group gap="md" wrap="nowrap" justify="center" align="center">
                    <Text fw={700} size="lg" style={{ minWidth: "fit-content" }}>
                        Blood Potency:
                    </Text>
                    <Pips
                        level={character.bloodPotency}
                        maxLevel={10}
                        minLevel={0}
                        onLevelChange={(level) => setCharacter({ ...character, bloodPotency: level })}
                        color={primaryColor}
                    />
                </Group>
            </Box>

            <Divider mb="md" />

            <Grid gutter="md">
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Paper p="sm" withBorder style={{ height: "100%" }}>
                        <Stack gap="xs">
                            <Group justify="space-between" align="center">
                                <Text fw={600} size="sm">
                                    Blood Surge
                                </Text>
                                <Badge size="lg" variant="light" color={primaryColor} circle>
                                    {effects.surge}
                                </Badge>
                            </Group>
                            <Group justify="space-between" align="center">
                                <Text fw={600} size="sm">
                                    Bane Severity
                                </Text>
                                <Badge size="lg" variant="light" color={primaryColor} circle>
                                    {effects.bane}
                                </Badge>
                            </Group>
                        </Stack>
                    </Paper>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Paper p="sm" withBorder style={{ height: "100%" }}>
                        <Stack gap="xs">
                            <Text fw={600} size="sm" c="dimmed" mb="xs">
                                Discipline Effects
                            </Text>
                            <Text size="sm">
                                <Text span fw={600}>
                                    Power Bonus:
                                </Text>{" "}
                                {effects.discBonus}
                            </Text>
                            <Text size="sm">
                                <Text span fw={600}>
                                    Mend Amount:
                                </Text>{" "}
                                {effects.mend}
                            </Text>
                            <Text size="sm">
                                <Text span fw={600}>
                                    Rouse Re-Roll:
                                </Text>{" "}
                                {effects.discRouse}
                            </Text>
                        </Stack>
                    </Paper>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Paper p="sm" withBorder style={{ height: "100%" }}>
                        <Stack gap="xs">
                            <Text fw={600} size="sm" c="dimmed" mb="xs">
                                Feeding Penalty
                            </Text>
                            {effects.penalty === "-" ? (
                                <Text size="sm" c="dimmed">
                                    {effects.penalty}
                                </Text>
                            ) : (
                                <Stack gap={4}>
                                    {effects.penalty.split("\n").map((line, i) => (
                                        <Text key={i} size="sm">
                                            {line}
                                        </Text>
                                    ))}
                                </Stack>
                            )}
                        </Stack>
                    </Paper>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Paper p="sm" withBorder style={{ height: "100%" }}>
                        <Stack gap="xs">
                            <Text fw={600} size="sm" c="dimmed" mb="xs">
                                Clan Traits
                            </Text>
                            <Text size="sm">
                                <Text span fw={600}>
                                    Clan Bane:
                                </Text>{" "}
                                {baneText}
                            </Text>
                            <Text size="sm">
                                <Text span fw={600}>
                                    Clan Compulsion:
                                </Text>{" "}
                                {clan.compulsion}
                            </Text>
                        </Stack>
                    </Paper>
                </Grid.Col>
            </Grid>
        </Paper>
    )
}

export default TheBlood
