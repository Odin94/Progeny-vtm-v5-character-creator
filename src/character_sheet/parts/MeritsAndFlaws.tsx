import { Box, Grid, Group, Paper, Stack, Text, Title, Badge } from "@mantine/core"
import { Character } from "~/data/Character"

type MeritsAndFlawsProps = {
    character: Character
    setCharacter: (character: Character) => void
}

const MeritsAndFlaws = ({ character, setCharacter }: MeritsAndFlawsProps) => {
    if (character.merits.length === 0 && character.flaws.length === 0) {
        return null
    }

    return (
        <Box>
            <Title order={2} mb="md">
                Merits & Flaws
            </Title>
            <Grid>
                {character.merits.length > 0 ? (
                    <Grid.Col span={{ base: 12, md: 6 }}>
                        <Title order={4} mb="sm">
                            Merits
                        </Title>
                        <Stack gap="xs">
                            {character.merits.map((merit, index) => (
                                <Paper key={index} p="sm" withBorder>
                                    <Group justify="space-between">
                                        <Text fw={700}>{merit.name}</Text>
                                        <Badge color="grape">Level {merit.level}</Badge>
                                    </Group>
                                    {merit.summary ? (
                                        <Text size="sm" c="dimmed" mt="xs">
                                            {merit.summary}
                                        </Text>
                                    ) : null}
                                </Paper>
                            ))}
                        </Stack>
                    </Grid.Col>
                ) : null}
                {character.flaws.length > 0 ? (
                    <Grid.Col span={{ base: 12, md: 6 }}>
                        <Title order={4} mb="sm">
                            Flaws
                        </Title>
                        <Stack gap="xs">
                            {character.flaws.map((flaw, index) => (
                                <Paper key={index} p="sm" withBorder>
                                    <Group justify="space-between">
                                        <Text fw={700}>{flaw.name}</Text>
                                        <Badge color="red">Level {flaw.level}</Badge>
                                    </Group>
                                    {flaw.summary ? (
                                        <Text size="sm" c="dimmed" mt="xs">
                                            {flaw.summary}
                                        </Text>
                                    ) : null}
                                </Paper>
                            ))}
                        </Stack>
                    </Grid.Col>
                ) : null}
            </Grid>
        </Box>
    )
}

export default MeritsAndFlaws
