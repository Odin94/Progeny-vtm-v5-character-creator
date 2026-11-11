import { TextInput, Textarea, Tooltip } from "@mantine/core"
import { IconPlus } from "@tabler/icons-react"
import { memo, useCallback, useEffect, useMemo, useState } from "react"
import posthog from "posthog-js"
import { skillsKeySchema, SkillsKey } from "~/data/Skills"
import { upcase } from "~/generator/utils"
import Pips from "~/character_sheet/components/Pips"
import { SheetOptions } from "../CharacterSheet"
import { getAvailableXP, canAffordUpgrade, getSpecialtyCost } from "../utils/xp"
import { useCharacterSheetStore } from "../stores/characterSheetStore"
import { useDiceRollModalStore } from "../stores/diceRollModalStore"
import { useShallow } from "zustand/react/shallow"
import { removeSkillSpecialty } from "../utils/specialties"
import classes from "../sheet.module.css"
import type { Specialty } from "~/data/Specialties"
import { getSkillSpecialtyCustomTextKey, updateCustomText } from "~/utils/customText"

type SkillsProps = {
    options: SheetOptions
}

type SpecialtyEntry = Specialty & {
    fromPredatorType?: boolean
}

const noSpecialties: SpecialtyEntry[] = []

type SkillRowProps = {
    skill: SkillsKey
    specialties: SpecialtyEntry[]
    character: SheetOptions["character"]
    options: SheetOptions
    primaryColor: string
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
    isEditable,
    addSpecialty,
    addSpecialtyDisabledReason,
    updateSpecialty,
    removeSpecialty
}: SkillRowProps) => {
    const [editingSpecialty, setEditingSpecialty] = useState<{
        skill: SkillsKey
        index: number
    } | null>(null)
    const [editingValue, setEditingValue] = useState<string>("")
    const [editingPredatorTypeSpecialty, setEditingPredatorTypeSpecialty] = useState<number | null>(
        null
    )
    // Reason shown inline (not just on hover) after a blocked "+" click.
    const [addBlockedReason, setAddBlockedReason] = useState<string | undefined>(undefined)
    // Drop a stale inline reason once the mode or affordability that caused it changes.
    useEffect(() => {
        setAddBlockedReason(undefined)
    }, [options.mode, addSpecialtyDisabledReason])
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
            secondAttribute: null,
            selectedSpecialties: [],
            selectedDisciplinePowers: [],
            selectedMeritFlaws: []
        })
        if (!diceModalOpened) {
            useDiceRollModalStore.getState().openSelectedPool()
        }
    }

    // Number of user-added (non-predator) specialties, i.e. the index a newly added one lands at.
    const editableSpecialtyCount = specialties.filter(
        (specialty) => !specialty.fromPredatorType
    ).length

    const handleAddSpecialtyClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        // Explain a blocked add inline instead of only through a hover tooltip.
        if (addSpecialtyDisabledReason) {
            setAddBlockedReason(addSpecialtyDisabledReason)
            try {
                posthog.capture("sheet-specialty-add-blocked", {
                    skill,
                    mode: options.mode,
                    reason: addSpecialtyDisabledReason
                })
            } catch (error) {
                console.warn("PostHog sheet-specialty-add-blocked tracking failed:", error)
            }
            return
        }
        setAddBlockedReason(undefined)
        addSpecialty(skill)
        // Drop straight into naming the new specialty so it isn't left as an empty
        // "New Specialty" badge that has to be clicked a second time to fill in.
        setEditingSpecialty({ skill, index: editableSpecialtyCount })
        setEditingValue("")
        try {
            posthog.capture("sheet-specialty-add", { skill, mode: options.mode })
        } catch (error) {
            console.warn("PostHog sheet-specialty-add tracking failed:", error)
        }
    }

    const renderPredatorTypeSpecialty = (specialty: SpecialtyEntry, index: number) => {
        const customTextKey = getSkillSpecialtyCustomTextKey(specialty)
        const customText = character.customText.skillSpecialties[customTextKey] ?? ""
        const isEditing = editingPredatorTypeSpecialty === index

        const isFreeMode = options.mode === "free"

        return (
            <span
                key={`${skill}-bonus-${specialty.name}-${index}`}
                className={classes.fieldInline}
                style={isEditing ? { flex: "1 1 100%" } : undefined}
            >
                <Tooltip label="From predator type" withArrow>
                    <span
                        className={classes.specialty}
                        data-source="predator"
                        data-editable={isFreeMode || undefined}
                        onClick={
                            isFreeMode
                                ? (event) => {
                                      event.stopPropagation()
                                      setEditingPredatorTypeSpecialty((current) =>
                                          current === index ? null : index
                                      )
                                  }
                                : undefined
                        }
                        onMouseDown={(event) => event.preventDefault()}
                    >
                        {[specialty.name, customText.trim()].filter(Boolean).join(" ")}
                    </span>
                </Tooltip>
                {isEditing ? (
                    <Textarea
                        className={classes.specialtyInput}
                        aria-label={`${upcase(skill)} ${specialty.name} custom note`}
                        value={customText}
                        onChange={(event) => {
                            const value = event.currentTarget.value
                            options.setCharacter((current) => ({
                                ...current,
                                customText: updateCustomText(
                                    current,
                                    "skillSpecialties",
                                    customTextKey,
                                    value
                                )
                            }))
                        }}
                        placeholder="Add a custom note..."
                        minRows={1}
                        size="xs"
                        autoFocus
                        onBlur={() => setEditingPredatorTypeSpecialty(null)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                event.preventDefault()
                                setEditingPredatorTypeSpecialty(null)
                            }
                        }}
                    />
                ) : null}
            </span>
        )
    }

    const renderAddSpecialtyButton = () => {
        const cost = options.mode === "xp" ? getSpecialtyCost() : undefined
        const tooltipLabel =
            addSpecialtyDisabledReason ||
            (cost !== undefined ? `Add specialty · ${cost} XP` : "Add specialty")
        return (
            <Tooltip label={tooltipLabel} withArrow>
                <button
                    type="button"
                    className={classes.addSpecialty}
                    aria-label={`Add ${upcase(skill)} specialty`}
                    data-blocked={addSpecialtyDisabledReason ? true : undefined}
                    onClick={handleAddSpecialtyClick}
                >
                    <IconPlus size={12} stroke={2.2} />
                </button>
            </Tooltip>
        )
    }

    const finishEditing = (index: number) => {
        if (editingValue.trim() === "") {
            removeSpecialty(skill, index)
        } else {
            updateSpecialty(skill, index, editingValue)
        }
        setEditingSpecialty(null)
        setEditingValue("")
    }

    const level = character.skills[skill]

    return (
        <div
            className={`${classes.traitRow} ${classes.skillRow}`}
            data-selected={isSelected || undefined}
            data-zero={level === 0 || undefined}
        >
            <p className={classes.traitName} onClick={handleSkillClick}>
                {upcase(skill)}
            </p>
            <span className={classes.leader} aria-hidden="true" />
            <div
                className={classes.traitPips}
                onClick={(e) => {
                    if (useDiceRollModalStore.getState().opened) {
                        e.stopPropagation()
                    }
                }}
            >
                <Pips
                    level={level}
                    options={options}
                    field={`skills.${skill}`}
                    label={upcase(skill)}
                />
            </div>
            {isEditable ? renderAddSpecialtyButton() : null}
            {specialties.length > 0 ? (
                <div className={classes.specialties}>
                    {specialties.map((specialty, index) => {
                        if (specialty.fromPredatorType) {
                            return renderPredatorTypeSpecialty(specialty, index)
                        }
                        const isEditing =
                            editingSpecialty?.skill === skill && editingSpecialty?.index === index
                        return isEditing ? (
                            <TextInput
                                key={`${skill}-edit-${specialty.name}-${index}`}
                                className={classes.specialtyInput}
                                aria-label={`${upcase(skill)} specialty`}
                                placeholder="Specialty"
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                onBlur={() => finishEditing(index)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        finishEditing(index)
                                    }
                                }}
                                size="xs"
                                autoFocus
                            />
                        ) : (
                            <span
                                key={`${skill}-${specialty.name}-${index}`}
                                className={classes.specialty}
                                data-editable={isEditable || undefined}
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
                            </span>
                        )
                    })}
                </div>
            ) : null}
            {addBlockedReason ? <p className={classes.inlineWarning}>{addBlockedReason}</p> : null}
        </div>
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
        (previous.mode !== "xp" ||
            getAvailableXP(previous.character) === getAvailableXP(following.character)) &&
        previous.character.customText.skillSpecialties ===
            following.character.customText.skillSpecialties
    )
})

const skillGroups: Array<{ title: string; skills: string[] }> = [
    {
        title: "Physical",
        skills: [
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
    },
    {
        title: "Social",
        skills: [
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
    },
    {
        title: "Mental",
        skills: [
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
    }
]

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
            try {
                posthog.capture("sheet-specialty-rename", { skill, mode })
            } catch (error) {
                console.warn("PostHog sheet-specialty-rename tracking failed:", error)
            }
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
        [mode, setCharacter]
    )

    const removeSpecialty = useCallback(
        (skill: SkillsKey, index: number) => {
            setCharacter((currentCharacter) =>
                removeSkillSpecialty(currentCharacter, skill, index, mode === "xp")
            )
        },
        [mode, setCharacter]
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
                isEditable={isEditable}
                addSpecialty={addSpecialty}
                addSpecialtyDisabledReason={addSpecialtyDisabledReason}
                updateSpecialty={updateSpecialty}
                removeSpecialty={removeSpecialty}
            />
        )
    }

    return (
        <div className={classes.triad}>
            {skillGroups.map(({ title, skills }) => (
                <div key={title} className={classes.column}>
                    <h3 className={classes.columnTitle}>{title}</h3>
                    {skills.map((s) => skillsKeySchema.parse(s)).map(renderSkillRow)}
                </div>
            ))}
        </div>
    )
}

export default memo(Skills, (prev, next) => {
    return (
        prev.options.mode === next.options.mode &&
        prev.options.primaryColor === next.options.primaryColor &&
        prev.options.canEdit === next.options.canEdit &&
        prev.options.editDisabledReason === next.options.editDisabledReason &&
        prev.options.setCharacter === next.options.setCharacter &&
        prev.options.character.skills === next.options.character.skills &&
        prev.options.character.skillSpecialties === next.options.character.skillSpecialties &&
        prev.options.character.predatorType.pickedSpecialties ===
            next.options.character.predatorType.pickedSpecialties &&
        prev.options.character.customText.skillSpecialties ===
            next.options.character.customText.skillSpecialties &&
        (prev.options.mode !== "xp" ||
            getAvailableXP(prev.options.character) === getAvailableXP(next.options.character))
    )
})
