import { Badge, Box, Divider, Grid, Group, Stack, Text, Title, Paper } from "@mantine/core"
import { Character } from "~/data/Character"
import { DisciplineName } from "~/data/NameSchemas"
import { upcase } from "~/generator/utils"
import { disciplines } from "~/data/Disciplines"
import Tally from "~/components/Tally"

type DisciplinesProps = {
    character: Character
    setCharacter: (character: Character) => void
    primaryColor: string
}

const Disciplines = ({ character, setCharacter, primaryColor }: DisciplinesProps) => {
    if (character.disciplines.length === 0 && character.rituals.length === 0) {
        return null
    }

    const powersByDiscipline = new Map<DisciplineName, typeof character.disciplines>()
    character.disciplines.forEach((power) => {
        if (!powersByDiscipline.has(power.discipline)) {
            powersByDiscipline.set(power.discipline, [power])
        } else {
            powersByDiscipline.set(power.discipline, [...powersByDiscipline.get(power.discipline)!, power])
        }
    })

    return (
        <>
            {character.disciplines.length > 0 ? (
                <Box>
                    <Title order={2} mb="lg" c={primaryColor}>
                        Disciplines
                    </Title>
                    <Grid gutter="md">
                        {Array.from(powersByDiscipline.entries()).map(([disciplineName, powers]) => {
                            const maxLevel = Math.max(...powers.map((p) => p.level))
                            const discipline = disciplines[disciplineName]
                            const logo = discipline?.logo

                            return (
                                <Grid.Col key={disciplineName} span={{ base: 12, md: 6, lg: 4 }}>
                                    <Paper p="md" withBorder style={{ height: "100%" }}>
                                        <Group gap="md" mb="md" align="center">
                                            {logo ? (
                                                <img
                                                    src={logo}
                                                    alt={upcase(disciplineName)}
                                                    style={{
                                                        width: "40px",
                                                        height: "40px",
                                                        flexShrink: 0,
                                                    }}
                                                />
                                            ) : null}
                                            <Group justify="space-between" style={{ flex: 1 }} align="center">
                                                <Title order={4} style={{ margin: 0 }}>
                                                    {upcase(disciplineName)}
                                                </Title>
                                                <Badge size="lg" variant="light" color={primaryColor} circle>
                                                    {maxLevel}
                                                </Badge>
                                            </Group>
                                        </Group>
                                        <Divider mb="sm" />
                                        <Stack gap="sm">
                                            {powers
                                                .sort((a, b) => a.level - b.level)
                                                .map((power) => (
                                                    <Box
                                                        key={power.name}
                                                        p="xs"
                                                        style={{
                                                            border: "1px solid var(--mantine-color-gray-3)",
                                                            borderRadius: "var(--mantine-radius-sm)",
                                                        }}
                                                    >
                                                        <Stack gap="xs">
                                                            <Group justify="space-between" align="flex-start">
                                                                <Stack gap={2} style={{ flex: 1 }}>
                                                                    <Text fw={600} size="sm">
                                                                        {power.name}
                                                                    </Text>
                                                                    {power.summary ? (
                                                                        <Text size="xs" c="dimmed" lineClamp={2}>
                                                                            {power.summary}
                                                                        </Text>
                                                                    ) : null}
                                                                </Stack>
                                                                <Badge size="sm" variant="dot" color={primaryColor}>
                                                                    Lv.{power.level}
                                                                </Badge>
                                                            </Group>
                                                            <Stack gap={2} mt={4}>
                                                                {power.dicePool && power.dicePool !== "-" ? (
                                                                    <Text size="xs">{power.dicePool.toUpperCase()}</Text>
                                                                ) : null}
                                                                <Group gap="xs" align="center">
                                                                    <Text size="xs">Rouses:</Text>
                                                                    {power.rouseChecks > 0 ? (
                                                                        <Tally
                                                                            n={power.rouseChecks}
                                                                            size={16}
                                                                            style={{ color: "var(--mantine-color-red-6)" }}
                                                                        />
                                                                    ) : (
                                                                        <Text size="xs">FREE</Text>
                                                                    )}
                                                                </Group>
                                                            </Stack>
                                                        </Stack>
                                                    </Box>
                                                ))}
                                        </Stack>
                                    </Paper>
                                </Grid.Col>
                            )
                        })}
                    </Grid>
                </Box>
            ) : null}

            {character.rituals.length > 0 ? (
                <Box mt="xl">
                    {character.disciplines.length > 0 ? <Divider mb="lg" /> : null}
                    <Title order={2} mb="lg" ta="center">
                        Rituals
                    </Title>
                    <Grid gutter="md">
                        {character.rituals.map((ritual) => (
                            <Grid.Col key={ritual.name} span={{ base: 12, md: 6 }}>
                                <Paper p="md" withBorder>
                                    <Group justify="space-between" align="flex-start" mb="xs">
                                        <Text fw={700} size="lg">
                                            {ritual.name}
                                        </Text>
                                        <Badge variant="light" color={primaryColor}>
                                            Ritual
                                        </Badge>
                                    </Group>
                                    {ritual.summary ? (
                                        <Text size="sm" c="dimmed" mt="xs">
                                            {ritual.summary}
                                        </Text>
                                    ) : null}
                                </Paper>
                            </Grid.Col>
                        ))}
                    </Grid>
                </Box>
            ) : null}
        </>
    )
}

export default Disciplines
