import { Box, Grid, Group, Text, Title, Badge, Stack, TextInput, Tooltip, useMantineTheme } from "@mantine/core"
import { useRef, useEffect, useState } from "react"
import { skillsKeySchema, SkillsKey } from "~/data/Skills"
import { upcase } from "~/generator/utils"
import Pips from "~/character_sheet/components/Pips"
import FocusBorderWrapper from "~/character_sheet/components/FocusBorderWrapper"
import { SheetOptions } from "../CharacterSheet"
import { getAvailableXP, canAffordUpgrade, getSpecialtyCost } from "../utils/xp"
import { useCharacterSheetStore } from "../stores/characterSheetStore"
import { useShallow } from "zustand/react/shallow"

type SkillsProps = {
    options: SheetOptions
}

type SkillRowProps = {
    skill: SkillsKey
    specialties: Array<{ skill: string; name: string }>
    character: SheetOptions["character"]
    options: SheetOptions
    primaryColor: string
    colorValue: string
    textStyle: React.CSSProperties
    isEditable: boolean
    addSpecialty: (skill: SkillsKey) => void
    getAddSpecialtyDisabledReason: () => string | undefined
    updateSpecialty: (skill: SkillsKey, index: number, newName: string) => void
    removeSpecialty: (skill: SkillsKey, index: number) => void
}

const SkillRow = ({
    skill,
    specialties,
    character,
    options,
    primaryColor,
    colorValue,
    textStyle,
    isEditable,
    addSpecialty,
    getAddSpecialtyDisabledReason,
    updateSpecialty,
    removeSpecialty,
}: SkillRowProps) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const testContentRef = useRef<HTMLDivElement>(null)
    const [showSpecialtiesBelow, setShowSpecialtiesBelow] = useState(false)
    const [editingSpecialty, setEditingSpecialty] = useState<{ skill: SkillsKey; index: number } | null>(null)
    const [editingValue, setEditingValue] = useState<string>("")
    const { selectedDicePool, updateSelectedDicePool } = useCharacterSheetStore(
        useShallow((state) => ({
            selectedDicePool: state.selectedDicePool,
            updateSelectedDicePool: state.updateSelectedDicePool,
        }))
    )
    
    const isClickable = options.diceModalOpened
    const isSelected = selectedDicePool.skill === skill

    const handleSkillClick = () => {
        if (!isClickable) return
        const newSkill = isSelected ? null : skill
        updateSelectedDicePool({
            skill: newSkill,
            discipline: null,
            selectedSpecialties: [],
            selectedDisciplinePowers: [],
        })
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

                const pipsElement = containerRef.current.querySelector('[class*="Group"]:last-child')
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
        const disabledReason = getAddSpecialtyDisabledReason()
        const cost = options.mode === "xp" ? getSpecialtyCost() : undefined
        const tooltipLabel = disabledReason || (cost !== undefined ? `${cost} XP` : undefined)
        const badge = (
            <Badge
                variant="light"
                size="sm"
                color={primaryColor}
                style={{
                    cursor: disabledReason ? "default" : "pointer",
                    opacity: disabledReason ? 0.6 : 1,
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
        <Group
            ref={containerRef}
            justify="space-between"
            mb="xs"
            wrap="nowrap"
            align="flex-start"
        >
            <Group
                ref={testContentRef}
                gap="xs"
                wrap="nowrap"
                style={{
                    position: "absolute",
                    visibility: "hidden",
                    whiteSpace: "nowrap",
                    pointerEvents: "none",
                }}
            >
                <Text style={textStyle}>{upcase(skill)}</Text>
                {specialties.map((specialty, index) => (
                    <Badge key={`test-${skill}-${specialty.name}-${index}`} variant="light" size="sm" color={primaryColor}>
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
                                cursor: isClickable ? "pointer" : "default",
                                userSelect: "none",
                            }}
                            onClick={isClickable ? handleSkillClick : undefined}
                        >
                            {upcase(skill)}
                        </Text>
                        {isEditable && renderAddSpecialtyBadge()}
                    </Group>
                    {specialties.length > 0 ? (
                        <Group gap="xs" wrap="wrap">
                            {specialties.map((specialty, index) => {
                                const isEditing = editingSpecialty?.skill === skill && editingSpecialty?.index === index
                                return isEditing ? (
                                    <FocusBorderWrapper key={`${skill}-${index}-edit`} colorValue={colorValue} style={{ width: "100px" }}>
                                        <TextInput
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
                                    </FocusBorderWrapper>
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
                            cursor: isClickable ? "pointer" : "default",
                            userSelect: "none",
                            padding: isClickable ? "4px 8px" : undefined,
                            borderRadius: isClickable ? "4px" : undefined,
                            backgroundColor: isClickable && isSelected ? `${primaryColor}33` : undefined,
                            transition: isClickable ? "background-color 0.2s" : undefined,
                        }}
                        onClick={isClickable ? handleSkillClick : undefined}
                    >
                        {upcase(skill)}
                    </Text>
                    {specialties.map((specialty, index) => {
                        const isEditing = editingSpecialty?.skill === skill && editingSpecialty?.index === index
                        return isEditing ? (
                            <FocusBorderWrapper key={`${skill}-${index}-edit`} colorValue={colorValue} style={{ width: "100px" }}>
                                <TextInput
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
                            </FocusBorderWrapper>
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
            <Box onClick={(e) => {
                if (isClickable) {
                    e.stopPropagation()
                }
            }}>
                <Pips level={character.skills[skill]} options={options} field={`skills.${skill}`} />
            </Box>
        </Group>
    )
}

// TODOdin: Refund XP when a newly created specialty is removed
const Skills = ({ options }: SkillsProps) => {
    const { character, primaryColor, mode, setCharacter } = options
    const theme = useMantineTheme()
    const colorValue = theme.colors[primaryColor]?.[6] || theme.colors.grape[6]
    const textStyle = {
        fontFamily: "Courier New",
    }
    const isEditable = mode === "xp" || mode === "free"

    // Map skill to array of specialty objects (not just names) for editing
    const specialtiesBySkill = new Map<string, typeof character.skillSpecialties>()
    character.skillSpecialties.forEach((specialty) => {
        if (!specialtiesBySkill.has(specialty.skill)) {
            specialtiesBySkill.set(specialty.skill, [])
        }
        specialtiesBySkill.get(specialty.skill)!.push(specialty)
    })

    const addSpecialty = (skill: SkillsKey) => {
        if (mode === "xp") {
            const cost = getSpecialtyCost()
            const availableXP = getAvailableXP(character)
            if (!canAffordUpgrade(availableXP, cost)) {
                return
            }
            setCharacter({
                ...character,
                skillSpecialties: [...character.skillSpecialties, { skill, name: "" }],
                ephemeral: {
                    ...character.ephemeral,
                    experienceSpent: character.ephemeral.experienceSpent + cost,
                },
            })
        } else {
            setCharacter({
                ...character,
                skillSpecialties: [...character.skillSpecialties, { skill, name: "" }],
            })
        }
    }

    const getAddSpecialtyDisabledReason = (): string | undefined => {
        if (mode !== "xp") return undefined
        const cost = getSpecialtyCost()
        const availableXP = getAvailableXP(character)
        if (!canAffordUpgrade(availableXP, cost)) {
            return `Insufficient XP. Need ${cost}, have ${availableXP}`
        }
        return undefined
    }

    const updateSpecialty = (skill: SkillsKey, index: number, newName: string) => {
        const skillSpecialties = [...character.skillSpecialties]
        const skillSpecialtiesForThisSkill = skillSpecialties.filter((s) => s.skill === skill)
        const specialtyToUpdate = skillSpecialtiesForThisSkill[index]
        if (specialtyToUpdate) {
            const globalIndex = skillSpecialties.indexOf(specialtyToUpdate)
            if (globalIndex !== -1) {
                skillSpecialties[globalIndex] = { skill, name: newName }
                setCharacter({
                    ...character,
                    skillSpecialties,
                })
            }
        }
    }

    const removeSpecialty = (skill: SkillsKey, index: number) => {
        const skillSpecialtiesForThisSkill = character.skillSpecialties.filter((s) => s.skill === skill)
        const specialtyToRemove = skillSpecialtiesForThisSkill[index]
        if (specialtyToRemove) {
            const skillSpecialties = character.skillSpecialties.filter((s) => s !== specialtyToRemove)
            setCharacter({
                ...character,
                skillSpecialties,
            })
        }
    }

    const renderSkillRow = (skill: SkillsKey) => {
        const specialties = specialtiesBySkill.get(skill) || []
        return (
            <SkillRow
                key={skill}
                skill={skill}
                specialties={specialties}
                character={character}
                options={options}
                primaryColor={primaryColor}
                colorValue={colorValue}
                textStyle={textStyle}
                isEditable={isEditable}
                addSpecialty={addSpecialty}
                getAddSpecialtyDisabledReason={getAddSpecialtyDisabledReason}
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
                    {["athletics", "brawl", "craft", "drive", "firearms", "melee", "larceny", "stealth", "survival"]
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
                        "subterfuge",
                    ]
                        .map((s) => skillsKeySchema.parse(s))
                        .map(renderSkillRow)}
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                    <Title order={4} mb="sm" c="dimmed">
                        MENTAL
                    </Title>
                    {["academics", "awareness", "finance", "investigation", "medicine", "occult", "politics", "science", "technology"]
                        .map((s) => skillsKeySchema.parse(s))
                        .map(renderSkillRow)}
                </Grid.Col>
            </Grid>
        </Box>
    )
}

export default Skills
