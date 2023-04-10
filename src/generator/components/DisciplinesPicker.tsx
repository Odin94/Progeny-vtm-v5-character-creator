import { Accordion, Button, Card, Center, Divider, Grid, Stack, Text } from "@mantine/core"
import { useState } from "react"
import { Character } from "../data/Character"
import { Discipline, Power, disciplines } from "../data/Disciplines"
import { intersection, upcase } from "../utils"


type DisciplinesPickerProps = {
    character: Character,
    setCharacter: (character: Character) => void
    nextStep: () => void
}

type DisciplineSetting = {
    firstDiscipline: {
        name: string,
        firstPower: Power,
        secondPower: Power
    },
    secondDiscipline: {
        name: string,
        power: Power
    }
}

const getEmptyPower = (): Power => { return { name: "", description: "", dicePool: "", summary: "", level: 1, discipline: "animalism" } }

const DisciplinesPicker = ({ character, setCharacter, nextStep }: DisciplinesPickerProps) => {
    const [pickedDisciplines, setPickedDisciplines] = useState<DisciplineSetting>({
        firstDiscipline: {
            name: "",
            firstPower: getEmptyPower(),
            secondPower: getEmptyPower()
        },
        secondDiscipline: {
            name: "",
            power: getEmptyPower()
        }
    })

    const disciplinesForClan = Object.fromEntries(Object.entries(disciplines).filter(([, value]) => value.clans.includes(character.clan)))

    const pickDisciplinePower = (disciplineName: string, power: Power) => {
        if (pickedDisciplines.firstDiscipline.firstPower.name === "") {
            setPickedDisciplines({ ...pickedDisciplines, firstDiscipline: { ...(pickedDisciplines.firstDiscipline), name: disciplineName, firstPower: power } })
        } else if (pickedDisciplines.firstDiscipline.secondPower.name === "") {
            setPickedDisciplines({ ...pickedDisciplines, firstDiscipline: { ...(pickedDisciplines.firstDiscipline), secondPower: power } })
        } else {
            setPickedDisciplines({ ...pickedDisciplines, secondDiscipline: { name: disciplineName, power } })
        }
    }

    const isPicked = (power: Power) => {
        return [
            pickedDisciplines.firstDiscipline.firstPower.name,
            pickedDisciplines.firstDiscipline.secondPower.name,
            pickedDisciplines.secondDiscipline.power.name,

        ].includes(power.name)
    }
    const isLvl2WithNoLvl1PickedYet = (power: Power) => {
        const powersOfDiscipline = disciplines[power.discipline].powers
        const pickedPowers = [
            pickedDisciplines.firstDiscipline.firstPower,
            pickedDisciplines.firstDiscipline.secondPower,
            pickedDisciplines.secondDiscipline.power,
        ]
        return power.level === 2 && intersection(powersOfDiscipline, pickedPowers).length === 0
    }
    const haveAlreadyPickedTwo = (power: Power) => {
        const powersOfDiscipline = disciplines[power.discipline].powers
        const pickedPowers = [
            pickedDisciplines.firstDiscipline.firstPower,
            pickedDisciplines.firstDiscipline.secondPower,
            pickedDisciplines.secondDiscipline.power,
        ]
        return intersection(powersOfDiscipline, pickedPowers).length === 2
    }
    const allPowersPicked = () => pickedDisciplines.secondDiscipline.name !== ""

    const undoPick = () => {
        if (pickedDisciplines.secondDiscipline.name !== "") {
            setPickedDisciplines({ ...pickedDisciplines, secondDiscipline: { name: "", power: getEmptyPower() } })
        } else if (pickedDisciplines.firstDiscipline.secondPower.name !== "") {
            setPickedDisciplines({ ...pickedDisciplines, firstDiscipline: { ...(pickedDisciplines.firstDiscipline), secondPower: getEmptyPower() } })
        } else {
            setPickedDisciplines({ ...pickedDisciplines, firstDiscipline: { name: "", firstPower: getEmptyPower(), secondPower: getEmptyPower() } })
        }
    }

    const getDisciplineAccordionItem = (disciplineName: string, discipline: Discipline) => {
        const haveToPickSecondPower = pickedDisciplines.firstDiscipline.firstPower.name !== "" && pickedDisciplines.firstDiscipline.secondPower.name === ""
        return (
            <Accordion.Item key={disciplineName} value={disciplineName}>
                <Accordion.Control disabled={haveToPickSecondPower}>{upcase(disciplineName)}</Accordion.Control>
                <Accordion.Panel>
                    <Stack>
                        {discipline.powers.map((power) => {
                            return (
                                <Card key={power.name}>
                                    <Text weight={500}>{power.name}</Text>

                                    <Text size="sm" color="dimmed">{power.summary}</Text>

                                    <Button disabled={isPicked(power) || isLvl2WithNoLvl1PickedYet(power) || haveAlreadyPickedTwo(power) || allPowersPicked()} onClick={() => pickDisciplinePower(disciplineName, power)} variant="light" color="blue" fullWidth mt="md" radius="md">
                                        Take {power.name}
                                    </Button>
                                </Card>
                            )
                        })}
                    </Stack>
                </Accordion.Panel>
            </Accordion.Item>
        )
    }

    return (
        <div>
            <h1>Pick 2 powers in one disciplines, and 1 power in another</h1>
            <Stack align="center" spacing="xl">
                <Grid style={{ width: "100%" }}>
                    <Grid.Col span={2}>
                        <Center style={{ height: "100%" }}>
                            <Stack>
                                {pickedDisciplines.firstDiscipline.name ? <Text weight={700} size={"xl"}>{upcase(pickedDisciplines.firstDiscipline.name)}</Text> : null}
                                <Text>{pickedDisciplines.firstDiscipline.firstPower.name}</Text>
                                <Text>{pickedDisciplines.firstDiscipline.secondPower.name}</Text>

                                {pickedDisciplines.secondDiscipline.name ? <> <Divider /> <Text weight={700} size={"xl"}>{upcase(pickedDisciplines.secondDiscipline.name)}</Text></> : null}
                                <Text>{pickedDisciplines.secondDiscipline.power.name}</Text>

                                {pickedDisciplines.firstDiscipline.name ? <Button onClick={undoPick}>Undo last pick</Button> : null}
                            </Stack>
                        </Center>
                    </Grid.Col>
                    <Grid.Col span={6} offset={1}>
                        <Accordion style={{ width: "400px" }}>
                            {
                                Object.entries(disciplinesForClan).map(([name, discipline]) => getDisciplineAccordionItem(name, discipline))
                            }
                        </Accordion>
                    </Grid.Col>
                </Grid>

                <Button disabled={!allPowersPicked()} color="grape" onClick={() => {
                    setCharacter({ ...character, disciplines: [pickedDisciplines.firstDiscipline.firstPower, pickedDisciplines.firstDiscipline.secondPower, pickedDisciplines.secondDiscipline.power] })
                    nextStep()
                }}>Confirm</Button>
            </Stack>
        </div>
    )
}

export default DisciplinesPicker