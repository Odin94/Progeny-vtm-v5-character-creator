import { Grid, Group, Paper, Stack, Text, useMantineTheme } from "@mantine/core"
import { memo, useCallback } from "react"
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
    const {
        superficialDamage,
        aggravatedDamage,
        superficialWillpowerDamage,
        aggravatedWillpowerDamage,
        hunger,
        humanityStains
    } = character.ephemeral
    const paperBg = hexToRgba(theme.colors.dark[7], bgAlpha)
    const emptyHumanityPips = 10 - character.humanity
    const updateHealthDamage = useCallback(
        (newSuperficial: number, newAggravated: number) =>
            setCharacter((current) => ({
                ...current,
                ephemeral: {
                    ...current.ephemeral,
                    superficialDamage: newSuperficial,
                    aggravatedDamage: newAggravated
                }
            })),
        [setCharacter]
    )
    const updateWillpowerDamage = useCallback(
        (newSuperficial: number, newAggravated: number) =>
            setCharacter((current) => ({
                ...current,
                ephemeral: {
                    ...current.ephemeral,
                    superficialWillpowerDamage: newSuperficial,
                    aggravatedWillpowerDamage: newAggravated
                }
            })),
        [setCharacter]
    )

    return (
        <Grid justify="space-between">
            <Grid.Col span={{ base: 12, md: 3 }}>
                <Paper p="sm" withBorder style={{ backgroundColor: paperBg }}>
                    <Text fw={700} mb="xs">
                        Health
                    </Text>
                    <Stack gap="xs">
                        <Group gap="xs">
                            <Pips
                                level={character.maxHealth}
                                maxLevel={10}
                                options={options}
                                field="maxHealth"
                            />
                        </Group>
                        <DamagePips
                            maxValue={character.maxHealth}
                            superficial={superficialDamage}
                            aggravated={aggravatedDamage}
                            onChange={updateHealthDamage}
                            color={options.primaryColor}
                            disabledReason={options.editDisabledReason}
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
                            <Pips
                                level={character.willpower}
                                maxLevel={10}
                                options={options}
                                field="willpower"
                            />
                        </Group>
                        <DamagePips
                            maxValue={character.willpower}
                            superficial={superficialWillpowerDamage}
                            aggravated={aggravatedWillpowerDamage}
                            onChange={updateWillpowerDamage}
                            color={options.primaryColor}
                            disabledReason={options.editDisabledReason}
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
                            disabledReason={options.editDisabledReason}
                        />
                    </Group>
                    <Stack gap="xs">
                        <div style={{ maxWidth: "226px" }}>
                            <div>
                                <SquarePips
                                    value={character.humanity}
                                    options={options}
                                    field="humanity"
                                    maxLevel={10}
                                    groupSize={5}
                                />
                            </div>
                            {emptyHumanityPips > 0 ? (
                                <HumanityStainsPips
                                    value={humanityStains}
                                    maxLevel={emptyHumanityPips}
                                    filledHumanity={character.humanity}
                                    options={options}
                                />
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
                            disabledReason={options.editDisabledReason}
                        />
                    </Group>
                    <SquarePips
                        value={hunger}
                        options={options}
                        field="ephemeral.hunger"
                        maxLevel={5}
                    />
                </Paper>
            </Grid.Col>
        </Grid>
    )
}

export default memo(BottomData, (prev, next) => {
    const p = prev.options
    const n = next.options
    return (
        p.mode === n.mode &&
        p.primaryColor === n.primaryColor &&
        p.canEdit === n.canEdit &&
        p.editDisabledReason === n.editDisabledReason &&
        p.setCharacter === n.setCharacter &&
        p.character.maxHealth === n.character.maxHealth &&
        p.character.willpower === n.character.willpower &&
        p.character.humanity === n.character.humanity &&
        p.character.ephemeral === n.character.ephemeral
    )
})
