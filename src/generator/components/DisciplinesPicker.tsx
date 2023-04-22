import { Accordion, Button, Card, Center, Grid, Space, Stack, Text } from "@mantine/core"
import { useState } from "react"
import { Character } from "../../data/Character"
import { Discipline, Power, disciplines } from "../../data/Disciplines"
import { intersection, upcase } from "../utils"


type DisciplinesPickerProps = {
    character: Character,
    setCharacter: (character: Character) => void
    nextStep: () => void
}

const DisciplinesPicker = ({ character, setCharacter, nextStep }: DisciplinesPickerProps) => {
    const [pickedPowers, setPickedPowers] = useState<Power[]>([])

    const disciplinesForClan = Object.fromEntries(Object.entries(disciplines).filter(([, value]) => value.clans.includes(character.clan)))

    const isPicked = (power: Power) => {
        return pickedPowers.map((power) => power.name).includes(power.name)
    }
    const missingPrerequisites = (power: Power) => {
        const powersOfDiscipline = disciplines[power.discipline].powers

        // lvl 2 powers require picking a lvl 1 power first
        if (power.level === 2 && intersection(powersOfDiscipline, pickedPowers).length === 0) return true

        // amalgam prerequisites
        for (const { discipline, level } of power.amalgamPrerequisites) {
            const pickedDisciplineLevel = pickedPowers
                .map((power) => power.discipline)
                .filter((powerDisc) => powerDisc === discipline)
                .length

            if (pickedDisciplineLevel < level) return true
        }

        return false
    }
    const alreadyPickedTwoPowers = (power: Power) => {
        const powersOfDiscipline = disciplines[power.discipline].powers

        return intersection(powersOfDiscipline, pickedPowers).length === 2
    }
    const alreadyPickedTwoDisciplines = (power: Power) => {
        const pickedDisciplines = pickedPowers.map((power) => power.discipline)
        const uniquePickedDisciplines = [...new Set(pickedDisciplines)]

        return uniquePickedDisciplines.length >= 2 && !uniquePickedDisciplines.includes(power.discipline)
    }
    const allPowersPicked = () => pickedPowers.length >= 3

    const undoPick = () => {
        setPickedPowers(pickedPowers.slice(0, -1))
    }

    // TODO: Consider putting two rows per discipline (one for lvl1, one for lvl2) to make accordion contents shorter
    const getDisciplineAccordionItem = (disciplineName: string, discipline: Discipline) => {
        return (
            <Accordion.Item key={disciplineName} value={disciplineName}>
                <Accordion.Control>{upcase(disciplineName)}</Accordion.Control>
                <Accordion.Panel>
                    <Stack>
                        {discipline.powers.map((power) => {
                            const isButtonDisabled = isPicked(power) || missingPrerequisites(power) || alreadyPickedTwoPowers(power) || alreadyPickedTwoDisciplines(power) || allPowersPicked()

                            return (
                                // TODO: Add badge with leve
                                // TODO: Include amalgam prerequisites somewhere
                                <Card key={power.name}>
                                    <Text weight={500}>{power.name}</Text>

                                    <Text size="sm" color="dimmed">{power.summary}</Text>
                                    <Button disabled={isButtonDisabled} onClick={() => setPickedPowers([...pickedPowers, power])} variant="light" color="blue" fullWidth mt="md" radius="md">
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

    const powersSortedByDiscipline = pickedPowers.sort()
    let disciplineTitle = ""
    return (
        <div>
            <h1>Pick 2 powers in one disciplines, and 1 power in another</h1>

            <Text ta="center" fz="xl" fw={700} c="red">Disciplines</Text>
            <hr color="#e03131" />
            <Space h={"sm"} />

            <Stack align="center" spacing="xl">
                <Grid style={{ width: "100%" }}>
                    <Grid.Col span={2}>
                        <Center style={{ height: "100%" }}>
                            <Stack>
                                {powersSortedByDiscipline.map((power) => {
                                    if (power.discipline !== disciplineTitle) {
                                        disciplineTitle = power.discipline
                                        return (
                                            <div key={power.name}>
                                                <Text weight={700} size={"xl"}>{upcase(power.discipline)}</Text>
                                                <Text> {power.name}</Text>
                                            </div>
                                        )
                                    }
                                    return (<Text key={power.name}>{power.name}</Text>)
                                })}
                                {pickedPowers.length > 0 ? <Button variant="light" color="red" onClick={undoPick}>Undo last pick</Button> : null}
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
                    setCharacter({ ...character, disciplines: pickedPowers })
                    nextStep()
                }}>Confirm</Button>
            </Stack>
        </div >
    )
}

export default DisciplinesPicker