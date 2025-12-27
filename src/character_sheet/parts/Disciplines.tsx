import { Box, Grid, Group, Stack, Text, Title, Paper } from "@mantine/core"
import { Character } from "~/data/Character"
import { DisciplineName } from "~/data/NameSchemas"
import { upcase } from "~/generator/utils"
import Tally from "~/components/Tally"

type DisciplinesProps = {
    character: Character
    setCharacter: (character: Character) => void
}

const Disciplines = ({ character, setCharacter }: DisciplinesProps) => {
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
                    <Title order={2} mb="md">
                        Disciplines
                    </Title>
                    <Grid>
                        {Array.from(powersByDiscipline.entries()).map(([disciplineName, powers]) => {
                            const maxLevel = Math.max(...powers.map((p) => p.level))
                            return (
                                <Grid.Col key={disciplineName} span={{ base: 12, md: 6 }}>
                                    <Paper p="sm" withBorder>
                                        <Group justify="space-between" mb="xs">
                                            <Title order={4}>{upcase(disciplineName)}</Title>
                                            <Tally n={maxLevel} />
                                        </Group>
                                        <Stack gap="xs">
                                            {powers.map((power) => (
                                                <Text key={power.name} size="sm">
                                                    • {power.name} (Level {power.level})
                                                </Text>
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
                <Box>
                    <Title order={2} mb="md">
                        Rituals
                    </Title>
                    <Stack gap="xs">
                        {character.rituals.map((ritual) => (
                            <Paper key={ritual.name} p="sm" withBorder>
                                <Text fw={700}>{ritual.name}</Text>
                                {ritual.summary ? (
                                    <Text size="sm" c="dimmed" mt="xs">
                                        {ritual.summary}
                                    </Text>
                                ) : null}
                            </Paper>
                        ))}
                    </Stack>
                </Box>
            ) : null}
        </>
    )
}

export default Disciplines
