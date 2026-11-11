import { replacePredatorSkillBonuses } from "~/data/predatorTypeOptions"
import { Badge, Button, ScrollArea, Tooltip } from "@mantine/core"
import { IconRotate2 } from "@tabler/icons-react"
import { useDisclosure } from "@mantine/hooks"
import { memo, useState } from "react"
import { trackEvent } from "../../utils/analytics"
import { Character } from "../../data/Character"
import {
    Skills,
    SkillsKey,
    emptySkills,
    skillsDescriptions,
    skillsKeySchema
} from "../../data/Skills"
import { globals } from "../../globals"
import { upcase } from "../utils"
import { SpecialtyModal } from "./SkillSpecialtyModal"
import {
    GeneratorConfirmButton,
    GeneratorPhasePrompt,
    GeneratorSectionDivider,
    GeneratorStepFooter,
    GeneratorStepHero
} from "./sharedGeneratorUi"
import { DistributionKey, emptySkillsSetting, SkillsSetting } from "../creatorDrafts"
import { PickColumnHeader, PickGrid, PickTile, pickTileClasses, type PickTone } from "./PickTile"
import {
    generatorScrollableAreaStyle,
    generatorScrollableContentStyle,
    generatorScrollableShellStyle
} from "./sharedGeneratorScrollableLayout"
import { nightfallScrollAreaStyles, nightfallScrollbarSize } from "./sharedScrollAreaStyles"

type SkillsPickerProps = {
    character: Character
    setCharacter: (character: Character) => void
    nextStep: () => void
    pickedSkills: SkillsSetting
    setPickedSkills: (skills: SkillsSetting) => void
    pickedDistribution: DistributionKey | null
    setPickedDistribution: (distribution: DistributionKey | null) => void
}

type SkillDistribution = { strongest: number; decent: number; acceptable: number; special: number }

const distributionDescriptions: Record<DistributionKey, string> = {
    "Jack of All Trades": "Decent at many things, good at none (1/8/10)",
    Balanced: "Best default choice (3/5/7)",
    Specialist: "Uniquely great at one thing, bad at most (1/3/3/3)"
}

const distributionByType: Record<DistributionKey, SkillDistribution> = {
    "Jack of All Trades": {
        special: 0,
        strongest: 1,
        decent: 8,
        acceptable: 10
    },
    Balanced: {
        special: 0,
        strongest: 3,
        decent: 5,
        acceptable: 7
    },
    Specialist: {
        special: 1,
        strongest: 3,
        decent: 3,
        acceptable: 3
    }
}

const getAll = (skillSetting: SkillsSetting): SkillsKey[] => {
    return Object.values(skillSetting).reduce((acc, s) => [...acc, ...s], [])
}

const toneForSkillLevel: Record<number, PickTone> = {
    4: "blood",
    3: "crimson",
    2: "gold",
    1: "ash"
}

const SkillButton = memo(function SkillButton({
    skill,
    assignedLevel,
    previewLevel,
    hasDistribution,
    skillAllocationIsFull
}: {
    skill: SkillsKey
    assignedLevel: number | null
    previewLevel: number | null
    hasDistribution: boolean
    skillAllocationIsFull: boolean
}) {
    const alreadyPicked = assignedLevel !== null
    return (
        <Tooltip
            disabled={alreadyPicked}
            label={skillsDescriptions[skill]}
            multiline
            maw={280}
            events={globals.tooltipTriggerEvents}
        >
            <PickTile
                data-testid={`skill-${skill.replace(/\s+/g, "-")}-button`}
                label={upcase(skill)}
                level={assignedLevel}
                tone={assignedLevel ? toneForSkillLevel[assignedLevel] : undefined}
                previewLevel={previewLevel ?? undefined}
                previewTone={previewLevel ? toneForSkillLevel[previewLevel] : undefined}
                disabled={!hasDistribution || (!alreadyPicked && skillAllocationIsFull)}
                data-skill={skill}
            />
        </Tooltip>
    )
})

const distributionRows = (distribution: SkillDistribution) =>
    (
        [
            { level: 4, count: distribution.special },
            { level: 3, count: distribution.strongest },
            { level: 2, count: distribution.decent },
            { level: 1, count: distribution.acceptable }
        ] as const
    ).filter((row) => row.count > 0)

const SkillsPicker = ({
    character,
    setCharacter,
    nextStep,
    pickedSkills,
    setPickedSkills,
    pickedDistribution,
    setPickedDistribution
}: SkillsPickerProps) => {
    const phoneScreen = globals.isPhoneScreen

    const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false)
    const [undoLastPickOnModalClose, setUndoLastPickOnModalClose] = useState(false)
    const hasConfirmedSkills = Object.values(character.skills).some((value) => value !== 0)
    const distr = pickedDistribution
        ? distributionByType[pickedDistribution]
        : { special: 0, strongest: 0, decent: 0, acceptable: 0 }

    const skillsFromSelection = (selection: SkillsSetting): Skills => {
        const skills = { ...emptySkills }
        selection.special.forEach((skill) => (skills[skill] = 4))
        selection.strongest.forEach((skill) => (skills[skill] = 3))
        selection.decent.forEach((skill) => (skills[skill] = 2))
        selection.acceptable.forEach((skill) => (skills[skill] = 1))
        return skills
    }

    const isComplete =
        pickedDistribution !== null &&
        pickedSkills.special.length === distr.special &&
        pickedSkills.strongest.length === distr.strongest &&
        pickedSkills.decent.length === distr.decent &&
        pickedSkills.acceptable.length === distr.acceptable
    const skillAllocationIsFull =
        pickedDistribution !== null &&
        pickedSkills.special.length >= distr.special &&
        pickedSkills.strongest.length >= distr.strongest &&
        pickedSkills.decent.length >= distr.decent &&
        pickedSkills.acceptable.length >= distr.acceptable

    const pickSkill = (skill: SkillsKey) => {
        const alreadyPicked = [
            ...pickedSkills.special,
            ...pickedSkills.strongest,
            ...pickedSkills.decent,
            ...pickedSkills.acceptable
        ].includes(skill)

        let onClick: () => void
        if (alreadyPicked) {
            onClick = () => {
                setPickedSkills({
                    special: pickedSkills.special.filter((it) => it !== skill),
                    strongest: pickedSkills.strongest.filter((it) => it !== skill),
                    decent: pickedSkills.decent.filter((it) => it !== skill),
                    acceptable: pickedSkills.acceptable.filter((it) => it !== skill)
                })
            }
        } else if (pickedSkills.special.length < distr.special) {
            onClick = () => {
                setPickedSkills({ ...pickedSkills, special: [...pickedSkills.special, skill] })
            }
        } else if (pickedSkills.strongest.length < distr.strongest) {
            onClick = () => {
                setPickedSkills({ ...pickedSkills, strongest: [...pickedSkills.strongest, skill] })
            }
        } else if (pickedSkills.decent.length < distr.decent) {
            onClick = () => {
                setPickedSkills({ ...pickedSkills, decent: [...pickedSkills.decent, skill] })
            }
        } else if (pickedSkills.acceptable.length < distr.acceptable) {
            const finalPick = { ...pickedSkills, acceptable: [...pickedSkills.acceptable, skill] }
            onClick = () => {
                setPickedSkills(finalPick)
                if (
                    !hasConfirmedSkills &&
                    finalPick.special.length === distr.special &&
                    finalPick.strongest.length === distr.strongest &&
                    finalPick.decent.length === distr.decent &&
                    finalPick.acceptable.length === distr.acceptable
                ) {
                    setUndoLastPickOnModalClose(true)
                    openModal()
                }
            }
        } else {
            onClick = () => {}
        }

        const trackClick = () => {
            trackEvent({
                action: "skill clicked",
                category: "skills",
                label: skill
            })
        }

        trackClick()
        onClick()
    }

    const toPick = (() => {
        if (pickedSkills.special.length < distr.special) return "special"
        if (pickedSkills.strongest.length < distr.strongest) return "strongest"
        if (pickedSkills.decent.length < distr.decent) return "decent"
        return "acceptable"
    })()

    const closeModalAndUndoLastPick = () => {
        if (undoLastPickOnModalClose) {
            setPickedSkills({ ...pickedSkills, acceptable: pickedSkills.acceptable.slice(0, -1) })
        }
        closeModal()
    }

    const confirmEditedSkills = () => {
        setUndoLastPickOnModalClose(false)
        openModal()
    }

    const resetSkills = () => {
        setPickedSkills(emptySkillsSetting)
        setPickedDistribution(null)
        setCharacter({
            ...character,
            ...replacePredatorSkillBonuses(
                {
                    ...character,
                    skills: { ...emptySkills },
                    predatorType: { ...character.predatorType, appliedSkillBonuses: undefined }
                },
                character.predatorType
            ),
            skillSpecialties: []
        })
    }

    // Delegate native button clicks so each memoized button only receives visual props.
    // Passing a selection-dependent callback to every button would invalidate all 27.
    const previewLevel = skillAllocationIsFull
        ? null
        : toPick === "special"
          ? 4
          : toPick === "strongest"
            ? 3
            : toPick === "decent"
              ? 2
              : 1

    const createSkillButtons = () => (
        <PickGrid
            onClick={(event) => {
                const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
                    "button[data-skill]"
                )
                if (button && !button.disabled)
                    pickSkill(skillsKeySchema.parse(button.dataset.skill))
            }}
        >
            <PickColumnHeader>Physical</PickColumnHeader>
            <PickColumnHeader>Social</PickColumnHeader>
            <PickColumnHeader>Mental</PickColumnHeader>
            {[
                "athletics",
                "animal ken",
                "academics",
                "brawl",
                "etiquette",
                "awareness",
                "craft",
                "insight",
                "finance",
                "drive",
                "intimidation",
                "investigation",
                "firearms",
                "leadership",
                "medicine",
                "melee",
                "performance",
                "occult",
                "larceny",
                "persuasion",
                "politics",
                "stealth",
                "streetwise",
                "science",
                "survival",
                "subterfuge",
                "technology"
            ]
                .map((s) => skillsKeySchema.parse(s))
                .map((skill) => (
                    <SkillButton
                        key={skill}
                        skill={skill}
                        assignedLevel={
                            pickedSkills.special.includes(skill)
                                ? 4
                                : pickedSkills.strongest.includes(skill)
                                  ? 3
                                  : pickedSkills.decent.includes(skill)
                                    ? 2
                                    : pickedSkills.acceptable.includes(skill)
                                      ? 1
                                      : null
                        }
                        previewLevel={pickedDistribution !== null ? previewLevel : null}
                        hasDistribution={pickedDistribution !== null}
                        skillAllocationIsFull={skillAllocationIsFull}
                    />
                ))}
        </PickGrid>
    )

    const phases = [
        pickedDistribution === "Specialist"
            ? {
                  key: "special",
                  prompt: "Pick your",
                  bold: `${distr.special - pickedSkills.special.length}`,
                  suffix: "specialty skill",
                  level: 4,
                  done: pickedSkills.special.length === distr.special
              }
            : null,
        {
            key: "strongest",
            prompt: "Pick your",
            bold: `${distr.strongest - pickedSkills.strongest.length} strongest`,
            suffix: "skills",
            level: 3,
            done: pickedSkills.strongest.length === distr.strongest
        },
        {
            key: "decent",
            prompt: "Pick",
            bold: `${distr.decent - pickedSkills.decent.length}`,
            suffix: "skills you're decent in",
            level: 2,
            done: pickedSkills.decent.length === distr.decent
        },
        {
            key: "acceptable",
            prompt: "Pick",
            bold: `${distr.acceptable - pickedSkills.acceptable.length}`,
            suffix: "skills you're ok in",
            level: 1,
            done: pickedSkills.acceptable.length === distr.acceptable
        }
    ].filter(Boolean) as Array<{
        key: string
        prompt: string
        bold: string
        suffix: string
        level: number
        done: boolean
    }>

    return (
        <div style={generatorScrollableShellStyle}>
            <ScrollArea
                style={generatorScrollableAreaStyle}
                w="100%"
                px={20}
                pt={4}
                pb={8}
                type="always"
                scrollbarSize={nightfallScrollbarSize}
                styles={nightfallScrollAreaStyles}
            >
                <div style={generatorScrollableContentStyle}>
                    {!pickedDistribution ? (
                        <>
                            <GeneratorStepHero
                                leadText="Pick your"
                                accentText="Skill Distribution"
                                description="Balanced is the default choice"
                                marginBottom={phoneScreen ? 20 : 28}
                            />
                            <div className={pickTileClasses.choices}>
                                {(
                                    [
                                        "Jack of All Trades",
                                        "Balanced",
                                        "Specialist"
                                    ] as DistributionKey[]
                                ).map((distribution) => (
                                    <Button
                                        unstyled
                                        key={distribution}
                                        className={pickTileClasses.choice}
                                        data-recommended={distribution === "Balanced" || undefined}
                                        data-testid={`skill-distribution-${distribution
                                            .toLowerCase()
                                            .replace(/\s+/g, "-")}-button`}
                                        disabled={pickedDistribution !== null}
                                        onClick={() => {
                                            setPickedSkills(emptySkillsSetting)
                                            setPickedDistribution(distribution)
                                        }}
                                    >
                                        <span className={pickTileClasses.choiceHead}>
                                            <span className={pickTileClasses.choiceTitle}>
                                                {distribution}
                                            </span>
                                            {distribution === "Balanced" ? (
                                                <Badge color="gold" variant="light" size="sm">
                                                    Default
                                                </Badge>
                                            ) : null}
                                        </span>
                                        <span className={pickTileClasses.choiceText}>
                                            {distributionDescriptions[distribution].replace(
                                                /\s*\(.*\)$/,
                                                ""
                                            )}
                                        </span>
                                        <span className={pickTileClasses.choiceRows}>
                                            {distributionRows(distributionByType[distribution]).map(
                                                (row) => (
                                                    <span
                                                        key={row.level}
                                                        className={pickTileClasses.choiceRow}
                                                        style={
                                                            {
                                                                "--tone": `var(--pick-tone-${toneForSkillLevel[row.level]})`
                                                            } as React.CSSProperties
                                                        }
                                                    >
                                                        <span
                                                            className={pickTileClasses.choiceCount}
                                                        >
                                                            {row.count}×
                                                        </span>
                                                        <span
                                                            className={pickTileClasses.pips}
                                                            aria-hidden="true"
                                                        >
                                                            {Array.from(
                                                                { length: 4 },
                                                                (_, index) => (
                                                                    <span
                                                                        key={index}
                                                                        className={
                                                                            pickTileClasses.pip
                                                                        }
                                                                        data-filled={
                                                                            index < row.level ||
                                                                            undefined
                                                                        }
                                                                    />
                                                                )
                                                            )}
                                                        </span>
                                                        <span>
                                                            {row.count === 1 ? "skill" : "skills"}{" "}
                                                            at {row.level}
                                                        </span>
                                                    </span>
                                                )
                                            )}
                                        </span>
                                    </Button>
                                ))}
                            </div>
                            <div style={{ height: phoneScreen ? 16 : 28 }} />
                        </>
                    ) : (
                        <GeneratorPhasePrompt
                            lines={phases}
                            activeKey={toPick}
                            phoneScreen={phoneScreen}
                            caption={pickedDistribution}
                        />
                    )}

                    <GeneratorSectionDivider label="Skills" marginY={phoneScreen ? "sm" : "md"} />

                    {createSkillButtons()}
                </div>
            </ScrollArea>

            <SpecialtyModal
                modalOpened={modalOpened}
                closeModal={closeModal}
                onBack={closeModalAndUndoLastPick}
                setCharacter={setCharacter}
                nextStep={nextStep}
                character={character}
                pickedSkillNames={getAll(pickedSkills)}
                skills={skillsFromSelection(pickedSkills)}
            />
            {hasConfirmedSkills ? (
                <GeneratorStepFooter>
                    <Button
                        variant="subtle"
                        color="gray"
                        size="md"
                        leftSection={<IconRotate2 size={16} />}
                        onClick={resetSkills}
                    >
                        Reset skills
                    </Button>
                    <GeneratorConfirmButton
                        data-testid="skills-confirm-button"
                        disabledReason={
                            isComplete
                                ? undefined
                                : "Assign every skill dot of your distribution first"
                        }
                        onClick={confirmEditedSkills}
                    />
                </GeneratorStepFooter>
            ) : null}
        </div>
    )
}

export default SkillsPicker
