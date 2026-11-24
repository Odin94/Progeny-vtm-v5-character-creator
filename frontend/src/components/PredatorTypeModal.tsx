import {
    Button,
    Group,
    Modal,
    Radio,
    SegmentedControl,
    Stack,
    Text,
    TextInput,
    Tooltip
} from "@mantine/core"
import { IconChevronLeft, IconLock } from "@tabler/icons-react"
import { Dots as DotTrack, Ornament } from "~/components/ui"
import { GeneratorConfirmButton } from "~/generator/components/sharedGeneratorUi"
import classes from "./PredatorTypeModal.module.css"
import { trackEvent } from "../utils/analytics"
import { Character, getCharacterExcludedPredatorTypes, meritFlawSchema } from "../data/Character"
import { disciplines } from "../data/Disciplines"
import { adjustPickedMeritsAndFlawsForPredatorTypeChange } from "../data/meritsAndFlawsResolution"
import type { PredatorType } from "../data/PredatorType"
import {
    getPredatorTypeOptions,
    getCharacterPredatorTypeKey,
    getPredatorDisciplineKey,
    replacePredatorSkillBonuses
} from "~/data/predatorTypeOptions"
import { predatorDisciplineKey } from "~/data/PredatorTypeRules"
import { useCharacterHomebrew } from "~/hooks/useHomebrew"
import { upcase, updateHealthAndWillpowerAndBloodPotencyAndHumanity } from "../generator/utils"
import { globals } from "../globals"
import usePointStates from "../hooks/usePointStates"
import PointPicker from "./PointPicker"
import { useEffect, useState } from "react"
import { DisciplineName, disciplineNameSchema, PredatorTypeName } from "~/data/NameSchemas"

type CategoryInfo = {
    key: string
    label: string
    mantineColor: string
}

const CATEGORY_INFO: Record<string, CategoryInfo> = {
    violent: { key: "violent", label: "Violent", mantineColor: "red" },
    sociable: { key: "sociable", label: "Sociable", mantineColor: "grape" },
    stealth: { key: "stealth", label: "Stealth", mantineColor: "gray" },
    exclusive: { key: "exclusive", label: "Excluding Mortals", mantineColor: "violet" }
}

const CATEGORY_COLOR: Record<string, string> = {
    violent: "var(--pg-blood-bright)",
    sociable: "var(--mantine-color-grape-4)",
    homebrew: "var(--mantine-color-grape-4)",
    stealth: "#c9bdb8",
    exclusive: "var(--mantine-color-violet-4)"
}

const PREDATOR_TO_CATEGORY: Partial<Record<PredatorTypeName, string>> = {
    Alleycat: "violent",
    Extortionist: "violent",
    "Roadside Killer": "violent",
    Montero: "violent",
    Cleaver: "sociable",
    Consensualist: "sociable",
    Osiris: "sociable",
    "Scene Queen": "sociable",
    Siren: "sociable",
    Sandman: "stealth",
    Graverobber: "stealth",
    "Grim Reaper": "stealth",
    Pursuer: "stealth",
    Trapdoor: "stealth",
    Bagger: "exclusive",
    "Blood Leech": "exclusive",
    Farmer: "exclusive"
}

const SectionDivider = ({ label }: { label: string }) => (
    <div className={classes.divider}>
        <span className={classes.dividerRule} />
        <span className={classes.dividerLabel}>{label}</span>
        <span className={classes.dividerRule} data-side="end" />
    </div>
)

const Dots = ({ n }: { n: number }) => (
    <DotTrack
        filled={n}
        glow
        color="var(--cat)"
        className={classes.dots}
        label={`${n} ${n === 1 ? "dot" : "dots"}`}
    />
)

type PredatorTypeModalProps = {
    modalOpened: boolean
    closeModal: () => void
    character: Character
    pickedPredatorType: PredatorTypeName
    predatorTypeDefinition?: PredatorType
    onConfirmPredatorType?: (predatorType: Character["predatorType"]) => void
    setCharacter: (character: Character) => void
    nextStep: () => void
    specialty: string
    setSpecialty: (specialty: string) => void
    discipline: string
    setDiscipline: (specialty: string) => void
    onPredatorTypeChanged: () => void
}

const PredatorTypeModal = ({
    modalOpened,
    closeModal,
    setCharacter,
    nextStep,
    character,
    pickedPredatorType,
    predatorTypeDefinition,
    onConfirmPredatorType,
    specialty,
    setSpecialty,
    discipline,
    setDiscipline,
    onPredatorTypeChanged
}: PredatorTypeModalProps) => {
    const phoneScreen = globals.isPhoneScreen

    const { data: collections = [] } = useCharacterHomebrew(character.id)
    const predatorType =
        predatorTypeDefinition ?? getPredatorTypeOptions(collections, character)[pickedPredatorType]
    const pickedDiscipline = disciplines[discipline as DisciplineName]

    const cat = predatorType.homebrewSource
        ? { ...CATEGORY_INFO.sociable, key: "homebrew", label: "Homebrew" }
        : CATEGORY_INFO[PREDATOR_TO_CATEGORY[pickedPredatorType] ?? "violent"]

    const [customSpecialtyText, setCustomSpecialtyText] = useState("")

    const {
        pointStates,
        updatePointStates,
        setExclusiveSelection,
        setFromSelectableMeritsAndFlaws
    } = usePointStates(predatorType.selectableMeritsAndFlaws)
    useEffect(() => {
        if (!modalOpened) return

        setFromSelectableMeritsAndFlaws(
            predatorType.selectableMeritsAndFlaws,
            getCharacterPredatorTypeKey(character) === pickedPredatorType
                ? character.predatorType.pickedMeritsAndFlaws
                : []
        )

        // Restore custom specialty text when reopening the already-confirmed type, so a
        // pre-filled "which scene?"-style input isn't silently blanked on the way back in.
        // A fresh pick (or a different type) starts empty.
        const storedSpecialty =
            getCharacterPredatorTypeKey(character) === pickedPredatorType
                ? character.predatorType.pickedSpecialties[0]
                : undefined
        const selectedOption = predatorType.specialtyOptions.find(
            (s) => `${s.skill}_${s.name}` === specialty
        )
        const restoredCustomText =
            storedSpecialty &&
            selectedOption?.customInput &&
            storedSpecialty.skill === selectedOption.skill &&
            storedSpecialty.name !== selectedOption.name
                ? storedSpecialty.name
                : ""
        setCustomSpecialtyText(restoredCustomText)
    }, [modalOpened, pickedPredatorType])

    // Prevent crashing modal in render before useEffect-update goes through.
    // Guard against both wrong number of groups AND wrong number of options within a group.
    const pointStatesMatchPredatorType =
        pointStates.length === predatorType.selectableMeritsAndFlaws.length &&
        predatorType.selectableMeritsAndFlaws.every(
            (selectable, i) => pointStates[i]?.subPointStates.length === selectable.options.length
        )
    if (!pointStatesMatchPredatorType) {
        return <></>
    }

    const selectedSpecialtyOption = predatorType.specialtyOptions.find(
        (s) => `${s.skill}_${s.name}` === specialty
    )
    const exclusiveGroupsFilled = predatorType.selectableMeritsAndFlaws.every((selectable, i) => {
        if (!selectable.exclusive) return true
        const subPointStates = pointStates[i]?.subPointStates
        if (!subPointStates) return false
        return subPointStates.some((s) => s.selectedPoints > 0)
    })

    const clanExcluded = getCharacterExcludedPredatorTypes(character).includes(predatorType.name)
    const activeClanName = character.homebrewClan?.name ?? character.clan

    const canConfirm = exclusiveGroupsFilled && !clanExcluded

    const hasMeritsSection =
        predatorType.meritsAndFlaws.length !== 0 ||
        predatorType.selectableMeritsAndFlaws.length !== 0
    const hasStatChanges =
        predatorType.bloodPotencyChange !== 0 || predatorType.humanityChange !== 0

    const confirmDisabledReason = clanExcluded
        ? `Locked for ${activeClanName}`
        : !exclusiveGroupsFilled
          ? "Choose an option in every group first"
          : undefined

    return (
        <Modal
            withCloseButton={false}
            size="lg"
            opened={modalOpened}
            onClose={closeModal}
            centered
            classNames={{ content: classes.content }}
            styles={{
                content: { "--cat": CATEGORY_COLOR[cat.key] ?? CATEGORY_COLOR.violent },
                body: { padding: 0 }
            }}
        >
            {/* Hero header */}
            <div className={classes.hero}>
                <span className={classes.eyebrow}>{cat.label}</span>
                <h2 className={classes.title}>{predatorType.name}</h2>
                <Ornament className={classes.ornament} />
                <span className={classes.summary}>{predatorType.summary}</span>
            </div>

            <div className={classes.body}>
                {/* Clan restriction notice */}
                {clanExcluded && (
                    <div className={classes.notice}>
                        <div className={classes.noticeTitle}>
                            <IconLock size={12} stroke={2.4} />
                            Locked for {activeClanName}
                        </div>
                        <Text className={classes.noticeText}>
                            The {activeClanName} clan can&apos;t take the {predatorType.name}{" "}
                            predator type. Go back to the clan step and pick a different clan to
                            unlock it. Changing clans may reset your discipline selections.
                        </Text>
                    </div>
                )}

                {/* Stat changes */}
                {hasStatChanges && (
                    <div className={classes.stats}>
                        {predatorType.bloodPotencyChange !== 0 && (
                            <div className={classes.stat}>
                                <span className={classes.statLabel}>Blood Potency</span>
                                <span
                                    className={classes.statValue}
                                    data-sign={predatorType.bloodPotencyChange > 0 ? "up" : "down"}
                                >
                                    {predatorType.bloodPotencyChange > 0
                                        ? `+${predatorType.bloodPotencyChange}`
                                        : `−${Math.abs(predatorType.bloodPotencyChange)}`}
                                </span>
                            </div>
                        )}
                        {predatorType.humanityChange !== 0 && (
                            <div className={classes.stat}>
                                <span className={classes.statLabel}>Humanity</span>
                                <span
                                    className={classes.statValue}
                                    data-sign={predatorType.humanityChange > 0 ? "up" : "down"}
                                >
                                    {predatorType.humanityChange > 0
                                        ? `+${predatorType.humanityChange}`
                                        : `−${Math.abs(predatorType.humanityChange)}`}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Merits & Flaws */}
                {hasMeritsSection && (
                    <div>
                        <SectionDivider label="Merits & Flaws" />
                        <Stack gap="sm">
                            {predatorType.meritsAndFlaws.map((mf) => (
                                <div key={mf.name + mf.level} className={classes.meritRow}>
                                    <Dots n={mf.level} />
                                    <div>
                                        <Text className={classes.meritName}>{mf.name}</Text>
                                        {mf.summary && (
                                            <Text className={classes.meritSummary}>
                                                {mf.summary}
                                            </Text>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {predatorType.selectableMeritsAndFlaws.map(
                                ({ options, totalPoints, exclusive }, i) => {
                                    const subPointStates = pointStates[i].subPointStates
                                    const spentPoints = subPointStates.reduce(
                                        (acc, cur) => acc + cur.selectedPoints,
                                        0
                                    )
                                    const selectedExclusiveIndex = exclusive
                                        ? subPointStates.findIndex((s) => s.selectedPoints > 0)
                                        : -1
                                    const groupMaxLevel = Math.max(
                                        ...options.map((o) => o.maxLevel)
                                    )

                                    return (
                                        <div key={i} className={classes.group}>
                                            {exclusive ? (
                                                <>
                                                    <div className={classes.groupHead}>
                                                        <Group gap="sm" wrap="nowrap">
                                                            <Dots n={totalPoints} />
                                                            <span className={classes.groupTitle}>
                                                                {options[0].name}
                                                            </span>
                                                        </Group>
                                                        <span
                                                            className={classes.remaining}
                                                            data-done={
                                                                selectedExclusiveIndex !== -1 ||
                                                                undefined
                                                            }
                                                        >
                                                            {selectedExclusiveIndex === -1
                                                                ? "Choose one"
                                                                : "Chosen"}
                                                        </span>
                                                    </div>
                                                    <Stack gap="xs">
                                                        {options.map((option, j) => (
                                                            <Radio
                                                                key={
                                                                    predatorType.name +
                                                                    "/" +
                                                                    option.name +
                                                                    j
                                                                }
                                                                checked={
                                                                    selectedExclusiveIndex === j
                                                                }
                                                                onChange={() =>
                                                                    setExclusiveSelection(i, j)
                                                                }
                                                                color={cat.mantineColor}
                                                                label={
                                                                    option.summary || option.name
                                                                }
                                                                classNames={{
                                                                    label: classes.radioLabel
                                                                }}
                                                            />
                                                        ))}
                                                    </Stack>
                                                </>
                                            ) : (
                                                <>
                                                    <div className={classes.groupHead}>
                                                        <span className={classes.groupTitle}>
                                                            Distribute {totalPoints}{" "}
                                                            {totalPoints === 1 ? "dot" : "dots"}
                                                        </span>
                                                        <span
                                                            className={classes.remaining}
                                                            data-done={
                                                                totalPoints - spentPoints === 0 ||
                                                                undefined
                                                            }
                                                        >
                                                            {totalPoints - spentPoints} remaining
                                                        </span>
                                                    </div>

                                                    <Stack gap={4}>
                                                        {options.map((option, j) => {
                                                            const { selectedPoints, maxLevel } =
                                                                subPointStates[j]
                                                            return (
                                                                <Group
                                                                    key={
                                                                        predatorType.name +
                                                                        "/" +
                                                                        option.name +
                                                                        j
                                                                    }
                                                                    justify="space-between"
                                                                    wrap="nowrap"
                                                                >
                                                                    <Tooltip
                                                                        disabled={
                                                                            option.summary === ""
                                                                        }
                                                                        label={upcase(
                                                                            option.summary
                                                                        )}
                                                                        multiline
                                                                        maw={280}
                                                                        events={
                                                                            globals.tooltipTriggerEvents
                                                                        }
                                                                    >
                                                                        <Text
                                                                            className={
                                                                                classes.optionName
                                                                            }
                                                                        >
                                                                            {option.name}
                                                                        </Text>
                                                                    </Tooltip>
                                                                    <PointPicker
                                                                        points={selectedPoints}
                                                                        setPoints={(n) =>
                                                                            updatePointStates(
                                                                                n,
                                                                                i,
                                                                                j
                                                                            )
                                                                        }
                                                                        maxLevel={maxLevel}
                                                                        displayCount={groupMaxLevel}
                                                                    />
                                                                </Group>
                                                            )
                                                        })}
                                                    </Stack>
                                                </>
                                            )}
                                        </div>
                                    )
                                }
                            )}
                        </Stack>
                    </div>
                )}

                {!!predatorType.skillBonuses?.length && (
                    <div>
                        <SectionDivider label="Skill Dots" />
                        <Text className={classes.skillDots}>
                            {predatorType.skillBonuses
                                .map((grant) => `+${grant.dots} ${upcase(grant.skill)}`)
                                .join(" · ")}
                        </Text>
                    </div>
                )}
                {predatorType.description && (
                    <Text className={classes.description}>{predatorType.description}</Text>
                )}
                {/* Skill Specialty */}
                {predatorType.specialtyOptions.length > 0 && (
                    <div>
                        <SectionDivider label="Skill Specialty" />
                        <SegmentedControl
                            size={phoneScreen ? "sm" : "md"}
                            color={cat.mantineColor}
                            fullWidth
                            orientation={
                                phoneScreen && predatorType.specialtyOptions.length > 2
                                    ? "vertical"
                                    : "horizontal"
                            }
                            value={specialty}
                            onChange={(value) => {
                                setSpecialty(value)
                                setCustomSpecialtyText("")
                            }}
                            data={predatorType.specialtyOptions.map((s) => ({
                                label: s.customInput
                                    ? upcase(s.skill)
                                    : `${upcase(s.skill)}: ${s.name}`,
                                value: `${s.skill}_${s.name}`
                            }))}
                        />
                        {(() => {
                            const selectedSpecialtyOption = predatorType.specialtyOptions.find(
                                (s) => `${s.skill}_${s.name}` === specialty
                            )
                            return selectedSpecialtyOption?.customInput ? (
                                <TextInput
                                    placeholder={selectedSpecialtyOption.customInput}
                                    value={customSpecialtyText}
                                    onChange={(e) => setCustomSpecialtyText(e.target.value)}
                                    color={cat.mantineColor}
                                    mt="xs"
                                    data-autofocus
                                />
                            ) : null
                        })()}
                    </div>
                )}

                {/* Discipline */}
                <div>
                    <SectionDivider label="Bonus Discipline" />
                    <Tooltip
                        label={`${upcase(discipline)}: ${pickedDiscipline?.summary ?? ""}`}
                        multiline
                        maw={320}
                        events={globals.tooltipTriggerEvents}
                    >
                        <SegmentedControl
                            size={phoneScreen ? "sm" : "md"}
                            color={cat.mantineColor}
                            fullWidth
                            value={discipline}
                            onChange={setDiscipline}
                            data={predatorType.disciplineOptions.map((d) => ({
                                label: upcase(d.name),
                                value: predatorDisciplineKey(d)
                            }))}
                        />
                    </Tooltip>
                </div>

                {/* Actions */}
                <div className={classes.actions}>
                    <Button
                        variant="subtle"
                        color="gray"
                        leftSection={<IconChevronLeft size={16} />}
                        onClick={closeModal}
                    >
                        Back
                    </Button>

                    <GeneratorConfirmButton
                        data-testid="predator-type-confirm-button"
                        disabled={!canConfirm}
                        disabledReason={canConfirm ? undefined : confirmDisabledReason}
                        onClick={async () => {
                            const pickedSpecialtyOption = predatorType.specialtyOptions.find(
                                (s) => `${s.skill}_${s.name}` === specialty
                            )
                            const pickedDisciplineOption = predatorType.disciplineOptions.find(
                                (option) => predatorDisciplineKey(option) === discipline
                            )
                            if (
                                !pickedSpecialtyOption &&
                                predatorType.specialtyOptions.length > 0
                            ) {
                                console.error(`Couldn't find specialty with key ${specialty}`)
                            } else if (!pickedDisciplineOption) {
                                console.error(`Couldn't find discipline with name ${discipline}`)
                            } else {
                                const resolvedSpecialty = pickedSpecialtyOption
                                    ? {
                                          skill: pickedSpecialtyOption.skill,
                                          name:
                                              customSpecialtyText.trim() ||
                                              pickedSpecialtyOption.name
                                      }
                                    : undefined

                                const pickedMeritsAndFlaws =
                                    predatorType.selectableMeritsAndFlaws.flatMap(
                                        (selectable, i) => {
                                            const subPointStates = pointStates[i].subPointStates
                                            return selectable.options.flatMap((option, j) => {
                                                const { selectedPoints } = subPointStates[j]
                                                if (selectedPoints === 0) return []
                                                return meritFlawSchema.parse({
                                                    ...option,
                                                    level: selectedPoints
                                                })
                                            })
                                        }
                                    )

                                const pickedDisciplineName = disciplineNameSchema.parse(
                                    pickedDisciplineOption.name
                                )
                                const nextPredatorType = {
                                    name: predatorType.name,
                                    ...(predatorType.homebrewSource && {
                                        homebrew: {
                                            ...predatorType,
                                            homebrewSource: predatorType.homebrewSource
                                        },
                                        pickedDisciplineRef: pickedDisciplineOption
                                    }),
                                    pickedDiscipline: pickedDisciplineName,
                                    pickedSpecialties: resolvedSpecialty ? [resolvedSpecialty] : [],
                                    pickedMeritsAndFlaws
                                }
                                if (onConfirmPredatorType) {
                                    onConfirmPredatorType(nextPredatorType)
                                    closeModal()
                                    nextStep()
                                    return
                                }
                                const adjustedPickedMeritsAndFlaws =
                                    adjustPickedMeritsAndFlawsForPredatorTypeChange(
                                        character,
                                        nextPredatorType
                                    )
                                const changedPickedDiscipline =
                                    discipline !== getPredatorDisciplineKey(character)
                                const changedPredatorType =
                                    pickedPredatorType !== getCharacterPredatorTypeKey(character)
                                const shouldResetDisciplineProgress =
                                    changedPredatorType || changedPickedDiscipline
                                const nextCharacter = {
                                    ...character,
                                    ...adjustedPickedMeritsAndFlaws,
                                    ...replacePredatorSkillBonuses(character, nextPredatorType),
                                    disciplines: shouldResetDisciplineProgress
                                        ? []
                                        : character.disciplines,
                                    disciplineLevels: shouldResetDisciplineProgress
                                        ? {}
                                        : character.disciplineLevels,
                                    rituals: shouldResetDisciplineProgress ? [] : character.rituals,
                                    ceremonies: shouldResetDisciplineProgress
                                        ? []
                                        : character.ceremonies
                                }
                                updateHealthAndWillpowerAndBloodPotencyAndHumanity(nextCharacter)
                                setCharacter(nextCharacter)

                                if (shouldResetDisciplineProgress) {
                                    onPredatorTypeChanged()
                                }

                                trackEvent({
                                    action: "predatortype confirm clicked",
                                    category: "predator type",
                                    label: pickedPredatorType
                                })

                                closeModal()
                                nextStep()
                            }
                        }}
                    />
                </div>
            </div>
        </Modal>
    )
}

export default PredatorTypeModal
