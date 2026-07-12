import {
    ActionIcon,
    Box,
    Container,
    createTheme,
    Divider,
    MantineProvider,
    Paper,
    SegmentedControl,
    Stack,
    Tooltip
} from "@mantine/core"
import { useLocalStorage } from "@mantine/hooks"
import { useCallback, useMemo } from "react"
import { Character, getEmptyCharacter } from "~/data/Character"
import { IconDice } from "@tabler/icons-react"
import posthog from "posthog-js"
import { getPrimaryColor } from "./utils/style"
import { type UserPreferences, getBackgroundSrc } from "./utils/preferences"
import { useUserPreferences } from "~/hooks/useUserPreferences"
import { useAutosaveCharacterVitals } from "~/hooks/useAutosaveCharacterVitals"
import type { SetCharacter } from "~/hooks/useCharacterLocalStorage"
import Attributes from "./sections/Attributes"
import BottomData from "./sections/BottomData"
import Disciplines from "./sections/Disciplines"
import MeritsAndFlaws from "./sections/MeritsAndFlaws"
import Skills from "./sections/Skills"
import TheBlood from "./sections/TheBlood"
import TopData from "./sections/TopData"
import Touchstones from "./sections/Touchstones"
import defaultBackgroundImage from "./resources/backgrounds/pexels-skyriusmarketing-2129796.jpg"
import CharacterSheetMenu from "./components/CharacterSheetMenu"
import DiceRollModal from "./components/diceRollModal/DiceRollModal"
import ChatWindow from "./components/ChatWindow"
import { useDiceRollModalStore } from "./stores/diceRollModalStore"
import { hasSheetMeritsAndFlaws } from "./utils/meritsAndFlaws"
import { useAuth } from "~/hooks/useAuth"
import { useCharacters } from "~/hooks/useCharacters"

export type CharacterSheetMode = "play" | "xp" | "free"

export type SheetOptions = {
    mode: CharacterSheetMode
    primaryColor: string
    character: Character
    setCharacter: SetCharacter
    canEdit: boolean
    editDisabledReason?: string
    preferences: UserPreferences
    onUpdatePreferences: (partial: Partial<UserPreferences>) => void
}

export const CHARACTER_OWNERSHIP_EDIT_REASON = "You can only edit your own characters"

type CharacterSheetProps = {
    character: Character
    setCharacter: SetCharacter
}

const CharacterSheet = ({ character, setCharacter }: CharacterSheetProps) => {
    const isEmptyCharacter = useMemo(() => {
        const emptyChar = getEmptyCharacter()
        return (
            character.name === emptyChar.name &&
            character.clan === emptyChar.clan &&
            character.sire === emptyChar.sire &&
            character.disciplines.length === 0 &&
            character.merits.length === 0 &&
            character.flaws.length === 0
        )
    }, [character])

    const [mode, setMode] = useLocalStorage<CharacterSheetMode>({
        key: "characterSheetMode",
        defaultValue: isEmptyCharacter ? "free" : "play",
        getInitialValueInEffect: false
    })
    const { isAuthenticated, isLoading: authLoading } = useAuth()
    const { data: userCharacters, isLoading: charactersLoading } = useCharacters(
        isAuthenticated && !!character.id
    )
    const loadedCharacter = (
        (userCharacters as Array<{ id: string; shared?: boolean }> | undefined) ?? []
    ).find((candidate) => candidate.id === character.id)
    const ownershipLoading =
        !!character.id && (authLoading || (isAuthenticated && charactersLoading))
    const canEdit =
        !character.id ||
        (!authLoading && !isAuthenticated) ||
        (!ownershipLoading && !!loadedCharacter && !loadedCharacter.shared)
    const editDisabledReason = canEdit ? undefined : CHARACTER_OWNERSHIP_EDIT_REASON
    const editableSetCharacter = useCallback<SetCharacter>(
        (update) => {
            if (canEdit) {
                setCharacter(update)
            }
        },
        [canEdit, setCharacter]
    )
    // Keep the selected mode while ownership is loading so editable characters do not
    // briefly render in Play mode before switching to their saved/default mode.
    // Editing remains disabled through canEdit until ownership has been confirmed.
    const effectiveMode = canEdit || ownershipLoading ? mode : "play"
    const openDiceModal = useDiceRollModalStore((state) => state.open)
    const diceModalOpened = useDiceRollModalStore((state) => state.opened)
    const { preferences, updatePreferences } = useUserPreferences()
    const primaryColor = preferences.colorTheme ?? getPrimaryColor(character.clan)
    const sheetTheme = useMemo(() => createTheme({ primaryColor }), [primaryColor])
    useAutosaveCharacterVitals(character, setCharacter, canEdit)

    const sheetOptions: SheetOptions = useMemo(
        () => ({
            mode: effectiveMode,
            primaryColor,
            character,
            setCharacter: editableSetCharacter,
            canEdit,
            editDisabledReason,
            preferences,
            onUpdatePreferences: updatePreferences
        }),
        [
            effectiveMode,
            primaryColor,
            character,
            editableSetCharacter,
            canEdit,
            editDisabledReason,
            preferences,
            updatePreferences
        ]
    )
    const characterMenuOptions = useMemo(
        () => ({ ...sheetOptions, setCharacter }),
        [setCharacter, sheetOptions]
    )

    return (
        <MantineProvider theme={sheetTheme} forceColorScheme="dark">
            <Box
                style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundImage: `url(${getBackgroundSrc(preferences.backgroundImage) ?? defaultBackgroundImage})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundAttachment: "fixed",
                    zIndex: -1
                }}
            />
            <Box
                style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "rgba(0, 0, 0, 0.4)",
                    zIndex: -1
                }}
            />
            <Box
                style={{
                    minHeight: "100vh",
                    width: "100%",
                    boxSizing: "border-box",
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "center",
                    padding: "calc(2rem + 52px) 0 2rem",
                    position: "relative"
                }}
            >
                <Container
                    size="xl"
                    style={{
                        width: "100%",
                        position: "relative"
                    }}
                >
                    <Box
                        style={{
                            backgroundColor: "rgba(255, 255, 255, 0.1)",
                            backdropFilter: "blur(7px)",
                            borderRadius: "8px",
                            padding: "1.5rem",
                            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                            position: "relative"
                        }}
                    >
                        <Box
                            style={{
                                position: "absolute",
                                top: "1rem",
                                right: "1rem",
                                zIndex: 10,
                                display: "flex",
                                flexDirection: "column",
                                gap: "0.5rem",
                                alignItems: "flex-end"
                            }}
                        >
                            <ActionIcon
                                size="xl"
                                variant="light"
                                color={primaryColor}
                                radius="xl"
                                onClick={() => {
                                    openDiceModal()
                                    try {
                                        posthog.capture("dice-modal-opened", {
                                            mode
                                        })
                                    } catch (error) {
                                        console.warn(
                                            "PostHog dice-modal-opened tracking failed:",
                                            error
                                        )
                                    }
                                }}
                                style={{
                                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)"
                                }}
                            >
                                <IconDice size={24} />
                            </ActionIcon>
                            <Tooltip label={editDisabledReason} disabled={canEdit} withArrow>
                                <span>
                                    <SegmentedControl
                                        value={effectiveMode}
                                        onChange={(value) => setMode(value as CharacterSheetMode)}
                                        data={[
                                            {
                                                label: (
                                                    <Tooltip
                                                        label="Lock editing, except for hunger, health etc."
                                                        position="left"
                                                    >
                                                        <span>Play</span>
                                                    </Tooltip>
                                                ),
                                                value: "play"
                                            },
                                            {
                                                label: (
                                                    <Tooltip
                                                        label="Spend XP to upgrade your character"
                                                        position="left"
                                                    >
                                                        <span>XP</span>
                                                    </Tooltip>
                                                ),
                                                value: "xp"
                                            },
                                            {
                                                label: (
                                                    <Tooltip
                                                        label="Free edit, no XP costs"
                                                        position="left"
                                                    >
                                                        <span>Free</span>
                                                    </Tooltip>
                                                ),
                                                value: "free"
                                            }
                                        ]}
                                        color={primaryColor}
                                        orientation="vertical"
                                        disabled={!canEdit}
                                    />
                                </span>
                            </Tooltip>
                        </Box>

                        <Paper p="lg" radius="md" style={{ backgroundColor: "transparent" }}>
                            <Stack gap="lg">
                                <TopData options={sheetOptions} />

                                <Divider />

                                <Attributes options={sheetOptions} />

                                <Divider />

                                <Skills options={sheetOptions} />

                                {character.disciplines.length > 0 ||
                                character.rituals.length > 0 ||
                                character.ceremonies.length > 0 ? (
                                    <Divider />
                                ) : null}

                                <Disciplines options={sheetOptions} />

                                <Divider />

                                <BottomData options={sheetOptions} />

                                <Divider />

                                <TheBlood options={sheetOptions} />

                                {character.touchstones.length > 0 ? <Divider /> : null}

                                <Touchstones options={sheetOptions} />

                                {hasSheetMeritsAndFlaws(character) ? <Divider /> : null}

                                <MeritsAndFlaws options={sheetOptions} />
                            </Stack>
                        </Paper>
                    </Box>
                </Container>
            </Box>
            <CharacterSheetMenu options={characterMenuOptions} />
            <ChatWindow options={sheetOptions} />
            {diceModalOpened ? (
                <DiceRollModal
                    primaryColor={primaryColor}
                    character={character}
                    setCharacter={editableSetCharacter}
                    editDisabledReason={editDisabledReason}
                />
            ) : null}
        </MantineProvider>
    )
}

export default CharacterSheet
