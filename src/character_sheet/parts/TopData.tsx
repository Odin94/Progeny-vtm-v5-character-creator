import { Grid, Group, Stack, Text, Title, Box, TextInput, Textarea, NumberInput, useMantineTheme } from "@mantine/core"
import { ReactNode } from "react"
import { clans } from "~/data/Clans"
import { SheetOptions } from "../constants"

type TopDataProps = {
    options: SheetOptions
}

type FocusBorderWrapperProps = {
    children: ReactNode
    colorValue: string
    style?: React.CSSProperties
}

const FocusBorderWrapper = ({ children, colorValue, style }: FocusBorderWrapperProps) => {
    return (
        <Box
            style={style}
            onFocusCapture={(e) => {
                const input = e.currentTarget.querySelector("input, textarea") as HTMLElement | null
                if (input) {
                    input.style.setProperty("--input-bd", colorValue)
                }
            }}
            onBlurCapture={(e) => {
                const input = e.currentTarget.querySelector("input, textarea") as HTMLElement | null
                if (input) {
                    input.style.setProperty("--input-bd", "transparent")
                }
            }}
        >
            {children}
        </Box>
    )
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
                            {clan ? (
                                <Group gap="xs">
                                    <Text>{clan.name}</Text>
                                </Group>
                            ) : (
                                <Text c="dimmed">—</Text>
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
