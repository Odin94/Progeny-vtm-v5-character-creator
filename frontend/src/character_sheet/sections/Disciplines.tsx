import { Button, Text, Tooltip } from "@mantine/core"
import { memo, useEffect, useState } from "react"
import posthog from "posthog-js"
import { DisciplineName } from "~/data/NameSchemas"
import { decreaseDisciplineLevelForPower, getDisciplineLevel } from "~/data/Character"
import { upcase, updateHealthAndWillpowerAndBloodPotencyAndHumanity } from "~/generator/utils"
import { disciplines, Power, Ritual, sanitizeCustomDisciplineLogoUrl } from "~/data/Disciplines"
import { Rituals } from "~/data/Rituals"
import {
    canAccessOblivionCeremonies,
    Ceremony,
    Ceremonies,
    getCeremonyPrerequisiteLabel,
    getOblivionCeremonyLevel
} from "~/data/Ceremonies"
import { SheetOptions } from "../CharacterSheet"
import DisciplineSelectModal from "../components/DisciplineSelectModal"
import DisciplinePowerCard, { RouseCost } from "../components/DisciplinePowerCard"
import Pips from "../components/Pips"
import HomebrewBadge from "~/components/HomebrewBadge"
import CustomDisciplineModal from "../components/CustomDisciplineModal"
import CustomPowerModal from "../components/CustomPowerModal"
import RitualSelectModal from "../components/RitualSelectModal"
import CustomRitualModal from "../components/CustomRitualModal"
import CeremonySelectModal from "../components/CeremonySelectModal"
import CustomCeremonyModal from "../components/CustomCeremonyModal"
import { IconDice5, IconEdit, IconNote, IconPlus, IconTrash } from "@tabler/icons-react"
import { getDisciplineCost, getAvailableXP, canAffordUpgrade, getRitualCost } from "../utils/xp"
import { useCharacterSheetStore } from "../stores/characterSheetStore"
import { useDiceRollModalStore } from "../stores/diceRollModalStore"
import { useShallow } from "zustand/react/shallow"
import type { HomebrewSource } from "~/data/Homebrew"
import {
    getDisciplineDefinitionIdentity,
    getPowerDisciplineIdentity,
    getPowerIdentity
} from "~/utils/homebrewOptions"
import { getDisciplinePowerCustomTextKey, updateCustomText } from "~/utils/customText"
import ConfirmActionModal from "~/components/ConfirmActionModal"
import {
    DeleteIconButton,
    IconButton,
    useContextMenu,
    type ContextMenuEntry
} from "~/components/ui"
import classes from "../sheet.module.css"

type DisciplinesProps = {
    options: SheetOptions
}

const BLOCKED_WARNING_DURATION_MS = 2_500

type XpAddButtonProps = {
    cost: number
    availableXP: number
    onAdd: () => void
    blockedEvent: string
    eventProperties?: Record<string, unknown>
    primaryColor: string
    large?: boolean
    label: string
}

const XpAddButton = ({
    cost,
    availableXP,
    onAdd,
    blockedEvent,
    eventProperties,
    primaryColor,
    large = false,
    label
}: XpAddButtonProps) => {
    const canAfford = canAffordUpgrade(availableXP, cost)
    const blockedReason = canAfford
        ? undefined
        : `Insufficient XP. Need ${cost}, have ${availableXP}`
    const [warning, setWarning] = useState<string>()

    useEffect(() => setWarning(undefined), [blockedReason])

    useEffect(() => {
        if (!warning) return
        const timeout = window.setTimeout(() => setWarning(undefined), BLOCKED_WARNING_DURATION_MS)
        return () => window.clearTimeout(timeout)
    }, [warning])

    const handleClick = (event: React.MouseEvent) => {
        event.stopPropagation()
        if (blockedReason) {
            setWarning(blockedReason)
            try {
                posthog.capture(blockedEvent, {
                    ...eventProperties,
                    mode: "xp",
                    reason: blockedReason
                })
            } catch (error) {
                console.warn(`PostHog ${blockedEvent} tracking failed:`, error)
            }
            return
        }
        setWarning(undefined)
        onAdd()
    }

    return (
        <div
            className={classes.fieldInline}
            style={{ flexDirection: "column", alignItems: "stretch" }}
        >
            <Tooltip label={canAfford ? `${cost} XP` : blockedReason} withArrow>
                <Button
                    size={large ? "md" : "sm"}
                    variant="light"
                    color={primaryColor}
                    leftSection={<IconPlus size={large ? 18 : 16} />}
                    onClick={handleClick}
                    aria-label={label}
                    fullWidth={!large}
                    style={{ opacity: canAfford ? 1 : 0.55 }}
                >
                    {label}
                </Button>
            </Tooltip>
            {warning ? (
                <Text role="status" aria-live="polite" size="xs" c="red.3" ta="center">
                    {warning}
                </Text>
            ) : null}
        </div>
    )
}

const Disciplines = ({ options }: DisciplinesProps) => {
    const { character, primaryColor, mode, setCharacter } = options
    const { updateSelectedDicePool } = useCharacterSheetStore(
        useShallow((state) => ({
            updateSelectedDicePool: state.updateSelectedDicePool
        }))
    )
    const contextMenu = useContextMenu()
    const [modalOpened, setModalOpened] = useState(false)
    const [initialDiscipline, setInitialDiscipline] = useState<DisciplineName | null>(null)
    const [customDisciplineModalOpened, setCustomDisciplineModalOpened] = useState(false)
    const [customPowerModalOpened, setCustomPowerModalOpened] = useState(false)
    const [ritualModalOpened, setRitualModalOpened] = useState(false)
    const [customRitualModalOpened, setCustomRitualModalOpened] = useState(false)
    const [ceremonyModalOpened, setCeremonyModalOpened] = useState(false)
    const [customCeremonyModalOpened, setCustomCeremonyModalOpened] = useState(false)
    const [editingDisciplineName, setEditingDisciplineName] = useState<DisciplineName | null>(null)
    const [editingPower, setEditingPower] = useState<Power | null>(null)
    const [editingPowerCustomText, setEditingPowerCustomText] = useState<string | null>(null)
    const [editingDisciplineSource, setEditingDisciplineSource] = useState<
        HomebrewSource | undefined
    >()
    const [editingRitual, setEditingRitual] = useState<Ritual | null>(null)
    const [editingCeremony, setEditingCeremony] = useState<Ceremony | null>(null)
    const [itemToDelete, setItemToDelete] = useState<
        | { type: "power"; power: Power }
        | { type: "ritual"; ritual: Ritual }
        | { type: "ceremony"; ceremony: Ceremony }
        | {
              type: "discipline"
              disciplineName: DisciplineName
              disciplineIdentity: string
          }
        | null
    >(null)
    const isEditable = mode === "xp" || mode === "free"
    const isFreeMode = mode === "free"
    const bloodSorceryLevel = getDisciplineLevel(character, "official:blood sorcery")
    const oblivionLevel = getOblivionCeremonyLevel(character)
    const canAddRituals = isEditable && bloodSorceryLevel > 0
    const canAddCeremonies = isEditable && canAccessOblivionCeremonies(character)

    const handleDisciplineClick = (disciplineName: DisciplineName) => {
        const diceModalOpened = useDiceRollModalStore.getState().opened
        const selectedDiscipline = useCharacterSheetStore.getState().selectedDicePool.discipline
        updateSelectedDicePool({
            discipline:
                diceModalOpened && selectedDiscipline === disciplineName ? null : disciplineName,
            skill: null,
            secondAttribute: null,
            selectedMeritFlaws: []
        })
        if (!diceModalOpened) {
            useDiceRollModalStore.getState().openSelectedPool()
        }
    }

    if (
        character.disciplines.length === 0 &&
        Object.values(character.disciplineLevels).every((level) => level === 0) &&
        character.rituals.length === 0 &&
        character.ceremonies.length === 0 &&
        !isEditable
    ) {
        return null
    }

    const disciplineGroups = new Map<
        string,
        {
            identity: string
            disciplineName: DisciplineName
            powers: typeof character.disciplines
            customDiscipline?: (typeof character.customDisciplines)[string]
        }
    >()
    character.disciplines.forEach((power) => {
        const identity = getPowerDisciplineIdentity(power)
        const group = disciplineGroups.get(identity)
        disciplineGroups.set(identity, {
            identity,
            disciplineName: power.discipline,
            powers: [...(group?.powers ?? []), power],
            customDiscipline: group?.customDiscipline
        })
    })

    if (isEditable && character.customDisciplines) {
        Object.values(character.customDisciplines).forEach((customDiscipline) => {
            const identity = getDisciplineDefinitionIdentity(customDiscipline)
            const group = disciplineGroups.get(identity)
            disciplineGroups.set(identity, {
                identity,
                disciplineName: customDiscipline.name,
                powers: group?.powers ?? [],
                customDiscipline
            })
        })
    }

    Object.entries(character.disciplineLevels).forEach(([identity, level]) => {
        if (level === 0 || disciplineGroups.has(identity)) return

        const customDiscipline = Object.values(character.customDisciplines).find(
            (definition) => getDisciplineDefinitionIdentity(definition) === identity
        )
        const disciplineName = customDiscipline?.name ?? identity.replace(/^official:/, "")
        disciplineGroups.set(identity, {
            identity,
            disciplineName,
            powers: [],
            customDiscipline
        })
    })

    const handleDeletePower = (power: Power) => {
        setItemToDelete({ type: "power", power })
    }

    const handleDeleteRitual = (ritual: Ritual) => {
        setItemToDelete({ type: "ritual", ritual })
    }

    const handleDeleteCeremony = (ceremony: Ceremony) => {
        setItemToDelete({ type: "ceremony", ceremony })
    }

    const handleDeleteDiscipline = (disciplineIdentity: string, disciplineName: DisciplineName) => {
        setItemToDelete({ type: "discipline", disciplineIdentity, disciplineName })
    }

    const confirmDelete = () => {
        if (!itemToDelete) return

        setCharacter((current) => {
            let updatedCharacter
            if (itemToDelete.type === "power") {
                const remainingDisciplines = current.disciplines.filter(
                    (power) => power !== itemToDelete.power
                )
                const remainingPowerCount = remainingDisciplines.filter(
                    (power) =>
                        getPowerDisciplineIdentity(power) ===
                        getPowerDisciplineIdentity(itemToDelete.power)
                ).length
                updatedCharacter = {
                    ...current,
                    disciplines: remainingDisciplines,
                    disciplineLevels: decreaseDisciplineLevelForPower(
                        current,
                        itemToDelete.power,
                        remainingPowerCount
                    )
                }
            } else if (itemToDelete.type === "ritual") {
                updatedCharacter = {
                    ...current,
                    rituals: current.rituals.filter((ritual) => ritual !== itemToDelete.ritual)
                }
            } else if (itemToDelete.type === "ceremony") {
                updatedCharacter = {
                    ...current,
                    ceremonies: current.ceremonies.filter(
                        (ceremony) => ceremony !== itemToDelete.ceremony
                    )
                }
            } else {
                const updatedCustomDisciplines = { ...current.customDisciplines }
                const remainingDisciplineLevels = Object.fromEntries(
                    Object.entries(current.disciplineLevels).filter(
                        ([identity]) => identity !== itemToDelete.disciplineIdentity
                    )
                )
                const remainingDisciplines = current.disciplines.filter(
                    (power) => getPowerDisciplineIdentity(power) !== itemToDelete.disciplineIdentity
                )
                Object.entries(updatedCustomDisciplines).forEach(([key, definition]) => {
                    if (
                        getDisciplineDefinitionIdentity(definition) ===
                        itemToDelete.disciplineIdentity
                    )
                        delete updatedCustomDisciplines[key]
                })

                updatedCharacter = {
                    ...current,
                    customDisciplines: updatedCustomDisciplines,
                    availableDisciplineNames: current.availableDisciplineNames.filter(
                        (disciplineName) =>
                            itemToDelete.disciplineIdentity.startsWith("homebrew:") ||
                            disciplineName !== itemToDelete.disciplineName
                    ),
                    disciplineLevels: remainingDisciplineLevels,
                    disciplines: remainingDisciplines,
                    rituals:
                        itemToDelete.disciplineIdentity === "official:blood sorcery"
                            ? []
                            : current.rituals,
                    ceremonies:
                        itemToDelete.disciplineIdentity === "official:oblivion" &&
                        !canAccessOblivionCeremonies({
                            disciplineLevels: remainingDisciplineLevels,
                            merits: current.merits
                        })
                            ? []
                            : current.ceremonies
                }
            }

            updateHealthAndWillpowerAndBloodPotencyAndHumanity(updatedCharacter)
            return updatedCharacter
        })
        setItemToDelete(null)
    }

    const rollWithEntry = (disciplineName: DisciplineName): ContextMenuEntry => ({
        key: "roll",
        label: `Roll with ${upcase(disciplineName)}`,
        icon: <IconDice5 size={14} />,
        onClick: () => handleDisciplineClick(disciplineName)
    })

    const addPowerButton = (
        disciplineName: DisciplineName,
        identity: string,
        catalogKey: string,
        isCustom: boolean,
        customDiscipline?: (typeof character.customDisciplines)[string]
    ) => {
        const openCatalog = () => {
            setInitialDiscipline(catalogKey as DisciplineName)
            setModalOpened(true)
        }
        const openCustomPower = () => {
            setEditingDisciplineName(disciplineName)
            setEditingDisciplineSource(customDiscipline?.homebrewSource)
            setEditingPower(null)
            setCustomPowerModalOpened(true)
        }
        const usesCatalog = !!customDiscipline?.homebrewSource || !isCustom
        if (usesCatalog && mode === "xp") {
            return (
                <XpAddButton
                    cost={getDisciplineCost(character, disciplineName, identity)}
                    availableXP={getAvailableXP(character)}
                    onAdd={openCatalog}
                    blockedEvent="sheet-power-pick-blocked"
                    eventProperties={{
                        discipline: disciplineName
                    }}
                    primaryColor={primaryColor}
                    label="Add power"
                />
            )
        }
        return (
            <Button
                size="sm"
                variant="light"
                color={primaryColor}
                fullWidth
                leftSection={<IconPlus size={16} />}
                onClick={(e) => {
                    e.stopPropagation()
                    if (usesCatalog) {
                        openCatalog()
                    } else {
                        openCustomPower()
                    }
                }}
            >
                Add power
            </Button>
        )
    }

    const renderRitualLike = (
        kind: "ritual" | "ceremony",
        item: Ritual | Ceremony,
        details: React.ReactNode
    ) => {
        const onEdit = () => {
            if (kind === "ritual") {
                setEditingRitual(item as Ritual)
                setCustomRitualModalOpened(true)
            } else {
                setEditingCeremony(item as Ceremony)
                setCustomCeremonyModalOpened(true)
            }
        }
        const onDelete = () =>
            kind === "ritual"
                ? handleDeleteRitual(item as Ritual)
                : handleDeleteCeremony(item as Ceremony)
        const menuItems: ContextMenuEntry[] = isFreeMode
            ? [
                  ...(item.isCustom
                      ? [
                            {
                                key: "edit",
                                label: `Edit ${kind}`,
                                icon: <IconEdit size={14} />,
                                onClick: onEdit
                            }
                        ]
                      : []),
                  {
                      key: "delete",
                      label: `Delete ${kind}…`,
                      color: "red",
                      icon: <IconTrash size={14} />,
                      onClick: onDelete
                  }
              ]
            : []

        return (
            <div
                key={item.name}
                className={classes.card}
                data-actionable={menuItems.length > 0 || undefined}
                onContextMenu={
                    menuItems.length > 0 ? (event) => contextMenu.open(event, menuItems) : undefined
                }
            >
                <div className={classes.cardHead}>
                    <span className={classes.powerLevel} aria-label={`Level ${item.level}`}>
                        {item.level}
                    </span>
                    <p className={classes.cardTitle}>{item.name}</p>
                    {item.isCustom ? <span className={classes.tag}>Custom</span> : null}
                    {item.homebrewSource ? <HomebrewBadge source={item.homebrewSource} /> : null}
                    {isFreeMode ? (
                        <div className={classes.cardActions}>
                            {item.isCustom ? (
                                <IconButton
                                    size="sm"
                                    label={`Edit ${item.name}`}
                                    icon={<IconEdit size={15} />}
                                    onClick={onEdit}
                                />
                            ) : null}
                            <DeleteIconButton
                                size="sm"
                                label={`Delete ${item.name}`}
                                onClick={onDelete}
                            />
                        </div>
                    ) : null}
                </div>
                {item.summary ? (
                    <p className={classes.cardBody}>
                        {item.summary.charAt(0).toUpperCase() + item.summary.slice(1)}
                    </p>
                ) : null}
                {details}
                <div className={classes.cardFoot}>
                    {item.dicePool ? (
                        <span className={classes.dicePool}>{item.dicePool}</span>
                    ) : (
                        <span />
                    )}
                    <RouseCost count={item.rouseChecks} />
                </div>
            </div>
        )
    }

    return (
        <>
            {character.disciplines.length > 0 ||
            Object.values(character.disciplineLevels).some((level) => level > 0) ||
            isEditable ? (
                <div className={classes.disciplineGrid}>
                    {Array.from(disciplineGroups.values()).map(
                        ({ identity, disciplineName, powers, customDiscipline }) => {
                            const isOfficial = identity === `official:${disciplineName}`
                            const isCustom = !isOfficial
                            const catalogKey = isOfficial ? disciplineName : identity
                            const discipline = isOfficial ? disciplines[disciplineName] : undefined
                            const logo = customDiscipline?.homebrewSource
                                ? ""
                                : discipline?.logo ||
                                  sanitizeCustomDisciplineLogoUrl(customDiscipline?.logo)
                            const disciplineLevel = getDisciplineLevel(character, identity)
                            const canEditCustomDiscipline =
                                isCustom && !customDiscipline?.homebrewSource && isFreeMode
                            const canDeleteDiscipline = isFreeMode && powers.length === 0
                            const openEditDiscipline = () => {
                                setEditingDisciplineName(disciplineName)
                                setCustomDisciplineModalOpened(true)
                            }
                            const disciplineMenu: ContextMenuEntry[] = [
                                rollWithEntry(disciplineName),
                                ...(canEditCustomDiscipline
                                    ? [
                                          {
                                              key: "edit",
                                              label: "Edit discipline",
                                              icon: <IconEdit size={14} />,
                                              onClick: openEditDiscipline
                                          }
                                      ]
                                    : []),
                                ...(canDeleteDiscipline
                                    ? [
                                          { type: "divider" as const, key: "divider" },
                                          {
                                              key: "delete",
                                              label: "Delete discipline…",
                                              color: "red",
                                              icon: <IconTrash size={14} />,
                                              onClick: () =>
                                                  handleDeleteDiscipline(identity, disciplineName)
                                          }
                                      ]
                                    : [])
                            ]

                            return (
                                <div
                                    key={identity}
                                    className={classes.discipline}
                                    onClick={() => {
                                        if (useDiceRollModalStore.getState().opened) {
                                            handleDisciplineClick(disciplineName)
                                        }
                                    }}
                                    onContextMenu={(event) =>
                                        contextMenu.open(event, disciplineMenu)
                                    }
                                >
                                    <div className={classes.disciplineHead}>
                                        <span className={classes.disciplineLogo} aria-hidden="true">
                                            {logo ? (
                                                <img
                                                    src={logo}
                                                    alt=""
                                                    referrerPolicy="no-referrer"
                                                />
                                            ) : (
                                                <span className={classes.sigilEmpty}>
                                                    {upcase(disciplineName).charAt(0)}
                                                </span>
                                            )}
                                        </span>
                                        <div className={classes.disciplineTitle}>
                                            <h3
                                                className={classes.disciplineName}
                                                onClick={(event) => {
                                                    event.stopPropagation()
                                                    handleDisciplineClick(disciplineName)
                                                }}
                                            >
                                                {upcase(disciplineName)}
                                                {isCustom && !customDiscipline?.homebrewSource ? (
                                                    <span className={classes.tag}>Custom</span>
                                                ) : null}
                                                {customDiscipline?.homebrewSource ? (
                                                    <HomebrewBadge
                                                        source={customDiscipline.homebrewSource}
                                                    />
                                                ) : null}
                                            </h3>
                                        </div>
                                        <div
                                            className={classes.disciplineHeadEnd}
                                            onClick={(event) => event.stopPropagation()}
                                        >
                                            <Pips
                                                level={disciplineLevel}
                                                minLevel={1}
                                                options={options}
                                                label={upcase(disciplineName)}
                                                readOnly={!isFreeMode || !options.canEdit}
                                                instant
                                                onLevelChange={
                                                    isFreeMode && options.canEdit
                                                        ? (level) => {
                                                              setCharacter((current) => {
                                                                  const updatedCharacter = {
                                                                      ...current,
                                                                      disciplineLevels: {
                                                                          ...current.disciplineLevels,
                                                                          [identity]: level
                                                                      }
                                                                  }
                                                                  if (
                                                                      identity ===
                                                                          "official:fortitude" &&
                                                                      current.disciplines.some(
                                                                          (power) =>
                                                                              power.name ===
                                                                              "Resilience"
                                                                      )
                                                                  ) {
                                                                      updateHealthAndWillpowerAndBloodPotencyAndHumanity(
                                                                          updatedCharacter
                                                                      )
                                                                  }
                                                                  return updatedCharacter
                                                              })
                                                          }
                                                        : undefined
                                                }
                                            />
                                            {canEditCustomDiscipline ? (
                                                <IconButton
                                                    size="sm"
                                                    label={`Edit ${upcase(disciplineName)}`}
                                                    icon={<IconEdit size={15} />}
                                                    onClick={openEditDiscipline}
                                                />
                                            ) : null}
                                            {canDeleteDiscipline ? (
                                                <DeleteIconButton
                                                    size="sm"
                                                    label={`Delete ${upcase(disciplineName)}`}
                                                    onClick={() =>
                                                        handleDeleteDiscipline(
                                                            identity,
                                                            disciplineName
                                                        )
                                                    }
                                                />
                                            ) : null}
                                        </div>
                                    </div>
                                    <div
                                        className={classes.powerList}
                                        onClick={(e) => {
                                            if (useDiceRollModalStore.getState().opened) {
                                                e.stopPropagation()
                                            }
                                        }}
                                    >
                                        {powers
                                            .sort((a, b) => a.level - b.level)
                                            .map((power) => {
                                                const customTextKey =
                                                    getDisciplinePowerCustomTextKey(power)
                                                const isStaticPower = !power.isCustom
                                                const toggleNote = () =>
                                                    setEditingPowerCustomText((current) =>
                                                        current === customTextKey
                                                            ? null
                                                            : customTextKey
                                                    )
                                                const editCustomPower = () => {
                                                    setEditingDisciplineName(disciplineName)
                                                    setEditingDisciplineSource(
                                                        customDiscipline?.homebrewSource
                                                    )
                                                    setEditingPower(power)
                                                    setCustomPowerModalOpened(true)
                                                }
                                                const powerMenu: ContextMenuEntry[] = [
                                                    rollWithEntry(disciplineName),
                                                    ...(isFreeMode
                                                        ? [
                                                              ...(isStaticPower
                                                                  ? [
                                                                        {
                                                                            key: "note",
                                                                            label: "Edit note",
                                                                            icon: (
                                                                                <IconNote
                                                                                    size={14}
                                                                                />
                                                                            ),
                                                                            onClick: () =>
                                                                                setEditingPowerCustomText(
                                                                                    customTextKey
                                                                                )
                                                                        }
                                                                    ]
                                                                  : [
                                                                        {
                                                                            key: "edit",
                                                                            label: "Edit power",
                                                                            icon: (
                                                                                <IconEdit
                                                                                    size={14}
                                                                                />
                                                                            ),
                                                                            onClick: editCustomPower
                                                                        }
                                                                    ]),
                                                              {
                                                                  type: "divider" as const,
                                                                  key: "divider"
                                                              },
                                                              {
                                                                  key: "delete",
                                                                  label: "Delete power…",
                                                                  color: "red",
                                                                  icon: <IconTrash size={14} />,
                                                                  onClick: () =>
                                                                      handleDeletePower(power)
                                                              }
                                                          ]
                                                        : [])
                                                ]
                                                return (
                                                    <DisciplinePowerCard
                                                        key={getPowerIdentity(power)}
                                                        power={power}
                                                        primaryColor={primaryColor}
                                                        inModal={false}
                                                        character={character}
                                                        onContextMenu={(event) => {
                                                            event.stopPropagation()
                                                            contextMenu.open(event, powerMenu)
                                                        }}
                                                        customText={
                                                            isStaticPower
                                                                ? (character.customText
                                                                      .disciplinePowers[
                                                                      customTextKey
                                                                  ] ?? "")
                                                                : undefined
                                                        }
                                                        onCustomTextChange={
                                                            isFreeMode && isStaticPower
                                                                ? (value) => {
                                                                      setCharacter((current) => ({
                                                                          ...current,
                                                                          customText:
                                                                              updateCustomText(
                                                                                  current,
                                                                                  "disciplinePowers",
                                                                                  customTextKey,
                                                                                  value
                                                                              )
                                                                      }))
                                                                  }
                                                                : undefined
                                                        }
                                                        isEditingCustomText={
                                                            editingPowerCustomText === customTextKey
                                                        }
                                                        onFinishCustomTextEditing={() =>
                                                            setEditingPowerCustomText(null)
                                                        }
                                                        renderActions={
                                                            isFreeMode
                                                                ? () => (
                                                                      <>
                                                                          {isStaticPower ? (
                                                                              <span
                                                                                  className={
                                                                                      classes.disabledWrap
                                                                                  }
                                                                                  onMouseDown={(
                                                                                      event
                                                                                  ) =>
                                                                                      event.preventDefault()
                                                                                  }
                                                                              >
                                                                                  <IconButton
                                                                                      size="sm"
                                                                                      label={`Edit ${power.name} custom note`}
                                                                                      icon={
                                                                                          <IconNote
                                                                                              size={
                                                                                                  15
                                                                                              }
                                                                                          />
                                                                                      }
                                                                                      onClick={(
                                                                                          event
                                                                                      ) => {
                                                                                          event.stopPropagation()
                                                                                          toggleNote()
                                                                                      }}
                                                                                  />
                                                                              </span>
                                                                          ) : (
                                                                              <IconButton
                                                                                  size="sm"
                                                                                  label={`Edit ${power.name}`}
                                                                                  icon={
                                                                                      <IconEdit
                                                                                          size={15}
                                                                                      />
                                                                                  }
                                                                                  onClick={(
                                                                                      event
                                                                                  ) => {
                                                                                      event.stopPropagation()
                                                                                      editCustomPower()
                                                                                  }}
                                                                              />
                                                                          )}
                                                                          <DeleteIconButton
                                                                              size="sm"
                                                                              label={`Delete ${power.name}`}
                                                                              onClick={(event) => {
                                                                                  event.stopPropagation()
                                                                                  handleDeletePower(
                                                                                      power
                                                                                  )
                                                                              }}
                                                                          />
                                                                      </>
                                                                  )
                                                                : undefined
                                                        }
                                                    />
                                                )
                                            })}
                                        {isEditable
                                            ? addPowerButton(
                                                  disciplineName,
                                                  identity,
                                                  catalogKey,
                                                  isCustom,
                                                  customDiscipline
                                              )
                                            : null}
                                    </div>
                                </div>
                            )
                        }
                    )}
                    {isEditable ? (
                        <div className={classes.addTile}>
                            {mode === "xp" ? (
                                (() => {
                                    const disciplinesAlreadyHave = new Set(
                                        character.disciplines.map((power) => power.discipline)
                                    )
                                    const allDisciplines = Object.keys(
                                        disciplines
                                    ) as DisciplineName[]
                                    const availableDisciplines = allDisciplines.filter(
                                        (disciplineName) =>
                                            disciplineName !== "" &&
                                            !disciplinesAlreadyHave.has(disciplineName)
                                    )

                                    const costs = availableDisciplines.map((disciplineName) =>
                                        getDisciplineCost(character, disciplineName)
                                    )
                                    const minCost = costs.length > 0 ? Math.min(...costs) : 0
                                    return (
                                        <XpAddButton
                                            cost={minCost}
                                            availableXP={getAvailableXP(character)}
                                            onAdd={() => {
                                                setInitialDiscipline(null)
                                                setModalOpened(true)
                                            }}
                                            blockedEvent="sheet-power-pick-blocked"
                                            eventProperties={{ discipline: "new" }}
                                            primaryColor={primaryColor}
                                            large
                                            label="Add discipline"
                                        />
                                    )
                                })()
                            ) : (
                                <Button
                                    size="md"
                                    variant="light"
                                    color={primaryColor}
                                    leftSection={<IconPlus size={18} />}
                                    onClick={() => {
                                        setInitialDiscipline(null)
                                        setModalOpened(true)
                                    }}
                                >
                                    Add discipline
                                </Button>
                            )}
                        </div>
                    ) : null}
                </div>
            ) : null}

            {character.rituals.length > 0 || canAddRituals ? (
                <div className={classes.subsection}>
                    <h3 className={classes.subsectionTitle}>
                        Rituals
                        <span className={classes.subsectionCount}>{character.rituals.length}</span>
                    </h3>
                    <div className={classes.ritualGrid}>
                        {character.rituals.map((ritual) =>
                            renderRitualLike(
                                "ritual",
                                ritual,
                                ritual.requiredTime || ritual.ingredients ? (
                                    <div className={classes.cardMeta}>
                                        {ritual.requiredTime ? (
                                            <span>
                                                <strong>Time</strong> {ritual.requiredTime}
                                            </span>
                                        ) : null}
                                        {ritual.ingredients ? (
                                            <span>
                                                <strong>Ingredients</strong> {ritual.ingredients}
                                            </span>
                                        ) : null}
                                    </div>
                                ) : null
                            )
                        )}
                        {canAddRituals ? (
                            <div className={classes.addTile} data-compact>
                                {mode === "xp" ? (
                                    (() => {
                                        const ownedRitualNames = new Set(
                                            character.rituals.map((ritual) => ritual.name)
                                        )
                                        const availableCosts = Rituals.filter(
                                            (ritual) =>
                                                ritual.level <= bloodSorceryLevel &&
                                                !ownedRitualNames.has(ritual.name)
                                        ).map((ritual) => getRitualCost(ritual.level))
                                        availableCosts.push(getRitualCost(1))
                                        const minCost =
                                            availableCosts.length > 0
                                                ? Math.min(...availableCosts)
                                                : 0
                                        return (
                                            <XpAddButton
                                                cost={minCost}
                                                availableXP={getAvailableXP(character)}
                                                onAdd={() => setRitualModalOpened(true)}
                                                blockedEvent="sheet-ritual-pick-blocked"
                                                primaryColor={primaryColor}
                                                large
                                                label="Add ritual"
                                            />
                                        )
                                    })()
                                ) : (
                                    <Button
                                        size="sm"
                                        variant="light"
                                        color={primaryColor}
                                        leftSection={<IconPlus size={16} />}
                                        onClick={() => setRitualModalOpened(true)}
                                    >
                                        Add ritual
                                    </Button>
                                )}
                            </div>
                        ) : null}
                    </div>
                </div>
            ) : null}
            {character.ceremonies.length > 0 || canAddCeremonies ? (
                <div className={classes.subsection}>
                    <h3 className={classes.subsectionTitle}>
                        Ceremonies
                        <span className={classes.subsectionCount}>
                            {character.ceremonies.length}
                        </span>
                    </h3>
                    <div className={classes.ritualGrid}>
                        {character.ceremonies.map((ceremony) =>
                            renderRitualLike(
                                "ceremony",
                                ceremony,
                                <div className={classes.cardMeta}>
                                    <span>
                                        <strong>Requires</strong>{" "}
                                        {getCeremonyPrerequisiteLabel(ceremony)}
                                    </span>
                                    <span>
                                        <strong>Time</strong> {ceremony.requiredTime}
                                    </span>
                                </div>
                            )
                        )}
                        {canAddCeremonies ? (
                            <div className={classes.addTile} data-compact>
                                {mode === "xp" ? (
                                    (() => {
                                        const ownedCeremonyNames = new Set(
                                            character.ceremonies.map((ceremony) => ceremony.name)
                                        )
                                        const availableCosts = Ceremonies.filter(
                                            (ceremony) =>
                                                ceremony.level <= oblivionLevel &&
                                                !ownedCeremonyNames.has(ceremony.name)
                                        ).map((ceremony) => getRitualCost(ceremony.level))
                                        availableCosts.push(getRitualCost(1))
                                        const minCost =
                                            availableCosts.length > 0
                                                ? Math.min(...availableCosts)
                                                : 0
                                        return (
                                            <XpAddButton
                                                cost={minCost}
                                                availableXP={getAvailableXP(character)}
                                                onAdd={() => setCeremonyModalOpened(true)}
                                                blockedEvent="sheet-ceremony-pick-blocked"
                                                primaryColor={primaryColor}
                                                large
                                                label="Add ceremony"
                                            />
                                        )
                                    })()
                                ) : (
                                    <Button
                                        size="sm"
                                        variant="light"
                                        color={primaryColor}
                                        leftSection={<IconPlus size={16} />}
                                        onClick={() => setCeremonyModalOpened(true)}
                                    >
                                        Add ceremony
                                    </Button>
                                )}
                            </div>
                        ) : null}
                    </div>
                </div>
            ) : null}
            {modalOpened ? (
                <DisciplineSelectModal
                    opened
                    onClose={() => {
                        setModalOpened(false)
                        setInitialDiscipline(null)
                    }}
                    options={options}
                    initialDiscipline={initialDiscipline}
                    hideBackButton={initialDiscipline !== null}
                />
            ) : null}
            {ritualModalOpened ? (
                <RitualSelectModal
                    opened
                    onClose={() => setRitualModalOpened(false)}
                    options={options}
                />
            ) : null}
            {customRitualModalOpened ? (
                <CustomRitualModal
                    opened
                    onClose={() => {
                        setCustomRitualModalOpened(false)
                        setEditingRitual(null)
                    }}
                    options={options}
                    editingRitual={editingRitual}
                />
            ) : null}
            {ceremonyModalOpened ? (
                <CeremonySelectModal
                    opened
                    onClose={() => setCeremonyModalOpened(false)}
                    options={options}
                />
            ) : null}
            {customCeremonyModalOpened ? (
                <CustomCeremonyModal
                    opened
                    onClose={() => {
                        setCustomCeremonyModalOpened(false)
                        setEditingCeremony(null)
                    }}
                    options={options}
                    editingCeremony={editingCeremony}
                />
            ) : null}
            {customDisciplineModalOpened ? (
                <CustomDisciplineModal
                    opened
                    onClose={() => {
                        setCustomDisciplineModalOpened(false)
                        setEditingDisciplineName(null)
                    }}
                    options={options}
                    editingDisciplineName={editingDisciplineName}
                />
            ) : null}
            {customPowerModalOpened ? (
                <CustomPowerModal
                    opened
                    onClose={() => {
                        setCustomPowerModalOpened(false)
                        setEditingDisciplineName(null)
                        setEditingDisciplineSource(undefined)
                        setEditingPower(null)
                    }}
                    options={options}
                    disciplineName={editingDisciplineName || ""}
                    disciplineHomebrewSource={editingDisciplineSource}
                    editingPower={editingPower}
                />
            ) : null}
            {itemToDelete ? (
                <ConfirmActionModal
                    opened={!!itemToDelete}
                    onClose={() => setItemToDelete(null)}
                    onConfirm={confirmDelete}
                    title={`Delete ${itemToDelete.type}`}
                    body={
                        itemToDelete.type === "power"
                            ? `Delete power "${itemToDelete.power.name}"?`
                            : itemToDelete.type === "ritual"
                              ? `Delete ritual "${itemToDelete.ritual.name}"?`
                              : itemToDelete.type === "ceremony"
                                ? `Delete ceremony "${itemToDelete.ceremony.name}"?`
                                : `Delete discipline "${upcase(itemToDelete.disciplineName)}"?`
                    }
                    confirmLabel="Delete"
                />
            ) : null}
            {contextMenu.menu}
        </>
    )
}

export default memo(Disciplines, (prev, next) => {
    const p = prev.options
    const n = next.options
    return (
        p.mode === n.mode &&
        p.primaryColor === n.primaryColor &&
        p.canEdit === n.canEdit &&
        p.editDisabledReason === n.editDisabledReason &&
        p.setCharacter === n.setCharacter &&
        p.character.disciplines === n.character.disciplines &&
        p.character.disciplineLevels === n.character.disciplineLevels &&
        p.character.rituals === n.character.rituals &&
        p.character.ceremonies === n.character.ceremonies &&
        p.character.customDisciplines === n.character.customDisciplines &&
        p.character.customText === n.character.customText &&
        p.character.availableDisciplineNames === n.character.availableDisciplineNames &&
        p.character.clan === n.character.clan &&
        p.character.predatorType === n.character.predatorType &&
        p.character.attributes === n.character.attributes &&
        p.character.skills === n.character.skills &&
        p.character.experience === n.character.experience &&
        p.character.ephemeral.experienceSpent === n.character.ephemeral.experienceSpent
    )
})
