import {
    ActionIcon,
    Badge,
    Box,
    Checkbox,
    Collapse,
    Group,
    Stack,
    Text,
    Tooltip,
    useMantineTheme
} from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { IconChevronDown, IconInfoCircle, IconRotateClockwise } from "@tabler/icons-react"
import { Character } from "~/data/Character"
import { useCharacterSheetStore } from "../../../stores/characterSheetStore"
import { upcase } from "~/generator/utils"
import { useShallow } from "zustand/react/shallow"
import { getApplicableDisciplinePowers } from "../../../utils/disciplinePowerMatcher"
import { getApplicableMeritFlawModifiers } from "../../../utils/meritFlawMatcher"
import { useMemo } from "react"

type SelectedDicePoolDisplayProps = {
    character?: Character
    primaryColor: string
    skillSpecialties: Array<{ name: string; skill: string; fromPredatorType?: boolean }>
}

const SelectedDicePoolDisplay = ({
    character,
    primaryColor,
    skillSpecialties
}: SelectedDicePoolDisplayProps) => {
    const theme = useMantineTheme()
    const colorValue = theme.colors[primaryColor]?.[6] || theme.colors.grape[6]
    const [poolExpanded, { toggle: togglePoolExpanded }] = useDisclosure(true)
    const [meritFlawExpanded, { toggle: toggleMeritFlawExpanded }] = useDisclosure(false)
    const { selectedDicePool, resetSelectedDicePool, updateSelectedDicePool } =
        useCharacterSheetStore(
            useShallow((state) => ({
                selectedDicePool: state.selectedDicePool,
                resetSelectedDicePool: state.resetSelectedDicePool,
                updateSelectedDicePool: state.updateSelectedDicePool
            }))
        )

    const applicablePowers = useMemo(() => {
        if (!character || !selectedDicePool.attribute) return []
        return getApplicableDisciplinePowers(
            character,
            selectedDicePool.attribute,
            selectedDicePool.skill
        )
    }, [character, selectedDicePool.attribute, selectedDicePool.skill])

    const applicableMeritFlawModifiers = useMemo(() => {
        if (!character) return []
        return getApplicableMeritFlawModifiers(
            character,
            selectedDicePool.attribute,
            selectedDicePool.skill
        )
    }, [character, selectedDicePool.attribute, selectedDicePool.skill])

    const formatDiceModifier = (bonusDice: number) => {
        const sign = bonusDice > 0 ? "+" : ""
        const absBonus = Math.abs(bonusDice)
        return `${sign}${bonusDice} ${absBonus === 1 ? "die" : "dice"}`
    }

    return (
        <Box
            style={{
                border: `1px solid ${colorValue}`,
                borderRadius: "8px",
                padding: "1rem",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                flexShrink: 0
            }}
        >
            <Stack gap="xs">
                <Group justify="space-between" align="center">
                    <Group gap="xs" align="center">
                        <ActionIcon
                            variant="subtle"
                            color={primaryColor}
                            size="sm"
                            onClick={togglePoolExpanded}
                            title={
                                poolExpanded
                                    ? "Collapse selected dice pool"
                                    : "Expand selected dice pool"
                            }
                            aria-label={
                                poolExpanded
                                    ? "Collapse selected dice pool"
                                    : "Expand selected dice pool"
                            }
                        >
                            <IconChevronDown
                                size={18}
                                style={{
                                    transform: poolExpanded ? "rotate(0deg)" : "rotate(-90deg)",
                                    transition: "transform 0.2s"
                                }}
                            />
                        </ActionIcon>
                        <Text fw={700} fz="md" c={primaryColor}>
                            Selected Dice Pool:
                        </Text>
                        <Tooltip
                            label="You can click Attributes, Skills, or Disciplines on the character sheet to determine your dice pool"
                            position="top"
                            withArrow
                            multiline
                            w={250}
                            zIndex={3000}
                        >
                            <ActionIcon
                                variant="subtle"
                                color={primaryColor}
                                size="sm"
                                style={{ cursor: "help" }}
                            >
                                <IconInfoCircle size={18} />
                            </ActionIcon>
                        </Tooltip>
                    </Group>
                    {selectedDicePool.attribute ||
                    selectedDicePool.skill ||
                    selectedDicePool.discipline ? (
                        <ActionIcon
                            variant="subtle"
                            color={primaryColor}
                            onClick={resetSelectedDicePool}
                            title="Reset dice pool"
                        >
                            <IconRotateClockwise size={18} />
                        </ActionIcon>
                    ) : null}
                </Group>
                <Collapse in={poolExpanded}>
                    <Stack gap="xs">
                        <Group gap="xs">
                            {selectedDicePool.attribute ? (
                                <Badge variant="light" color={primaryColor} size="lg">
                                    {upcase(selectedDicePool.attribute)}:{" "}
                                    {character?.attributes[selectedDicePool.attribute] || 0}
                                </Badge>
                            ) : (
                                <Text c="dimmed" size="sm">
                                    No attribute selected
                                </Text>
                            )}
                            {selectedDicePool.skill ? (
                                <Badge variant="light" color={primaryColor} size="lg">
                                    {upcase(selectedDicePool.skill)}:{" "}
                                    {character?.skills[selectedDicePool.skill] || 0}
                                </Badge>
                            ) : selectedDicePool.discipline ? (
                                <Badge variant="light" color={primaryColor} size="lg">
                                    {upcase(selectedDicePool.discipline)}:{" "}
                                    {character?.disciplines.filter(
                                        (p) => p.discipline === selectedDicePool.discipline
                                    ).length || 0}
                                </Badge>
                            ) : (
                                <Text c="dimmed" size="sm">
                                    No skill/discipline selected
                                </Text>
                            )}
                        </Group>
                        {skillSpecialties.length > 0 && selectedDicePool.skill ? (
                            <Stack gap="xs" mt="sm">
                                <Text fw={600} fz="sm" c={primaryColor}>
                                    Specialties (+1 die each):
                                </Text>
                                <Group gap="xs">
                                    {skillSpecialties.map((specialty) => (
                                        <Checkbox
                                            key={`${specialty.fromPredatorType ? "predator" : "direct"}-${specialty.skill}-${specialty.name}`}
                                            label={
                                                specialty.fromPredatorType
                                                    ? `${specialty.name} (Predator Type)`
                                                    : specialty.name
                                            }
                                            checked={selectedDicePool.selectedSpecialties.includes(
                                                specialty.name
                                            )}
                                            onChange={(e) => {
                                                if (e.currentTarget.checked) {
                                                    updateSelectedDicePool({
                                                        selectedSpecialties: [
                                                            ...selectedDicePool.selectedSpecialties,
                                                            specialty.name
                                                        ]
                                                    })
                                                } else {
                                                    updateSelectedDicePool({
                                                        selectedSpecialties:
                                                            selectedDicePool.selectedSpecialties.filter(
                                                                (s) => s !== specialty.name
                                                            )
                                                    })
                                                }
                                            }}
                                            color={primaryColor}
                                        />
                                    ))}
                                </Group>
                            </Stack>
                        ) : null}
                        {applicablePowers.length > 0 || true ? (
                            <Stack gap="xs" mt="sm">
                                <Text fw={600} fz="sm" c={primaryColor}>
                                    The Blood:
                                </Text>
                                <Group gap="xs">
                                    <Checkbox
                                        label="Blood Surge (+2 dice)"
                                        checked={selectedDicePool.bloodSurge}
                                        onChange={(e) => {
                                            updateSelectedDicePool({
                                                bloodSurge: e.currentTarget.checked
                                            })
                                        }}
                                        color={primaryColor}
                                    />
                                    {applicablePowers.map(({ power, disciplineRating }) => {
                                        const isWrecker = power.name === "Wrecker"
                                        const bonusDice = isWrecker
                                            ? disciplineRating * 2
                                            : disciplineRating
                                        const powerKey = `${power.discipline}-${power.name}`
                                        const isChecked =
                                            selectedDicePool.selectedDisciplinePowers.includes(
                                                powerKey
                                            )

                                        return (
                                            <Checkbox
                                                key={powerKey}
                                                label={`${power.name} (+${bonusDice} ${bonusDice === 1 ? "die" : "dice"})`}
                                                checked={isChecked}
                                                onChange={(e) => {
                                                    if (e.currentTarget.checked) {
                                                        updateSelectedDicePool({
                                                            selectedDisciplinePowers: [
                                                                ...selectedDicePool.selectedDisciplinePowers,
                                                                powerKey
                                                            ]
                                                        })
                                                    } else {
                                                        updateSelectedDicePool({
                                                            selectedDisciplinePowers:
                                                                selectedDicePool.selectedDisciplinePowers.filter(
                                                                    (p) => p !== powerKey
                                                                )
                                                        })
                                                    }
                                                }}
                                                color={primaryColor}
                                            />
                                        )
                                    })}
                                </Group>
                            </Stack>
                        ) : null}
                        {applicableMeritFlawModifiers.length > 0 ? (
                            <Stack gap="xs" mt="sm">
                                <Group gap="xs" align="center">
                                    <ActionIcon
                                        variant="subtle"
                                        color={primaryColor}
                                        size="sm"
                                        onClick={toggleMeritFlawExpanded}
                                        title={
                                            meritFlawExpanded
                                                ? "Collapse merits and flaws"
                                                : "Expand merits and flaws"
                                        }
                                        aria-label={
                                            meritFlawExpanded
                                                ? "Collapse merits and flaws"
                                                : "Expand merits and flaws"
                                        }
                                    >
                                        <IconChevronDown
                                            size={18}
                                            style={{
                                                transform: meritFlawExpanded
                                                    ? "rotate(0deg)"
                                                    : "rotate(-90deg)",
                                                transition: "transform 0.2s"
                                            }}
                                        />
                                    </ActionIcon>
                                    <Text fw={600} fz="sm" c={primaryColor}>
                                        Merits & Flaws:
                                    </Text>
                                </Group>
                                <Collapse in={meritFlawExpanded}>
                                    <Group gap="xs">
                                        {applicableMeritFlawModifiers.map(
                                            ({ meritFlaw, bonusDice, reason, key }) => {
                                                const isChecked =
                                                    selectedDicePool.selectedMeritFlaws.includes(key)

                                                return (
                                                    <Checkbox
                                                        key={key}
                                                        label={`${meritFlaw.name} (${formatDiceModifier(bonusDice)})`}
                                                        description={reason}
                                                        checked={isChecked}
                                                        onChange={(e) => {
                                                            if (e.currentTarget.checked) {
                                                                updateSelectedDicePool({
                                                                    selectedMeritFlaws: [
                                                                        ...selectedDicePool.selectedMeritFlaws,
                                                                        key
                                                                    ]
                                                                })
                                                            } else {
                                                                updateSelectedDicePool({
                                                                    selectedMeritFlaws:
                                                                        selectedDicePool.selectedMeritFlaws.filter(
                                                                            (modifierKey) =>
                                                                                modifierKey !== key
                                                                        )
                                                                })
                                                            }
                                                        }}
                                                        color={primaryColor}
                                                    />
                                                )
                                            }
                                        )}
                                    </Group>
                                </Collapse>
                            </Stack>
                        ) : null}
                    </Stack>
                </Collapse>
            </Stack>
        </Box>
    )
}

export default SelectedDicePoolDisplay
