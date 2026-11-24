import { ActionIcon, Box, Checkbox, Collapse, Tooltip, type CheckboxProps } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import {
    IconChevronDown,
    IconHandClick,
    IconInfoCircle,
    IconRotateClockwise
} from "@tabler/icons-react"
import { Character } from "~/data/Character"
import { AttributesKey } from "~/data/Attributes"
import { useCharacterSheetStore } from "../../../stores/characterSheetStore"
import { getDisciplineRating, upcase } from "~/generator/utils"
import { useShallow } from "zustand/react/shallow"
import { getApplicableDisciplinePowers } from "../../../utils/disciplinePowerMatcher"
import { getApplicableMeritFlawModifiers } from "../../../utils/meritFlawMatcher"
import { useMemo, type ReactNode } from "react"
import { getBloodPotencyDisciplineBonus } from "~/data/BloodPotency"
import classes from "../diceRoller.module.css"

type SelectedDicePoolDisplayProps = {
    character?: Character
    primaryColor: string
    skillSpecialties: Array<{
        name: string
        skill: string
        fromPredatorType?: boolean
    }>
}

/** "Strength: 3" stays the accessible text; the colon is only hidden visually. */
const StatChip = ({ name, value, bonus }: { name: string; value: number; bonus?: ReactNode }) => (
    <span className={classes.chip}>
        {name}
        <span className="pg-visually-hidden">: </span>
        <span className={classes.chipValue}>{value}</span>
        {bonus ? <span className={classes.chipBonus}>{bonus}</span> : null}
    </span>
)

const toggleClassNames: CheckboxProps["classNames"] = {
    root: classes.toggle,
    body: classes.toggleBody,
    label: classes.toggleLabel,
    description: classes.toggleDescription
}

const SelectedDicePoolDisplay = ({
    character,
    primaryColor,
    skillSpecialties
}: SelectedDicePoolDisplayProps) => {
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

    const selectedDisciplineRating =
        selectedDicePool.discipline && character
            ? getDisciplineRating(selectedDicePool.discipline, character)
            : 0
    const bloodPotencyDisciplineBonus =
        selectedDicePool.discipline && character
            ? getBloodPotencyDisciplineBonus(character.bloodPotency)
            : 0
    const attributeChip = (attribute: AttributesKey) => (
        <StatChip name={upcase(attribute)} value={character?.attributes[attribute] || 0} />
    )
    const selectedDisciplineChip = selectedDicePool.discipline ? (
        <StatChip
            name={upcase(selectedDicePool.discipline)}
            value={selectedDisciplineRating}
            bonus={bloodPotencyDisciplineBonus > 0 ? ` (+${bloodPotencyDisciplineBonus})` : null}
        />
    ) : null
    const hasSelection =
        !!selectedDicePool.attribute ||
        !!selectedDicePool.secondAttribute ||
        !!selectedDicePool.skill ||
        !!selectedDicePool.discipline

    const companion = selectedDicePool.skill ? (
        <StatChip
            name={upcase(selectedDicePool.skill)}
            value={character?.skills[selectedDicePool.skill] || 0}
        />
    ) : selectedDicePool.discipline ? (
        bloodPotencyDisciplineBonus > 0 ? (
            <Tooltip
                label={`+${bloodPotencyDisciplineBonus} from blood potency`}
                position="top"
                withArrow
                zIndex={3000}
            >
                <Box component="span">{selectedDisciplineChip}</Box>
            </Tooltip>
        ) : (
            selectedDisciplineChip
        )
    ) : selectedDicePool.secondAttribute ? (
        attributeChip(selectedDicePool.secondAttribute)
    ) : (
        <span className={classes.chipEmpty}>Skill, Discipline or Attribute</span>
    )

    return (
        <div className={classes.poolCard}>
            <div className={classes.poolCardHeader}>
                <ActionIcon
                    variant="subtle"
                    color="gray"
                    size="sm"
                    onClick={togglePoolExpanded}
                    aria-label={
                        poolExpanded ? "Collapse selected dice pool" : "Expand selected dice pool"
                    }
                    aria-expanded={poolExpanded}
                >
                    <IconChevronDown
                        size={16}
                        style={{
                            transform: poolExpanded ? "rotate(0deg)" : "rotate(-90deg)",
                            transition: "transform var(--pg-dur-base) var(--ease-out)"
                        }}
                    />
                </ActionIcon>
                <span className={classes.poolCardTitle}>From your sheet</span>
                <Tooltip
                    label="Click an Attribute, then a Skill, Discipline, or second Attribute on the character sheet to determine your dice pool"
                    position="top"
                    withArrow
                    multiline
                    w={250}
                    zIndex={3000}
                    events={{ hover: true, focus: true, touch: true }}
                >
                    <ActionIcon
                        variant="subtle"
                        color="gray"
                        size="sm"
                        style={{ cursor: "help" }}
                        aria-label="How to select a dice pool"
                    >
                        <IconInfoCircle size={16} />
                    </ActionIcon>
                </Tooltip>
                {hasSelection ? (
                    <Tooltip label="Reset dice pool" zIndex={3000}>
                        <ActionIcon
                            variant="subtle"
                            color="gray"
                            size="sm"
                            onClick={resetSelectedDicePool}
                            aria-label="Reset dice pool"
                        >
                            <IconRotateClockwise size={16} />
                        </ActionIcon>
                    </Tooltip>
                ) : null}
            </div>
            <Collapse expanded={poolExpanded}>
                <div className={classes.pool}>
                    {hasSelection ? (
                        <div className={classes.equation}>
                            {selectedDicePool.attribute ? (
                                attributeChip(selectedDicePool.attribute)
                            ) : (
                                <span className={classes.chipEmpty}>Attribute</span>
                            )}
                            <span className={classes.plus} aria-hidden="true">
                                +
                            </span>
                            {companion}
                        </div>
                    ) : (
                        <div className={classes.poolHint}>
                            <IconHandClick size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                            <span>
                                Tap an Attribute on your sheet, then a Skill, Discipline or a second
                                Attribute.
                            </span>
                        </div>
                    )}
                    {skillSpecialties.length > 0 && selectedDicePool.skill ? (
                        <div className={classes.modifierGroup}>
                            <span className={classes.modifierLabel}>Specialties · +1 die each</span>
                            <div className={classes.modifierGrid}>
                                {skillSpecialties.map((specialty) => (
                                    <Checkbox
                                        key={`${specialty.fromPredatorType ? "predator" : "direct"}-${specialty.skill}-${specialty.name}`}
                                        classNames={toggleClassNames}
                                        size="xs"
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
                            </div>
                        </div>
                    ) : null}
                    <div className={classes.modifierGroup}>
                        <span className={classes.modifierLabel}>The Blood</span>
                        <div className={classes.modifierGrid}>
                            <Checkbox
                                classNames={toggleClassNames}
                                size="xs"
                                label="Blood Surge (+2 dice)"
                                checked={selectedDicePool.bloodSurge}
                                onChange={(e) => {
                                    updateSelectedDicePool({
                                        bloodSurge: e.currentTarget.checked
                                    })
                                }}
                                color="red"
                            />
                            {applicablePowers.map(({ power, disciplineRating }) => {
                                const isWrecker = power.name === "Wrecker"
                                const bonusDice = isWrecker
                                    ? disciplineRating * 2
                                    : disciplineRating
                                const powerKey = `${power.discipline}-${power.name}`
                                const isChecked =
                                    selectedDicePool.selectedDisciplinePowers.includes(powerKey)

                                return (
                                    <Checkbox
                                        key={powerKey}
                                        classNames={toggleClassNames}
                                        size="xs"
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
                        </div>
                    </div>
                    {applicableMeritFlawModifiers.length > 0 ? (
                        <div className={classes.modifierGroup}>
                            <button
                                type="button"
                                className={classes.disclosure}
                                onClick={toggleMeritFlawExpanded}
                                aria-expanded={meritFlawExpanded}
                                aria-label={
                                    meritFlawExpanded
                                        ? "Collapse merits and flaws"
                                        : "Expand merits and flaws"
                                }
                            >
                                Merits & Flaws
                                <span className={classes.disclosureCount}>
                                    {applicableMeritFlawModifiers.length}
                                </span>
                                <IconChevronDown size={14} className={classes.disclosureChevron} />
                            </button>
                            <Collapse expanded={meritFlawExpanded}>
                                <div className={classes.modifierGrid}>
                                    {applicableMeritFlawModifiers.map(
                                        ({ meritFlaw, bonusDice, reason, key }) => {
                                            const isChecked =
                                                selectedDicePool.selectedMeritFlaws.includes(key)

                                            return (
                                                <Checkbox
                                                    key={key}
                                                    classNames={toggleClassNames}
                                                    size="xs"
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
                                </div>
                            </Collapse>
                        </div>
                    ) : null}
                </div>
            </Collapse>
        </div>
    )
}

export default SelectedDicePoolDisplay
