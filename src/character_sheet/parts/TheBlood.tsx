import { Grid, Group, Paper, Stack, Text } from "@mantine/core"
import { Character } from "~/data/Character"
import { clans } from "~/data/Clans"
import { potencyEffects } from "~/data/BloodPotency"
import Pips from "~/character_sheet/components/Pips"

type TheBloodProps = {
    character: Character
    setCharacter: (character: Character) => void
}

const TheBlood = ({ character, setCharacter }: TheBloodProps) => {
    const effects = potencyEffects[Math.min(character.bloodPotency, 5)] || potencyEffects[0]
    const clan = clans[character.clan] || clans[""]
    const baneText = clan.bane ? clan.bane.replace(/BANE_SEVERITY/g, `${effects.bane} (bane severity)`) : ""

    return (
        <Paper p="sm" withBorder>
            <Grid>
                <Grid.Col span={12} mb="xs">
                    <Group gap="xs" wrap="nowrap" justify="center">
                        <Text fw={600} style={{ minWidth: "fit-content" }}>
                            Blood Potency:
                        </Text>
                        <Pips
                            level={character.bloodPotency}
                            maxLevel={10}
                            minLevel={0}
                            onLevelChange={(level) => setCharacter({ ...character, bloodPotency: level })}
                        />
                    </Group>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Text>
                        <Text span fw={600}>
                            Blood Surge:
                        </Text>{" "}
                        {effects.surge}
                    </Text>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Text>
                        <Text span fw={600}>
                            Bane Severity:
                        </Text>{" "}
                        {effects.bane}
                    </Text>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Stack gap="xs">
                        <Text>
                            <Text span fw={600}>
                                Power Bonus:
                            </Text>{" "}
                            {effects.discBonus}
                        </Text>
                        <Text>
                            <Text span fw={600}>
                                Mend Amount:
                            </Text>{" "}
                            {effects.mend}
                        </Text>
                        <Text>
                            <Text span fw={600}>
                                Rouse Re-Roll:
                            </Text>{" "}
                            {effects.discRouse}
                        </Text>
                    </Stack>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Stack gap={0}>
                        <Text>
                            <Text span fw={600}>
                                Feeding Penalty:
                            </Text>
                        </Text>
                        {effects.penalty === "-" ? (
                            <Text>{effects.penalty}</Text>
                        ) : (
                            effects.penalty.split("\n").map((line, i) => (
                                <Text key={i} size="sm">
                                    {line}
                                </Text>
                            ))
                        )}
                    </Stack>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Text>
                        <Text span fw={600}>
                            Clan Bane:
                        </Text>{" "}
                        {baneText}
                    </Text>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Text>
                        <Text span fw={600}>
                            Clan Compulsion:
                        </Text>{" "}
                        {clan.compulsion}
                    </Text>
                </Grid.Col>
            </Grid>
        </Paper>
    )
}

export default TheBlood
