import {
    Badge,
    Box,
    Divider,
    Grid,
    Group,
    Stack,
    Text,
    Title,
    Paper,
    Center,
    ActionIcon,
    Modal,
    Button,
    Tooltip
} from "@mantine/core"
import { memo, useEffect, useState } from "react"
import posthog from "posthog-js"
import { DisciplineName } from "~/data/NameSchemas"
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
import DisciplinePowerCard from "../components/DisciplinePowerCard"
import HomebrewBadge from "~/components/HomebrewBadge"
import CustomDisciplineModal from "../components/CustomDisciplineModal"
import CustomPowerModal from "../components/CustomPowerModal"
import RitualSelectModal from "../components/RitualSelectModal"
import CustomRitualModal from "../components/CustomRitualModal"
import CeremonySelectModal from "../components/CeremonySelectModal"
import CustomCeremonyModal from "../components/CustomCeremonyModal"
import { IconPlus, IconX, IconEdit } from "@tabler/icons-react"
import { getDisciplineCost, getAvailableXP, canAffordUpgrade, getRitualCost } from "../utils/xp"
import { sheetAddSurfaceStyle, sheetSurfaceStyle } from "../utils/style"
import { useCharacterSheetStore } from "../stores/characterSheetStore"
import { useDiceRollModalStore } from "../stores/diceRollModalStore"
import { useShallow } from "zustand/react/shallow"
import type { HomebrewSource } from "~/data/Homebrew"
import {
    getDisciplineDefinitionIdentity,
    getPowerDisciplineIdentity,
    getPowerIdentity
} from "~/utils/homebrewOptions"

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
        <Stack gap={4} align="center">
            <Tooltip label={canAfford ? `${cost} XP` : blockedReason} withArrow>
                <Button
                    size={large ? "md" : "sm"}
                    radius="md"
                    variant="light"
                    color={primaryColor}
                    leftSection={<IconPlus size={large ? 18 : 16} />}
                    onClick={handleClick}
                    aria-label={label}
                    style={{ opacity: canAfford ? 1 : 0.55 }}
                >
                    {label}
                </Button>
            </Tooltip>
            {warning ? (
                <Text role="status" aria-live="polite" size="xs" c="red.4" ta="center">
                    {warning}
                </Text>
            ) : null}
        </Stack>
    )
}

const Disciplines = ({ options }: DisciplinesProps) => {
    const { character, primaryColor, mode, setCharacter } = options
    const { updateSelectedDicePool } = useCharacterSheetStore(
        useShallow((state) => ({
            updateSelectedDicePool: state.updateSelectedDicePool
        }))
    )
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
    const bloodSorceryLevel = character.disciplines.filter(
        (power) => getPowerDisciplineIdentity(power) === "official:blood sorcery"
    ).length
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
            selectedMeritFlaws: []
        })
        if (!diceModalOpened) {
            useDiceRollModalStore.getState().openSelectedPool()
        }
    }

    if (
        character.disciplines.length === 0 &&
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
                updatedCharacter = {
                    ...current,
                    disciplines: current.disciplines.filter((p) => p !== itemToDelete.power)
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
                    disciplines: current.disciplines.filter(
                        (power) =>
                            getPowerDisciplineIdentity(power) !== itemToDelete.disciplineIdentity
                    ),
                    rituals:
                        itemToDelete.disciplineIdentity === "official:blood sorcery"
                            ? []
                            : current.rituals,
                    ceremonies:
                        itemToDelete.disciplineIdentity === "official:oblivion" &&
                        !canAccessOblivionCeremonies({
                            disciplines: current.disciplines.filter(
                                (power) =>
                                    getPowerDisciplineIdentity(power) !==
                                    itemToDelete.disciplineIdentity
                            ),
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

    return (
        <>
            {character.disciplines.length > 0 || isEditable ? (
                <Box>
                    <Title order={2} mb="lg" c={primaryColor}>
                        Disciplines
                    </Title>
                    <Grid gap="md">
                        {Array.from(disciplineGroups.values()).map(
                            ({ identity, disciplineName, powers, customDiscipline }) => {
                                const isOfficial = identity === `official:${disciplineName}`
                                const isCustom = !isOfficial
                                const catalogKey = isOfficial ? disciplineName : identity
                                const discipline = isOfficial
                                    ? disciplines[disciplineName]
                                    : undefined
                                const logo = customDiscipline?.homebrewSource
                                    ? ""
                                    : discipline?.logo ||
                                      sanitizeCustomDisciplineLogoUrl(customDiscipline?.logo)

                                return (
                                    <Grid.Col key={identity} span={{ base: 12, md: 6, lg: 4 }}>
                                        <Paper
                                            p="md"
                                            style={{
                                                height: "100%",
                                                ...sheetSurfaceStyle,
                                                cursor: "default"
                                            }}
                                            onClick={() => {
                                                if (useDiceRollModalStore.getState().opened) {
                                                    handleDisciplineClick(disciplineName)
                                                }
                                            }}
                                        >
                                            <Group gap="md" mb="md" align="center">
                                                {logo ? (
                                                    <img
                                                        src={logo}
                                                        alt={upcase(disciplineName)}
                                                        referrerPolicy="no-referrer"
                                                        style={{
                                                            width: "40px",
                                                            height: "40px",
                                                            flexShrink: 0
                                                        }}
                                                    />
                                                ) : null}
                                                <Group
                                                    justify="space-between"
                                                    style={{ flex: 1 }}
                                                    align="center"
                                                >
                                                    <Group gap="xs" wrap="nowrap">
                                                        <Title
                                                            order={4}
                                                            style={{ margin: 0, cursor: "pointer" }}
                                                            onClick={(event) => {
                                                                event.stopPropagation()
                                                                handleDisciplineClick(
                                                                    disciplineName
                                                                )
                                                            }}
                                                        >
                                                            {upcase(disciplineName)}
                                                            {isCustom &&
                                                            !customDiscipline?.homebrewSource ? (
                                                                <Badge
                                                                    size="xs"
                                                                    variant="dot"
                                                                    color={primaryColor}
                                                                    ml="xs"
                                                                >
                                                                    Custom
                                                                </Badge>
                                                            ) : null}
                                                        </Title>
                                                        {customDiscipline?.homebrewSource ? (
                                                            <HomebrewBadge
                                                                source={
                                                                    customDiscipline.homebrewSource
                                                                }
                                                            />
                                                        ) : null}
                                                    </Group>
                                                    <Group gap="xs" align="center">
                                                        <Badge
                                                            size="lg"
                                                            variant="light"
                                                            color={primaryColor}
                                                            circle
                                                        >
                                                            {powers.length}
                                                        </Badge>
                                                        {isCustom &&
                                                        !customDiscipline?.homebrewSource &&
                                                        isFreeMode ? (
                                                            <ActionIcon
                                                                size="sm"
                                                                variant="subtle"
                                                                color={primaryColor}
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    setEditingDisciplineName(
                                                                        disciplineName
                                                                    )
                                                                    setCustomDisciplineModalOpened(
                                                                        true
                                                                    )
                                                                }}
                                                            >
                                                                <IconEdit size={16} />
                                                            </ActionIcon>
                                                        ) : null}
                                                        {isFreeMode && powers.length === 0 ? (
                                                            <ActionIcon
                                                                size="sm"
                                                                variant="subtle"
                                                                color="red"
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    handleDeleteDiscipline(
                                                                        identity,
                                                                        disciplineName
                                                                    )
                                                                }}
                                                            >
                                                                <IconX size={16} />
                                                            </ActionIcon>
                                                        ) : null}
                                                    </Group>
                                                </Group>
                                            </Group>
                                            <Divider mb="sm" />
                                            <Stack
                                                gap="sm"
                                                onClick={(e) => {
                                                    if (useDiceRollModalStore.getState().opened) {
                                                        e.stopPropagation()
                                                    }
                                                }}
                                            >
                                                {powers
                                                    .sort((a, b) => a.level - b.level)
                                                    .map((power) => (
                                                        <DisciplinePowerCard
                                                            key={getPowerIdentity(power)}
                                                            power={power}
                                                            primaryColor={primaryColor}
                                                            inModal={false}
                                                            character={character}
                                                            renderActions={
                                                                isFreeMode
                                                                    ? () => (
                                                                          <Group gap="xs">
                                                                              {power.isCustom ? (
                                                                                  <ActionIcon
                                                                                      size="sm"
                                                                                      variant="subtle"
                                                                                      color={
                                                                                          primaryColor
                                                                                      }
                                                                                      onClick={(
                                                                                          e
                                                                                      ) => {
                                                                                          e.stopPropagation()
                                                                                          setEditingDisciplineName(
                                                                                              disciplineName
                                                                                          )
                                                                                          setEditingDisciplineSource(
                                                                                              customDiscipline?.homebrewSource
                                                                                          )
                                                                                          setEditingPower(
                                                                                              power
                                                                                          )
                                                                                          setCustomPowerModalOpened(
                                                                                              true
                                                                                          )
                                                                                      }}
                                                                                  >
                                                                                      <IconEdit
                                                                                          size={16}
                                                                                      />
                                                                                  </ActionIcon>
                                                                              ) : null}
                                                                              <ActionIcon
                                                                                  size="sm"
                                                                                  variant="subtle"
                                                                                  color="red"
                                                                                  onClick={(e) => {
                                                                                      e.stopPropagation()
                                                                                      handleDeletePower(
                                                                                          power
                                                                                      )
                                                                                  }}
                                                                              >
                                                                                  <IconX
                                                                                      size={16}
                                                                                  />
                                                                              </ActionIcon>
                                                                          </Group>
                                                                      )
                                                                    : undefined
                                                            }
                                                        />
                                                    ))}
                                                {isEditable ? (
                                                    <Center
                                                        mt="xs"
                                                        onClick={(e) => {
                                                            if (
                                                                useDiceRollModalStore.getState()
                                                                    .opened
                                                            ) {
                                                                e.stopPropagation()
                                                            }
                                                        }}
                                                    >
                                                        {customDiscipline?.homebrewSource ? (
                                                            mode === "xp" ? (
                                                                <XpAddButton
                                                                    cost={getDisciplineCost(
                                                                        character,
                                                                        disciplineName,
                                                                        identity
                                                                    )}
                                                                    availableXP={getAvailableXP(
                                                                        character
                                                                    )}
                                                                    onAdd={() => {
                                                                        setInitialDiscipline(
                                                                            catalogKey as DisciplineName
                                                                        )
                                                                        setModalOpened(true)
                                                                    }}
                                                                    blockedEvent="sheet-power-pick-blocked"
                                                                    eventProperties={{
                                                                        discipline: disciplineName
                                                                    }}
                                                                    primaryColor={primaryColor}
                                                                    label="Add power"
                                                                />
                                                            ) : (
                                                                <Button
                                                                    size="sm"
                                                                    radius="md"
                                                                    variant="light"
                                                                    color={primaryColor}
                                                                    leftSection={<IconPlus size={16} />}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        setInitialDiscipline(
                                                                            catalogKey as DisciplineName
                                                                        )
                                                                        setModalOpened(true)
                                                                    }}
                                                                >
                                                                    Add power
                                                                </Button>
                                                            )
                                                        ) : isCustom ? (
                                                            <Button
                                                                size="sm"
                                                                radius="md"
                                                                variant="light"
                                                                color={primaryColor}
                                                                leftSection={<IconPlus size={16} />}
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    setEditingDisciplineName(
                                                                        disciplineName
                                                                    )
                                                                    setEditingDisciplineSource(
                                                                        customDiscipline?.homebrewSource
                                                                    )
                                                                    setEditingPower(null)
                                                                    setCustomPowerModalOpened(true)
                                                                }}
                                                            >
                                                                Add power
                                                            </Button>
                                                        ) : mode === "xp" ? (
                                                            <XpAddButton
                                                                cost={getDisciplineCost(
                                                                    character,
                                                                    disciplineName,
                                                                    identity
                                                                )}
                                                                availableXP={getAvailableXP(
                                                                    character
                                                                )}
                                                                onAdd={() => {
                                                                    setInitialDiscipline(catalogKey)
                                                                    setModalOpened(true)
                                                                }}
                                                                blockedEvent="sheet-power-pick-blocked"
                                                                eventProperties={{
                                                                    discipline: disciplineName
                                                                }}
                                                                primaryColor={primaryColor}
                                                                label="Add power"
                                                            />
                                                        ) : (
                                                            <Button
                                                                size="sm"
                                                                radius="md"
                                                                variant="light"
                                                                color={primaryColor}
                                                                leftSection={<IconPlus size={16} />}
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    setInitialDiscipline(catalogKey)
                                                                    setModalOpened(true)
                                                                }}
                                                            >
                                                                Add power
                                                            </Button>
                                                        )}
                                                    </Center>
                                                ) : null}
                                            </Stack>
                                        </Paper>
                                    </Grid.Col>
                                )
                            }
                        )}
                        {isEditable ? (
                            <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
                                <Paper
                                    p="md"
                                    withBorder
                                    style={{
                                        height: "100%",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        ...sheetAddSurfaceStyle
                                    }}
                                >
                                    <Center style={{ height: "100%" }}>
                                        {mode === "xp" ? (
                                            (() => {
                                                const disciplinesAlreadyHave = new Set(
                                                    character.disciplines.map(
                                                        (power) => power.discipline
                                                    )
                                                )
                                                const allDisciplines = Object.keys(
                                                    disciplines
                                                ) as DisciplineName[]
                                                const availableDisciplines = allDisciplines.filter(
                                                    (disciplineName) =>
                                                        disciplineName !== "" &&
                                                        !disciplinesAlreadyHave.has(disciplineName)
                                                )

                                                const costs = availableDisciplines.map(
                                                    (disciplineName) =>
                                                        getDisciplineCost(character, disciplineName)
                                                )
                                                const minCost =
                                                    costs.length > 0 ? Math.min(...costs) : 0
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
                                                radius="md"
                                                leftSection={<IconPlus size={18} />}
                                                onClick={() => {
                                                    setInitialDiscipline(null)
                                                    setModalOpened(true)
                                                }}
                                            >
                                                Add discipline
                                            </Button>
                                        )}
                                    </Center>
                                </Paper>
                            </Grid.Col>
                        ) : null}
                    </Grid>
                </Box>
            ) : null}

            {character.rituals.length > 0 || canAddRituals ? (
                <Box mt="xl">
                    {character.disciplines.length > 0 ? <Divider mb="lg" /> : null}
                    <Group justify="center" gap="sm" mb="lg">
                        <Title order={2} ta="center">
                            Rituals
                        </Title>
                        {canAddRituals ? (
                            mode === "xp" ? (
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
                                        availableCosts.length > 0 ? Math.min(...availableCosts) : 0
                                    return (
                                        <XpAddButton
                                            cost={minCost}
                                            availableXP={getAvailableXP(character)}
                                            onAdd={() => setRitualModalOpened(true)}
                                            blockedEvent="sheet-ritual-pick-blocked"
                                            primaryColor={primaryColor}
                                            label="Add ritual"
                                        />
                                    )
                                })()
                            ) : (
                                <Button
                                    size="sm"
                                    radius="md"
                                    variant="light"
                                    color={primaryColor}
                                    leftSection={<IconPlus size={16} />}
                                    onClick={() => setRitualModalOpened(true)}
                                >
                                    Add ritual
                                </Button>
                            )
                        ) : null}
                    </Group>
                    <Grid gap="md">
                        {character.rituals.map((ritual) => (
                            <Grid.Col key={ritual.name} span={{ base: 12, md: 6 }}>
                                <Paper p="md" style={sheetSurfaceStyle}>
                                    <Group justify="space-between" align="flex-start" mb="xs">
                                        <Text fw={700} size="lg">
                                            {ritual.name}
                                        </Text>
                                        <Group gap="xs">
                                            <Badge variant="light" color={primaryColor}>
                                                {ritual.isCustom ? "Custom Ritual" : "Ritual"}
                                            </Badge>
                                            {ritual.homebrewSource ? (
                                                <HomebrewBadge source={ritual.homebrewSource} />
                                            ) : null}
                                            {ritual.isCustom && isFreeMode ? (
                                                <ActionIcon
                                                    size="sm"
                                                    variant="subtle"
                                                    color={primaryColor}
                                                    onClick={() => {
                                                        setEditingRitual(ritual)
                                                        setCustomRitualModalOpened(true)
                                                    }}
                                                >
                                                    <IconEdit size={16} />
                                                </ActionIcon>
                                            ) : null}
                                            {isFreeMode ? (
                                                <ActionIcon
                                                    size="sm"
                                                    variant="subtle"
                                                    color="red"
                                                    onClick={() => handleDeleteRitual(ritual)}
                                                >
                                                    <IconX size={16} />
                                                </ActionIcon>
                                            ) : null}
                                        </Group>
                                    </Group>
                                    {ritual.summary ? (
                                        <Text size="sm" c="dimmed" mt="xs">
                                            {ritual.summary}
                                        </Text>
                                    ) : null}
                                    {ritual.dicePool ? (
                                        <Text size="xs" c="dimmed" mt="sm">
                                            {ritual.dicePool.toUpperCase()}
                                        </Text>
                                    ) : null}
                                </Paper>
                            </Grid.Col>
                        ))}
                    </Grid>
                </Box>
            ) : null}
            {character.ceremonies.length > 0 || canAddCeremonies ? (
                <Box mt="xl">
                    {character.disciplines.length > 0 || character.rituals.length > 0 ? (
                        <Divider mb="lg" />
                    ) : null}
                    <Group justify="center" gap="sm" mb="lg">
                        <Title order={2} ta="center">
                            Ceremonies
                        </Title>
                        {canAddCeremonies ? (
                            mode === "xp" ? (
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
                                        availableCosts.length > 0 ? Math.min(...availableCosts) : 0
                                    return (
                                        <XpAddButton
                                            cost={minCost}
                                            availableXP={getAvailableXP(character)}
                                            onAdd={() => setCeremonyModalOpened(true)}
                                            blockedEvent="sheet-ceremony-pick-blocked"
                                            primaryColor={primaryColor}
                                            label="Add ceremony"
                                        />
                                    )
                                })()
                            ) : (
                                <Button
                                    size="sm"
                                    radius="md"
                                    variant="light"
                                    color={primaryColor}
                                    leftSection={<IconPlus size={16} />}
                                    onClick={() => setCeremonyModalOpened(true)}
                                >
                                    Add ceremony
                                </Button>
                            )
                        ) : null}
                    </Group>
                    <Grid gap="md">
                        {character.ceremonies.map((ceremony) => (
                            <Grid.Col key={ceremony.name} span={{ base: 12, md: 6 }}>
                                <Paper p="md" style={sheetSurfaceStyle}>
                                    <Group justify="space-between" align="flex-start" mb="xs">
                                        <Text fw={700} size="lg">
                                            {ceremony.name}
                                        </Text>
                                        <Group gap="xs">
                                            <Badge variant="light" color={primaryColor}>
                                                {ceremony.isCustom ? "Custom Ceremony" : "Ceremony"}
                                            </Badge>
                                            {ceremony.homebrewSource ? (
                                                <HomebrewBadge source={ceremony.homebrewSource} />
                                            ) : null}
                                            {ceremony.isCustom && isFreeMode ? (
                                                <ActionIcon
                                                    size="sm"
                                                    variant="subtle"
                                                    color={primaryColor}
                                                    onClick={() => {
                                                        setEditingCeremony(ceremony)
                                                        setCustomCeremonyModalOpened(true)
                                                    }}
                                                >
                                                    <IconEdit size={16} />
                                                </ActionIcon>
                                            ) : null}
                                            {isFreeMode ? (
                                                <ActionIcon
                                                    size="sm"
                                                    variant="subtle"
                                                    color="red"
                                                    onClick={() => handleDeleteCeremony(ceremony)}
                                                >
                                                    <IconX size={16} />
                                                </ActionIcon>
                                            ) : null}
                                        </Group>
                                    </Group>
                                    {ceremony.summary ? (
                                        <Text size="sm" c="dimmed" mt="xs">
                                            {ceremony.summary}
                                        </Text>
                                    ) : null}
                                    <Stack gap={2} mt="sm">
                                        {ceremony.dicePool ? (
                                            <Text size="xs" c="dimmed">
                                                {ceremony.dicePool.toUpperCase()}
                                            </Text>
                                        ) : null}
                                        <Text size="xs" c="dimmed">
                                            Requires: {getCeremonyPrerequisiteLabel(ceremony)}
                                        </Text>
                                        <Text size="xs" c="dimmed">
                                            Time: {ceremony.requiredTime}
                                        </Text>
                                    </Stack>
                                </Paper>
                            </Grid.Col>
                        ))}
                    </Grid>
                </Box>
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
                <Modal
                    opened={!!itemToDelete}
                    onClose={() => {
                        setItemToDelete(null)
                    }}
                    title=""
                    centered
                    withCloseButton={false}
                >
                    <Stack>
                        <Text fz="xl" ta="center">
                            {itemToDelete?.type === "power"
                                ? `Delete power "${itemToDelete.power.name}"?`
                                : itemToDelete?.type === "ritual"
                                  ? `Delete ritual "${itemToDelete.ritual.name}"?`
                                  : itemToDelete?.type === "ceremony"
                                    ? `Delete ceremony "${itemToDelete.ceremony.name}"?`
                                    : `Delete discipline "${itemToDelete ? upcase(itemToDelete.disciplineName) : ""}"?`}
                        </Text>
                        <Divider my="sm" />
                        <Group justify="space-between">
                            <Button
                                color="yellow"
                                variant="subtle"
                                onClick={() => {
                                    setItemToDelete(null)
                                }}
                            >
                                Cancel
                            </Button>
                            <Button color="red" onClick={confirmDelete}>
                                Delete
                            </Button>
                        </Group>
                    </Stack>
                </Modal>
            ) : null}
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
        p.character.rituals === n.character.rituals &&
        p.character.ceremonies === n.character.ceremonies &&
        p.character.customDisciplines === n.character.customDisciplines &&
        p.character.availableDisciplineNames === n.character.availableDisciplineNames &&
        p.character.clan === n.character.clan &&
        p.character.predatorType === n.character.predatorType &&
        p.character.attributes === n.character.attributes &&
        p.character.skills === n.character.skills &&
        p.character.experience === n.character.experience &&
        p.character.ephemeral.experienceSpent === n.character.ephemeral.experienceSpent
    )
})
