import { Grid, Group, Paper, Stack, Text } from "@mantine/core"
import { Character } from "~/data/Character"
import Pips from "~/character_sheet/components/Pips"
import SquarePips from "~/character_sheet/components/SquarePips"
import DamagePips from "~/character_sheet/components/DamagePips"

type BottomDataProps = {
    character: Character
    setCharacter: (character: Character) => void
}

const BottomData = ({ character, setCharacter }: BottomDataProps) => {
    const { superficialDamage, aggravatedDamage, superficialWillpowerDamage, aggravatedWillpowerDamage, hunger } = character.ephemeral

    return (
        <Grid justify="space-between">
            <Grid.Col span={{ base: 12, md: 3 }}>
                <Paper p="sm" withBorder>
                    <Text fw={700} mb="xs">
                        Health
                    </Text>
                    <Stack gap="xs">
                        <Group gap="xs">
                            <Pips
                                level={character.maxHealth}
                                maxLevel={10}
                                onLevelChange={(level) => setCharacter({ ...character, maxHealth: level })}
                            />
                        </Group>
                        <DamagePips
                            maxValue={character.maxHealth}
                            superficial={superficialDamage}
                            aggravated={aggravatedDamage}
                            onChange={(newSuperficial, newAggravated) =>
                                setCharacter({
                                    ...character,
                                    ephemeral: {
                                        ...character.ephemeral,
                                        superficialDamage: newSuperficial,
                                        aggravatedDamage: newAggravated,
                                    },
                                })
                            }
                        />
                    </Stack>
                </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 3 }}>
                <Paper p="sm" withBorder>
                    <Text fw={700} mb="xs">
                        Willpower
                    </Text>
                    <Stack gap="xs">
                        <Group gap="xs">
                            <Pips
                                level={character.willpower}
                                maxLevel={10}
                                onLevelChange={(level) => setCharacter({ ...character, willpower: level })}
                            />
                        </Group>
                        <DamagePips
                            maxValue={character.willpower}
                            superficial={superficialWillpowerDamage}
                            aggravated={aggravatedWillpowerDamage}
                            onChange={(newSuperficial, newAggravated) =>
                                setCharacter({
                                    ...character,
                                    ephemeral: {
                                        ...character.ephemeral,
                                        superficialWillpowerDamage: newSuperficial,
                                        aggravatedWillpowerDamage: newAggravated,
                                    },
                                })
                            }
                        />
                    </Stack>
                </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 3 }}>
                <Paper p="sm" withBorder>
                    <Text fw={700} mb="xs">
                        Humanity
                    </Text>
                    <SquarePips
                        value={character.humanity}
                        setValue={(value) => setCharacter({ ...character, humanity: value })}
                        maxLevel={10}
                        groupSize={5}
                    />
                </Paper>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 3 }}>
                <Paper p="sm" withBorder>
                    <Text fw={700} mb="xs">
                        Hunger
                    </Text>
                    <SquarePips
                        value={hunger}
                        setValue={(value) =>
                            setCharacter({
                                ...character,
                                ephemeral: {
                                    ...character.ephemeral,
                                    hunger: value,
                                },
                            })
                        }
                        maxLevel={5}
                    />
                </Paper>
            </Grid.Col>
        </Grid>
    )
}

export default BottomData
