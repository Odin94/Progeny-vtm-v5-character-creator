import { Grid, Group, Paper, Stack, Text, useMantineTheme } from "@mantine/core"
import DamagePips from "~/character_sheet/components/DamagePips"
import HumanityStainsPips from "~/character_sheet/components/HumanityStainsPips"
import Pips from "~/character_sheet/components/Pips"
import RemorseTestButton from "~/character_sheet/components/RemorseTestButton"
import RouseCheckButton from "~/character_sheet/components/RouseCheckButton"
import SquarePips from "~/character_sheet/components/SquarePips"
import { SheetOptions } from "../CharacterSheet"
import { bgAlpha, hexToRgba } from "../utils/style"

type BottomDataProps = {
    options: SheetOptions
}

const BottomData = ({ options }: BottomDataProps) => {
    const { character, setCharacter, primaryColor } = options
    const theme = useMantineTheme()
    const { superficialDamage, aggravatedDamage, superficialWillpowerDamage, aggravatedWillpowerDamage, hunger, humanityStains } = character.ephemeral
    const paperBg = hexToRgba(theme.colors.dark[7], bgAlpha)
    const emptyHumanityPips = 10 - character.humanity

    return (
        <Grid justify="space-between">
            <Grid.Col span={{ base: 12, md: 3 }}>
                <Paper p="sm" withBorder style={{ backgroundColor: paperBg }}>
                    <Text fw={700} mb="xs">
                        Health
                    </Text>
                    <Stack gap="xs">
                        <Group gap="xs">
                            <Pips level={character.maxHealth} maxLevel={10} options={options} field="maxHealth" />
                        </Group>
                        <DamagePips
                            maxValue={character.maxHealth}
                            superficial={superficialDamage}
                            aggravated={aggravatedDamage}
                            onChange={(newSuperficial, newAggravated) =>
                                options.setCharacter({
                                    ...character,
                                    ephemeral: {
                                        ...character.ephemeral,
                                        superficialDamage: newSuperficial,
                                        aggravatedDamage: newAggravated,
                                    },
                                })
                            }
                            color={options.primaryColor}
                        />
                    </Stack>
                </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 3 }}>
                <Paper p="sm" withBorder style={{ backgroundColor: paperBg }}>
                    <Text fw={700} mb="xs">
                        Willpower
                    </Text>
                    <Stack gap="xs">
                        <Group gap="xs">
                            <Pips level={character.willpower} maxLevel={10} options={options} field="willpower" />
                        </Group>
                        <DamagePips
                            maxValue={character.willpower}
                            superficial={superficialWillpowerDamage}
                            aggravated={aggravatedWillpowerDamage}
                            onChange={(newSuperficial, newAggravated) =>
                                options.setCharacter({
                                    ...character,
                                    ephemeral: {
                                        ...character.ephemeral,
                                        superficialWillpowerDamage: newSuperficial,
                                        aggravatedWillpowerDamage: newAggravated,
                                    },
                                })
                            }
                            color={options.primaryColor}
                        />
                    </Stack>
                </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 3 }}>
                <Paper p="sm" withBorder style={{ backgroundColor: paperBg }}>
                    <Group gap="xs" mb="xs" justify="space-between">
                        <Text fw={700}>Humanity</Text>
                        <RemorseTestButton
                            character={character}
                            setCharacter={setCharacter}
                            primaryColor={primaryColor}
                            size="sm"
                            iconSize={16}
                        />
                    </Group>
                    <Stack gap="xs">
                        <div style={{ maxWidth: "226px" }}>
                            <div>
                                <SquarePips value={character.humanity} options={options} field="humanity" maxLevel={10} groupSize={5} />
                            </div>
                            {emptyHumanityPips > 0 ? (
                                <HumanityStainsPips value={humanityStains} maxLevel={emptyHumanityPips} filledHumanity={character.humanity} options={options} />
                            ) : null}
                        </div>
                    </Stack>
                </Paper>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 3 }}>
                <Paper p="sm" withBorder style={{ backgroundColor: paperBg }}>
                    <Group gap="xs" mb="xs" justify="space-between">
                        <Text fw={700}>Hunger</Text>
                        <RouseCheckButton
                            character={character}
                            setCharacter={setCharacter}
                            primaryColor={primaryColor}
                            size="sm"
                            iconSize={16}
                        />
                    </Group>
                    <SquarePips value={hunger} options={options} field="ephemeral.hunger" maxLevel={5} />
                </Paper>
            </Grid.Col>
        </Grid>
    )
}

export default BottomData
