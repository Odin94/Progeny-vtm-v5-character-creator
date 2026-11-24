import {
    Button,
    Checkbox,
    Divider,
    Group,
    Menu,
    Modal,
    Skeleton,
    Stack,
    Text,
    Tooltip
} from "@mantine/core"
import { Link, useNavigate } from "@tanstack/react-router"
import {
    IconArrowUpRight,
    IconDots,
    IconEdit,
    IconFlask,
    IconInfoCircle,
    IconLink,
    IconMessageCircle,
    IconPlus,
    IconRefresh,
    IconTrash,
    IconUserMinus,
    IconUsersGroup
} from "@tabler/icons-react"
import { useEffect, useMemo, useState, type MouseEvent } from "react"
import { confirmationModalCancelButtonStyles } from "~/components/ConfirmActionModal"
import NameTag from "~/components/NameTag"
import {
    DeleteIconButton,
    EmptyState,
    IconButton,
    useContextMenu,
    type ContextMenuEntry
} from "~/components/ui"
import {
    useCoterieHomebrew,
    useHomebrewCollections,
    useSetCoterieHomebrew
} from "~/hooks/useHomebrew"
import type { CoterieCharacter, CoteriePlayerResponse, CoterieResponse } from "~/utils/api"
import { parseCharacterData } from "~/utils/characterData"
import { getCharacterVitals } from "~/utils/characterVitals"
import type { CharacterVitals } from "~/utils/characterVitals"
import { ClanSigil } from "../me/ClanSigil"
import { clanColorVars, getCharacterIdentity } from "../me/characterIdentity"
import { SectionBar } from "../me/SectionBar"
import { StateError } from "../me/StateError"
import classes from "../me/me.module.css"

type Character = CoterieCharacter
type CoteriePlayer = CoteriePlayerResponse
type Coterie = CoterieResponse

type CoteriesSectionProps = {
    userCoteries: Coterie[]
    /** Initial request still in flight (no cached data yet). */
    isLoading?: boolean
    hasLoadError?: boolean
    onRetry?: () => void
    setCreateCoterieModalOpened: (opened: boolean) => void
    handleAddCharacterToCoterie: (coterie: Coterie) => void
    handleEditCoterie: (coterie: Coterie) => void
    handleDeleteCoterie: (coterieId: string, coterieName: string) => void
    handleManageCoterieInvites: (coterie: Coterie) => void
    handleJoinCoterieChat: (coterie: Coterie) => void
    handleRemoveCoteriePlayer: (coterie: Coterie, player: CoteriePlayer) => void
    handleShowCharacterSummary: (character: Character) => void
    handleRemoveCharacterFromCoterie: (
        coterieId: string,
        characterId: string,
        details?: {
            characterName?: string | null
            coterieName?: string | null
        }
    ) => void
    setCoterieForSummary: (coterie: Coterie) => void
    setCoterieSummaryModalOpened: (opened: boolean) => void
    vitalsByCharacterId: Record<string, CharacterVitals>
}

type MemberDetails = {
    playerName?: string
    showPlayerNameTag: boolean
    vitals?: CharacterVitals
    identity: ReturnType<typeof getCharacterIdentity>
}

const HungerDrops = ({ hunger }: { hunger: number }) => (
    <span className={classes.hunger}>
        {Array.from({ length: 5 }, (_, index) => (
            <span
                key={index}
                className={classes.hungerDrop}
                data-filled={index < hunger || undefined}
            />
        ))}
    </span>
)

const MemberVitals = ({ vitals }: { vitals: CharacterVitals }) => (
    <div className={classes.vitals}>
        <Tooltip label={`Hunger ${vitals.hunger}/5`}>
            <span className={classes.vital} aria-label={`Hunger ${vitals.hunger} of 5`}>
                <span className={classes.vitalLabel}>Hunger</span>
                <HungerDrops hunger={vitals.hunger} />
            </span>
        </Tooltip>
        <Tooltip label={`Willpower ${vitals.currentWillpower}/${vitals.willpower}`}>
            <span className={classes.vital}>
                <span className={classes.vitalLabel}>WP</span>
                <b>
                    {vitals.currentWillpower}/{vitals.willpower}
                </b>
            </span>
        </Tooltip>
        <Tooltip
            label={`Humanity ${vitals.humanity}/10${
                vitals.humanityStains > 0 ? ` · ${vitals.humanityStains} stains` : ""
            }`}
        >
            <span className={classes.vital}>
                <span className={classes.vitalLabel}>Hum</span>
                <b>{vitals.humanity}</b>
                {vitals.humanityStains > 0 ? (
                    <span className={classes.fieldMuted}>+{vitals.humanityStains}s</span>
                ) : null}
            </span>
        </Tooltip>
    </div>
)

type OpenContextMenu = ReturnType<typeof useContextMenu>["open"]

const MemberRow = ({
    character,
    details,
    canRemove,
    onSummary,
    onRemove,
    openContextMenu
}: {
    character: Character
    details?: MemberDetails
    canRemove: boolean
    onSummary: (character: Character) => void
    onRemove: () => void
    openContextMenu: OpenContextMenu
}) => {
    const onContextMenu = (event: MouseEvent<HTMLDivElement>) => {
        event.stopPropagation()
        openContextMenu(event, [
            {
                key: "summary",
                label: "Summary",
                icon: <IconInfoCircle size={14} />,
                onClick: () => onSummary(character)
            },
            ...(canRemove
                ? ([
                      { type: "divider", key: "d" },
                      {
                          key: "remove",
                          label: "Remove from coterie…",
                          color: "red",
                          icon: <IconUserMinus size={14} />,
                          onClick: onRemove
                      }
                  ] satisfies ContextMenuEntry[])
                : [])
        ])
    }

    return (
        <div
            role="listitem"
            className={classes.row}
            style={clanColorVars(details?.identity.color ?? "red")}
            onContextMenu={onContextMenu}
        >
            <div className={classes.rowMain}>
                <ClanSigil logo={details?.identity.logo} size={34} framed />
                <div className={classes.rowText}>
                    <div className={classes.rowName}>{character.name}</div>
                    <div className={classes.rowSub}>
                        {details?.playerName ? (
                            details.showPlayerNameTag ? (
                                <NameTag name={details.playerName} size="xs" />
                            ) : (
                                <span>{details.playerName}</span>
                            )
                        ) : null}
                        {details?.identity.clanName ? (
                            <span>{details.identity.clanName}</span>
                        ) : null}
                        {character.shared ? (
                            <span className={classes.ownerMark}>Shared</span>
                        ) : null}
                    </div>
                </div>
            </div>
            {details?.vitals ? <MemberVitals vitals={details.vitals} /> : null}
            <div className={classes.rowActions}>
                <IconButton
                    label={`Summary of ${character.name}`}
                    size="sm"
                    icon={<IconInfoCircle size={15} />}
                    onClick={() => onSummary(character)}
                />
                {canRemove ? (
                    <DeleteIconButton
                        size="sm"
                        label={`Remove ${character.name} from coterie`}
                        onClick={onRemove}
                    />
                ) : null}
            </div>
        </div>
    )
}

const PlayerRow = ({
    player,
    onRemove,
    openContextMenu
}: {
    player: CoteriePlayer
    onRemove: () => void
    openContextMenu: OpenContextMenu
}) => {
    const removable = !player.isOwner && !!player.membershipId

    return (
        <div
            role="listitem"
            className={classes.row}
            onContextMenu={(event) => {
                // The owner row has nothing to act on; let the coterie's own menu open instead.
                if (!removable) return
                event.stopPropagation()
                openContextMenu(event, [
                    {
                        key: "remove",
                        label: "Remove player…",
                        color: "red",
                        icon: <IconUserMinus size={14} />,
                        onClick: onRemove
                    }
                ])
            }}
        >
            <div className={classes.rowMain}>
                {player.showNameTag && player.nickname ? (
                    <NameTag name={player.nickname} size="xs" />
                ) : (
                    <span className={player.nickname ? undefined : classes.fieldMuted}>
                        {player.nickname || "No nickname set"}
                    </span>
                )}
                {player.isOwner ? <span className={classes.ownerMark}>Owner</span> : null}
            </div>
            {removable ? (
                <div className={classes.rowActions}>
                    <IconButton
                        size="sm"
                        label={`Remove ${player.nickname || "player"}`}
                        icon={<IconUserMinus size={15} />}
                        onClick={onRemove}
                    />
                </div>
            ) : null}
        </div>
    )
}

const CoteriesSection = ({
    userCoteries,
    isLoading = false,
    hasLoadError = false,
    onRetry,
    setCreateCoterieModalOpened,
    handleAddCharacterToCoterie,
    handleEditCoterie,
    handleDeleteCoterie,
    handleManageCoterieInvites,
    handleJoinCoterieChat,
    handleRemoveCoteriePlayer,
    handleShowCharacterSummary,
    handleRemoveCharacterFromCoterie,
    setCoterieForSummary,
    setCoterieSummaryModalOpened,
    vitalsByCharacterId
}: CoteriesSectionProps) => {
    const navigate = useNavigate()
    const contextMenu = useContextMenu()
    const [homebrewCoterie, setHomebrewCoterie] = useState<Coterie | null>(null)
    const [selectedHomebrewIds, setSelectedHomebrewIds] = useState<string[]>([])
    const { data: homebrewCollections = [] } = useHomebrewCollections()
    const { data: coterieHomebrew } = useCoterieHomebrew(homebrewCoterie?.id)
    const setCoterieHomebrewMutation = useSetCoterieHomebrew()

    useEffect(() => {
        if (coterieHomebrew) {
            setSelectedHomebrewIds(coterieHomebrew.collections.map((collection) => collection.id))
        }
    }, [coterieHomebrew])

    const memberDetailsByCharacterId = useMemo(() => {
        const details: Record<string, MemberDetails> = {}

        userCoteries.forEach((coterie) => {
            coterie.members?.forEach((member) => {
                const characterData = parseCharacterData(member.character?.data)
                const liveVitals = vitalsByCharacterId[member.characterId]

                details[member.characterId] = {
                    playerName: member.playerNickname?.trim() || characterData?.player || undefined,
                    showPlayerNameTag: !!member.showPlayerNameTag,
                    vitals:
                        liveVitals ??
                        (characterData ? getCharacterVitals(characterData) : undefined),
                    identity: getCharacterIdentity(characterData)
                }
            })
        })

        return details
    }, [userCoteries, vitalsByCharacterId])

    const openCoterie = (coterie: Coterie) =>
        navigate({ to: "/coteries/$coterieId", params: { coterieId: coterie.id } })

    const showSummary = (coterie: Coterie) => {
        setCoterieForSummary(coterie)
        setCoterieSummaryModalOpened(true)
    }

    const coterieMenuEntries = (coterie: Coterie): ContextMenuEntry[] => [
        {
            key: "open",
            label: "View",
            icon: <IconArrowUpRight size={14} />,
            onClick: () => void openCoterie(coterie)
        },
        {
            key: "chat",
            label: "Chat",
            icon: <IconMessageCircle size={14} />,
            onClick: () => handleJoinCoterieChat(coterie)
        },
        {
            key: "add",
            label: "Add Character",
            icon: <IconPlus size={14} />,
            onClick: () => handleAddCharacterToCoterie(coterie)
        },
        {
            key: "summary",
            label: "Summary",
            icon: <IconInfoCircle size={14} />,
            onClick: () => showSummary(coterie)
        },
        ...(coterie.owned
            ? ([
                  { type: "divider", key: "owned" },
                  {
                      key: "invites",
                      label: "Invites",
                      icon: <IconLink size={14} />,
                      onClick: () => handleManageCoterieInvites(coterie)
                  },
                  {
                      key: "edit",
                      label: "Edit",
                      icon: <IconEdit size={14} />,
                      onClick: () => handleEditCoterie(coterie)
                  },
                  {
                      key: "homebrew",
                      label: "Manage Homebrew",
                      icon: <IconFlask size={14} />,
                      onClick: () => setHomebrewCoterie(coterie)
                  },
                  { type: "divider", key: "danger" },
                  {
                      key: "delete",
                      label: "Delete…",
                      color: "red",
                      icon: <IconTrash size={14} />,
                      onClick: () => handleDeleteCoterie(coterie.id, coterie.name)
                  }
              ] satisfies ContextMenuEntry[])
            : [])
    ]

    const ownedCount = userCoteries.filter((coterie) => coterie.owned).length
    const header = (
        <SectionBar
            id="me-coteries-title"
            title="Coteries"
            summary={
                !isLoading && !hasLoadError && userCoteries.length > 0 ? (
                    <>
                        <b>{userCoteries.length}</b>{" "}
                        {userCoteries.length === 1 ? "coterie" : "coteries"}
                        {ownedCount > 0 ? (
                            <>
                                {" · "}
                                <b>{ownedCount}</b> led by you
                            </>
                        ) : null}
                    </>
                ) : null
            }
            actions={
                !isLoading && !hasLoadError && userCoteries.length > 0 ? (
                    <Button
                        leftSection={<IconPlus size={16} />}
                        onClick={() => setCreateCoterieModalOpened(true)}
                    >
                        Create Coterie
                    </Button>
                ) : undefined
            }
        />
    )

    if (isLoading) {
        return (
            <section aria-labelledby="me-coteries-title" aria-busy="true">
                {header}
                <div className={classes.coteries} aria-hidden="true">
                    <Skeleton height={248} radius="lg" />
                    <Skeleton height={168} radius="lg" />
                </div>
            </section>
        )
    }

    if (hasLoadError) {
        return (
            <section aria-labelledby="me-coteries-title">
                {header}
                <StateError
                    title="Could not load your coteries"
                    actions={
                        onRetry ? (
                            <Button
                                variant="light"
                                color="red"
                                leftSection={<IconRefresh size={16} />}
                                onClick={onRetry}
                            >
                                Retry
                            </Button>
                        ) : undefined
                    }
                >
                    Your coteries are safe. The list just couldn&apos;t be fetched right now.
                </StateError>
            </section>
        )
    }

    return (
        <section aria-labelledby="me-coteries-title">
            {header}
            {userCoteries.length === 0 ? (
                <EmptyState
                    icon={<IconUsersGroup size={26} stroke={1.5} />}
                    title="No coteries yet"
                    description="Gather your characters into a coterie and invite your players with a link."
                    actions={
                        <Button
                            leftSection={<IconPlus size={16} />}
                            onClick={() => setCreateCoterieModalOpened(true)}
                        >
                            Create Coterie
                        </Button>
                    }
                />
            ) : (
                <div className={classes.coteries}>
                    {userCoteries.map((coterie) => {
                        const members = (coterie.members ?? []).filter((member) => member.character)
                        const players = coterie.owned ? (coterie.players ?? []) : []
                        const playerCount = coterie.players?.length ?? coterie.playerCount

                        return (
                            <article
                                key={coterie.id}
                                className={classes.coterie}
                                aria-label={coterie.name}
                                onContextMenu={(event) =>
                                    contextMenu.open(event, coterieMenuEntries(coterie))
                                }
                            >
                                <div className={classes.coterieHead}>
                                    <span className={classes.coterieCrest} aria-hidden="true">
                                        <IconUsersGroup size={20} stroke={1.5} />
                                    </span>
                                    <div className={classes.coterieTitle}>
                                        <h3 className={classes.coterieName}>{coterie.name}</h3>
                                        <div className={classes.coterieMeta}>
                                            <b>{coterie.owned ? "Owned" : "Joined"}</b>
                                            {` · ${playerCount} ${playerCount === 1 ? "player" : "players"} · ${members.length} ${members.length === 1 ? "character" : "characters"}`}
                                        </div>
                                    </div>
                                    <div className={classes.coterieActions}>
                                        <Button
                                            renderRoot={(props) => (
                                                <Link
                                                    to="/coteries/$coterieId"
                                                    params={{ coterieId: coterie.id }}
                                                    {...props}
                                                />
                                            )}
                                            size="xs"
                                            variant="light"
                                            leftSection={<IconArrowUpRight size={14} />}
                                        >
                                            View
                                        </Button>
                                        <Button
                                            size="xs"
                                            variant="default"
                                            leftSection={<IconMessageCircle size={14} />}
                                            onClick={() => handleJoinCoterieChat(coterie)}
                                        >
                                            Chat
                                        </Button>
                                        <Button
                                            size="xs"
                                            variant="default"
                                            leftSection={<IconPlus size={14} />}
                                            onClick={() => handleAddCharacterToCoterie(coterie)}
                                        >
                                            Add Character
                                        </Button>
                                    </div>
                                    <div className={classes.coterieIcons}>
                                        <Menu position="bottom-end" withinPortal>
                                            <Menu.Target>
                                                <IconButton
                                                    label="More actions"
                                                    icon={<IconDots size={16} />}
                                                />
                                            </Menu.Target>
                                            <Menu.Dropdown>
                                                <Menu.Item
                                                    leftSection={<IconInfoCircle size={14} />}
                                                    onClick={() => showSummary(coterie)}
                                                >
                                                    Summary
                                                </Menu.Item>
                                                {coterie.owned ? (
                                                    <>
                                                        <Menu.Item
                                                            leftSection={<IconLink size={14} />}
                                                            onClick={() =>
                                                                handleManageCoterieInvites(coterie)
                                                            }
                                                        >
                                                            Invites
                                                        </Menu.Item>
                                                        <Menu.Item
                                                            leftSection={<IconEdit size={14} />}
                                                            onClick={() =>
                                                                handleEditCoterie(coterie)
                                                            }
                                                        >
                                                            Edit
                                                        </Menu.Item>
                                                        <Menu.Item
                                                            leftSection={<IconFlask size={14} />}
                                                            onClick={() =>
                                                                setHomebrewCoterie(coterie)
                                                            }
                                                        >
                                                            Manage Homebrew
                                                        </Menu.Item>
                                                    </>
                                                ) : null}
                                            </Menu.Dropdown>
                                        </Menu>
                                        {coterie.owned ? (
                                            <DeleteIconButton
                                                label={`Delete ${coterie.name}`}
                                                onClick={() =>
                                                    handleDeleteCoterie(coterie.id, coterie.name)
                                                }
                                            />
                                        ) : null}
                                    </div>
                                </div>

                                <div
                                    className={classes.coterieBody}
                                    data-with-players={players.length > 0 || undefined}
                                >
                                    <div>
                                        <p className={classes.listLabel}>
                                            Characters <span>{members.length}</span>
                                        </p>
                                        {members.length === 0 ? (
                                            <div className={classes.emptyNote}>
                                                No characters have joined yet.
                                            </div>
                                        ) : (
                                            <div className={classes.rows} role="list">
                                                {members.map((member) => (
                                                    <MemberRow
                                                        key={member.characterId}
                                                        character={member.character!}
                                                        details={
                                                            memberDetailsByCharacterId[
                                                                member.characterId
                                                            ]
                                                        }
                                                        canRemove={
                                                            !!coterie.owned ||
                                                            !!member.character!.ownedByCurrentUser
                                                        }
                                                        onSummary={handleShowCharacterSummary}
                                                        onRemove={() =>
                                                            handleRemoveCharacterFromCoterie(
                                                                coterie.id,
                                                                member.characterId,
                                                                {
                                                                    characterName:
                                                                        member.character!.name,
                                                                    coterieName: coterie.name
                                                                }
                                                            )
                                                        }
                                                        openContextMenu={contextMenu.open}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {players.length > 0 ? (
                                        <div>
                                            <p className={classes.listLabel}>
                                                Players <span>{players.length}</span>
                                            </p>
                                            <div className={classes.rows} role="list">
                                                {players.map((player) => (
                                                    <PlayerRow
                                                        key={player.membershipId ?? "owner"}
                                                        player={player}
                                                        onRemove={() =>
                                                            handleRemoveCoteriePlayer(
                                                                coterie,
                                                                player
                                                            )
                                                        }
                                                        openContextMenu={contextMenu.open}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            </article>
                        )
                    })}
                </div>
            )}
            {contextMenu.menu}
            <Modal
                opened={!!homebrewCoterie}
                onClose={() => setHomebrewCoterie(null)}
                title={`Homebrew for ${homebrewCoterie?.name ?? "coterie"}`}
                centered
            >
                <Stack>
                    <Text size="sm" c="dimmed">
                        Characters in this coterie can select items from enabled collections. Your
                        collection edits appear here immediately.
                    </Text>
                    {homebrewCollections.length === 0 ? (
                        <Text c="dimmed">
                            You do not own any collections yet. Create or copy one from the Homebrew
                            page first.
                        </Text>
                    ) : (
                        <Checkbox.Group
                            value={selectedHomebrewIds}
                            onChange={setSelectedHomebrewIds}
                        >
                            <Stack gap="xs">
                                {homebrewCollections.map((collection) => (
                                    <Checkbox
                                        key={collection.id}
                                        value={collection.id}
                                        label={`${collection.name} (${collection.items.length} items)`}
                                    />
                                ))}
                            </Stack>
                        </Checkbox.Group>
                    )}
                    <Divider />
                    <Group justify="space-between">
                        <Button
                            variant="subtle"
                            color="gray"
                            onClick={() => setHomebrewCoterie(null)}
                            styles={confirmationModalCancelButtonStyles}
                        >
                            Cancel
                        </Button>
                        <Button
                            loading={setCoterieHomebrewMutation.isPending}
                            onClick={() => {
                                if (!homebrewCoterie) return
                                setCoterieHomebrewMutation.mutate(
                                    {
                                        coterieId: homebrewCoterie.id,
                                        collectionIds: selectedHomebrewIds
                                    },
                                    { onSuccess: () => setHomebrewCoterie(null) }
                                )
                            }}
                        >
                            Save
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </section>
    )
}

export default CoteriesSection
