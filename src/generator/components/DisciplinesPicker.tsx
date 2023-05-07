import { Accordion, Badge, Button, Card, Center, Grid, Group, List, Space, Stack, Text } from "@mantine/core"
import { useMediaQuery } from "@mantine/hooks"
import { useState } from "react"
import { Character } from "../../data/Character"
import { ClanName } from "../../data/Clans"
import { Discipline, Power, disciplines } from "../../data/Disciplines"
import { intersection, upcase } from "../utils"


type DisciplinesPickerProps = {
    character: Character,
    setCharacter: (character: Character) => void
    nextStep: () => void
}

const getDisciplinesForClan = (clan: ClanName) => {
    return Object.fromEntries(Object.entries(disciplines).filter(([, value]) => value.clans.includes(clan)))
}

// TODO: Fix background image size changing when opening a tab with 3 powers at one level (eg. Animalism/Cleaver)
const DisciplinesPicker = ({ character, setCharacter, nextStep }: DisciplinesPickerProps) => {
    const phoneSizedScreen = useMediaQuery('(max-width: 550px)')
    const [pickedPowers, setPickedPowers] = useState<Power[]>([])
    const [pickedPredatorTypePower, setPickedPredatorTypePower] = useState<Power | undefined>()

    let allPickedPowers = pickedPredatorTypePower ? [...pickedPowers, pickedPredatorTypePower] : pickedPowers

    const disciplinesForClan = getDisciplinesForClan(character.clan)
    const predatorTypeDiscipline = disciplines[character.predatorType.pickedDiscipline]

    const isPicked = (power: Power) => {
        return allPickedPowers.map((power) => power.name).includes(power.name)
    }
    const missingPrerequisites = (power: Power) => {
        const powersOfDiscipline = disciplines[power.discipline].powers

        // lvl n powers require picking n-1 powers to access
        if (intersection(powersOfDiscipline, allPickedPowers).length < power.level - 1) return true

        // amalgam prerequisites; intentionally not counting pickedPredatorTypePower
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
        // Prepare allPickedPowers to check if pickedPredatorTypePower still meets prerequisites
        allPickedPowers = pickedPowers.slice(0, -1)
        if (pickedPredatorTypePower && missingPrerequisites(pickedPredatorTypePower)) {
            setPickedPredatorTypePower(undefined)
        }
    }
    const undoPredatorTypePick = () => {
        // Prepare allPickedPowers to check if pickedPowers still meet prerequisites
        allPickedPowers = allPickedPowers
            .filter((p) => p.name !== pickedPredatorTypePower?.name)
            .filter((p) => !(p.discipline === pickedPredatorTypePower?.discipline && p.level > (pickedPredatorTypePower?.level ?? 0)))  // remove powers of same discipline with higher level
        setPickedPredatorTypePower(undefined)
        setPickedPowers(pickedPowers.filter((p) => !missingPrerequisites(p)))
    }

    const getPowerCards = (powers: Power[], isForPredatorType = false) => {
        return powers.map((power) => {
            const isButtonDisabled = isPicked(power)
                || missingPrerequisites(power)
                || (!isForPredatorType && (alreadyPickedTwoPowers(power) || alreadyPickedTwoDisciplines(power) || allPowersPicked()))
                || (isForPredatorType && pickedPredatorTypePower !== undefined)

            const onClick = () => isForPredatorType ? setPickedPredatorTypePower(power) : setPickedPowers([...pickedPowers, power])

            const canReachLvl3 = power.discipline === character.predatorType.pickedDiscipline
            return (
                <Card key={power.name} mb={20} h={255} style={{ backgroundColor: "rgba(26, 27, 30, 0.90)" }}>
                    <Group position="apart" mt="md" mb="xs">
                        <Text weight={500}>{power.name}</Text>
                        {/* FIXUP: Hide badges for small cards + long name to prevent badge being in new line and pushing button down */}
                        {canReachLvl3 && power.name.length > 10 ? null : <Badge color="pink" variant="light">lv {power.level}</Badge>}
                    </Group>

                    <Text h={65} size="sm" color="dimmed">{power.summary}</Text>
                    {power.amalgamPrerequisites.length > 0 ?
                        <div style={{ height: 55 }}>
                            <Text size="sm" color="red">Requires:</Text>
                            <List size="xs">
                                {power.amalgamPrerequisites.map((prereq) => {
                                    return (<List.Item key={power.name + prereq.discipline}>{upcase(prereq.discipline)}: Lv {prereq.level}</List.Item>)
                                })}
                            </List>
                        </div>
                        : <div style={{ height: 55 }}></div>}

                    <Button disabled={isButtonDisabled} onClick={onClick} variant="light" color="blue" fullWidth mt="md" radius="md">
                        Take {power.name}
                    </Button>
                </Card >
            )
        })
    }

    const getDisciplineAccordionItem = (disciplineName: string, discipline: Discipline, isPredatorType = false) => {
        const clanHasPrereqDisciplines = (power: Power) => {
            const prereqDisciplines = power.amalgamPrerequisites.map((prereq) => prereq.discipline)
            for (const disc of prereqDisciplines) {
                if (disciplinesForClan[disc] === undefined) return false
            }
            return true
        }

        // Only show Amalgams that the clan can theoretically pick; using predator-type to get amalgams is intentionally impossible
        const eligiblePowers = discipline.powers.filter(clanHasPrereqDisciplines)

        const lvl1Powers = eligiblePowers.filter((power) => power.level === 1)
        const lvl2Powers = eligiblePowers.filter((power) => power.level === 2)
        const lvl3Powers = eligiblePowers.filter((power) => power.level === 3)

        const canReachLvl3 = disciplineName === character.predatorType.pickedDiscipline

        return (
            <Accordion.Item key={disciplineName + isPredatorType} value={disciplineName + isPredatorType}>
                <Accordion.Control>{upcase(disciplineName)}</Accordion.Control>
                <Accordion.Panel>
                    <Stack>
                        <Grid>
                            <Grid.Col span={canReachLvl3 ? 4 : 6}>{getPowerCards(lvl1Powers, isPredatorType)}</Grid.Col>
                            <Grid.Col span={canReachLvl3 ? 4 : 6}>{getPowerCards(lvl2Powers, isPredatorType)}</Grid.Col>
                            {canReachLvl3 ? <Grid.Col span={4}>{getPowerCards(lvl3Powers, isPredatorType)}</Grid.Col> : null}
                        </Grid>
                    </Stack>
                </Accordion.Panel>
            </Accordion.Item>
        )
    }

    const powersSortedByDiscipline = pickedPowers.sort()
    let disciplineTitle = ""
    return (
        <div>
            <h1>Pick 2 powers in one disciplines,<br /> 1 power in another,<br /> and 1 power in {upcase(character.predatorType.pickedDiscipline)} from your predator type</h1>

            <Text ta="center" fz="xl" fw={700} c="red">Disciplines</Text>
            <hr color="#e03131" />
            <Space h={"sm"} />

            <Stack align="center" spacing="xl">
                <Grid style={{ width: "100%" }}>
                    {/* Picked Powers */}
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

                                {/* Predator Type Discipline pick */}
                                {pickedPredatorTypePower ?
                                    <div>
                                        {powersSortedByDiscipline.length > 0 ? <hr style={{ width: "100%" }} color="#e03131" /> : null}

                                        <Text weight={700} size={"xl"}>{upcase(pickedPredatorTypePower.discipline)}</Text>
                                        <Text> {pickedPredatorTypePower.name}</Text>

                                        <Button variant="light" color="red" onClick={undoPredatorTypePick}>Undo pred pick</Button>
                                    </div>
                                    : null
                                }
                            </Stack>
                        </Center>
                    </Grid.Col>

                    {/* Discipline-List */}
                    <Grid.Col span={6} offset={1}>
                        <Accordion style={{ width: "600px" }}>
                            {
                                Object.entries(disciplinesForClan).map(([name, discipline]) => getDisciplineAccordionItem(name, discipline))
                            }
                            <Text fw={700} mt={"lg"} c={"red"} ta={"center"}>Predator Type Discipline</Text>
                            <hr color="#e03131" />
                            {
                                getDisciplineAccordionItem(character.predatorType.pickedDiscipline, predatorTypeDiscipline, true)
                            }
                        </Accordion>
                    </Grid.Col>
                </Grid>

                <Button disabled={!(allPowersPicked() && pickedPredatorTypePower)} color="grape" onClick={() => {
                    setCharacter({ ...character, disciplines: allPickedPowers })
                    nextStep()
                }}>Confirm</Button>
            </Stack>
        </div >
    )
}

export default DisciplinesPicker