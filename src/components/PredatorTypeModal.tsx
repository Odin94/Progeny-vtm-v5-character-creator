import { faChevronLeft } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Button, Divider, Grid, Group, Modal, SegmentedControl, Stack, Text, Title, Tooltip, useMantineTheme } from "@mantine/core"
import { trackEvent } from "../utils/analytics"
import { Character, meritFlawSchema } from "../data/Character"
import { disciplines } from "../data/Disciplines"
import { PredatorTypes } from "../data/PredatorType"
import { upcase, updateHealthAndWillpowerAndBloodPotencyAndHumanity } from "../generator/utils"
import { globals } from "../globals"
import usePointStates from "../hooks/usePointStates"
import PointPicker from "./PointPicker"
import Tally from "./Tally"
import { useEffect } from "react"
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

    // refactor-idea to make this less messy: make pointStates a map from group-index -> {meritName -> {curPoints, maxPoints}} and return a default value when accessing things that don't exist yet
    // -> no need to check for updated state before rendering modal & maybe accessing looks less messy..?
    const { pointStates, updatePointStates, setFromSelectableMeritsAndFlaws } = usePointStates(predatorType.selectableMeritsAndFlaws)
    useEffect(() => {
        // set baseline for pointStates so the array-access-methods don't crash
        setFromSelectableMeritsAndFlaws(predatorType.selectableMeritsAndFlaws)
    }, [pickedPredatorType])

    const titleWidth = smallScreen ? "300px" : "750px"

    // Prevent crashing modal in render before useEffect-update goes through
    if (predatorType.selectableMeritsAndFlaws.length > 0 && !pointStates?.at(predatorType.selectableMeritsAndFlaws.length - 1)) {
        return <></>
    }

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
                                {predatorType.selectableMeritsAndFlaws.map(({ options, totalPoints }, i) => {
                                    const subPointStates = pointStates[i].subPointStates
                                    const spentPoints = subPointStates.reduce((acc, cur) => {
                                        return acc + cur.selectedPoints
                                    }, 0)
                                    return (
                                        <div key={i}>
                                            <Divider my="sm" />
                                            <Group justify="space-between">
                                                <Text maw={"80%"} fz={"xl"}>
                                                    {`Pick ${totalPoints} point(s) from: `}
                                                </Text>
                                                <div>
                                                    Remaining: <Title ta={"center"} c={"red"}>{`${totalPoints - spentPoints}`}</Title>
                                                </div>
                                                <Stack>
                                                    {options.map((option, j) => {
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
                    onChange={setSpecialty}
                    data={predatorType.specialtyOptions.map((specialty) => ({
                        label: `${upcase(specialty.skill)}: ${specialty.name}`,
                        value: `${specialty.skill}_${specialty.name}`,
                    }))}
                />
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
                        onClick={async () => {
                            const pickedSpecialty = predatorType.specialtyOptions.find(({ name }) => name === specialty.split("_")[1])
                            const pickedDiscipline = predatorType.disciplineOptions.find(({ name }) => name === discipline)
                            if (!pickedSpecialty) {
                                console.error(`Couldn't find specialty with name ${specialty}`)
                            } else if (!pickedDiscipline) {
                                console.error(`Couldn't find discipline with name ${discipline}`)
                            } else {
                                const pickedMeritsAndFlaws = predatorType.selectableMeritsAndFlaws.flatMap((selectable, i) => {
                                    const subPointStates = pointStates[i].subPointStates
                                    const pickedMerits = selectable.options.flatMap((option, j) => {
                                        const { selectedPoints } = subPointStates[j]
                                        if (selectedPoints === 0) return []
                                        return meritFlawSchema.parse({
                                            name: option.name,
                                            summary: option.summary,
                                            level: selectedPoints,
                                            type: option.type,
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
                                        pickedSpecialties: [pickedSpecialty],
                                        pickedMeritsAndFlaws,
                                    },
                                    disciplines: changedPickedDiscipline ? [] : character.disciplines,
                                    rituals: changedPickedDiscipline ? [] : character.rituals,
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
