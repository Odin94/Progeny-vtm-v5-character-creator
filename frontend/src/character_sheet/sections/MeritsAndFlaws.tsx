import { Button, Textarea, Tooltip } from "@mantine/core"
import { memo, useState, useMemo } from "react"
import type { SheetOptions } from "../CharacterSheet"
import MeritFlawSelectModal from "../components/MeritFlawSelectModal"
import HomebrewBadge from "~/components/HomebrewBadge"
import { MeritFlaw } from "~/data/Character"
import { IconNote, IconPlus, IconTrash } from "@tabler/icons-react"
import { getSheetMeritsAndFlaws, type SheetMeritFlaw } from "../utils/meritsAndFlaws"
import { getMeritFlawDisplayName } from "~/data/meritsAndFlawsResolution"
import ConfirmActionModal from "~/components/ConfirmActionModal"
import { getMeritFlawCustomTextKey, updateCustomText } from "~/utils/customText"
import {
    DeleteIconButton,
    IconButton,
    useContextMenu,
    type ContextMenuEntry
} from "~/components/ui"
import classes from "../sheet.module.css"

type MeritsAndFlawsProps = {
    options: SheetOptions
}

type Kind = "merit" | "flaw"

const LevelDots = ({ level, kind }: { level: number; kind: Kind }) =>
    level > 0 ? (
        <span className={classes.levelDots} data-kind={kind} aria-label={`Level ${level}`}>
            {Array.from({ length: level }, (_, index) => (
                <span key={index} className={classes.levelDot} />
            ))}
        </span>
    ) : (
        <span className={classes.levelZero} aria-label="Level 0">
            0
        </span>
    )

const MeritsAndFlaws = ({ options }: MeritsAndFlawsProps) => {
    const { character, primaryColor, mode, setCharacter } = options
    const [meritModalOpened, setMeritModalOpened] = useState(false)
    const [flawModalOpened, setFlawModalOpened] = useState(false)
    const [itemToDelete, setItemToDelete] = useState<{
        type: Kind
        item: MeritFlaw
    } | null>(null)
    const [editingCustomText, setEditingCustomText] = useState<string | null>(null)
    const contextMenu = useContextMenu()
    const isEditable = mode === "xp" || mode === "free"
    const isFreeMode = mode === "free"

    const { merits: allMerits, flaws: allFlaws } = useMemo(
        () => getSheetMeritsAndFlaws(character),
        [character]
    )

    if (allMerits.length === 0 && allFlaws.length === 0 && !isEditable) {
        return null
    }

    const confirmDelete = () => {
        if (!itemToDelete) return

        if (itemToDelete.type === "merit") {
            setCharacter((current) => ({
                ...current,
                merits: current.merits.filter((m) => m !== itemToDelete.item)
            }))
        } else {
            setCharacter((current) => ({
                ...current,
                flaws: current.flaws.filter((f) => f !== itemToDelete.item)
            }))
        }

        setItemToDelete(null)
    }

    const renderItem = (kind: Kind, entry: SheetMeritFlaw, index: number) => {
        const {
            meritFlaw: item,
            isFromPredatorType,
            isUpgradedFromPredatorType,
            isFromLoresheet,
            isUpgradedFromLoresheet
        } = entry
        const isFromBonus = isFromPredatorType || isFromLoresheet
        const displayName = getMeritFlawDisplayName(item)
        const customTextKey = getMeritFlawCustomTextKey(item)
        const customText = character.customText.meritFlaws[customTextKey] ?? ""
        const customTextEditorKey = `${kind}:${customTextKey}`
        const isEditingCustomText = editingCustomText === customTextEditorKey
        const badgeText = isFromLoresheet
            ? isUpgradedFromLoresheet
                ? "Upgraded from loresheet"
                : "From loresheet"
            : isUpgradedFromPredatorType
              ? "Upgraded from predator type"
              : "From predator type"
        const askDelete = () => setItemToDelete({ type: kind, item })
        const toggleNote = () =>
            setEditingCustomText((current) =>
                current === customTextEditorKey ? null : customTextEditorKey
            )
        const menuItems: ContextMenuEntry[] = !isFreeMode
            ? []
            : isFromBonus
              ? [
                    {
                        key: "note",
                        label: "Edit note",
                        icon: <IconNote size={14} />,
                        onClick: () => setEditingCustomText(customTextEditorKey)
                    }
                ]
              : [
                    {
                        key: "delete",
                        label: `Delete ${kind}…`,
                        color: "red",
                        icon: <IconTrash size={14} />,
                        onClick: askDelete
                    }
                ]

        const card = (
            <div
                key={`${item.name}-${item.level}-${index}`}
                className={`${classes.card} ${classes.meritCard}`}
                data-kind={kind}
                data-actionable={menuItems.length > 0 || undefined}
                onContextMenu={
                    menuItems.length > 0 ? (event) => contextMenu.open(event, menuItems) : undefined
                }
            >
                <div className={classes.cardHead}>
                    <p className={classes.cardTitle}>{displayName}</p>
                    {item.homebrewSource ? <HomebrewBadge source={item.homebrewSource} /> : null}
                    <LevelDots level={item.level} kind={kind} />
                    {isFreeMode ? (
                        <div className={classes.cardActions}>
                            {isFromBonus ? (
                                <span
                                    className={classes.disabledWrap}
                                    onMouseDown={(event) => event.preventDefault()}
                                >
                                    <IconButton
                                        size="sm"
                                        label={`Edit ${displayName} custom note`}
                                        icon={<IconNote size={15} />}
                                        onClick={toggleNote}
                                    />
                                </span>
                            ) : (
                                <DeleteIconButton
                                    size="sm"
                                    label={`Delete ${displayName}`}
                                    onClick={askDelete}
                                />
                            )}
                        </div>
                    ) : null}
                </div>
                {isFreeMode && !isFromBonus ? (
                    <Textarea
                        aria-label={`${displayName} description`}
                        value={item.summary}
                        onChange={(event) => {
                            const summary = event.currentTarget.value
                            setCharacter((current) => ({
                                ...current,
                                [kind === "merit" ? "merits" : "flaws"]: (kind === "merit"
                                    ? current.merits
                                    : current.flaws
                                ).map((candidate) =>
                                    candidate === item ? { ...candidate, summary } : candidate
                                )
                            }))
                        }}
                        placeholder="Description..."
                        autosize
                        minRows={2}
                        size="sm"
                    />
                ) : item.summary ? (
                    <p className={classes.cardBody}>
                        {item.summary.charAt(0).toUpperCase() + item.summary.slice(1)}
                    </p>
                ) : null}
                {isEditingCustomText ? (
                    <Textarea
                        aria-label={`${displayName} custom note`}
                        value={customText}
                        onChange={(event) => {
                            const value = event.currentTarget.value
                            setCharacter((current) => ({
                                ...current,
                                customText: updateCustomText(
                                    current,
                                    "meritFlaws",
                                    customTextKey,
                                    value
                                )
                            }))
                        }}
                        placeholder="Add a custom note..."
                        minRows={2}
                        size="sm"
                        autoFocus
                        onBlur={() => setEditingCustomText(null)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                event.preventDefault()
                                setEditingCustomText(null)
                            }
                        }}
                    />
                ) : customText ? (
                    <p className={classes.cardNote}>{customText}</p>
                ) : null}
                {isFromBonus ? <span className={classes.tag}>{badgeText}</span> : null}
            </div>
        )

        if (isFromBonus) {
            return (
                <Tooltip
                    key={index}
                    label={isFromLoresheet ? "Added by loresheet" : "Added by predator type"}
                    withArrow
                >
                    <div>{card}</div>
                </Tooltip>
            )
        }

        return card
    }

    const renderColumn = (kind: Kind, entries: SheetMeritFlaw[]) => (
        <div>
            <h3
                className={classes.subsectionTitle}
                data-tone={kind === "flaw" ? "blood" : undefined}
            >
                {kind === "merit" ? "Merits" : "Flaws"}
                <span className={classes.subsectionCount}>{entries.length}</span>
            </h3>
            <div className={classes.meritList}>
                {entries.map((entry, index) => renderItem(kind, entry, index))}
                {isEditable ? (
                    <div
                        className={classes.addTile}
                        data-compact
                        data-tone={kind === "flaw" ? "blood" : undefined}
                    >
                        <Button
                            size="sm"
                            variant="light"
                            color={kind === "merit" ? primaryColor : "red"}
                            leftSection={<IconPlus size={16} />}
                            onClick={() =>
                                kind === "merit"
                                    ? setMeritModalOpened(true)
                                    : setFlawModalOpened(true)
                            }
                        >
                            {kind === "merit" ? "Add merit" : "Add flaw"}
                        </Button>
                    </div>
                ) : null}
            </div>
        </div>
    )

    return (
        <>
            <div className={classes.meritColumns}>
                {allMerits.length > 0 || isEditable ? renderColumn("merit", allMerits) : null}
                {allFlaws.length > 0 || isEditable ? renderColumn("flaw", allFlaws) : null}
            </div>
            {meritModalOpened ? (
                <MeritFlawSelectModal
                    opened
                    onClose={() => setMeritModalOpened(false)}
                    options={options}
                    type="merit"
                />
            ) : null}
            {flawModalOpened ? (
                <MeritFlawSelectModal
                    opened
                    onClose={() => setFlawModalOpened(false)}
                    options={options}
                    type="flaw"
                />
            ) : null}
            {itemToDelete ? (
                <ConfirmActionModal
                    opened={!!itemToDelete}
                    onClose={() => setItemToDelete(null)}
                    onConfirm={confirmDelete}
                    title={`Delete ${itemToDelete.type}`}
                    body={
                        <>
                            Delete {itemToDelete.type} &quot;{itemToDelete.item.name}&quot;?
                        </>
                    }
                    confirmLabel="Delete"
                />
            ) : null}
            {contextMenu.menu}
        </>
    )
}

export default memo(MeritsAndFlaws, (prev, next) => {
    const p = prev.options
    const n = next.options
    return (
        p.mode === n.mode &&
        p.primaryColor === n.primaryColor &&
        p.canEdit === n.canEdit &&
        p.editDisabledReason === n.editDisabledReason &&
        p.setCharacter === n.setCharacter &&
        p.character.merits === n.character.merits &&
        p.character.flaws === n.character.flaws &&
        p.character.customText === n.character.customText &&
        p.character.clan === n.character.clan &&
        p.character.predatorType === n.character.predatorType &&
        p.character.availableDisciplineNames === n.character.availableDisciplineNames &&
        p.character.disciplines === n.character.disciplines &&
        p.character.experience === n.character.experience &&
        p.character.ephemeral.experienceSpent === n.character.ephemeral.experienceSpent
    )
})
