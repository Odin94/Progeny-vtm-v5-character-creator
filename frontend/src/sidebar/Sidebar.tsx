import { Box, Button, FileButton, Modal, ScrollArea, Stack, Text } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import {
    IconChevronRight,
    IconDownload,
    IconFilePlus,
    IconFileUpload,
    IconPlus,
    IconUser
} from "@tabler/icons-react"
import { useEffect, useState, type CSSProperties } from "react"
import { Panel, useContextMenu } from "~/components/ui"
import { getPrimaryColor } from "~/character_sheet/utils/style"
import { clans } from "../data/Clans"
import classes from "./components/Dossier.module.css"
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

const Sidebar = ({
    character,
    onLoadFromFile,
    onLoadSavedCharacter,
    onCreateCharacter
}: SidebarProps) => {
    const phoneScreen = globals.isPhoneScreen
    const { isAuthenticated } = useAuth()
    const { data: characters, isLoading: charactersLoading } = useCharacters(isAuthenticated)
    const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(
        character.id || null
    )
    const [isLoadingSelectedCharacter, setIsLoadingSelectedCharacter] = useState(false)
    const [switchCharacterModalOpened, setSwitchCharacterModalOpened] = useState(false)

    const characterOptions: SidebarCharacterOption[] = (
        (characters as Array<{ id: string; name: string; shared?: boolean }>) || []
    )
        .filter((candidate) => !candidate.shared)
        .map((candidate) => ({
            value: candidate.id,
            label: candidate.name || "Untitled character"
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
            if (
                !(
                    error instanceof Error &&
                    "alreadyNotified" in error &&
                    error.alreadyNotified === true
                )
            ) {
                notifications.show({
                    title: "Error loading character",
                    message:
                        error instanceof Error
                            ? error.message
                            : "Failed to load selected character",
                    color: "red"
                })
            }
        } finally {
            setIsLoadingSelectedCharacter(false)
        }
    }

    const activeCharacterLabel =
        characterOptions.find((candidate) => candidate.value === selectedCharacterId)?.label ||
        (character.name.trim() ? character.name : "Switch Character")

    const contextMenu = useContextMenu()

    const createCharacter = async () => {
        try {
            setIsLoadingSelectedCharacter(true)
            await onCreateCharacter()
            setSwitchCharacterModalOpened(false)
        } catch (error) {
            if (
                !(
                    error instanceof Error &&
                    "alreadyNotified" in error &&
                    error.alreadyNotified === true
                )
            ) {
                notifications.show({
                    title: "Error creating character",
                    message:
                        error instanceof Error ? error.message : "Failed to create a new character",
                    color: "red"
                })
            }
        } finally {
            setIsLoadingSelectedCharacter(false)
        }
    }

    const loadCharacter = async (characterId: string) => {
        await handleSelectCharacter(characterId)
        setSwitchCharacterModalOpened(false)
    }

    const clanName = character.homebrewClan?.name || character.clan
    const officialClan = character.clan && !character.homebrewClan ? character.clan : null
    const clanColor = officialClan
        ? `var(--mantine-color-${getPrimaryColor(officialClan)}-${getPrimaryColor(officialClan) === "gray" ? 3 : 5})`
        : "var(--mantine-color-grape-5)"
    const hasName = character.name.trim() !== ""

    return (
        <>
            <Modal
                opened={switchCharacterModalOpened}
                onClose={() => setSwitchCharacterModalOpened(false)}
                title="Switch Character"
                centered
            >
                <Stack gap="md">
                    <Text ta="center" c="dimmed" ff="var(--pg-font-lore)" fz="md">
                        Choose one of your saved characters to load into the generator.
                    </Text>

                    <ScrollArea.Autosize mah={phoneScreen ? 320 : 420} type="auto">
                        <Stack gap="xs">
                            <Panel tone="raised" p="sm">
                                <div className={classes.characterRow}>
                                    <Box style={{ minWidth: 0 }}>
                                        <div className={classes.characterName}>New Character</div>
                                        <div className={classes.characterMeta}>
                                            Start a fresh character at the clan step
                                        </div>
                                    </Box>
                                    <Button
                                        size="xs"
                                        variant="default"
                                        leftSection={<IconPlus size={14} />}
                                        disabled={isLoadingSelectedCharacter}
                                        onClick={createCharacter}
                                    >
                                        Create
                                    </Button>
                                </div>
                            </Panel>
                            {characterOptions.map((option) => {
                                const isActive = option.value === selectedCharacterId

                                return (
                                    <Panel
                                        key={option.value}
                                        tone="raised"
                                        p="sm"
                                        selected={isActive}
                                        onContextMenu={(event: React.MouseEvent) =>
                                            contextMenu.open(event, [
                                                {
                                                    key: "load",
                                                    label: isActive ? "Loaded" : "Load",
                                                    icon: <IconDownload size={14} />,
                                                    disabled:
                                                        isActive || isLoadingSelectedCharacter,
                                                    onClick: () => loadCharacter(option.value)
                                                }
                                            ])
                                        }
                                    >
                                        <div className={classes.characterRow}>
                                            <Box style={{ minWidth: 0 }}>
                                                <div className={classes.characterName}>
                                                    {option.label}
                                                </div>
                                                <div className={classes.characterMeta}>
                                                    {isActive
                                                        ? "Currently loaded"
                                                        : "Load this character"}
                                                </div>
                                            </Box>
                                            <Button
                                                size="xs"
                                                variant={isActive ? "light" : "default"}
                                                color={isActive ? "grape" : undefined}
                                                disabled={isLoadingSelectedCharacter}
                                                loading={
                                                    isLoadingSelectedCharacter &&
                                                    option.value === selectedCharacterId
                                                }
                                                onClick={() => loadCharacter(option.value)}
                                            >
                                                {isActive ? "Loaded" : "Load"}
                                            </Button>
                                        </div>
                                    </Panel>
                                )
                            })}
                        </Stack>
                    </ScrollArea.Autosize>
                </Stack>
                {contextMenu.menu}
            </Modal>

            <div className={classes.root}>
                <div className={classes.actions}>
                    <FileButton onChange={onLoadFromFile} accept="application/json">
                        {(props) => (
                            <Button
                                size="sm"
                                variant="default"
                                fullWidth
                                leftSection={<IconFileUpload size={16} />}
                                {...props}
                            >
                                Load From File
                            </Button>
                        )}
                    </FileButton>
                    {showCharacterSelect ? (
                        <Button
                            size="sm"
                            variant="default"
                            fullWidth
                            leftSection={
                                characterOptions.length > 0 ? (
                                    <IconUser size={16} />
                                ) : (
                                    <IconFilePlus size={16} />
                                )
                            }
                            rightSection={<IconChevronRight size={14} />}
                            disabled={charactersLoading || isLoadingSelectedCharacter}
                            loading={charactersLoading}
                            justify="space-between"
                            styles={{
                                label: {
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap"
                                }
                            }}
                            onClick={() => setSwitchCharacterModalOpened(true)}
                        >
                            {activeCharacterLabel}
                        </Button>
                    ) : null}
                </div>

                <ScrollArea className={classes.scroll} type="hover" scrollbarSize={8}>
                    <div className={classes.dossier}>
                        {notDefault(character, "clan") || clanName ? (
                            <div
                                className={classes.identity}
                                style={{ "--clan": clanColor } as CSSProperties}
                            >
                                {officialClan ? (
                                    <span className={classes.sigilWrap}>
                                        <span
                                            className={classes.sigil}
                                            style={
                                                {
                                                    "--sigil": `url("${clans[officialClan].logo}")`
                                                } as CSSProperties
                                            }
                                            aria-hidden="true"
                                        />
                                    </span>
                                ) : null}
                                <span
                                    className={classes.name}
                                    data-placeholder={!hasName || undefined}
                                >
                                    {hasName ? character.name : "Unnamed"}
                                </span>
                                <span className={classes.lineage}>
                                    <b>{clanName}</b>
                                    {notDefault(character, "generation")
                                        ? ` · ${character.generation}th gen.`
                                        : null}
                                    {notDefault(character, "predatorType")
                                        ? ` · ${character.predatorType.name}`
                                        : null}
                                </span>
                            </div>
                        ) : (
                            <Text className={classes.muted} ta="center" py="lg">
                                Pick a clan to begin.
                            </Text>
                        )}
                        {notDefault(character, "name") ? (
                            <BasicsDisplay character={character} />
                        ) : null}
                        {notDefault(character, "attributes") ? (
                            <AttributesDisplay attributes={character.attributes} />
                        ) : null}
                        {notDefault(character, "skills") ? (
                            <SkillDisplay skills={character.skills} />
                        ) : null}
                        {notDefault(character, "disciplines") ? (
                            <DisciplineDisplay
                                powers={character.disciplines}
                                rituals={character.rituals}
                                ceremonies={character.ceremonies}
                            />
                        ) : null}
                        {notDefault(character, "touchstones") ? (
                            <TouchstoneDisplay touchstones={character.touchstones} />
                        ) : null}
                        {notDefault(character, "merits") || notDefault(character, "flaws") ? (
                            <MeritsAndFlawsDisplay
                                merits={character.merits}
                                flaws={character.flaws}
                            />
                        ) : null}
                    </div>
                </ScrollArea>
            </div>
        </>
    )
}

export default Sidebar
