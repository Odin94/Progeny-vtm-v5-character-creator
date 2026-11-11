import { Button, Menu } from "@mantine/core"
import {
    IconDeviceFloppy,
    IconDots,
    IconDownload,
    IconFileTypePdf,
    IconInfoCircle,
    IconShare,
    IconShareOff,
    IconSparkles,
    IconTrash,
    IconUpload,
    IconUser,
    IconUsers,
    IconEye,
    IconSkull
} from "@tabler/icons-react"
import { memo, type MouseEvent } from "react"
import {
    DeleteIconButton,
    DisabledReason,
    IconButton,
    type ContextMenuEntry
} from "~/components/ui"
import { ClanSigil } from "./ClanSigil"
import {
    clanColorVars,
    formatRelativeTime,
    getCharacterIdentity,
    ordinal
} from "./characterIdentity"
import classes from "./me.module.css"

export type AccountCharacter = {
    id: string
    name: string
    shared?: boolean
    data?: unknown
    updatedAt?: string
    sharedBy?: string | null
}

export type CharacterCardHandlers = {
    onSave: () => void
    onLoad: (char: AccountCharacter) => void
    onShare: (char: AccountCharacter) => void
    onSummary: (char: AccountCharacter) => void
    onSaveJson: (char: AccountCharacter) => void
    onDownloadPdf: (char: AccountCharacter) => void
    onDelete: (characterId: string, characterName: string) => void
    onUnshare: (char: AccountCharacter) => void
}

export type CharacterCardState = {
    isSelected: boolean
    isLoading: boolean
    isSaving: boolean
    /** Any save/load/transition is running — loads and saves are blocked meanwhile. */
    isBusy: boolean
    /** Why "Save" is unavailable for the loaded character (unnamed), if it is. */
    saveBlockedReason?: string
}

export const CHARACTER_CARD_HEIGHT = 176

const BUSY_REASON = "Wait for the current save or load to finish"

/** The same actions as the card buttons, for the right-click menu. */
export const getCharacterMenuEntries = (
    char: AccountCharacter,
    state: CharacterCardState,
    handlers: CharacterCardHandlers
): ContextMenuEntry[] => {
    const common: ContextMenuEntry[] = [
        {
            key: "summary",
            label: "Summary",
            icon: <IconInfoCircle size={14} />,
            onClick: () => handlers.onSummary(char)
        },
        { type: "divider", key: "d1" },
        {
            key: "json",
            label: "Save JSON",
            icon: <IconDownload size={14} />,
            onClick: () => handlers.onSaveJson(char)
        },
        {
            key: "pdf",
            label: "Download PDF",
            icon: <IconFileTypePdf size={14} />,
            onClick: () => handlers.onDownloadPdf(char)
        },
        { type: "divider", key: "d2" }
    ]

    if (char.shared) {
        return [
            {
                key: "view",
                label: "View",
                icon: <IconEye size={14} />,
                disabled: state.isBusy,
                onClick: () => handlers.onLoad(char)
            },
            ...common,
            {
                key: "unshare",
                label: "Unshare",
                color: "red",
                icon: <IconShareOff size={14} />,
                onClick: () => handlers.onUnshare(char)
            }
        ]
    }

    return [
        ...(state.isSelected
            ? [
                  {
                      key: "save",
                      label: "Save",
                      icon: <IconDeviceFloppy size={14} />,
                      disabled: state.isBusy || Boolean(state.saveBlockedReason),
                      onClick: handlers.onSave
                  }
              ]
            : []),
        {
            key: "load",
            label: "Load",
            icon: <IconUpload size={14} />,
            disabled: state.isBusy,
            onClick: () => handlers.onLoad(char)
        },
        {
            key: "share",
            label: "Share…",
            icon: <IconShare size={14} />,
            onClick: () => handlers.onShare(char)
        },
        ...common,
        {
            key: "delete",
            label: "Delete…",
            color: "red",
            icon: <IconTrash size={14} />,
            onClick: () => handlers.onDelete(char.id, char.name)
        }
    ]
}

type CharacterCardProps = {
    char: AccountCharacter
    state: CharacterCardState
    handlers: CharacterCardHandlers
    onContextMenu: (event: MouseEvent<HTMLElement>, char: AccountCharacter) => void
}

const CharacterCardImpl = ({ char, state, handlers, onContextMenu }: CharacterCardProps) => {
    const identity = getCharacterIdentity(char.data)
    const edited = formatRelativeTime(char.updatedAt)
    const clanLine = [
        identity.generation ? `${ordinal(identity.generation)} generation` : null,
        identity.predatorType
    ].filter(Boolean)
    const loadReason = state.isBusy && !state.isLoading ? BUSY_REASON : undefined
    const saveReason =
        state.saveBlockedReason ?? (state.isBusy && !state.isSaving ? BUSY_REASON : undefined)

    return (
        <article
            className={classes.card}
            style={clanColorVars(identity.color)}
            data-active={state.isSelected || undefined}
            data-character-card={char.id}
            aria-label={char.name}
            onContextMenu={(event) => onContextMenu(event, char)}
        >
            <ClanSigil logo={identity.logo} size={150} className={classes.watermark} />

            <div className={classes.cardHead}>
                <ClanSigil logo={identity.logo} size={42} framed />
                <div className={classes.cardTitle}>
                    <h3 className={classes.cardName} title={char.name}>
                        {char.name || "Unnamed character"}
                    </h3>
                    <div className={classes.cardClan}>
                        {identity.clanName ? <b>{identity.clanName}</b> : "No clan yet"}
                        {clanLine.length ? ` · ${clanLine.join(" · ")}` : null}
                    </div>
                </div>
                {state.isSelected ? (
                    <span className={classes.cardStatus}>
                        <IconSparkles size={12} stroke={2} aria-hidden="true" />
                        Active
                    </span>
                ) : char.shared ? (
                    <span className={classes.cardStatus} data-kind="shared">
                        <IconUsers size={12} stroke={2} aria-hidden="true" />
                        Shared
                    </span>
                ) : null}
            </div>

            <div className={classes.cardMeta}>
                {identity.player ? (
                    <span>
                        <IconUser size={13} aria-hidden="true" />
                        {identity.player}
                    </span>
                ) : null}
                {char.shared && char.sharedBy ? (
                    <span>
                        <IconShare size={13} aria-hidden="true" />
                        from {char.sharedBy}
                    </span>
                ) : null}
                {!identity.player && !char.sharedBy && !identity.clanName ? (
                    <span>
                        <IconSkull size={13} aria-hidden="true" />
                        Still an empty sheet
                    </span>
                ) : null}
            </div>

            <div className={classes.cardFoot}>
                <span className={classes.cardTime}>
                    {/* The loaded card spends this room on its Save button. */}
                    {edited && !(state.isSelected && !char.shared) ? `Edited ${edited}` : null}
                </span>
                <div className={classes.cardActions}>
                    {!char.shared && state.isSelected ? (
                        <DisabledReason reason={saveReason}>
                            <Button
                                size="xs"
                                leftSection={<IconDeviceFloppy size={14} />}
                                onClick={handlers.onSave}
                                disabled={Boolean(saveReason) || state.isBusy}
                                loading={state.isSaving}
                            >
                                Save
                            </Button>
                        </DisabledReason>
                    ) : null}
                    <DisabledReason reason={loadReason}>
                        <Button
                            size="xs"
                            variant={state.isSelected ? "default" : "light"}
                            leftSection={
                                char.shared ? <IconEye size={14} /> : <IconUpload size={14} />
                            }
                            onClick={() => handlers.onLoad(char)}
                            disabled={state.isBusy}
                            loading={state.isLoading}
                        >
                            {char.shared ? "View" : "Load"}
                        </Button>
                    </DisabledReason>
                    {!char.shared ? (
                        <IconButton
                            label={`Share ${char.name}`}
                            icon={<IconShare size={16} />}
                            onClick={() => handlers.onShare(char)}
                        />
                    ) : null}
                    <Menu position="bottom-end" withinPortal>
                        <Menu.Target>
                            <IconButton label="More actions" icon={<IconDots size={16} />} />
                        </Menu.Target>
                        <Menu.Dropdown>
                            <Menu.Item
                                leftSection={<IconInfoCircle size={14} />}
                                onClick={() => handlers.onSummary(char)}
                            >
                                Summary
                            </Menu.Item>
                            <Menu.Divider />
                            <Menu.Item
                                leftSection={<IconDownload size={14} />}
                                onClick={() => handlers.onSaveJson(char)}
                            >
                                Save JSON
                            </Menu.Item>
                            <Menu.Item
                                leftSection={<IconFileTypePdf size={14} />}
                                onClick={() => handlers.onDownloadPdf(char)}
                            >
                                Download PDF
                            </Menu.Item>
                            {char.shared ? (
                                <>
                                    <Menu.Divider />
                                    <Menu.Item
                                        leftSection={<IconShareOff size={14} />}
                                        color="red"
                                        onClick={() => handlers.onUnshare(char)}
                                    >
                                        Unshare
                                    </Menu.Item>
                                </>
                            ) : null}
                        </Menu.Dropdown>
                    </Menu>
                    {!char.shared ? (
                        <DeleteIconButton
                            label={`Delete ${char.name}`}
                            onClick={() => handlers.onDelete(char.id, char.name)}
                        />
                    ) : null}
                </div>
            </div>
        </article>
    )
}

export const CharacterCard = memo(CharacterCardImpl)
