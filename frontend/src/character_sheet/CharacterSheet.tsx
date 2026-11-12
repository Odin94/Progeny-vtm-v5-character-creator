import { ActionIcon, createTheme, MantineProvider, SegmentedControl, Tooltip } from "@mantine/core"
import { useLocalStorage } from "@mantine/hooks"
import { useCallback, useEffect, useMemo } from "react"
import { Character, getEmptyCharacter } from "~/data/Character"
import { IconDice } from "@tabler/icons-react"
import posthog from "posthog-js"
import { getPrimaryColor } from "./utils/style"
import { type UserPreferences, getBackgroundSrc } from "./utils/preferences"
import { useUserPreferences } from "~/hooks/useUserPreferences"
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
import CharacterNotesControl from "./components/CharacterNotesControl"
import { useDiceRollModalStore } from "./stores/diceRollModalStore"
import { useRollHistoryStore } from "./stores/rollHistoryStore"
import { hasSheetMeritsAndFlaws } from "./utils/meritsAndFlaws"
import { useAuth } from "~/hooks/useAuth"
import { useVampireDiceFeatureFlag } from "~/hooks/useVampireDiceFeatureFlag"
import QuickRollHotkeys from "./components/diceRollModal/threeDice/QuickRollHotkeys"
import { useCharacter, useCharacters } from "~/hooks/useCharacters"
import SheetSection from "./components/SheetSection"
import classes from "./sheet.module.css"

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
            Object.values(character.disciplineLevels).every((level) => level === 0) &&
            character.merits.length === 0 &&
            character.flaws.length === 0
        )
    }, [character])

    // The roll history is per character: loading another character starts a fresh list.
    useEffect(() => {
        useRollHistoryStore.getState().bindToCharacter(character.id || "local")
    }, [character.id])

    const [mode, setMode] = useLocalStorage<CharacterSheetMode>({
        key: "characterSheetMode",
        defaultValue: isEmptyCharacter ? "free" : "play",
        getInitialValueInEffect: false
    })
    const { user, isAuthenticated, isLoading: authLoading } = useAuth()
    const hasCrystalDice = useVampireDiceFeatureFlag(user?.id)
    const [useLegacyDice, setUseLegacyDice] = useLocalStorage<boolean>({
        key: "use-legacy-dice",
        defaultValue: false,
        getInitialValueInEffect: false
    })
    const use3dDice = !useLegacyDice
    const { data: userCharacters, isLoading: charactersLoading } = useCharacters(
        isAuthenticated && !!character.id
    )
    const loadedCharacter = (
        (userCharacters as Array<{ id: string; shared?: boolean }> | undefined) ?? []
    ).find((candidate) => candidate.id === character.id)
    const { data: authoritativeCharacter, isLoading: ownershipQueryLoading } = useCharacter(
        character.id || null,
        isAuthenticated && !!character.id && !loadedCharacter
    )
    const ownershipLoading =
        !!character.id &&
        (authLoading || (isAuthenticated && (charactersLoading || ownershipQueryLoading)))
    const canEdit =
        !character.id ||
        (!authLoading && !isAuthenticated) ||
        (!ownershipLoading &&
            // Validation or transport failures must not make the local draft read-only.
            // The backend remains authoritative for writes; saving an unverified draft
            // offers an owned copy instead of updating the original.
            (loadedCharacter ? !loadedCharacter.shared : authoritativeCharacter?.canEdit !== false))
    const editDisabledReason = canEdit
        ? undefined
        : ownershipLoading
          ? "Checking character ownership…"
          : loadedCharacter?.shared || authoritativeCharacter?.canEdit === false
            ? CHARACTER_OWNERSHIP_EDIT_REASON
            : "Unable to verify character ownership. Retry loading your characters, or save a copy from your account."
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
    const { preferences, updatePreferences } = useUserPreferences()
    const primaryColor = preferences.colorTheme ?? getPrimaryColor(character.clan)
    const sheetTheme = useMemo(() => createTheme({ primaryColor }), [primaryColor])
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

    const openDiceRoller = () => {
        openDiceModal()
        try {
            posthog.capture("dice-modal-opened", {
                mode
            })
        } catch (error) {
            console.warn("PostHog dice-modal-opened tracking failed:", error)
        }
    }
    const hasDisciplineContent =
        character.disciplines.length > 0 ||
        Object.values(character.disciplineLevels).some((level) => level > 0) ||
        character.rituals.length > 0 ||
        character.ceremonies.length > 0

    // Deduplication would skip `--mantine-primary-color-*` when the clan color equals Mantine's
    // default primary (blue: Ventrue), leaving the sheet in the app's violet.
    return (
        <MantineProvider theme={sheetTheme} forceColorScheme="dark" deduplicateCssVariables={false}>
            <div
                className={classes.backdrop}
                style={{
                    backgroundImage: `url(${getBackgroundSrc(preferences.backgroundImage) ?? defaultBackgroundImage})`
                }}
                aria-hidden="true"
            />
            <div className={classes.page}>
                <article className={classes.sheet}>
                    <div className={classes.sheetContent}>
                        <div className={classes.toolbar}>
                            <div className={classes.toolbarPill}>
                                <Tooltip label={editDisabledReason} disabled={canEdit} withArrow>
                                    <span className={classes.modeControl}>
                                        <SegmentedControl
                                            value={effectiveMode}
                                            onChange={(value) => {
                                                const nextMode = value as CharacterSheetMode
                                                try {
                                                    posthog.capture("sheet-mode-switch", {
                                                        from: effectiveMode,
                                                        to: nextMode
                                                    })
                                                } catch (error) {
                                                    console.warn(
                                                        "PostHog sheet-mode-switch tracking failed:",
                                                        error
                                                    )
                                                }
                                                setMode(nextMode)
                                            }}
                                            data={[
                                                {
                                                    label: (
                                                        <Tooltip
                                                            label="Lock editing, except for hunger, health etc."
                                                            position="bottom"
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
                                                            position="bottom"
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
                                                            position="bottom"
                                                        >
                                                            <span>Free</span>
                                                        </Tooltip>
                                                    ),
                                                    value: "free"
                                                }
                                            ]}
                                            color={primaryColor}
                                            size="sm"
                                            disabled={!canEdit}
                                        />
                                    </span>
                                </Tooltip>
                                <span className={classes.toolbarDivider} aria-hidden="true" />
                                <CharacterNotesControl
                                    characterId={character.id}
                                    isAuthenticated={isAuthenticated}
                                    authLoading={authLoading}
                                    characterAccessLoading={ownershipLoading}
                                    hasCharacterAccess={!!loadedCharacter}
                                    primaryColor={primaryColor}
                                />
                                <Tooltip label="Roll dice" withArrow>
                                    <ActionIcon
                                        className={classes.toolbarButton}
                                        size="lg"
                                        variant="filled"
                                        color={primaryColor}
                                        aria-label="Open dice roller"
                                        onClick={openDiceRoller}
                                    >
                                        <IconDice size={20} stroke={1.7} />
                                    </ActionIcon>
                                </Tooltip>
                            </div>
                        </div>

                        <TopData options={sheetOptions} />

                        <SheetSection>
                            <BottomData options={sheetOptions} />
                        </SheetSection>

                        <SheetSection title="Attributes">
                            <Attributes options={sheetOptions} />
                        </SheetSection>

                        <SheetSection title="Skills">
                            <Skills options={sheetOptions} />
                        </SheetSection>

                        {hasDisciplineContent || effectiveMode !== "play" ? (
                            <SheetSection title="Disciplines">
                                <Disciplines options={sheetOptions} />
                            </SheetSection>
                        ) : null}

                        <SheetSection title="The Blood">
                            <TheBlood options={sheetOptions} />
                        </SheetSection>

                        {character.touchstones.length > 0 || effectiveMode === "free" ? (
                            <SheetSection title="Touchstones">
                                <Touchstones options={sheetOptions} />
                            </SheetSection>
                        ) : null}

                        {hasSheetMeritsAndFlaws(character) || effectiveMode !== "play" ? (
                            <SheetSection title="Merits & Flaws">
                                <MeritsAndFlaws options={sheetOptions} />
                            </SheetSection>
                        ) : null}
                    </div>
                </article>
            </div>
            <CharacterSheetMenu options={characterMenuOptions} />
            <ChatWindow options={sheetOptions} />
            {use3dDice ? <QuickRollHotkeys /> : null}
            <DiceRollModal
                primaryColor={primaryColor}
                use3dDice={use3dDice}
                useLegacyDice={useLegacyDice}
                allowCrystalDice={hasCrystalDice}
                onLegacyDiceChange={(enabled) => {
                    useDiceRollModalStore.getState().setDice([])
                    setUseLegacyDice(enabled)
                }}
                character={character}
                setCharacter={editableSetCharacter}
                editDisabledReason={editDisabledReason}
            />
        </MantineProvider>
    )
}

export default CharacterSheet
