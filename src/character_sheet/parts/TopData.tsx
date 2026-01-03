import { Grid, Group, Stack, Text, Title, Box, TextInput, Textarea, NumberInput, useMantineTheme, Select } from "@mantine/core"
import { clans } from "~/data/Clans"
import { ClanName, PredatorTypeName } from "~/data/NameSchemas"
import { PredatorTypes } from "~/data/PredatorType"
import { SheetOptions } from "../CharacterSheet"
import FocusBorderWrapper from "../components/FocusBorderWrapper"
import { hexToRgba, inputAlpha } from "../utils/style"
import { useDebouncedUncontrolledStringField, useDebouncedUncontrolledNumberField } from "../utils/useDebouncedUncontrolledField"

type TopDataProps = {
    options: SheetOptions
}

const TopData = ({ options }: TopDataProps) => {
    const { character, primaryColor, mode, setCharacter } = options
    const theme = useMantineTheme()
    const clan = character.clan ? clans[character.clan] : null
    const colorValue = theme.colors[primaryColor]?.[6] || theme.colors.grape[6]
    const isFreeMode = mode === "free"

    const nameField = useDebouncedUncontrolledStringField({ character, setCharacter, field: "name" })
    const descriptionField = useDebouncedUncontrolledStringField({ character, setCharacter, field: "description" })
    const ambitionField = useDebouncedUncontrolledStringField({ character, setCharacter, field: "ambition" })
    const desireField = useDebouncedUncontrolledStringField({ character, setCharacter, field: "desire" })
    const playerField = useDebouncedUncontrolledStringField({ character, setCharacter, field: "player" })
    const generationField = useDebouncedUncontrolledNumberField({ character, setCharacter, field: "generation" })
    const sireField = useDebouncedUncontrolledStringField({ character, setCharacter, field: "sire" })

    return (
        <>
            <Box>
                <Group gap="md" justify="center" align="center" mb="md">
                    {isFreeMode ? (
                        <FocusBorderWrapper colorValue={colorValue} style={{ width: "100%", maxWidth: "600px" }}>
                            <TextInput
                                key={nameField.key}
                                defaultValue={nameField.defaultValue}
                                onChange={(e) => nameField.onChange(e.target.value)}
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
                            key={descriptionField.key}
                            defaultValue={descriptionField.defaultValue}
                            onChange={(e) => descriptionField.onChange(e.target.value)}
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
                <Grid.Col span={{ base: 12, md: 4 }}>
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
                            <Text fw={700}>Predator Type:</Text>
                            {isFreeMode ? (
                                <FocusBorderWrapper colorValue={colorValue}>
                                    <Select
                                        placeholder="Select a predator type"
                                        data={Object.keys(PredatorTypes)
                                            .filter((predatorTypeName) => predatorTypeName !== "")
                                            .map((predatorTypeName) => ({
                                                value: predatorTypeName,
                                                label: predatorTypeName,
                                            }))}
                                        value={character.predatorType.name || null}
                                        onChange={(value) => {
                                            if (value) {
                                                const selectedPredatorType = value as PredatorTypeName
                                                setCharacter({
                                                    ...character,
                                                    predatorType: {
                                                        ...character.predatorType,
                                                        name: selectedPredatorType,
                                                    },
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
                                <Text>{character.predatorType.name || "—"}</Text>
                            )}
                        </Group>
                    </Stack>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                    <Stack gap="xs">
                        <Group gap="xs">
                            <Text fw={700}>Ambition:</Text>
                            {isFreeMode ? (
                                <FocusBorderWrapper colorValue={colorValue} style={{ flex: 1 }}>
                                    <TextInput
                                        key={ambitionField.key}
                                        defaultValue={ambitionField.defaultValue}
                                        onChange={(e) => ambitionField.onChange(e.target.value)}
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
                                        key={desireField.key}
                                        defaultValue={desireField.defaultValue}
                                        onChange={(e) => desireField.onChange(e.target.value)}
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
                                        key={playerField.key}
                                        defaultValue={playerField.defaultValue}
                                        onChange={(e) => playerField.onChange(e.target.value)}
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
                <Grid.Col span={{ base: 12, md: 4 }}>
                    <Stack gap="xs">
                        <Group gap="xs">
                            <Text fw={700}>Generation:</Text>
                            {isFreeMode ? (
                                <FocusBorderWrapper colorValue={colorValue}>
                                    <NumberInput
                                        key={generationField.key}
                                        defaultValue={generationField.defaultValue}
                                        onChange={(value) => {
                                            const numValue = typeof value === "string" ? parseInt(value) || 0 : value || 0
                                            generationField.onChange(numValue)
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
                                        key={sireField.key}
                                        defaultValue={sireField.defaultValue}
                                        onChange={(e) => sireField.onChange(e.target.value)}
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
            </Grid>
        </>
    )
}

export default TopData
