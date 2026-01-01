import { Grid, Group, Stack, Text, Title, Box, TextInput, Textarea, NumberInput, useMantineTheme, Select } from "@mantine/core"
import { clans } from "~/data/Clans"
import { ClanName } from "~/data/NameSchemas"
import { SheetOptions } from "../utils/constants"
import FocusBorderWrapper from "../components/FocusBorderWrapper"
import { hexToRgba, inputAlpha } from "../utils/style"

type TopDataProps = {
    options: SheetOptions
}

const TopData = ({ options }: TopDataProps) => {
    const { character, primaryColor, mode, setCharacter } = options
    const theme = useMantineTheme()
    const clan = character.clan ? clans[character.clan] : null
    const colorValue = theme.colors[primaryColor]?.[6] || theme.colors.grape[6]
    const isFreeMode = mode === "free"

    return (
        <>
            <Box>
                <Group gap="md" justify="center" align="center" mb="md">
                    {isFreeMode ? (
                        <FocusBorderWrapper colorValue={colorValue} style={{ width: "100%", maxWidth: "600px" }}>
                            <TextInput
                                value={character.name || ""}
                                onChange={(e) =>
                                    setCharacter({
                                        ...character,
                                        name: e.target.value,
                                    })
                                }
                                placeholder="Unnamed Character"
                                color={primaryColor}
                                styles={{
                                    input: {
                                        fontSize: "2rem",
                                        fontWeight: 700,
                                        textAlign: "center",
                                        color: colorValue,
                                        border: "none",
                                        borderBottom: `2px solid transparent`,
                                        borderRadius: 0,
                                        padding: "0.5rem",
                                        backgroundColor: hexToRgba(theme.colors.dark[7], inputAlpha),
                                    },
                                }}
                                style={{ width: "100%" }}
                            />
                        </FocusBorderWrapper>
                    ) : (
                        <Title order={1} c={primaryColor} style={{ margin: 0 }}>
                            {character.name || "Unnamed Character"}
                        </Title>
                    )}
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
                {isFreeMode ? (
                    <FocusBorderWrapper colorValue={colorValue}>
                        <Textarea
                            value={character.description || ""}
                            onChange={(e) =>
                                setCharacter({
                                    ...character,
                                    description: e.target.value,
                                })
                            }
                            placeholder="Character description..."
                            minRows={2}
                            maxRows={4}
                            color={primaryColor}
                            styles={{
                                input: {
                                    textAlign: "center",
                                    color: "var(--mantine-color-dimmed)",
                                    backgroundColor: hexToRgba(theme.colors.dark[7], inputAlpha),
                                },
                            }}
                            mb="lg"
                        />
                    </FocusBorderWrapper>
                ) : character.description ? (
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
                            {isFreeMode || !clan ? (
                                <FocusBorderWrapper colorValue={colorValue}>
                                    <Select
                                        placeholder="Select a clan"
                                        data={Object.keys(clans)
                                            .filter((clanName) => clanName !== "")
                                            .map((clanName) => ({
                                                value: clanName,
                                                label: clanName,
                                            }))}
                                        value={character.clan || null}
                                        onChange={(value) => {
                                            if (value) {
                                                const selectedClan = value as ClanName
                                                setCharacter({
                                                    ...character,
                                                    clan: selectedClan,
                                                    availableDisciplineNames: clans[selectedClan].nativeDisciplines,
                                                })
                                            }
                                        }}
                                        size="sm"
                                        color={primaryColor}
                                        style={{ width: "200px" }}
                                        styles={{
                                            input: {
                                                backgroundColor: hexToRgba(theme.colors.dark[7], inputAlpha),
                                            },
                                        }}
                                    />
                                </FocusBorderWrapper>
                            ) : (
                                <Group gap="xs">
                                    <Text>{clan.name}</Text>
                                </Group>
                            )}
                        </Group>
                        <Group gap="xs">
                            <Text fw={700}>Generation:</Text>
                            {isFreeMode ? (
                                <FocusBorderWrapper colorValue={colorValue}>
                                    <NumberInput
                                        value={character.generation || 0}
                                        onChange={(value) => {
                                            const numValue = typeof value === "string" ? parseInt(value) || 0 : value || 0
                                            setCharacter({
                                                ...character,
                                                generation: Math.max(0, numValue),
                                            })
                                        }}
                                        min={0}
                                        size="sm"
                                        color={primaryColor}
                                        style={{ width: "100px" }}
                                        styles={{
                                            input: {
                                                backgroundColor: hexToRgba(theme.colors.dark[7], inputAlpha),
                                            },
                                        }}
                                    />
                                </FocusBorderWrapper>
                            ) : (
                                <Text>{character.generation || "—"}</Text>
                            )}
                        </Group>
                        <Group gap="xs">
                            <Text fw={700}>Sire:</Text>
                            {isFreeMode ? (
                                <FocusBorderWrapper colorValue={colorValue} style={{ flex: 1 }}>
                                    <TextInput
                                        value={character.sire || ""}
                                        onChange={(e) =>
                                            setCharacter({
                                                ...character,
                                                sire: e.target.value,
                                            })
                                        }
                                        placeholder="—"
                                        size="sm"
                                        color={primaryColor}
                                        style={{ width: "50%" }}
                                        styles={{
                                            input: {
                                                backgroundColor: hexToRgba(theme.colors.dark[7], inputAlpha),
                                            },
                                        }}
                                    />
                                </FocusBorderWrapper>
                            ) : (
                                <Text>{character.sire || "—"}</Text>
                            )}
                        </Group>
                    </Stack>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Stack gap="xs">
                        <Group gap="xs">
                            <Text fw={700}>Ambition:</Text>
                            {isFreeMode ? (
                                <FocusBorderWrapper colorValue={colorValue} style={{ flex: 1 }}>
                                    <TextInput
                                        value={character.ambition || ""}
                                        onChange={(e) =>
                                            setCharacter({
                                                ...character,
                                                ambition: e.target.value,
                                            })
                                        }
                                        placeholder="—"
                                        size="sm"
                                        color={primaryColor}
                                        style={{ width: "100%" }}
                                        styles={{
                                            input: {
                                                backgroundColor: hexToRgba(theme.colors.dark[7], inputAlpha),
                                            },
                                        }}
                                    />
                                </FocusBorderWrapper>
                            ) : (
                                <Text>{character.ambition || "—"}</Text>
                            )}
                        </Group>
                        <Group gap="xs">
                            <Text fw={700}>Desire:</Text>
                            {isFreeMode ? (
                                <FocusBorderWrapper colorValue={colorValue} style={{ flex: 1 }}>
                                    <TextInput
                                        value={character.desire || ""}
                                        onChange={(e) =>
                                            setCharacter({
                                                ...character,
                                                desire: e.target.value,
                                            })
                                        }
                                        placeholder="—"
                                        size="sm"
                                        color={primaryColor}
                                        style={{ width: "100%" }}
                                        styles={{
                                            input: {
                                                backgroundColor: hexToRgba(theme.colors.dark[7], inputAlpha),
                                            },
                                        }}
                                    />
                                </FocusBorderWrapper>
                            ) : (
                                <Text>{character.desire || "—"}</Text>
                            )}
                        </Group>
                        <Group gap="xs">
                            <Text fw={700}>Player:</Text>
                            {isFreeMode ? (
                                <FocusBorderWrapper colorValue={colorValue} style={{ flex: 1 }}>
                                    <TextInput
                                        value={character.player || ""}
                                        onChange={(e) =>
                                            setCharacter({
                                                ...character,
                                                player: e.target.value,
                                            })
                                        }
                                        placeholder="—"
                                        size="sm"
                                        color={primaryColor}
                                        style={{ width: "100%" }}
                                        styles={{
                                            input: {
                                                backgroundColor: hexToRgba(theme.colors.dark[7], inputAlpha),
                                            },
                                        }}
                                    />
                                </FocusBorderWrapper>
                            ) : (
                                <Text>{character.player || "—"}</Text>
                            )}
                        </Group>
                    </Stack>
                </Grid.Col>
            </Grid>
        </>
    )
}

export default TopData
