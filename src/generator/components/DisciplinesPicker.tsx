import { Accordion, Button, Card, Divider, Grid, Stack, Text } from "@mantine/core"
import { useState } from "react"
import { Character } from "../data/Character"
import { Discipline, Power, disciplines } from "../data/Disciplines"
import { upcase } from "../utils"


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

const DisciplinesPicker = ({ character, setCharacter, nextStep }: DisciplinesPickerProps) => {
    const [pickedDisciplines, setPickedDisciplines] = useState<DisciplineSetting>({
        firstDiscipline: {
            name: "",
            firstPower: { name: "", description: "", dicePool: "", summary: "", level: 1, discipline: "animalism" },
            secondPower: { name: "", description: "", dicePool: "", summary: "", level: 1, discipline: "animalism" }
        },
        secondDiscipline: {
            name: "",
            power: { name: "", description: "", dicePool: "", summary: "", level: 1, discipline: "animalism" }
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

    const isPicked = (powerName: string) => {
        return [
            pickedDisciplines.firstDiscipline.firstPower.name,
            pickedDisciplines.firstDiscipline.secondPower.name,
            pickedDisciplines.secondDiscipline.power.name,

        ].includes(powerName)
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

                                    <Button disabled={isPicked(power.name)} onClick={() => pickDisciplinePower(disciplineName, power)} variant="light" color="blue" fullWidth mt="md" radius="md">
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
                        <Stack>
                            {pickedDisciplines.firstDiscipline.name ? <Text weight={700} size={"xl"}>{upcase(pickedDisciplines.firstDiscipline.name)}</Text> : null}
                            <Text>{pickedDisciplines.firstDiscipline.firstPower.name}</Text>
                            <Text>{pickedDisciplines.firstDiscipline.secondPower.name}</Text>

                            {pickedDisciplines.secondDiscipline.name ? <> <Divider /> <Text weight={700} size={"xl"}>{upcase(pickedDisciplines.secondDiscipline.name)}</Text></> : null}
                            <Text>{pickedDisciplines.secondDiscipline.power.name}</Text>

                        </Stack>
                    </Grid.Col>
                    <Grid.Col span={6} offset={1}>
                        <Accordion style={{ width: "400px" }}>
                            {
                                Object.entries(disciplinesForClan).map(([name, discipline]) => getDisciplineAccordionItem(name, discipline))
                            }
                        </Accordion>
                    </Grid.Col>
                </Grid>

                <Button disabled={pickedDisciplines.secondDiscipline.name === ""} color="grape" onClick={() => {
                    setCharacter({ ...character, disciplines: [pickedDisciplines.firstDiscipline.firstPower, pickedDisciplines.firstDiscipline.secondPower, pickedDisciplines.secondDiscipline.power] })
                    nextStep()
                }}>Confirm</Button>
            </Stack>
        </div>
    )
}

export default DisciplinesPicker