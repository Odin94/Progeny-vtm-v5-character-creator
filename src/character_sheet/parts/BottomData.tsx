import { Grid, Group, Paper, Stack, Text, useMantineTheme } from "@mantine/core"
import Pips from "~/character_sheet/components/Pips"
import SquarePips from "~/character_sheet/components/SquarePips"
import DamagePips from "~/character_sheet/components/DamagePips"
import { SheetOptions } from "../utils/constants"
import { bgAlpha, hexToRgba } from "../utils/style"

type BottomDataProps = {
    options: SheetOptions
}

const BottomData = ({ options }: BottomDataProps) => {
    const { character } = options
    const theme = useMantineTheme()
    const { superficialDamage, aggravatedDamage, superficialWillpowerDamage, aggravatedWillpowerDamage, hunger } = character.ephemeral
    const paperBg = hexToRgba(theme.colors.dark[7], bgAlpha)

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
                    <Text fw={700} mb="xs">
                        Humanity
                    </Text>
                    <SquarePips value={character.humanity} options={options} field="humanity" maxLevel={10} groupSize={5} />
                </Paper>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 3 }}>
                <Paper p="sm" withBorder style={{ backgroundColor: paperBg }}>
                    <Text fw={700} mb="xs">
                        Hunger
                    </Text>
                    <SquarePips value={hunger} options={options} field="ephemeral.hunger" maxLevel={5} />
                </Paper>
            </Grid.Col>
        </Grid>
    )
}

export default BottomData
