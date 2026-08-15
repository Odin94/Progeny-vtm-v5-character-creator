import {
    Badge,
    Box,
    Button,
    Center,
    Divider,
    Grid,
    Group,
    Loader,
    Modal,
    Stack,
    Text,
    Title,
    Tooltip
} from "@mantine/core"
import { useState, useEffect } from "react"
import { DisciplineName } from "~/data/NameSchemas"
import { disciplines, Power } from "~/data/Disciplines"
import { clans } from "~/data/Clans"
import { upcase, updateHealthAndWillpowerAndBloodPotencyAndHumanity } from "~/generator/utils"
import { Character } from "~/data/Character"
import { SheetOptions } from "../CharacterSheet"
import DisciplinePowerCard from "./DisciplinePowerCard"
import CustomDisciplineModal from "./CustomDisciplineModal"
import CustomPowerModal from "./CustomPowerModal"
import { canAffordUpgrade, getAvailableXP, getDisciplineCost } from "../utils/xp"
import posthog from "posthog-js"
import { IconPlus } from "@tabler/icons-react"
import { useCharacterHomebrew } from "~/hooks/useHomebrew"
import type { HomebrewDiscipline } from "~/data/Homebrew"
import {
    getHomebrewDisciplineOptions,
    getPowerDisciplineIdentity,
    getPowerIdentity
} from "~/utils/homebrewOptions"
import HomebrewBadge from "~/components/HomebrewBadge"

type DisciplineSelectModalProps = {
    opened: boolean
    onClose: () => void
    options: SheetOptions
    initialDiscipline?: DisciplineName | null
    hideBackButton?: boolean
}

// TODOdin: Fix discipline card height
const DisciplineSelectModal = ({
    opened,
    onClose,
    options,
    initialDiscipline,
    hideBackButton
}: DisciplineSelectModalProps) => {
    const { character, primaryColor, setCharacter } = options
    const [selectedDiscipline, setSelectedDiscipline] = useState<DisciplineName | null>(
        initialDiscipline || null
    )
    const [customDisciplineModalOpened, setCustomDisciplineModalOpened] = useState(false)
    const [customPowerModalOpened, setCustomPowerModalOpened] = useState(false)
    const [contentReady, setContentReady] = useState(false)
    const { data: homebrewCollections = [] } = useCharacterHomebrew(character.id)
    const homebrewDisciplineItems = homebrewCollections.flatMap((collection) =>
        collection.items
            .filter(
                (item): item is HomebrewDiscipline & { id: string } => item.kind === "discipline"
            )
            .map((item) => ({ item, collection }))
    )
    const disciplineCatalog = {
        ...disciplines,
        ...getHomebrewDisciplineOptions(homebrewCollections, [
            ...Object.keys(disciplines),
            ...homebrewDisciplineItems.map(({ item }) => item.name)
        ])
    }

    const captureModalEvent = (event: string, properties: Record<string, unknown>) => {
        try {
            posthog.capture(event, properties)
        } catch (error) {
            console.warn(`PostHog ${event} tracking failed:`, error)
        }
    }

    useEffect(() => {
        if (!opened) {
            setContentReady(false)
            return
        }

        const frame = window.requestAnimationFrame(() => setContentReady(true))
        return () => window.cancelAnimationFrame(frame)
    }, [opened])

    // No open/close event existed, so every failure in here was only visible from a replay.
    useEffect(() => {
        if (!opened) return
        captureModalEvent("sheet-discipline-modal-opened", {
            discipline: initialDiscipline ?? null,
            mode: options.mode
        })
        return () => {
            captureModalEvent("sheet-discipline-modal-closed", {
                mode: options.mode
            })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [opened])

    useEffect(() => {
        if (opened && initialDiscipline) {
            setSelectedDiscipline(initialDiscipline)
        }
    }, [opened, initialDiscipline])

    useEffect(() => {
        if (!opened) {
            const timer = setTimeout(() => {
                setSelectedDiscipline(null)
            }, 200)
            return () => clearTimeout(timer)
        }
    }, [opened])

    const getCurrentDisciplineLevel = (disciplineKey: DisciplineName): number => {
        const discipline = disciplineCatalog[disciplineKey]
        if (!discipline) return 0
        const identity = discipline.homebrewSource
            ? `homebrew:${discipline.homebrewSource.collectionId}:${discipline.homebrewSource.itemId}`
            : `official:${discipline.name}`
        const disciplinePowers = character.disciplines.filter(
            (power) => getPowerDisciplineIdentity(power) === identity
        )
        return disciplinePowers.length
    }

    const getAvailablePowers = (disciplineName: DisciplineName): Power[] => {
        const discipline = disciplineCatalog[disciplineName]
        if (!discipline) return []

        const characterPowerIds = new Set(character.disciplines.map(getPowerIdentity))

        return discipline.powers.filter(
            (power) => !characterPowerIds.has(getPowerIdentity(power))
        )
    }

    // Powers the character cannot take yet stay on screen but disabled, with the reason spelled
    // out. Hiding them left users with no way to learn which lower power unlocks the one they want.
    const getPowerDisabledReasons = (power: Power): string[] => {
        const reasons: string[] = []

        if (selectedDiscipline) {
            const currentLevel = getCurrentDisciplineLevel(selectedDiscipline)
            const maxLevel = currentLevel === 0 ? 1 : currentLevel + 1
            if (power.level > maxLevel) {
                const disciplineLabel = upcase(
                    disciplineCatalog[selectedDiscipline]?.name ?? selectedDiscipline
                )
                reasons.push(`Requires ${disciplineLabel} Level ${power.level - 1}`)
            }
        }

        for (const {
            discipline: requiredDiscipline,
            level: requiredLevel
        } of power.amalgamPrerequisites) {
            if (getCurrentDisciplineLevel(requiredDiscipline) < requiredLevel) {
                reasons.push(`Requires ${upcase(requiredDiscipline)} Level ${requiredLevel}`)
            }
        }

        if (options.mode === "xp") {
            const cost = getDisciplineCost(
                character,
                power.discipline,
                getPowerDisciplineIdentity(power)
            )
            const availableXP = getAvailableXP(character)
            if (!canAffordUpgrade(availableXP, cost)) {
                reasons.push(`Insufficient XP. Need ${cost}, have ${availableXP}`)
            }
        }

        return reasons
    }

    const getPowerXpCost = (power: Power): number | null => {
        if (options.mode !== "xp" || !selectedDiscipline) return null
        return getDisciplineCost(character, power.discipline, getPowerDisciplineIdentity(power))
    }

    const clanDisciplines = new Set(
        character.homebrewClan?.nativeDisciplines ?? clans[character.clan]?.nativeDisciplines ?? []
    )

    const allDisciplines = Object.keys(disciplineCatalog) as DisciplineName[]
    const availableDisciplines = allDisciplines
        .filter((disciplineName) => {
            if (disciplineName === "") return false
            const discipline = disciplineCatalog[disciplineName]
            if (!discipline) return false
            const hasAvailablePowers = getAvailablePowers(disciplineName).length > 0
            return hasAvailablePowers
        })
        .sort((a, b) => {
            const aIsClan = clanDisciplines.has(disciplineCatalog[a]?.name ?? a)
            const bIsClan = clanDisciplines.has(disciplineCatalog[b]?.name ?? b)
            if (aIsClan && !bIsClan) return -1
            if (!aIsClan && bIsClan) return 1
            return a.localeCompare(b)
        })

    const handleSelectDiscipline = (disciplineName: DisciplineName) => {
        setSelectedDiscipline(disciplineName)
    }

    const handleSelectPower = (power: Power) => {
        if (getPowerDisabledReasons(power).length > 0) return
        setCharacter((current) => {
            const selectedOption = selectedDiscipline
                ? disciplineCatalog[selectedDiscipline]
                : undefined
            const sourceDiscipline = selectedOption?.homebrewSource
            const selectedDisciplineIdentity = selectedOption
                ? selectedOption.homebrewSource
                    ? `homebrew:${selectedOption.homebrewSource.collectionId}:${selectedOption.homebrewSource.itemId}`
                    : `official:${selectedOption.name}`
                : getPowerDisciplineIdentity(power)
            const updatedCharacter = {
                ...current,
                disciplines: [...current.disciplines, power],
                customDisciplines: sourceDiscipline
                    ? {
                          ...current.customDisciplines,
                          [selectedDisciplineIdentity]: {
                              name: selectedOption.name,
                              summary: selectedOption.summary,
                              logo: selectedOption.logo,
                              homebrewSource: sourceDiscipline
                          }
                      }
                    : current.customDisciplines
            }
            updateHealthAndWillpowerAndBloodPotencyAndHumanity(updatedCharacter)

            if (options.mode === "xp") {
                const cost = getDisciplineCost(
                    current,
                    power.discipline,
                    getPowerDisciplineIdentity(power)
                )
                updatedCharacter.ephemeral = {
                    ...updatedCharacter.ephemeral,
                    experienceSpent: updatedCharacter.ephemeral.experienceSpent + cost
                }
            }

            return updatedCharacter
        })

        captureModalEvent("sheet-power-pick", {
            power_name: power.name,
            discipline: power.discipline,
            level: power.level,
            mode: options.mode
        })

        onClose()
        setSelectedDiscipline(null)
    }

    const handleBlockedPick = (power: Power, reason: string) => {
        captureModalEvent("sheet-power-pick-blocked", {
            power_name: power.name,
            discipline: power.discipline,
            level: power.level,
            reason,
            mode: options.mode
        })
    }

    const handleBack = () => {
        setSelectedDiscipline(null)
    }

    const handleCustomPowerSaved = () => {
        setCustomPowerModalOpened(false)
        onClose()
        setSelectedDiscipline(null)
    }

    const availablePowers = selectedDiscipline ? getAvailablePowers(selectedDiscipline) : []

    return (
        <Modal
            opened={opened}
            onClose={() => {
                onClose()
                setSelectedDiscipline(null)
            }}
            title={
                selectedDiscipline
                    ? `Select a Power - ${upcase(
                          disciplineCatalog[selectedDiscipline]?.name ?? selectedDiscipline
                      )}`
                    : "Select a Discipline"
            }
            size="lg"
        >
            {contentReady ? (
                <Stack gap="md">
                    {opened && selectedDiscipline ? (
                        <PowerPicker
                            availablePowers={availablePowers}
                            primaryColor={primaryColor}
                            onSelectPower={handleSelectPower}
                            onBack={handleBack}
                            onCreateCustomPower={() => setCustomPowerModalOpened(true)}
                            hideBackButton={hideBackButton}
                            character={character}
                            getPowerDisabledReasons={getPowerDisabledReasons}
                            getPowerXpCost={getPowerXpCost}
                            onBlockedPick={handleBlockedPick}
                        />
                    ) : opened ? (
                        <>
                            {availableDisciplines.length === 0 ? (
                                <Text c="dimmed" ta="center" py="xl">
                                    No available disciplines to add.
                                </Text>
                            ) : (
                                <Grid gutter="md">
                                    {availableDisciplines.map((disciplineName) => {
                                        const discipline = disciplineCatalog[disciplineName]
                                        if (!discipline) return null

                                        return (
                                            <Grid.Col
                                                key={disciplineName}
                                                span={{ base: 12, sm: 6 }}
                                            >
                                                <Box
                                                    style={{
                                                        position: "relative",
                                                        minHeight: "180px"
                                                    }}
                                                >
                                                    <Button
                                                        variant="light"
                                                        color={primaryColor}
                                                        fullWidth
                                                        h="auto"
                                                        p="md"
                                                        onClick={() =>
                                                            handleSelectDiscipline(disciplineName)
                                                        }
                                                        style={{
                                                            height: "100%",
                                                            minHeight: "180px"
                                                        }}
                                                    >
                                                        <Box pos="relative" w="100%">
                                                            <Stack
                                                                gap="xs"
                                                                align="center"
                                                                style={{ width: "100%" }}
                                                            >
                                                                <Box
                                                                    style={{
                                                                        width: "60px",
                                                                        height: "60px",
                                                                        display: "flex",
                                                                        alignItems: "center",
                                                                        justifyContent: "center"
                                                                    }}
                                                                >
                                                                    {discipline.logo ? (
                                                                        <img
                                                                            src={discipline.logo}
                                                                            alt={upcase(disciplineName)}
                                                                            style={{
                                                                                width: "60px",
                                                                                height: "60px"
                                                                            }}
                                                                        />
                                                                    ) : null}
                                                                </Box>
                                                                <Title order={4} style={{ margin: 0 }}>
                                                                    {upcase(discipline.name)}
                                                                </Title>
                                                                <Box
                                                                    style={{
                                                                        minHeight: "40px",
                                                                        display: "flex",
                                                                        alignItems: "center",
                                                                        justifyContent: "center"
                                                                    }}
                                                                >
                                                                    {discipline.summary ? (
                                                                        <Tooltip
                                                                            label={discipline.summary}
                                                                            multiline
                                                                            w={260}
                                                                            withArrow
                                                                        >
                                                                            <Text
                                                                                size="sm"
                                                                                c="dimmed"
                                                                                ta="center"
                                                                                lineClamp={2}
                                                                            >
                                                                                {discipline.summary}
                                                                            </Text>
                                                                        </Tooltip>
                                                                    ) : null}
                                                                </Box>
                                                            </Stack>
                                                            {discipline.homebrewSource ? (
                                                                <Box pos="absolute" top={0} right={0}>
                                                                    <HomebrewBadge
                                                                        source={discipline.homebrewSource}
                                                                    />
                                                                </Box>
                                                            ) : null}
                                                        </Box>
                                                    </Button>
                                                    {clanDisciplines.has(discipline.name) ? (
                                                        <Badge
                                                            size="sm"
                                                            variant="light"
                                                            color={primaryColor}
                                                            style={{
                                                                position: "absolute",
                                                                top: "8px",
                                                                right: "8px"
                                                            }}
                                                        >
                                                            Clan
                                                        </Badge>
                                                    ) : null}
                                                </Box>
                                            </Grid.Col>
                                        )
                                    })}
                                </Grid>
                            )}
                            <Divider my="md" />
                            <Button
                                variant="filled"
                                color="black"
                                fullWidth
                                onClick={() => {
                                    setCustomDisciplineModalOpened(true)
                                }}
                            >
                                Create Custom Discipline
                            </Button>
                        </>
                    ) : null}
                </Stack>
            ) : (
                <Center mih={240}>
                    <Loader color={primaryColor} />
                </Center>
            )}
            <CustomDisciplineModal
                opened={customDisciplineModalOpened}
                onClose={() => {
                    setCustomDisciplineModalOpened(false)
                }}
                options={options}
                editingDisciplineName={null}
                onSave={() => {
                    setCustomDisciplineModalOpened(false)
                    onClose()
                }}
            />
            <CustomPowerModal
                opened={customPowerModalOpened}
                onClose={() => setCustomPowerModalOpened(false)}
                onSave={handleCustomPowerSaved}
                options={options}
                disciplineName={
                    selectedDiscipline
                        ? (disciplineCatalog[selectedDiscipline]?.name ?? selectedDiscipline)
                        : ""
                }
            />
        </Modal>
    )
}

type PowerPickerProps = {
    availablePowers: Power[]
    primaryColor: string
    onSelectPower: (power: Power) => void
    onBack: () => void
    onCreateCustomPower: () => void
    hideBackButton?: boolean
    character: Character
    getPowerDisabledReasons: (power: Power) => string[]
    getPowerXpCost: (power: Power) => number | null
    onBlockedPick: (power: Power, reason: string) => void
}

const PowerPicker = ({
    availablePowers,
    primaryColor,
    onSelectPower,
    onBack,
    onCreateCustomPower,
    hideBackButton,
    character,
    getPowerDisabledReasons,
    getPowerXpCost,
    onBlockedPick
}: PowerPickerProps) => {
    const powersByLevel = new Map<number, Power[]>()
    availablePowers.forEach((power) => {
        const level = power.level
        if (!powersByLevel.has(level)) {
            powersByLevel.set(level, [])
        }
        powersByLevel.get(level)!.push(power)
    })

    const sortedLevels = Array.from(powersByLevel.keys()).sort((a, b) => a - b)

    return (
        <>
            {!hideBackButton ? (
                <Group>
                    <Button variant="subtle" onClick={onBack} color={primaryColor}>
                        ← Back
                    </Button>
                </Group>
            ) : null}
            <Group justify="flex-end">
                <Button
                    variant="light"
                    color={primaryColor}
                    leftSection={<IconPlus size={16} />}
                    onClick={onCreateCustomPower}
                >
                    Create Custom Power
                </Button>
            </Group>
            {availablePowers.length === 0 ? (
                <Text c="dimmed" ta="center" py="xl">
                    No available powers to add for this discipline.
                </Text>
            ) : (
                <Stack gap="lg">
                    {sortedLevels.map((level) => {
                        const powers = powersByLevel.get(level)!
                        return (
                            <Stack key={level} gap="md">
                                <Title order={4} c={primaryColor}>
                                    Level {level}
                                </Title>
                                <Grid gutter="md">
                                    {powers.map((power) => {
                                        const disabledReasons = getPowerDisabledReasons(power)
                                        const disabledTooltip =
                                            disabledReasons.join(" · ") || null
                                        const disabled = disabledTooltip !== null
                                        const xpCost = getPowerXpCost(power)
                                        return (
                                            <Grid.Col
                                                key={getPowerIdentity(power)}
                                                span={{ base: 12, sm: 6 }}
                                            >
                                                <DisciplinePowerCard
                                                    power={power}
                                                    primaryColor={primaryColor}
                                                    onClick={() => onSelectPower(power)}
                                                    onDisabledClick={() =>
                                                        onBlockedPick(power, disabledTooltip ?? "")
                                                    }
                                                    inModal={true}
                                                    character={character}
                                                    disabled={disabled}
                                                    disabledTooltip={disabledTooltip}
                                                    renderActions={
                                                        xpCost !== null
                                                            ? () => (
                                                                  <Badge
                                                                      size="sm"
                                                                      variant="light"
                                                                      color={primaryColor}
                                                                  >
                                                                      {xpCost} XP
                                                                  </Badge>
                                                              )
                                                            : undefined
                                                    }
                                                />
                                            </Grid.Col>
                                        )
                                    })}
                                </Grid>
                            </Stack>
                        )
                    })}
                </Stack>
            )}
        </>
    )
}

export default DisciplineSelectModal
