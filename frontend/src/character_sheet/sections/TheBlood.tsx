import {
    Box,
    Button,
    Divider,
    Grid,
    Group,
    Paper,
    Stack,
    Text
} from "@mantine/core"
import { IconSwitchHorizontal } from "@tabler/icons-react"
import { memo } from "react"
import { getBloodPotencyEffectLevel, potencyEffects } from "~/data/BloodPotency"
import {
    getClanBaneText,
    getClanCompulsionText,
    hasVariantClanBane,
    variantClanBanes
} from "~/data/VariantClanBanes"
import Pips from "~/character_sheet/components/Pips"
import Tally from "~/components/Tally"
import { SheetOptions } from "../CharacterSheet"
import { sheetSurfaceStyle } from "../utils/style"

type TheBloodProps = {
    options: SheetOptions
}

const TheBlood = ({ options }: TheBloodProps) => {
    const { character, primaryColor, mode, setCharacter } = options
    const effects =
        potencyEffects[getBloodPotencyEffectLevel(character.bloodPotency)] || potencyEffects[0]
    const variantBane = variantClanBanes[character.clan]
    const baneText = getClanBaneText(character, effects.bane)
    const compulsionText = getClanCompulsionText(character)

    const canToggleClanBane = mode !== "play" && hasVariantClanBane(character.clan)
    const effectRowsStyle = {
        display: "grid",
        gridTemplateColumns: "max-content minmax(0, 1fr)",
        columnGap: "var(--mantine-spacing-xs)",
        rowGap: "var(--mantine-spacing-xs)",
        alignItems: "center"
    } as const
    const tallyStyle = { color: `var(--mantine-color-${primaryColor}-6)` }

    return (
        <Paper p="lg" style={sheetSurfaceStyle}>
            <Box mb="lg">
                <Group gap="md" wrap="nowrap" justify="center" align="center">
                    <Text fw={700} size="lg" style={{ minWidth: "fit-content" }}>
                        Blood Potency:
                    </Text>
                    <Pips
                        level={character.bloodPotency}
                        maxLevel={10}
                        minLevel={0}
                        mobileColumns={5}
                        options={options}
                        field="bloodPotency"
                    />
                </Group>
            </Box>

            <Divider mb="md" />

            <Grid columnGap="xl" rowGap="xl">
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Box style={effectRowsStyle}>
                        <Text fw={600} size="sm">
                            Blood Surge
                        </Text>
                        <Tally n={effects.surge} size={22} style={tallyStyle} />
                        <Text fw={600} size="sm">
                            Bane Severity
                        </Text>
                        <Tally n={effects.bane} size={22} style={tallyStyle} />
                    </Box>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Box style={effectRowsStyle}>
                        <Text fw={600} size="sm">
                            Power Bonus:
                        </Text>
                        <Text size="sm">{effects.discBonus}</Text>
                        <Text fw={600} size="sm">
                            Mend Amount:
                        </Text>
                        <Text size="sm">{effects.mend}</Text>
                        <Text fw={600} size="sm">
                            Rouse Re-Roll:
                        </Text>
                        <Text size="sm">{effects.discRouse}</Text>
                    </Box>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Stack gap="xs">
                        <Text fw={600} size="sm" c="dimmed" mb="xs">
                            Feeding Penalty
                        </Text>
                        {effects.penalty === "-" ? (
                            <Text size="sm" c="dimmed">
                                {effects.penalty}
                            </Text>
                        ) : (
                            <Stack gap={4}>
                                {effects.penalty.split("\n").map((line, i) => (
                                    <Text key={i} size="sm">
                                        {line}
                                    </Text>
                                ))}
                            </Stack>
                        )}
                    </Stack>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Stack gap="xs">
                        <Text fw={600} size="sm" c="dimmed" mb="xs">
                            Clan Traits
                        </Text>
                        <Group gap="xs" align="center" wrap="nowrap">
                            <Text size="sm">
                                <Text span fw={600} c={primaryColor}>
                                    Clan Bane:
                                </Text>{" "}
                                {baneText}
                            </Text>
                        </Group>
                        {canToggleClanBane ? (
                            <Button
                                size="xs"
                                variant="light"
                                color={primaryColor}
                                leftSection={<IconSwitchHorizontal size={14} />}
                                onClick={() =>
                                    setCharacter((current) => ({
                                        ...current,
                                        clanBane:
                                            current.clanBane === "variant" ? "default" : "variant"
                                    }))
                                }
                                styles={{
                                    root: {
                                        alignSelf: "flex-start"
                                    }
                                }}
                            >
                                {character.clanBane === "variant"
                                    ? "Use Default Bane"
                                    : `Use ${variantBane?.name ?? "Variant"} Bane`}
                            </Button>
                        ) : null}
                        <Text size="sm">
                            <Text span fw={600} c={primaryColor}>
                                Clan Compulsion:
                            </Text>{" "}
                            {compulsionText}
                        </Text>
                    </Stack>
                </Grid.Col>
            </Grid>
        </Paper>
    )
}

export default memo(TheBlood, (prev, next) => {
    const p = prev.options
    const n = next.options
    return (
        p.mode === n.mode &&
        p.primaryColor === n.primaryColor &&
        p.canEdit === n.canEdit &&
        p.editDisabledReason === n.editDisabledReason &&
        p.setCharacter === n.setCharacter &&
        p.character.bloodPotency === n.character.bloodPotency &&
        p.character.clan === n.character.clan &&
        p.character.clanBane === n.character.clanBane &&
        p.character.homebrewClan?.bane === n.character.homebrewClan?.bane &&
        p.character.homebrewClan?.compulsion === n.character.homebrewClan?.compulsion
    )
})
