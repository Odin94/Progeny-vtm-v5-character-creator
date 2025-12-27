import { Grid, Group, Stack, Text, Title, Box, useMantineTheme } from "@mantine/core"
import { Character } from "~/data/Character"
import { clans } from "~/data/Clans"

type TopDataProps = {
    character: Character
    setCharacter: (character: Character) => void
    primaryColor: string
}

const TopData = ({ character, primaryColor }: TopDataProps) => {
    const theme = useMantineTheme()
    const clan = character.clan ? clans[character.clan] : null
    const colorValue = theme.colors[primaryColor]?.[6] || theme.colors.grape[6]

    return (
        <>
            <Box>
                <Group gap="md" justify="center" align="center" mb="md">
                    <Title order={1} c={primaryColor} style={{ margin: 0 }}>
                        {character.name || "Unnamed Character"}
                    </Title>
                    {clan?.logo ? (
                        <Box
                            style={{
                                width: "56px",
                                height: "56px",
                                backgroundColor: colorValue,
                                maskImage: `url(${clan.logo})`,
                                maskSize: "contain",
                                maskRepeat: "no-repeat",
                                maskPosition: "center",
                                WebkitMaskImage: `url(${clan.logo})`,
                                WebkitMaskSize: "contain",
                                WebkitMaskRepeat: "no-repeat",
                                WebkitMaskPosition: "center",
                            }}
                        />
                    ) : null}
                </Group>
                {character.description ? (
                    <Text c="dimmed" ta="center" mb="lg">
                        {character.description}
                    </Text>
                ) : null}
            </Box>

            <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Stack gap="xs">
                        <Group gap="xs">
                            <Text fw={700}>Clan:</Text>
                            {clan ? (
                                <Group gap="xs">
                                    <Text>{clan.name}</Text>
                                    {clan.logo ? (
                                        <img
                                            src={clan.logo}
                                            alt={clan.name}
                                            style={{
                                                width: "24px",
                                                height: "24px",
                                            }}
                                        />
                                    ) : null}
                                </Group>
                            ) : (
                                <Text c="dimmed">—</Text>
                            )}
                        </Group>
                        <Group gap="xs">
                            <Text fw={700}>Generation:</Text>
                            <Text>{character.generation || "—"}</Text>
                        </Group>
                        <Group gap="xs">
                            <Text fw={700}>Sire:</Text>
                            <Text>{character.sire || "—"}</Text>
                        </Group>
                    </Stack>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Stack gap="xs">
                        <Group gap="xs">
                            <Text fw={700}>Ambition:</Text>
                            <Text>{character.ambition || "—"}</Text>
                        </Group>
                        <Group gap="xs">
                            <Text fw={700}>Desire:</Text>
                            <Text>{character.desire || "—"}</Text>
                        </Group>
                        <Group gap="xs">
                            <Text fw={700}>Predator Type:</Text>
                            <Text>{character.predatorType.name || "—"}</Text>
                        </Group>
                    </Stack>
                </Grid.Col>
            </Grid>
        </>
    )
}

export default TopData
