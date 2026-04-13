import { faChevronLeft } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Button, Divider, Grid, Group, Modal, Radio, SegmentedControl, Stack, Text, TextInput, Title, Tooltip, useMantineTheme } from "@mantine/core"
import { trackEvent } from "../utils/analytics"
import { Character, meritFlawSchema } from "../data/Character"
import { disciplines } from "../data/Disciplines"
import { PredatorTypes } from "../data/PredatorType"
import { upcase, updateHealthAndWillpowerAndBloodPotencyAndHumanity } from "../generator/utils"
import { globals } from "../globals"
import usePointStates from "../hooks/usePointStates"
import PointPicker from "./PointPicker"
import Tally from "./Tally"
import FocusBorderWrapper from "../character_sheet/components/FocusBorderWrapper"
import { useEffect, useState } from "react"
import { DisciplineName, disciplineNameSchema, PredatorTypeName } from "~/data/NameSchemas"

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
    setDiscipline,
}: PredatorTypeModalProps) => {
    const theme = useMantineTheme()

    const smallScreen = globals.isSmallScreen
    const phoneScreen = globals.isPhoneScreen

    const predatorType = PredatorTypes[pickedPredatorType]
    const pickedDiscipline = disciplines[discipline as DisciplineName]

    const [customSpecialtyText, setCustomSpecialtyText] = useState("")

    // refactor-idea to make this less messy: make pointStates a map from group-index -> {meritName -> {curPoints, maxPoints}} and return a default value when accessing things that don't exist yet
    // -> no need to check for updated state before rendering modal & maybe accessing looks less messy..?
    const { pointStates, updatePointStates, setExclusiveSelection, setFromSelectableMeritsAndFlaws } = usePointStates(predatorType.selectableMeritsAndFlaws)
    useEffect(() => {
        // set baseline for pointStates so the array-access-methods don't crash
        setFromSelectableMeritsAndFlaws(predatorType.selectableMeritsAndFlaws)
        setCustomSpecialtyText("")
    }, [pickedPredatorType])

    const titleWidth = smallScreen ? "300px" : "750px"

    // Prevent crashing modal in render before useEffect-update goes through
    if (predatorType.selectableMeritsAndFlaws.length > 0 && !pointStates?.at(predatorType.selectableMeritsAndFlaws.length - 1)) {
        return <></>
    }

    // Validation: check that all required inputs are filled
    const selectedSpecialtyOption = predatorType.specialtyOptions.find(
        (s) => `${s.skill}_${s.name}` === specialty
    )
    const needsCustomText = selectedSpecialtyOption?.customInput !== undefined
    const customTextFilled = !needsCustomText || customSpecialtyText.trim().length > 0

    const exclusiveGroupsFilled = predatorType.selectableMeritsAndFlaws.every((selectable, i) => {
        if (!selectable.exclusive) return true
        const subPointStates = pointStates[i]?.subPointStates
        if (!subPointStates) return false
        return subPointStates.some((s) => s.selectedPoints > 0)
    })

    const canConfirm = customTextFilled && exclusiveGroupsFilled

    return (
        <Modal
            withCloseButton={false}
            size="xl"
            opened={modalOpened}
            onClose={() => {
                closeModal()
            }}
            title={
                <div style={{ width: titleWidth }}>
                    <Text fw={700} fz={"30px"} ta="center">
                        {predatorType.name}
                    </Text>
                    <Text style={{ fontSize: "25px", color: "grey" }} ta={"center"}>
                        This predator type comes with the following benefits and banes
                    </Text>
                </div>
            }
            centered
        >
            <Stack>
                <Divider my="sm" />

                {predatorType.bloodPotencyChange !== 0 ? (
                    <div>
                        <Grid>
                            <Grid.Col span={smallScreen ? 8 : 4}>
                                <Text fw={700} fz={"xl"}>
                                    Blood Potency Change:
                                </Text>
                            </Grid.Col>
                            <Grid.Col span={4}>
                                <Text fz={"xl"} fw={700} ta={"center"} c={predatorType.bloodPotencyChange > 0 ? "green" : "red"}>{`${
                                    predatorType.bloodPotencyChange > 0 ? "+" : ""
                                }${predatorType.bloodPotencyChange}`}</Text>
                            </Grid.Col>
                        </Grid>
                        <Divider my="sm" variant="dotted" />
                    </div>
                ) : null}

                {predatorType.humanityChange !== 0 ? (
                    <div>
                        <Grid>
                            <Grid.Col span={smallScreen ? 8 : 4}>
                                <Text fw={700} fz={"xl"}>
                                    Humanity Change:
                                </Text>
                            </Grid.Col>
                            <Grid.Col span={4}>
                                <Text fz={"xl"} ta={"center"} fw={700} c={predatorType.humanityChange > 0 ? "green" : "red"}>{`${
                                    predatorType.humanityChange > 0 ? "+" : ""
                                }${predatorType.humanityChange}`}</Text>
                            </Grid.Col>
                        </Grid>
                        <Divider my="sm" variant="dotted" />
                    </div>
                ) : null}
                {predatorType.meritsAndFlaws.length !== 0 || predatorType.selectableMeritsAndFlaws.length !== 0 ? (
                    <div>
                        <Group justify="space-between">
                            <Text fw={700} fz={"xl"}>
                                Merits and Flaws:
                            </Text>
                            <Stack w={"100%"}>
                                {predatorType.meritsAndFlaws.map((mf) => {
                                    return (
                                        <Grid key={mf.name}>
                                            <Grid.Col span={smallScreen ? 8 : 4}>
                                                <Text miw={"220px"} maw={"80%"} fz={"xl"}>
                                                    {`${mf.name}: `}
                                                    <Text fz={"xs"} component="span">
                                                        {mf.summary}
                                                    </Text>
                                                </Text>
                                            </Grid.Col>
                                            <Grid.Col span={4}>
                                                <Text fz={"xl"} ta={"center"}>
                                                    Lvl
                                                    <Tally
                                                        n={mf.level}
                                                        style={{ color: theme.colors.red[7], marginTop: "-5px" }}
                                                        size={"28px"}
                                                    />
                                                </Text>
                                            </Grid.Col>
                                        </Grid>
                                    )
                                })}
                                {/* TODO: Can we split some of this into a separate component? */}
                                {predatorType.selectableMeritsAndFlaws.map(({ options, totalPoints, exclusive }, i) => {
                                    const subPointStates = pointStates[i].subPointStates
                                    const spentPoints = subPointStates.reduce((acc, cur) => {
                                        return acc + cur.selectedPoints
                                    }, 0)
                                    const selectedExclusiveIndex = exclusive
                                        ? subPointStates.findIndex((s) => s.selectedPoints > 0)
                                        : -1

                                    return (
                                        <div key={i}>
                                            <Divider my="sm" />
                                            <Group justify="space-between">
                                                {exclusive ? (
                                                    <Text maw={"80%"} fz={"xl"}>
                                                        {options[0].name}:
                                                    </Text>
                                                ) : (
                                                    <Text maw={"80%"} fz={"xl"}>
                                                        {`Pick ${totalPoints} point(s) from: `}
                                                    </Text>
                                                )}
                                                {!exclusive && (
                                                    <div>
                                                        Remaining: <Title ta={"center"} c={"red"}>{`${totalPoints - spentPoints}`}</Title>
                                                    </div>
                                                )}
                                                <Stack>
                                                    {options.map((option, j) => {
                                                        if (exclusive) {
                                                            return (
                                                                <Group key={predatorType.name + "/" + option.name + j} justify="space-between" wrap="nowrap" style={{ width: "100%" }}>
                                                                    <Radio
                                                                        checked={selectedExclusiveIndex === j}
                                                                        onChange={() => setExclusiveSelection(i, j)}
                                                                        label={option.summary}
                                                                        color="red"
                                                                        styles={{ radio: { cursor: "pointer" }, label: { cursor: "pointer" } }}
                                                                    />
                                                                    <Tally
                                                                        n={totalPoints}
                                                                        style={{ color: theme.colors.red[7], marginTop: "-5px" }}
                                                                        size={"28px"}
                                                                    />
                                                                </Group>
                                                            )
                                                        }

                                                        const { selectedPoints, maxLevel } = subPointStates[j]
                                                        return (
                                                            <Group key={predatorType.name + "/" + option.name + j}>
                                                                <Tooltip
                                                                    disabled={option.summary === ""}
                                                                    label={`${upcase(option.summary)}`}
                                                                    transitionProps={{ transition: "slide-up", duration: 200 }}
                                                                    events={globals.tooltipTriggerEvents}
                                                                >
                                                                    <Text w={"140px"}>{option.name}</Text>
                                                                </Tooltip>
                                                                <PointPicker
                                                                    points={selectedPoints}
                                                                    setPoints={(n) => {
                                                                        updatePointStates(n, i, j)
                                                                    }}
                                                                    maxLevel={maxLevel}
                                                                />
                                                            </Group>
                                                        )
                                                    })}
                                                </Stack>
                                            </Group>
                                        </div>
                                    )
                                })}
                            </Stack>
                        </Group>
                        <Divider my="sm" />
                    </div>
                ) : null}

                <Text fw={700} fz={"xl"} ta="center">
                    Select a skill specialty
                </Text>
                <SegmentedControl
                    size={phoneScreen ? "sm" : "md"}
                    color="red"
                    value={specialty}
                    onChange={(value) => {
                        setSpecialty(value)
                        setCustomSpecialtyText("")
                    }}
                    data={predatorType.specialtyOptions.map((s) => ({
                        label: `${upcase(s.skill)}: ${s.name}`,
                        value: `${s.skill}_${s.name}`,
                    }))}
                />
                {(() => {
                    const selectedSpecialtyOption = predatorType.specialtyOptions.find(
                        (s) => `${s.skill}_${s.name}` === specialty
                    )
                    return selectedSpecialtyOption?.customInput ? (
                        <FocusBorderWrapper colorValue={theme.colors.grape[6]}>
                            <TextInput
                                placeholder={selectedSpecialtyOption.customInput}
                                value={customSpecialtyText}
                                onChange={(e) => setCustomSpecialtyText(e.target.value)}
                                mt="xs"
                            />
                        </FocusBorderWrapper>
                    ) : null
                })()}
                <Divider my="sm" />

                <Text fw={700} fz={"xl"} ta="center">
                    Take a bonus level to a discipline
                </Text>
                <Tooltip
                    label={`${upcase(discipline)}: ${pickedDiscipline.summary}`}
                    transitionProps={{ transition: "slide-up", duration: 200 }}
                    events={globals.tooltipTriggerEvents}
                >
                    <SegmentedControl
                        size={phoneScreen ? "sm" : "md"}
                        color="red"
                        value={discipline}
                        onChange={setDiscipline}
                        data={predatorType.disciplineOptions.map((discipline) => ({
                            label: upcase(discipline.name),
                            value: discipline.name,
                        }))}
                    />
                </Tooltip>

                <Divider my="sm" />

                <Group justify="space-between">
                    <Button color="yellow" variant="subtle" leftSection={<FontAwesomeIcon icon={faChevronLeft} />} onClick={closeModal}>
                        Back
                    </Button>

                    <Button
                        color="grape"
                        disabled={!canConfirm}
                        onClick={async () => {
                            const pickedSpecialtyOption = predatorType.specialtyOptions.find(
                                (s) => `${s.skill}_${s.name}` === specialty
                            )
                            const pickedDiscipline = predatorType.disciplineOptions.find(({ name }) => name === discipline)
                            if (!pickedSpecialtyOption) {
                                console.error(`Couldn't find specialty with key ${specialty}`)
                            } else if (!pickedDiscipline) {
                                console.error(`Couldn't find discipline with name ${discipline}`)
                            } else {
                                // Substitute custom text into the specialty name when applicable
                                const resolvedSpecialty = pickedSpecialtyOption.customInput && customSpecialtyText.trim()
                                    ? { skill: pickedSpecialtyOption.skill, name: customSpecialtyText.trim() }
                                    : { skill: pickedSpecialtyOption.skill, name: pickedSpecialtyOption.name }

                                const pickedMeritsAndFlaws = predatorType.selectableMeritsAndFlaws.flatMap((selectable, i) => {
                                    const subPointStates = pointStates[i].subPointStates
                                    const pickedMerits = selectable.options.flatMap((option, j) => {
                                        const { selectedPoints } = subPointStates[j]
                                        if (selectedPoints === 0) return []
                                        return meritFlawSchema.parse({
                                            ...option,
                                            level: selectedPoints,
                                        })
                                    })

                                    return pickedMerits
                                })

                                const pickedDiscipline = disciplineNameSchema.parse(discipline)
                                const changedPickedDiscipline = pickedDiscipline !== character.predatorType.pickedDiscipline
                                updateHealthAndWillpowerAndBloodPotencyAndHumanity(character)
                                setCharacter({
                                    ...character,
                                    predatorType: {
                                        name: pickedPredatorType,
                                        pickedDiscipline,
                                        pickedSpecialties: [resolvedSpecialty],
                                        pickedMeritsAndFlaws,
                                    },
                                    disciplines: changedPickedDiscipline ? [] : character.disciplines,
                                    rituals: changedPickedDiscipline ? [] : character.rituals,
                                    // TODOdin: Consider updating merits and flaws here with predatorType.meritsAndFlaws so we don't have to
                                    // remember to query those every time
                                })

                                trackEvent({
                                    action: "predatortype confirm clicked",
                                    category: "predator type",
                                    label: pickedPredatorType,
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
