import { Box, Grid, Group, Text, Title, Badge, Stack, TextInput, Tooltip } from "@mantine/core"
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { skillsKeySchema, SkillsKey } from "~/data/Skills"
import { upcase } from "~/generator/utils"
import Pips from "~/character_sheet/components/Pips"
import { SheetOptions } from "../CharacterSheet"
import { getAvailableXP, canAffordUpgrade, getSpecialtyCost } from "../utils/xp"
import { useCharacterSheetStore } from "../stores/characterSheetStore"
import { useDiceRollModalStore } from "../stores/diceRollModalStore"
import { useShallow } from "zustand/react/shallow"

type SkillsProps = {
    options: SheetOptions
}

type SpecialtyEntry = {
    skill: string
    name: string
    fromPredatorType?: boolean
}

const noSpecialties: SpecialtyEntry[] = []

type SkillRowProps = {
    skill: SkillsKey
    specialties: SpecialtyEntry[]
    character: SheetOptions["character"]
    options: SheetOptions
    primaryColor: string
    textStyle: React.CSSProperties
    isEditable: boolean
    addSpecialty: (skill: SkillsKey) => void
    addSpecialtyDisabledReason?: string
    updateSpecialty: (skill: SkillsKey, index: number, newName: string) => void
    removeSpecialty: (skill: SkillsKey, index: number) => void
}

const SkillRow = ({
    skill,
    specialties,
    character,
    options,
    primaryColor,
    textStyle,
    isEditable,
    addSpecialty,
    addSpecialtyDisabledReason,
    updateSpecialty,
    removeSpecialty
}: SkillRowProps) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const testContentRef = useRef<HTMLDivElement>(null)
    const [showSpecialtiesBelow, setShowSpecialtiesBelow] = useState(false)
    const [editingSpecialty, setEditingSpecialty] = useState<{
        skill: SkillsKey
        index: number
    } | null>(null)
    const [editingValue, setEditingValue] = useState<string>("")
    const { isSelected, updateSelectedDicePool } = useCharacterSheetStore(
        useShallow((state) => ({
            isSelected: state.selectedDicePool.skill === skill,
            updateSelectedDicePool: state.updateSelectedDicePool
        }))
    )

    const handleSkillClick = () => {
        const diceModalOpened = useDiceRollModalStore.getState().opened
        const newSkill = diceModalOpened && isSelected ? null : skill
        updateSelectedDicePool({
            skill: newSkill,
            discipline: null,
            selectedSpecialties: [],
            selectedDisciplinePowers: [],
            selectedMeritFlaws: []
        })
        if (!diceModalOpened) {
            useDiceRollModalStore.getState().openSelectedPool()
        }
    }

    useEffect(() => {
        const checkOverflow = () => {
            if (!containerRef.current || !testContentRef.current || specialties.length === 0) {
                setShowSpecialtiesBelow(false)
                return
            }

            requestAnimationFrame(() => {
                if (!containerRef.current || !testContentRef.current) return

                const containerWidth = containerRef.current.offsetWidth
                const testContentWidth = testContentRef.current.scrollWidth

                const pipsElement = containerRef.current.querySelector(
                    '[class*="Group"]:last-child'
                )
                const pipsWidth = pipsElement ? (pipsElement as HTMLElement).offsetWidth : 200

                const availableWidth = containerWidth - pipsWidth - 20

                setShowSpecialtiesBelow(testContentWidth > availableWidth)
            })
        }

        const timeoutId1 = setTimeout(checkOverflow, 10)
        const timeoutId2 = setTimeout(checkOverflow, 100)
        window.addEventListener("resize", checkOverflow)

        return () => {
            clearTimeout(timeoutId1)
            clearTimeout(timeoutId2)
            window.removeEventListener("resize", checkOverflow)
        }
    }, [specialties.length, skill, character.skills[skill]])

    const renderAddSpecialtyBadge = () => {
        const disabledReason = addSpecialtyDisabledReason
        const cost = options.mode === "xp" ? getSpecialtyCost() : undefined
        const tooltipLabel = disabledReason || (cost !== undefined ? `${cost} XP` : undefined)
        const badge = (
            <Badge
                variant="light"
                size="sm"
                color={primaryColor}
                style={{
                    cursor: disabledReason ? "default" : "pointer",
                    opacity: disabledReason ? 0.6 : 1
                }}
                onClick={
                    disabledReason
                        ? undefined
                        : (e) => {
                              e.stopPropagation()
                              addSpecialty(skill)
                          }
                }
            >
                +
            </Badge>
        )
        return tooltipLabel ? (
            <Tooltip label={tooltipLabel} withArrow>
                <span style={{ display: "inline-block" }}>{badge}</span>
            </Tooltip>
        ) : (
            badge
        )
    }

    return (
        <Group ref={containerRef} justify="space-between" mb="xs" wrap="nowrap" align="flex-start">
            <Group
                ref={testContentRef}
                gap="xs"
                wrap="nowrap"
                style={{
                    position: "absolute",
                    visibility: "hidden",
                    whiteSpace: "nowrap",
                    pointerEvents: "none"
                }}
            >
                <Text style={textStyle}>{upcase(skill)}</Text>
                {specialties.map((specialty, index) => (
                    <Badge
                        key={`test-${skill}-${specialty.name}-${index}`}
                        variant="light"
                        size="sm"
                        color={primaryColor}
                    >
                        {specialty.name || "New Specialty"}
                    </Badge>
                ))}
            </Group>

            {showSpecialtiesBelow ? (
                <Stack gap="xs" style={{ flex: 1 }}>
                    <Group gap="xs" wrap="nowrap">
                        <Text
                            style={{
                                ...textStyle,
                                cursor: "pointer"
                            }}
                            onClick={handleSkillClick}
                        >
                            {upcase(skill)}
                        </Text>
                        {isEditable && renderAddSpecialtyBadge()}
                    </Group>
                    {specialties.length > 0 ? (
                        <Group gap="xs" wrap="wrap">
                            {specialties.map((specialty, index) => {
                                if (specialty.fromPredatorType) {
                                    return (
                                        <Badge
                                            key={`${skill}-bonus-${specialty.name}-${index}`}
                                            variant="outline"
                                            size="sm"
                                            color={primaryColor}
                                        >
                                            {specialty.name}
                                        </Badge>
                                    )
                                }
                                const isEditing =
                                    editingSpecialty?.skill === skill &&
                                    editingSpecialty?.index === index
                                return isEditing ? (
                                    <TextInput
                                        key={`${skill}-edit-${specialty.name}-${index}`}
                                        value={editingValue}
                                        onChange={(e) => setEditingValue(e.target.value)}
                                        onBlur={() => {
                                            if (editingValue.trim() === "") {
                                                removeSpecialty(skill, index)
                                            } else {
                                                updateSpecialty(skill, index, editingValue)
                                            }
                                            setEditingSpecialty(null)
                                            setEditingValue("")
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                if (editingValue.trim() === "") {
                                                    removeSpecialty(skill, index)
                                                } else {
                                                    updateSpecialty(skill, index, editingValue)
                                                }
                                                setEditingSpecialty(null)
                                                setEditingValue("")
                                            }
                                        }}
                                        size="xs"
                                        autoFocus
                                        style={{ width: "100%" }}
                                    />
                                ) : (
                                    <Badge
                                        key={`${skill}-${specialty.name}-${index}`}
                                        variant="light"
                                        size="sm"
                                        color={primaryColor}
                                        style={isEditable ? { cursor: "pointer" } : undefined}
                                        onClick={
                                            isEditable
                                                ? (e) => {
                                                      e.stopPropagation()
                                                      setEditingSpecialty({ skill, index })
                                                      setEditingValue(specialty.name)
                                                  }
                                                : undefined
                                        }
                                    >
                                        {specialty.name || "New Specialty"}
                                    </Badge>
                                )
                            })}
                        </Group>
                    ) : null}
                </Stack>
            ) : (
                <Group gap="xs" wrap="nowrap" style={{ flex: 1 }}>
                    <Text
                        style={{
                            ...textStyle,
                            cursor: "pointer",
                            borderRadius: "4px",
                            backgroundColor: isSelected ? `${primaryColor}33` : undefined,
                            transition: "background-color 0.2s"
                        }}
                        onClick={handleSkillClick}
                    >
                        {upcase(skill)}
                    </Text>
                    {specialties.map((specialty, index) => {
                        if (specialty.fromPredatorType) {
                            return (
                                <Badge
                                    key={`${skill}-bonus-${specialty.name}-${index}`}
                                    variant="outline"
                                    size="sm"
                                    color={primaryColor}
                                >
                                    {specialty.name}
                                </Badge>
                            )
                        }
                        const isEditing =
                            editingSpecialty?.skill === skill && editingSpecialty?.index === index
                        return isEditing ? (
                            <TextInput
                                key={`${skill}-edit-${specialty.name}-${index}`}
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                onBlur={() => {
                                    if (editingValue.trim() === "") {
                                        removeSpecialty(skill, index)
                                    } else {
                                        updateSpecialty(skill, index, editingValue)
                                    }
                                    setEditingSpecialty(null)
                                    setEditingValue("")
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        if (editingValue.trim() === "") {
                                            removeSpecialty(skill, index)
                                        } else {
                                            updateSpecialty(skill, index, editingValue)
                                        }
                                        setEditingSpecialty(null)
                                        setEditingValue("")
                                    }
                                }}
                                size="xs"
                                autoFocus
                                style={{ width: "100%" }}
                            />
                        ) : (
                            <Badge
                                key={`${skill}-${specialty.name}-${index}`}
                                variant="light"
                                size="sm"
                                color={primaryColor}
                                style={isEditable ? { cursor: "pointer" } : undefined}
                                onClick={
                                    isEditable
                                        ? (e) => {
                                              e.stopPropagation()
                                              setEditingSpecialty({ skill, index })
                                              setEditingValue(specialty.name)
                                          }
                                        : undefined
                                }
                            >
                                {specialty.name || "New Specialty"}
                            </Badge>
                        )
                    })}
                    {isEditable && renderAddSpecialtyBadge()}
                </Group>
            )}
            <Box
                onClick={(e) => {
                    if (useDiceRollModalStore.getState().opened) {
                        e.stopPropagation()
                    }
                }}
            >
                <Pips level={character.skills[skill]} options={options} field={`skills.${skill}`} />
            </Box>
        </Group>
    )
}

const MemoizedSkillRow = memo(SkillRow, (prev, next) => {
    const previous = prev.options
    const following = next.options
    return (
        prev.skill === next.skill &&
        prev.specialties === next.specialties &&
        prev.primaryColor === next.primaryColor &&
        prev.isEditable === next.isEditable &&
        prev.addSpecialtyDisabledReason === next.addSpecialtyDisabledReason &&
        prev.addSpecialty === next.addSpecialty &&
        prev.updateSpecialty === next.updateSpecialty &&
        prev.removeSpecialty === next.removeSpecialty &&
        previous.mode === following.mode &&
        previous.canEdit === following.canEdit &&
        previous.editDisabledReason === following.editDisabledReason &&
        previous.setCharacter === following.setCharacter &&
        previous.character.skills[prev.skill] === following.character.skills[next.skill] &&
        previous.character.generation === following.character.generation &&
        previous.character.experience === following.character.experience &&
        previous.character.ephemeral.experienceSpent ===
            following.character.ephemeral.experienceSpent
    )
})

const skillTextStyle: React.CSSProperties = {
    fontFamily: "Courier New"
}

// TODOdin: Refund XP when a newly created specialty is removed
const Skills = ({ options }: SkillsProps) => {
    const { character, primaryColor, mode, setCharacter } = options
    const isEditable = mode === "xp" || mode === "free"

    // Map skill to array of specialty objects (not just names) for editing
    const specialtiesBySkill = useMemo(() => {
        const groupedSpecialties = new Map<string, SpecialtyEntry[]>()
        character.skillSpecialties.forEach((specialty) => {
            if (!groupedSpecialties.has(specialty.skill)) {
                groupedSpecialties.set(specialty.skill, [])
            }
            groupedSpecialties.get(specialty.skill)!.push(specialty)
        })
        // Include predator type specialties as read-only entries
        character.predatorType.pickedSpecialties.forEach((specialty) => {
            if (!specialty.name) return
            if (!groupedSpecialties.has(specialty.skill)) {
                groupedSpecialties.set(specialty.skill, [])
            }
            groupedSpecialties.get(specialty.skill)!.push({ ...specialty, fromPredatorType: true })
        })
        return groupedSpecialties
    }, [character.predatorType.pickedSpecialties, character.skillSpecialties])
    const addSpecialty = useCallback(
        (skill: SkillsKey) => {
            if (mode === "xp") {
                const cost = getSpecialtyCost()
                setCharacter((currentCharacter) => {
                    const currentAvailableXP = getAvailableXP(currentCharacter)
                    if (!canAffordUpgrade(currentAvailableXP, cost)) {
                        return currentCharacter
                    }
                    return {
                        ...currentCharacter,
                        skillSpecialties: [
                            ...currentCharacter.skillSpecialties,
                            { skill, name: "" }
                        ],
                        ephemeral: {
                            ...currentCharacter.ephemeral,
                            experienceSpent: currentCharacter.ephemeral.experienceSpent + cost
                        }
                    }
                })
            } else {
                setCharacter((currentCharacter) => ({
                    ...currentCharacter,
                    skillSpecialties: [...currentCharacter.skillSpecialties, { skill, name: "" }]
                }))
            }
        },
        [mode, setCharacter]
    )

    const addSpecialtyDisabledReason = useMemo((): string | undefined => {
        if (mode !== "xp") return undefined
        const cost = getSpecialtyCost()
        const availableXP = getAvailableXP(character)
        if (!canAffordUpgrade(availableXP, cost)) {
            return `Insufficient XP. Need ${cost}, have ${availableXP}`
        }
        return undefined
    }, [character, mode])

    const updateSpecialty = useCallback(
        (skill: SkillsKey, index: number, newName: string) => {
            setCharacter((currentCharacter) => {
                const skillSpecialties = [...currentCharacter.skillSpecialties]
                const skillSpecialtiesForThisSkill = skillSpecialties.filter(
                    (specialty) => specialty.skill === skill
                )
                const specialtyToUpdate = skillSpecialtiesForThisSkill[index]
                if (specialtyToUpdate) {
                    const globalIndex = skillSpecialties.indexOf(specialtyToUpdate)
                    if (globalIndex !== -1) {
                        skillSpecialties[globalIndex] = { skill, name: newName }
                        return { ...currentCharacter, skillSpecialties }
                    }
                }
                return currentCharacter
            })
        },
        [setCharacter]
    )

    const removeSpecialty = useCallback(
        (skill: SkillsKey, index: number) => {
            setCharacter((currentCharacter) => {
                const skillSpecialtiesForThisSkill = currentCharacter.skillSpecialties.filter(
                    (specialty) => specialty.skill === skill
                )
                const specialtyToRemove = skillSpecialtiesForThisSkill[index]
                if (!specialtyToRemove) return currentCharacter
                return {
                    ...currentCharacter,
                    skillSpecialties: currentCharacter.skillSpecialties.filter(
                        (specialty) => specialty !== specialtyToRemove
                    )
                }
            })
        },
        [setCharacter]
    )

    /*
     * Keep row callbacks stable so changing one skill does not invalidate every skill row.
     * XP affordability is passed as a primitive because it legitimately affects all rows.
     */
    const renderSkillRow = (skill: SkillsKey) => {
        const specialties = specialtiesBySkill.get(skill) || noSpecialties
        return (
            <MemoizedSkillRow
                key={skill}
                skill={skill}
                specialties={specialties}
                character={character}
                options={options}
                primaryColor={primaryColor}
                textStyle={skillTextStyle}
                isEditable={isEditable}
                addSpecialty={addSpecialty}
                addSpecialtyDisabledReason={addSpecialtyDisabledReason}
                updateSpecialty={updateSpecialty}
                removeSpecialty={removeSpecialty}
            />
        )
    }

    return (
        <Box>
            <Title order={2} mb="md" c={primaryColor}>
                Skills
            </Title>
            <Grid>
                <Grid.Col span={{ base: 12, md: 4 }}>
                    <Title order={4} mb="sm" c="dimmed">
                        PHYSICAL
                    </Title>
                    {[
                        "athletics",
                        "brawl",
                        "craft",
                        "drive",
                        "firearms",
                        "melee",
                        "larceny",
                        "stealth",
                        "survival"
                    ]
                        .map((s) => skillsKeySchema.parse(s))
                        .map(renderSkillRow)}
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                    <Title order={4} mb="sm" c="dimmed">
                        SOCIAL
                    </Title>
                    {[
                        "animal ken",
                        "etiquette",
                        "insight",
                        "intimidation",
                        "leadership",
                        "performance",
                        "persuasion",
                        "streetwise",
                        "subterfuge"
                    ]
                        .map((s) => skillsKeySchema.parse(s))
                        .map(renderSkillRow)}
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                    <Title order={4} mb="sm" c="dimmed">
                        MENTAL
                    </Title>
                    {[
                        "academics",
                        "awareness",
                        "finance",
                        "investigation",
                        "medicine",
                        "occult",
                        "politics",
                        "science",
                        "technology"
                    ]
                        .map((s) => skillsKeySchema.parse(s))
                        .map(renderSkillRow)}
                </Grid.Col>
            </Grid>
        </Box>
    )
}

export default memo(Skills, (prev, next) => {
    return (
        prev.options.mode === next.options.mode &&
        prev.options.primaryColor === next.options.primaryColor &&
        prev.options.character.skills === next.options.character.skills &&
        prev.options.character.skillSpecialties === next.options.character.skillSpecialties &&
        prev.options.character.predatorType.pickedSpecialties ===
            next.options.character.predatorType.pickedSpecialties &&
        prev.options.character.experience === next.options.character.experience &&
        prev.options.character.ephemeral.experienceSpent ===
            next.options.character.ephemeral.experienceSpent
    )
})
