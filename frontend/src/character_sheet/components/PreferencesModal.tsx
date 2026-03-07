import { Box, ColorSwatch, Group, SimpleGrid, Stack, Text, Tooltip, UnstyledButton, useMantineTheme } from "@mantine/core"
import { IconCheck } from "@tabler/icons-react"
import { type UserPreferences, ALLOWED_COLORS, BACKGROUND_IMAGES } from "../utils/preferences"

type PreferencesContentProps = {
    preferences: UserPreferences
    onUpdate: (partial: Partial<UserPreferences>) => void
    primaryColor: string
}

const PreferencesContent = ({ preferences, onUpdate, primaryColor }: PreferencesContentProps) => {
    const theme = useMantineTheme()

    return (
        <Stack gap="xl">
            <Stack gap="xs">
                <Text fw={600} size="sm">
                    Color theme
                </Text>
                <Text size="xs" c="dimmed">
                    Override the clan-based accent color. Select "Default" to use your character's clan color.
                </Text>
                <SimpleGrid cols={7} spacing="sm" mt="xs">
                    <Tooltip label="Default (clan)" withArrow>
                        <UnstyledButton
                            onClick={() => onUpdate({ colorTheme: null })}
                            style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                            <Box
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: "50%",
                                    background: "linear-gradient(135deg, #e63946 0%, #457b9d 50%, #2a9d8f 100%)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    boxShadow: preferences.colorTheme === null
                                        ? `0 0 0 2.5px ${theme.white}`
                                        : "none",
                                    cursor: "pointer",
                                    flexShrink: 0,
                                }}
                            >
                                {preferences.colorTheme === null ? (
                                    <IconCheck size={14} color="white" style={{ filter: "drop-shadow(0 0 2px rgba(0,0,0,0.8))" }} />
                                ) : null}
                            </Box>
                        </UnstyledButton>
                    </Tooltip>

                    {ALLOWED_COLORS.map(({ value, label }) => {
                        const isSelected = preferences.colorTheme === value
                        const colorValue = theme.colors[value]?.[6] ?? value
                        return (
                            <Tooltip key={value} label={label} withArrow>
                                <UnstyledButton
                                    onClick={() => onUpdate({ colorTheme: value })}
                                    style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
                                >
                                    <ColorSwatch
                                        color={colorValue}
                                        size={32}
                                        style={{
                                            cursor: "pointer",
                                            boxShadow: isSelected ? `0 0 0 2.5px ${theme.white}` : "none",
                                        }}
                                    >
                                        {isSelected ? (
                                            <IconCheck size={14} color="white" style={{ filter: "drop-shadow(0 0 2px rgba(0,0,0,0.8))" }} />
                                        ) : null}
                                    </ColorSwatch>
                                </UnstyledButton>
                            </Tooltip>
                        )
                    })}
                </SimpleGrid>
            </Stack>

            <Stack gap="xs">
                <Text fw={600} size="sm">
                    Background image
                </Text>
                <Text size="xs" c="dimmed">
                    Choose the background image displayed behind the character sheet.
                </Text>

                {BACKGROUND_IMAGES.length === 1 ? (
                    <Text size="xs" c="dimmed" fs="italic">
                        No additional background images are available yet. Check back later!
                    </Text>
                ) : (
                    <SimpleGrid cols={3} spacing="xs" mt="xs">
                        <Tooltip label="Default" withArrow>
                            <UnstyledButton
                                onClick={() => onUpdate({ backgroundImage: null })}
                                style={{
                                    borderRadius: 8,
                                    overflow: "hidden",
                                    border: preferences.backgroundImage === null
                                        ? `3px solid ${theme.colors[primaryColor]?.[6] ?? theme.white}`
                                        : "3px solid transparent",
                                    position: "relative",
                                    aspectRatio: "16/9",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    backgroundColor: theme.colors.dark[6],
                                }}
                            >
                                <Text size="xs" ta="center" c="dimmed">Default</Text>
                                {preferences.backgroundImage === null ? (
                                    <Box
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            backgroundColor: "rgba(0,0,0,0.4)",
                                        }}
                                    >
                                        <IconCheck size={20} color="white" />
                                    </Box>
                                ) : null}
                            </UnstyledButton>
                        </Tooltip>

                        {BACKGROUND_IMAGES.filter((bg) => bg.id !== "default").map((bg) => {
                            const isSelected = preferences.backgroundImage === bg.id
                            return (
                                <Tooltip key={bg.id} label={bg.label} withArrow>
                                    <UnstyledButton
                                        onClick={() => onUpdate({ backgroundImage: bg.id })}
                                        style={{
                                            borderRadius: 8,
                                            overflow: "hidden",
                                            border: isSelected
                                                ? `3px solid ${theme.colors[primaryColor]?.[6] ?? theme.white}`
                                                : "3px solid transparent",
                                            position: "relative",
                                            aspectRatio: "16/9",
                                        }}
                                    >
                                        <img
                                            src={bg.src}
                                            alt={bg.label}
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                                display: "block",
                                            }}
                                        />
                                        {isSelected ? (
                                            <Box
                                                style={{
                                                    position: "absolute",
                                                    inset: 0,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    backgroundColor: "rgba(0,0,0,0.4)",
                                                }}
                                            >
                                                <IconCheck size={20} color="white" />
                                            </Box>
                                        ) : null}
                                    </UnstyledButton>
                                </Tooltip>
                            )
                        })}
                    </SimpleGrid>
                )}
            </Stack>

            <Group justify="flex-end">
                <Text size="xs" c="dimmed">
                    Changes are saved automatically.
                </Text>
            </Group>
        </Stack>
    )
}

export default PreferencesContent
