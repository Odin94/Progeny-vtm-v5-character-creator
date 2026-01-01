import { Box, Grid, Group, Paper, Stack, Text, Title, Badge, useMantineTheme } from "@mantine/core"
import { SheetOptions } from "../constants"
import { bgAlpha, hexToRgba } from "../utils/style"

type MeritsAndFlawsProps = {
    options: SheetOptions
}

const MeritsAndFlaws = ({ options }: MeritsAndFlawsProps) => {
    const { character, primaryColor } = options
    const theme = useMantineTheme()
    const paperBg = hexToRgba(theme.colors.dark[7], bgAlpha)
    if (character.merits.length === 0 && character.flaws.length === 0) {
        return null
    }

    return (
        <Box>
            <Title order={2} mb="md" c={primaryColor}>
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
                                <Paper key={index} p="sm" withBorder style={{ backgroundColor: paperBg }}>
                                    <Group justify="space-between">
                                        <Text fw={700}>{merit.name}</Text>
                                        <Badge color={primaryColor} circle>
                                            {merit.level}
                                        </Badge>
                                    </Group>
                                    {merit.summary ? (
                                        <Text size="sm" c="dimmed" mt="xs">
                                            {merit.summary.charAt(0).toUpperCase() + merit.summary.slice(1)}
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
                                <Paper key={index} p="sm" withBorder style={{ backgroundColor: paperBg }}>
                                    <Group justify="space-between">
                                        <Text fw={700}>{flaw.name}</Text>
                                        <Badge color="red" circle>
                                            {flaw.level}
                                        </Badge>
                                    </Group>
                                    {flaw.summary ? (
                                        <Text size="sm" c="dimmed" mt="xs">
                                            {flaw.summary.charAt(0).toUpperCase() + flaw.summary.slice(1)}
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
