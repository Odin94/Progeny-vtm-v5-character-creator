import { ActionIcon, Grid, Group, Paper, Stack, Text, Tooltip, useMantineTheme } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { IconDroplet } from "@tabler/icons-react"
import DamagePips from "~/character_sheet/components/DamagePips"
import Pips from "~/character_sheet/components/Pips"
import SquarePips from "~/character_sheet/components/SquarePips"
import { SheetOptions } from "../CharacterSheet"
import { bgAlpha, hexToRgba, vtmRed } from "../utils/style"

type BottomDataProps = {
    options: SheetOptions
}

const BottomData = ({ options }: BottomDataProps) => {
    const { character, setCharacter } = options
    const theme = useMantineTheme()
    const { superficialDamage, aggravatedDamage, superficialWillpowerDamage, aggravatedWillpowerDamage, hunger } = character.ephemeral
    const paperBg = hexToRgba(theme.colors.dark[7], bgAlpha)

    const handleRouseCheck = () => {
        const roll = Math.floor(Math.random() * 10) + 1
        let message = `Rouse Check: ${roll}`
        
        if (roll < 6) {
            const newHunger = Math.min(hunger + 1, 5)
            setCharacter({
                ...character,
                ephemeral: {
                    ...character.ephemeral,
                    hunger: newHunger,
                },
            })
            message += ". Hunger increased"
        }
        
        notifications.show({
            message,
            color: roll < 6 ? "orange" : "blue",
        })
    }

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
                    <Group gap="xs" mb="xs" justify="space-between">
                        <Text fw={700}>Hunger</Text>
                        <Tooltip label="Roll rouse check">
                                <ActionIcon size="sm" variant="subtle" onClick={handleRouseCheck} color={vtmRed}>
                                    <IconDroplet size={16} />
                                </ActionIcon>
                        </Tooltip>
                    </Group>
                    <SquarePips value={hunger} options={options} field="ephemeral.hunger" maxLevel={5} />
                </Paper>
            </Grid.Col>
        </Grid>
    )
}

export default BottomData
