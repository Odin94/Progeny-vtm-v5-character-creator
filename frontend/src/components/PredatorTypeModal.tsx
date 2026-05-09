import { faChevronLeft } from "@fortawesome/free-solid-svg-icons"
import { RAW_GREY, RAW_RED, rgba } from "~/theme/colors"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
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
import { trackEvent } from "../utils/analytics"
import { Character, meritFlawSchema } from "../data/Character"
import { disciplines } from "../data/Disciplines"
import { PredatorTypes } from "../data/PredatorType"
import { upcase, updateHealthAndWillpowerAndBloodPotencyAndHumanity } from "../generator/utils"
import { globals } from "../globals"
import usePointStates from "../hooks/usePointStates"
import PointPicker from "./PointPicker"
import Tally from "./Tally"
import { useEffect, useState } from "react"
import { DisciplineName, disciplineNameSchema, PredatorTypeName } from "~/data/NameSchemas"

type CategoryInfo = {
    label: string
    accentColor: string
    bgColor: string
    headerBg: string
    borderColor: string
    tallyColor: string
    mantineColor: string
}

const CATEGORY_INFO: Record<string, CategoryInfo> = {
    violent: {
        label: "Violent",
        accentColor: "rgba(250, 82, 82, 0.95)",
        bgColor: rgba(RAW_RED, 0.05),
        headerBg: `linear-gradient(to bottom, ${rgba(RAW_RED, 0.06)} 0%, transparent 100%)`,
        borderColor: rgba(RAW_RED, 0.22),
        tallyColor: "rgba(250, 82, 82, 0.85)",
        mantineColor: "red"
    },
    sociable: {
        label: "Sociable",
        accentColor: "rgba(190, 75, 219, 0.95)",
        bgColor: "rgba(190, 75, 219, 0.05)",
        headerBg: "linear-gradient(to bottom, rgba(190, 75, 219, 0.06) 0%, transparent 100%)",
        borderColor: "rgba(190, 75, 219, 0.22)",
        tallyColor: "rgba(190, 75, 219, 0.85)",
        mantineColor: "grape"
    },
    stealth: {
        label: "Stealth",
        accentColor: "rgba(222, 226, 230, 0.92)",
        bgColor: "rgba(173, 181, 189, 0.05)",
        headerBg: "linear-gradient(to bottom, rgba(173, 181, 189, 0.06) 0%, transparent 100%)",
        borderColor: "rgba(173, 181, 189, 0.22)",
        tallyColor: "rgba(222, 226, 230, 0.75)",
        mantineColor: "gray"
    },
    exclusive: {
        label: "Excluding Mortals",
        accentColor: "rgba(153, 105, 229, 0.95)",
        bgColor: "rgba(132, 94, 247, 0.10)",
        headerBg: "linear-gradient(to bottom, rgba(132, 94, 247, 0.06) 0%, transparent 100%)",
        borderColor: "rgba(132, 94, 247, 0.22)",
        tallyColor: "rgba(153, 105, 229, 0.85)",
        mantineColor: "violet"
    }
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

const SectionDivider = ({
    label,
    color,
    lineColor
}: {
    label?: string
    color?: string
    lineColor: string
}) => (
    <div
        style={{
            display: "flex",
            alignItems: "center",
            gap: "0.85rem",
            margin: "16px 0"
        }}
    >
        <div
            style={{
                flex: 1,
                height: "1px",
                background: `linear-gradient(90deg, transparent 0%, ${lineColor} 50%, transparent 100%)`
            }}
        />
        {label && color && (
            <Text
                style={{
                    fontFamily: "Cinzel, Georgia, serif",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color,
                    whiteSpace: "nowrap"
                }}
            >
                {label}
            </Text>
        )}
        <div
            style={{
                flex: 1,
                height: "1px",
                background: `linear-gradient(90deg, transparent 0%, ${lineColor} 50%, transparent 100%)`
            }}
        />
    </div>
)

type PredatorTypeModalProps = {
    modalOpened: boolean
    closeModal: () => void
    character: Character
    pickedPredatorType: PredatorTypeName
    setCharacter: (character: Character) => void
    nextStep: () => void
    specialty: string
    setSpecialty: (specialty: string) => void
    discipline: string
    setDiscipline: (specialty: string) => void
}

const PredatorTypeModal = ({
    modalOpened,
    closeModal,
    setCharacter,
    nextStep,
    character,
    pickedPredatorType,
    specialty,
    setSpecialty,
    discipline,
    setDiscipline
}: PredatorTypeModalProps) => {
    const phoneScreen = globals.isPhoneScreen

    const predatorType = PredatorTypes[pickedPredatorType]
    const pickedDiscipline = disciplines[discipline as DisciplineName]

    const cat = CATEGORY_INFO[PREDATOR_TO_CATEGORY[pickedPredatorType] ?? "violent"]

    const [customSpecialtyText, setCustomSpecialtyText] = useState("")

    const {
        pointStates,
        updatePointStates,
        setExclusiveSelection,
        setFromSelectableMeritsAndFlaws
    } = usePointStates(predatorType.selectableMeritsAndFlaws)
    useEffect(() => {
        setFromSelectableMeritsAndFlaws(predatorType.selectableMeritsAndFlaws)
        setCustomSpecialtyText("")
    }, [pickedPredatorType])

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

    const canConfirm = exclusiveGroupsFilled

    const hasMeritsSection =
        predatorType.meritsAndFlaws.length !== 0 ||
        predatorType.selectableMeritsAndFlaws.length !== 0
    const hasStatChanges =
        predatorType.bloodPotencyChange !== 0 || predatorType.humanityChange !== 0

    return (
        <Modal
            withCloseButton={false}
            size="lg"
            opened={modalOpened}
            onClose={closeModal}
            centered
            radius="xl"
            styles={{
                content: {
                    background:
                        "linear-gradient(to bottom, hsl(0 0% 13%), hsl(0 0% 13%), hsl(0 0% 10%))",
                    backgroundColor: "hsl(0 0% 10%)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    maxHeight: "calc(100dvh - 32px)",
                    overflowX: "hidden",
                    overflowY: "auto"
                },
                overlay: { backdropFilter: "blur(6px)" },
                body: { padding: 0 }
            }}
        >
            {/* Hero header */}
            <div
                style={{
                    padding: "22px 28px 18px",
                    background: cat.headerBg,
                    textAlign: "center"
                }}
            >
                <Text
                    style={{
                        fontFamily: "Inter, Segoe UI, sans-serif",
                        fontSize: "0.68rem",
                        letterSpacing: "0.22em",
                        textTransform: "uppercase",
                        color: cat.accentColor,
                        marginBottom: 6
                    }}
                >
                    {cat.label}
                </Text>
                <Text
                    style={{
                        fontFamily: "Cinzel, Georgia, serif",
                        fontSize: "1.55rem",
                        fontWeight: 600,
                        letterSpacing: "0.05em",
                        color: "rgba(244, 236, 232, 0.97)",
                        lineHeight: 1.2
                    }}
                >
                    {predatorType.name}
                </Text>
                <Text
                    style={{
                        fontFamily: "Crimson Text, Georgia, serif",
                        fontSize: "1rem",
                        color: rgba(RAW_GREY, 0.65),
                        marginTop: 6
                    }}
                >
                    {predatorType.summary}
                </Text>
            </div>

            {/* Body */}
            <Stack gap="md" p="xl" pt="lg">
                {/* Stat changes */}
                {hasStatChanges && (
                    <div>
                        <Group gap="xl" justify="center">
                            {predatorType.bloodPotencyChange !== 0 && (
                                <div style={{ textAlign: "center" }}>
                                    <Text
                                        style={{
                                            fontFamily: "Inter, sans-serif",
                                            fontSize: "0.68rem",
                                            letterSpacing: "0.15em",
                                            textTransform: "uppercase",
                                            color: rgba(RAW_GREY, 0.45),
                                            marginBottom: 2
                                        }}
                                    >
                                        Blood Potency
                                    </Text>
                                    <Text
                                        style={{
                                            fontFamily: "Cinzel, Georgia, serif",
                                            fontSize: "1.1rem",
                                            fontWeight: 700,
                                            color:
                                                predatorType.bloodPotencyChange > 0
                                                    ? "rgba(100, 220, 120, 0.9)"
                                                    : "rgba(250, 82, 82, 0.9)"
                                        }}
                                    >
                                        {predatorType.bloodPotencyChange > 0
                                            ? `+${predatorType.bloodPotencyChange}`
                                            : predatorType.bloodPotencyChange}
                                    </Text>
                                </div>
                            )}
                            {predatorType.humanityChange !== 0 && (
                                <div style={{ textAlign: "center" }}>
                                    <Text
                                        style={{
                                            fontFamily: "Inter, sans-serif",
                                            fontSize: "0.68rem",
                                            letterSpacing: "0.15em",
                                            textTransform: "uppercase",
                                            color: rgba(RAW_GREY, 0.45),
                                            marginBottom: 2
                                        }}
                                    >
                                        Humanity
                                    </Text>
                                    <Text
                                        style={{
                                            fontFamily: "Cinzel, Georgia, serif",
                                            fontSize: "1.1rem",
                                            fontWeight: 700,
                                            color:
                                                predatorType.humanityChange > 0
                                                    ? "rgba(100, 220, 120, 0.9)"
                                                    : "rgba(250, 82, 82, 0.9)"
                                        }}
                                    >
                                        {predatorType.humanityChange > 0
                                            ? `+${predatorType.humanityChange}`
                                            : predatorType.humanityChange}
                                    </Text>
                                </div>
                            )}
                        </Group>
                    </div>
                )}

                {/* Merits & Flaws */}
                {hasMeritsSection && (
                    <div>
                        <SectionDivider
                            label="Merits & Flaws"
                            color={cat.accentColor}
                            lineColor="rgba(80, 80, 90, 0.4)"
                        />
                        <Stack gap="sm">
                            {predatorType.meritsAndFlaws.map((mf) => (
                                <Group
                                    key={mf.name + mf.level}
                                    gap="sm"
                                    wrap="nowrap"
                                    align="center"
                                >
                                    <Tally
                                        n={mf.level}
                                        style={{ color: cat.tallyColor, flexShrink: 0 }}
                                        size="22px"
                                    />
                                    <div>
                                        <Text
                                            style={{
                                                fontFamily: "Crimson Text, Georgia, serif",
                                                fontSize: "1.05rem",
                                                color: "rgba(244, 236, 232, 0.9)",
                                                lineHeight: 1.2
                                            }}
                                        >
                                            {mf.name}
                                        </Text>
                                        {mf.summary && (
                                            <Text
                                                style={{
                                                    fontFamily: "Inter, sans-serif",
                                                    fontSize: "0.76rem",
                                                    color: rgba(RAW_GREY, 0.5),
                                                    marginTop: 1
                                                }}
                                            >
                                                {mf.summary}
                                            </Text>
                                        )}
                                    </div>
                                </Group>
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
                                        <div
                                            key={i}
                                            style={{
                                                padding: "12px 14px",
                                                borderRadius: 10,
                                                background: cat.bgColor,
                                                border: `1px solid ${cat.borderColor}`
                                            }}
                                        >
                                            {exclusive ? (
                                                <Group
                                                    justify="space-between"
                                                    wrap="nowrap"
                                                    align="flex-start"
                                                >
                                                    <Group
                                                        gap="sm"
                                                        align="center"
                                                        style={{ paddingTop: 2 }}
                                                    >
                                                        <Tally
                                                            n={totalPoints}
                                                            style={{
                                                                color: cat.tallyColor,
                                                                flexShrink: 0
                                                            }}
                                                            size="26px"
                                                        />
                                                        <Text
                                                            style={{
                                                                fontFamily:
                                                                    "Cinzel, Georgia, serif",
                                                                fontSize: "0.9rem",
                                                                fontWeight: 600,
                                                                letterSpacing: "0.15em",
                                                                textTransform: "uppercase",
                                                                color: cat.accentColor
                                                            }}
                                                        >
                                                            {options[0].name}
                                                        </Text>
                                                    </Group>
                                                    <Stack gap="xs">
                                                        {options.map((option, j) => (
                                                            <Group
                                                                key={
                                                                    predatorType.name +
                                                                    "/" +
                                                                    option.name +
                                                                    j
                                                                }
                                                                gap="xs"
                                                                wrap="nowrap"
                                                                align="center"
                                                            >
                                                                <Radio
                                                                    checked={
                                                                        selectedExclusiveIndex === j
                                                                    }
                                                                    onChange={() =>
                                                                        setExclusiveSelection(i, j)
                                                                    }
                                                                    color={cat.mantineColor}
                                                                    styles={{
                                                                        radio: { cursor: "pointer" }
                                                                    }}
                                                                />
                                                                <Text
                                                                    style={{
                                                                        fontFamily:
                                                                            "Crimson Text, Georgia, serif",
                                                                        fontSize: "1rem",
                                                                        color: rgba(RAW_GREY, 0.85),
                                                                        cursor: "pointer"
                                                                    }}
                                                                    onClick={() =>
                                                                        setExclusiveSelection(i, j)
                                                                    }
                                                                >
                                                                    {option.summary || option.name}
                                                                </Text>
                                                            </Group>
                                                        ))}
                                                    </Stack>
                                                </Group>
                                            ) : (
                                                <>
                                                    <Text
                                                        style={{
                                                            fontFamily: "Cinzel, Georgia, serif",
                                                            fontSize: "0.8rem",
                                                            fontWeight: 700,
                                                            textAlign: "right",
                                                            color:
                                                                totalPoints - spentPoints === 0
                                                                    ? "rgba(160, 160, 170, 0.55)"
                                                                    : cat.accentColor
                                                        }}
                                                    >
                                                        {totalPoints - spentPoints} remaining
                                                    </Text>

                                                    <Stack gap="xs">
                                                        {options.map((option, j) => {
                                                            if (false) {
                                                                return null
                                                            }

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
                                                                        transitionProps={{
                                                                            transition: "slide-up",
                                                                            duration: 200
                                                                        }}
                                                                        events={
                                                                            globals.tooltipTriggerEvents
                                                                        }
                                                                    >
                                                                        <Text
                                                                            style={{
                                                                                fontFamily:
                                                                                    "Crimson Text, Georgia, serif",
                                                                                fontSize: "1rem",
                                                                                color: rgba(
                                                                                    RAW_GREY,
                                                                                    0.85
                                                                                ),
                                                                                minWidth: 140
                                                                            }}
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

                {/* Skill Specialty */}
                <div>
                    <SectionDivider
                        label="Skill Specialty"
                        color={cat.accentColor}
                        lineColor="rgba(80, 80, 90, 0.4)"
                    />
                    <SegmentedControl
                        size={phoneScreen ? "sm" : "md"}
                        color={cat.mantineColor}
                        fullWidth
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
                                color={cat.accentColor}
                                mt="xs"
                            />
                        ) : null
                    })()}
                </div>

                {/* Discipline */}
                <div>
                    <SectionDivider
                        label="Bonus Discipline"
                        color={cat.accentColor}
                        lineColor="rgba(80, 80, 90, 0.4)"
                    />
                    <Tooltip
                        label={`${upcase(discipline)}: ${pickedDiscipline?.summary ?? ""}`}
                        transitionProps={{ transition: "slide-up", duration: 200 }}
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
                                value: d.name
                            }))}
                        />
                    </Tooltip>
                </div>

                {/* Actions */}
                <Group justify="space-between" mt="md">
                    <Button
                        variant="subtle"
                        color="gray"
                        leftSection={<FontAwesomeIcon icon={faChevronLeft} />}
                        onClick={closeModal}
                        styles={{
                            root: {
                                color: rgba(RAW_GREY, 0.5),
                                "&:hover": { color: rgba(RAW_GREY, 0.85) }
                            }
                        }}
                    >
                        Back
                    </Button>

                    <Button
                        data-testid="predator-type-confirm-button"
                        color={cat.mantineColor}
                        disabled={!canConfirm}
                        onClick={async () => {
                            const pickedSpecialtyOption = predatorType.specialtyOptions.find(
                                (s) => `${s.skill}_${s.name}` === specialty
                            )
                            const pickedDisciplineOption = predatorType.disciplineOptions.find(
                                ({ name }) => name === discipline
                            )
                            if (!pickedSpecialtyOption) {
                                console.error(`Couldn't find specialty with key ${specialty}`)
                            } else if (!pickedDisciplineOption) {
                                console.error(`Couldn't find discipline with name ${discipline}`)
                            } else {
                                const resolvedSpecialty = {
                                    skill: pickedSpecialtyOption.skill,
                                    name: customSpecialtyText.trim() || pickedSpecialtyOption.name
                                }

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

                                const pickedDisciplineName = disciplineNameSchema.parse(discipline)
                                const changedPickedDiscipline =
                                    pickedDisciplineName !== character.predatorType.pickedDiscipline
                                updateHealthAndWillpowerAndBloodPotencyAndHumanity(character)
                                setCharacter({
                                    ...character,
                                    predatorType: {
                                        name: pickedPredatorType,
                                        pickedDiscipline: pickedDisciplineName,
                                        pickedSpecialties: [resolvedSpecialty],
                                        pickedMeritsAndFlaws
                                    },
                                    disciplines: changedPickedDiscipline
                                        ? []
                                        : character.disciplines,
                                    rituals: changedPickedDiscipline ? [] : character.rituals,
                                    ceremonies: changedPickedDiscipline ? [] : character.ceremonies
                                })

                                trackEvent({
                                    action: "predatortype confirm clicked",
                                    category: "predator type",
                                    label: pickedPredatorType
                                })

                                closeModal()
                                nextStep()
                            }
                        }}
                    >
                        Confirm
                    </Button>
                </Group>
            </Stack>
        </Modal>
    )
}

export default PredatorTypeModal
