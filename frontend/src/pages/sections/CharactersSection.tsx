import { Button, FileButton, Skeleton, TextInput, VisuallyHidden } from "@mantine/core"
import {
    IconDeviceFloppy,
    IconDroplet,
    IconFeather,
    IconFileUpload,
    IconPlus,
    IconRefresh,
    IconSearch
} from "@tabler/icons-react"
import { useMemo, useState, type MouseEvent } from "react"
import { EmptyState, IconButton, useContextMenu } from "~/components/ui"
import { Character as CharacterType } from "~/data/Character"
import {
    CHARACTER_CARD_HEIGHT,
    CharacterCard,
    getCharacterMenuEntries,
    type AccountCharacter,
    type CharacterCardHandlers,
    type CharacterCardState
} from "../me/CharacterCard"
import { getCharacterIdentity } from "../me/characterIdentity"
import { SectionBar } from "../me/SectionBar"
import { StateError } from "../me/StateError"
import { VirtualGrid } from "../me/VirtualGrid"
import classes from "../me/me.module.css"

type Character = AccountCharacter

type CharactersSectionProps = {
    isLoading: boolean
    hasLoadError: boolean
    onRetry: () => void
    userCharacters: Character[]
    character: CharacterType & { id?: string }
    showSaveCurrentButton: boolean
    isSavingCharacter: boolean
    isAnyOperationInFlight: boolean
    loadingCharacterId: string | null
    setCreateCharacterModalOpened: (opened: boolean) => void
    handleSaveCurrentCharacter: () => void
    handleLoadFromFile: (file: File | null) => void
    handleLoadCharacter: (char: Character) => void
    handleShareCharacter: (char: Character) => void
    handleShowSummary: (char: Character) => void
    handleSaveJson: (char: Character) => void
    handleDownloadPdf: (char: Character) => void
    handleDeleteCharacter: (characterId: string, characterName: string) => void
    handleUnshareCharacter: (char: Character) => void
}

/** Above this many cards the gallery is windowed. */
const VIRTUALIZE_AFTER = 30
/** Offer a name filter once the gallery no longer fits on a screen or two. */
const FILTER_AFTER = 8
const GRID_GAP = 16
const MIN_COLUMN_WIDTH = 300

const matchesFilter = (char: Character, query: string) => {
    if (!query) return true
    const identity = getCharacterIdentity(char.data)
    return [char.name, identity.clanName, identity.player, identity.predatorType, char.sharedBy]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query))
}

const CharactersSection = ({
    isLoading,
    hasLoadError,
    onRetry,
    userCharacters,
    character,
    showSaveCurrentButton,
    isSavingCharacter,
    isAnyOperationInFlight,
    loadingCharacterId,
    setCreateCharacterModalOpened,
    handleSaveCurrentCharacter,
    handleLoadFromFile,
    handleLoadCharacter,
    handleShareCharacter,
    handleShowSummary,
    handleSaveJson,
    handleDownloadPdf,
    handleDeleteCharacter,
    handleUnshareCharacter
}: CharactersSectionProps) => {
    const contextMenu = useContextMenu()
    const [filter, setFilter] = useState("")
    const query = filter.trim().toLowerCase()

    const handlers: CharacterCardHandlers = {
        onSave: handleSaveCurrentCharacter,
        onLoad: handleLoadCharacter,
        onShare: handleShareCharacter,
        onSummary: handleShowSummary,
        onSaveJson: handleSaveJson,
        onDownloadPdf: handleDownloadPdf,
        onDelete: handleDeleteCharacter,
        onUnshare: handleUnshareCharacter
    }

    const stateFor = (char: Character): CharacterCardState => ({
        isSelected: character.id === char.id,
        isLoading: loadingCharacterId === char.id,
        isSaving: isSavingCharacter,
        isBusy: isAnyOperationInFlight,
        saveBlockedReason: character.name.trim() ? undefined : "Name your character first"
    })

    const openContextMenu = (event: MouseEvent<HTMLElement>, char: Character) =>
        contextMenu.open(event, getCharacterMenuEntries(char, stateFor(char), handlers))

    const visibleCharacters = useMemo(
        () => userCharacters.filter((char) => matchesFilter(char, query)),
        [userCharacters, query]
    )

    const renderCard = (char: Character) => (
        <CharacterCard
            char={char}
            state={stateFor(char)}
            handlers={handlers}
            onContextMenu={openContextMenu}
        />
    )

    if (isLoading || hasLoadError) {
        return (
            <section aria-labelledby="me-characters-title">
                <SectionBar id="me-characters-title" title="Characters" />
                {hasLoadError ? (
                    <StateError
                        title="Could not load saved characters"
                        actions={
                            <>
                                <Button
                                    onClick={onRetry}
                                    variant="light"
                                    color="red"
                                    leftSection={<IconRefresh size={16} />}
                                >
                                    Retry loading characters
                                </Button>
                                {character.id && (
                                    <Button
                                        onClick={handleSaveCurrentCharacter}
                                        variant="default"
                                        leftSection={<IconDeviceFloppy size={16} />}
                                    >
                                        Save Current Character
                                    </Button>
                                )}
                            </>
                        }
                    >
                        A loading error does not mean your characters were deleted. Your current
                        draft is still in this browser. Reload the list before saving to avoid
                        creating duplicates. You can also explicitly save your current character as
                        a copy.
                    </StateError>
                ) : (
                    <>
                        <VisuallyHidden role="status">Loading saved characters…</VisuallyHidden>
                        <div className={classes.grid} aria-hidden="true">
                            {Array.from({ length: 6 }, (_, index) => (
                                <Skeleton key={index} className={classes.skeletonCard} />
                            ))}
                        </div>
                    </>
                )}
            </section>
        )
    }

    const hasCharacters = userCharacters.length > 0
    const sharedCount = userCharacters.filter((char) => char.shared).length
    const summary = hasCharacters ? (
        <>
            <b>{userCharacters.length}</b>{" "}
            {userCharacters.length === 1 ? "character" : "characters"}
            {sharedCount > 0 ? (
                <>
                    {" · "}
                    <b>{sharedCount}</b> shared with you
                </>
            ) : null}
        </>
    ) : null

    return (
        <section aria-labelledby="me-characters-title">
            <SectionBar
                id="me-characters-title"
                title="Characters"
                summary={summary}
                actions={
                    <>
                        {userCharacters.length > FILTER_AFTER ? (
                            <TextInput
                                className={classes.filter}
                                size="sm"
                                placeholder="Filter characters"
                                aria-label="Filter characters"
                                leftSection={<IconSearch size={15} />}
                                value={filter}
                                onChange={(event) => setFilter(event.currentTarget.value)}
                            />
                        ) : null}
                        <FileButton
                            onChange={(payload: File | null) => {
                                if (!payload) return
                                handleLoadFromFile(payload)
                            }}
                            accept="application/json"
                        >
                            {(props) => (
                                <IconButton
                                    {...props}
                                    label="Load JSON"
                                    size="lg"
                                    variant="default"
                                    icon={<IconFileUpload size={17} />}
                                />
                            )}
                        </FileButton>
                        <Button
                            leftSection={<IconPlus size={16} />}
                            onClick={() => setCreateCharacterModalOpened(true)}
                        >
                            Create Empty
                        </Button>
                    </>
                }
            />

            {showSaveCurrentButton ? (
                <div className={classes.draft}>
                    <span className={classes.draftIcon} aria-hidden="true">
                        <IconFeather size={17} stroke={1.6} />
                    </span>
                    <p className={classes.draftText}>
                        <strong>{character.name}</strong> is open in this browser but not saved to
                        your account.
                    </p>
                    <Button
                        variant="light"
                        leftSection={<IconDeviceFloppy size={16} />}
                        onClick={handleSaveCurrentCharacter}
                        disabled={!character.name.trim() || isSavingCharacter}
                        loading={isSavingCharacter}
                    >
                        Save Current Character
                    </Button>
                </div>
            ) : null}

            {!hasCharacters ? (
                <EmptyState
                    icon={<IconDroplet size={26} stroke={1.5} />}
                    title="No characters yet"
                    description="Create one in the generator, start an empty sheet, or bring one in from a JSON file."
                    actions={
                        <FileButton
                            onChange={(payload: File | null) => {
                                if (!payload) return
                                handleLoadFromFile(payload)
                            }}
                            accept="application/json"
                        >
                            {(props) => (
                                <Button
                                    {...props}
                                    variant="default"
                                    leftSection={<IconFileUpload size={16} />}
                                >
                                    Import JSON
                                </Button>
                            )}
                        </FileButton>
                    }
                />
            ) : visibleCharacters.length === 0 ? (
                <EmptyState
                    compact
                    icon={<IconSearch size={22} stroke={1.5} />}
                    title="No matches"
                    description={`No character matches “${filter.trim()}”.`}
                    actions={
                        <Button variant="default" onClick={() => setFilter("")}>
                            Clear filter
                        </Button>
                    }
                />
            ) : visibleCharacters.length > VIRTUALIZE_AFTER ? (
                <VirtualGrid
                    items={visibleCharacters}
                    itemHeight={CHARACTER_CARD_HEIGHT}
                    gap={GRID_GAP}
                    minColumnWidth={MIN_COLUMN_WIDTH}
                    getKey={(char) => char.id}
                    renderItem={renderCard}
                />
            ) : (
                <div className={classes.grid} role="list">
                    {visibleCharacters.map((char) => (
                        <div key={char.id} role="listitem">
                            {renderCard(char)}
                        </div>
                    ))}
                </div>
            )}
            {contextMenu.menu}
        </section>
    )
}

export default CharactersSection
