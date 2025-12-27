import { Grid, Group, Stack, Text, Title, Box } from "@mantine/core"
import { Character } from "~/data/Character"
import { clans } from "~/data/Clans"
import Tally from "~/components/Tally"
import classes from "./TopData.module.css"

type TopDataProps = {
    character: Character
    setCharacter: (character: Character) => void
}

const TopData = ({ character }: TopDataProps) => {
    const clan = character.clan ? clans[character.clan] : null

    return (
        <>
            <Box>
                <Title order={1} ta="center" mb="md">
                    {character.name || "Unnamed Character"}
                </Title>
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
                                    {clan.logo ? <img src={clan.logo} alt={clan.name} className={classes.image} /> : null}
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
                        <Group gap="xs">
                            <Text fw={700}>Predator Type:</Text>
                            <Text>{character.predatorType.name || "—"}</Text>
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
                            <Text fw={700}>Blood Potency:</Text>
                            <Tally n={character.bloodPotency} />
                        </Group>
                    </Stack>
                </Grid.Col>
            </Grid>
        </>
    )
}

export default TopData
