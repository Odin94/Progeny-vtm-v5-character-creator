import { Badge, Box, Divider, Grid, Group, Paper, Stack, Text, Title } from "@mantine/core"
import { clans } from "~/data/Clans"
import { potencyEffects } from "~/data/BloodPotency"
import Pips from "~/character_sheet/components/Pips"
import { SheetOptions } from "../constants"

type TheBloodProps = {
    options: SheetOptions
}

const TheBlood = ({ options }: TheBloodProps) => {
    const { character, primaryColor } = options
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
                    <Pips level={character.bloodPotency} maxLevel={10} minLevel={0} options={options} field="bloodPotency" />
                </Group>
            </Box>

            <Divider mb="md" />

            <Grid gutter="md">
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Paper p="sm" withBorder style={{ height: "100%" }}>
                        <Stack gap="xs">
                            <Group gap="md" align="center">
                                <Group gap="xs" align="center">
                                    <Text fw={600} size="sm">
                                        Blood Surge
                                    </Text>
                                    <Badge size="lg" variant="light" color={primaryColor} circle>
                                        {effects.surge}
                                    </Badge>
                                </Group>
                                <Box
                                    style={{
                                        width: "1px",
                                        height: "1.5rem",
                                        backgroundColor: "var(--mantine-color-gray-3)",
                                    }}
                                />
                                <Group gap="xs" align="center">
                                    <Text fw={600} size="sm">
                                        Bane Severity
                                    </Text>
                                    <Badge size="lg" variant="light" color={primaryColor} circle>
                                        {effects.bane}
                                    </Badge>
                                </Group>
                            </Group>
                            <Text size="sm" fw={600}>
                                <Text span c="white">
                                    XP:{" "}
                                </Text>
                                <Text span size="lg" c={primaryColor} fw={700}>
                                    {character.ephemeral.experienceSpent} / {character.experience}
                                </Text>
                            </Text>
                        </Stack>
                    </Paper>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Paper p="sm" withBorder style={{ height: "100%" }}>
                        <Stack gap="xs">
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
                            <Group gap="xs" align="center" wrap="nowrap">
                                <Text size="sm">
                                    <Text span fw={600} c={primaryColor}>
                                        Clan Bane:
                                    </Text>{" "}
                                    {baneText}
                                </Text>
                            </Group>
                            <Text size="sm">
                                <Text span fw={600} c={primaryColor}>
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
