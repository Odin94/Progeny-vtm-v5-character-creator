import { Box, Button, Center, FileButton, Group, Modal, Paper, ScrollArea, Stack, Text } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { IconChevronRight, IconFilePlus, IconFileUpload, IconUser } from "@tabler/icons-react"
import { useEffect, useState } from "react"
import { Character } from "../data/Character"
import { notDefault } from "../generator/utils"
import AttributesDisplay from "./components/AttributesDisplay"
import BasicsDisplay from "./components/BasicsDisplay"
import DisciplineDisplay from "./components/DisciplinesDisplay"
import MeritsAndFlawsDisplay from "./components/MeritsAndFlawsDisplay"
import SkillDisplay from "./components/SkillsDisplay"
import TouchstoneDisplay from "./components/TouchstoneDisplay"
import { globals } from "../globals"
import { useAuth } from "../hooks/useAuth"
import { useCharacters } from "../hooks/useCharacters"

export type SidebarProps = {
    character: Character
    onLoadFromFile: (file: File | null) => void
    onLoadSavedCharacter: (characterId: string) => Promise<void>
    onCreateCharacter: () => Promise<void>
}

type SidebarCharacterOption = {
    value: string
    label: string
}

const Sidebar = ({ character, onLoadFromFile, onLoadSavedCharacter, onCreateCharacter }: SidebarProps) => {
    const height = globals.viewportHeightPx
    const phoneScreen = globals.isPhoneScreen
    const { isAuthenticated } = useAuth()
    const { data: characters, isLoading: charactersLoading } = useCharacters(isAuthenticated)
    const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(character.id || null)
    const [isLoadingSelectedCharacter, setIsLoadingSelectedCharacter] = useState(false)
    const [switchCharacterModalOpened, setSwitchCharacterModalOpened] = useState(false)

    const characterOptions: SidebarCharacterOption[] = ((characters as Array<{ id: string; name: string; shared?: boolean }>) || [])
        .filter((candidate) => !candidate.shared)
        .map((candidate) => ({
            value: candidate.id,
            label: candidate.name || "Untitled character",
        }))

    const showCharacterSelect = isAuthenticated

    useEffect(() => {
        setSelectedCharacterId(character.id || null)
    }, [character.id])

    const handleSelectCharacter = async (value: string | null) => {
        if (!value || value === character.id) {
            setSelectedCharacterId(value)
            return
        }

        setSelectedCharacterId(value)
        setIsLoadingSelectedCharacter(true)

        try {
            await onLoadSavedCharacter(value)
        } catch (error) {
            setSelectedCharacterId(character.id || null)
            if (!(error instanceof Error && "alreadyNotified" in error && error.alreadyNotified === true)) {
                notifications.show({
                    title: "Error loading character",
                    message: error instanceof Error ? error.message : "Failed to load selected character",
                    color: "red",
                })
            }
        } finally {
            setIsLoadingSelectedCharacter(false)
        }
    }

    const actionButtonStyles = {
        root: {
            minHeight: 42,
            justifyContent: "center",
            borderColor: "rgba(224, 49, 49, 0.4)",
            background: "rgba(224, 49, 49, 0.08)",
            boxShadow: "none",
            transition: "background 120ms ease, border-color 120ms ease, box-shadow 120ms ease, transform 120ms ease",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            fontFamily: "Cinzel, Georgia, serif",
            fontSize: "0.76rem",
            color: "rgba(244, 236, 232, 0.95)",
            "&:hover": {
                borderColor: "rgba(250, 82, 82, 0.85)",
                background: "rgba(224, 49, 49, 0.24)",
                boxShadow: "0 0 0 1px rgba(224, 49, 49, 0.22), 0 0 18px rgba(224, 49, 49, 0.18), 0 10px 24px rgba(224, 49, 49, 0.18)",
                transform: "translateY(-1px) scale(1.01)",
            },
        },
        section: {
            color: "rgba(224, 49, 49, 1)",
        },
        label: {
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
        },
    } as const

    const activeCharacterLabel =
        characterOptions.find((candidate) => candidate.value === selectedCharacterId)?.label ||
        (character.name.trim() ? character.name : "Switch Character")

    return (
        <>
            <Modal
                opened={switchCharacterModalOpened}
                onClose={() => setSwitchCharacterModalOpened(false)}
                title=""
                centered
                overlayProps={{ backgroundOpacity: 0.72, blur: 8 }}
                styles={{
                    content: {
                        border: "1px solid rgba(125, 91, 72, 0.38)",
                        background: "linear-gradient(180deg, rgba(24, 17, 20, 0.98) 0%, rgba(14, 10, 12, 0.98) 100%)",
                        boxShadow: "0 24px 54px rgba(0, 0, 0, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.04)",
                    },
                    body: {
                        padding: phoneScreen ? "1.1rem" : "1.35rem",
                    },
                }}
            >
                <Stack gap="md">
                    <Stack gap={6} align="center">
                        <Text
                            ta="center"
                            style={{
                                fontFamily: "Cinzel, Georgia, serif",
                                fontSize: phoneScreen ? "1.2rem" : "1.35rem",
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                                color: "rgba(244, 236, 232, 0.95)",
                            }}
                        >
                            Switch Character
                        </Text>
                        <Text
                            ta="center"
                            style={{
                                fontFamily: "Inter, Segoe UI, sans-serif",
                                fontSize: "0.9rem",
                                color: "rgba(214, 204, 198, 0.62)",
                            }}
                        >
                            Choose one of your saved characters to load into the generator.
                        </Text>
                    </Stack>

                    <ScrollArea.Autosize mah={phoneScreen ? 320 : 420} type="auto">
                        <Stack gap="sm">
                            <Paper
                                p="sm"
                                withBorder
                                style={{
                                    borderColor: "rgba(125, 91, 72, 0.32)",
                                    background: "linear-gradient(180deg, rgba(30, 21, 24, 0.78) 0%, rgba(18, 13, 16, 0.92) 100%)",
                                }}
                            >
                                <Group justify="space-between" align="center" wrap="nowrap">
                                    <Box style={{ minWidth: 0 }}>
                                        <Text
                                            style={{
                                                fontFamily: "Cinzel, Georgia, serif",
                                                fontSize: "0.92rem",
                                                letterSpacing: "0.06em",
                                                textTransform: "uppercase",
                                                color: "rgba(244, 236, 232, 0.95)",
                                            }}
                                        >
                                            New Character
                                        </Text>
                                        <Text size="xs" c="dimmed">
                                            Start a fresh character at the clan step
                                        </Text>
                                    </Box>
                                    <Button
                                        size="xs"
                                        variant="outline"
                                        color="red"
                                        disabled={isLoadingSelectedCharacter}
                                        onClick={async () => {
                                            try {
                                                setIsLoadingSelectedCharacter(true)
                                                await onCreateCharacter()
                                                setSwitchCharacterModalOpened(false)
                                            } catch (error) {
                                                if (!(error instanceof Error && "alreadyNotified" in error && error.alreadyNotified === true)) {
                                                    notifications.show({
                                                        title: "Error creating character",
                                                        message: error instanceof Error ? error.message : "Failed to create a new character",
                                                        color: "red",
                                                    })
                                                }
                                            } finally {
                                                setIsLoadingSelectedCharacter(false)
                                            }
                                        }}
                                        styles={actionButtonStyles}
                                    >
                                        Create
                                    </Button>
                                </Group>
                            </Paper>
                            {characterOptions.map((option) => {
                                const isActive = option.value === selectedCharacterId

                                return (
                                    <Paper
                                        key={option.value}
                                        p="sm"
                                        withBorder
                                        style={{
                                            borderColor: isActive ? "rgba(224, 49, 49, 0.45)" : "rgba(125, 91, 72, 0.32)",
                                            background: isActive
                                                ? "linear-gradient(180deg, rgba(58, 18, 22, 0.9) 0%, rgba(32, 14, 17, 0.96) 100%)"
                                                : "linear-gradient(180deg, rgba(30, 21, 24, 0.78) 0%, rgba(18, 13, 16, 0.92) 100%)",
                                            boxShadow: isActive ? "0 12px 24px rgba(224, 49, 49, 0.14)" : "none",
                                        }}
                                    >
                                        <Group justify="space-between" align="center" wrap="nowrap">
                                            <Box style={{ minWidth: 0 }}>
                                                <Text
                                                    style={{
                                                        fontFamily: "Cinzel, Georgia, serif",
                                                        fontSize: "0.92rem",
                                                        letterSpacing: "0.06em",
                                                        textTransform: "uppercase",
                                                        color: "rgba(244, 236, 232, 0.95)",
                                                    }}
                                                >
                                                    {option.label}
                                                </Text>
                                                <Text size="xs" c="dimmed">
                                                    {isActive ? "Currently loaded" : "Load this character"}
                                                </Text>
                                            </Box>
                                            <Button
                                                size="xs"
                                                variant={isActive ? "light" : "outline"}
                                                color="red"
                                                disabled={isLoadingSelectedCharacter}
                                                loading={isLoadingSelectedCharacter && option.value === selectedCharacterId}
                                                onClick={async () => {
                                                    await handleSelectCharacter(option.value)
                                                    setSwitchCharacterModalOpened(false)
                                                }}
                                                styles={actionButtonStyles}
                                            >
                                                {isActive ? "Loaded" : "Load"}
                                            </Button>
                                        </Group>
                                    </Paper>
                                )
                            })}
                        </Stack>
                    </ScrollArea.Autosize>
                </Stack>
            </Modal>

            <ScrollArea h={height - 60} type="never">
                <Stack>
                    <Stack gap="xs">
                        <FileButton onChange={onLoadFromFile} accept="application/json">
                            {(props) => (
                                <Button size="sm" variant="outline" leftSection={<IconFileUpload size={16} />} styles={actionButtonStyles} {...props}>
                                    Load From File
                                </Button>
                            )}
                        </FileButton>
                        {showCharacterSelect ? (
                            <Button
                                size="sm"
                                variant="outline"
                                leftSection={characterOptions.length > 0 ? <IconUser size={16} /> : <IconFilePlus size={16} />}
                                rightSection={<IconChevronRight size={14} />}
                                disabled={charactersLoading || isLoadingSelectedCharacter}
                                loading={charactersLoading}
                                justify="space-between"
                                styles={actionButtonStyles}
                                onClick={() => setSwitchCharacterModalOpened(true)}
                            >
                                {activeCharacterLabel}
                            </Button>
                        ) : null}
                    </Stack>
                    {notDefault(character, "clan") ? (
                        <Center>
                            <Text fz="xl">{character.clan}</Text>
                        </Center>
                    ) : null}
                    {notDefault(character, "name") ? <BasicsDisplay character={character} /> : null}
                    {notDefault(character, "attributes") ? <AttributesDisplay attributes={character.attributes} /> : null}
                    {notDefault(character, "skills") ? <SkillDisplay skills={character.skills} /> : null}
                    {notDefault(character, "generation") ? (
                        <Text>
                            <b>Generation:</b> {character.generation}
                        </Text>
                    ) : null}
                    {notDefault(character, "predatorType") ? (
                        <Text>
                            <b>Predator Type:</b> {character.predatorType.name}
                        </Text>
                    ) : null}
                    {notDefault(character, "disciplines") ? (
                        <DisciplineDisplay powers={character.disciplines} rituals={character.rituals} />
                    ) : null}
                    {notDefault(character, "touchstones") ? <TouchstoneDisplay touchstones={character.touchstones} /> : null}
                    {notDefault(character, "merits") || notDefault(character, "flaws") ? (
                        <MeritsAndFlawsDisplay merits={character.merits} flaws={character.flaws} />
                    ) : null}
                </Stack>
            </ScrollArea>
        </>
    )
}

export default Sidebar
