import { Accordion, Badge, Button, Card, Center, Grid, Group, Image, List, ScrollArea, Space, Stack, Text } from "@mantine/core"
import { useEffect, useState } from "react"
import ReactGA from "react-ga4"
import { trackEvent } from "../../utils/analytics"
import { Character, containsBloodSorcery } from "../../data/Character"
import { Discipline, Power, disciplines } from "../../data/Disciplines"
import { globals } from "../../globals"
import { intersection, upcase } from "../utils"
import { DisciplineName } from "~/data/NameSchemas"

type DisciplinesPickerProps = {
    character: Character
    setCharacter: (character: Character) => void
    nextStep: () => void
}

const getAvailableDisciplines = (character: Character): Record<DisciplineName, Discipline> => {
    const availableDisciplines: Record<string, Discipline> = {}
    for (const n of character.availableDisciplineNames) {
        availableDisciplines[n] = disciplines[n]
    }

    return availableDisciplines
}

const DisciplinesPicker = ({ character, setCharacter, nextStep }: DisciplinesPickerProps) => {
    useEffect(() => {
        ReactGA.send({ hitType: "pageview", title: "Disciplines Picker" })
    }, [])

    const smallScreen = globals.isSmallScreen
    const phoneScreen = globals.isPhoneScreen
    const [pickedPowers, setPickedPowers] = useState<Power[]>([])
    const [pickedPredatorTypePower, setPickedPredatorTypePower] = useState<Power | undefined>()

    let allPickedPowers = pickedPredatorTypePower ? [...pickedPowers, pickedPredatorTypePower] : pickedPowers

    const disciplinesForClan = getAvailableDisciplines(character)
    const predatorTypeDiscipline = disciplines[character.predatorType.pickedDiscipline]

    const isPicked = (power: Power) => {
        return allPickedPowers.map((power) => power.name).includes(power.name)
    }
    const missingAmalgamPrereq = (power: Power) => {
        for (const { discipline, level } of power.amalgamPrerequisites) {
            const pickedDisciplineLevel = allPickedPowers
                .map((power) => power.discipline)
                .filter((powerDisc) => powerDisc === discipline).length

            if (pickedDisciplineLevel < level) return true
        }
        return false
    }
    const missingPrerequisites = (power: Power) => {
        const powersOfDiscipline = disciplines[power.discipline].powers

        // lvl n powers require picking n-1 powers to access
        if (intersection(powersOfDiscipline, allPickedPowers).length < power.level - 1) return true

        if (missingAmalgamPrereq(power)) return true

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
            .filter((p) => !(p.discipline === pickedPredatorTypePower?.discipline && p.level > (pickedPredatorTypePower?.level ?? 0))) // remove powers of same discipline with higher level
        setPickedPredatorTypePower(undefined)
        setPickedPowers(pickedPowers.filter((p) => !missingPrerequisites(p)))
    }

    const getPowerCards = (powers: Power[], isForPredatorType = false) => {
        return powers.map((power) => {
            const isButtonDisabled =
                isPicked(power) ||
                missingPrerequisites(power) ||
                (!isForPredatorType && (alreadyPickedTwoPowers(power) || alreadyPickedTwoDisciplines(power) || allPowersPicked())) ||
                (isForPredatorType && pickedPredatorTypePower !== undefined)

            const trackClick = () => {
                trackEvent({
                    action: "power clicked",
                    category: "disciplines",
                    label: power.name,
                })
            }
            const onClick = () => (isForPredatorType ? setPickedPredatorTypePower(power) : setPickedPowers([...pickedPowers, power]))

            const amalgamHeight = 25
            let cardHeight = phoneScreen ? 180 : 215
            if (power.amalgamPrerequisites.length > 0) cardHeight += amalgamHeight
            if (power.name.length > 15) cardHeight += 25
            return (
                <Card key={power.name} mb={20} h={cardHeight} style={{ backgroundColor: "rgba(26, 27, 30, 0.90)" }}>
                    <Group justify="space-between" mt="0" mb="xs">
                        <Text fz={smallScreen && !phoneScreen ? "xs" : "sm"} fw={500}>
                            {power.name}
                        </Text>
                        <Badge pos={"absolute"} top={0} right={0} radius={"xs"} color="pink" variant="light">
                            lv {power.level}
                        </Badge>
                    </Group>

                    <Text fz={"sm"} size="sm" color="dimmed">
                        {upcase(power.summary)}
                    </Text>
                    {power.amalgamPrerequisites.length > 0 ? (
                        <div style={{ height: amalgamHeight }}>
                            <Text size="sm" color="red">
                                Requires:
                            </Text>
                            <List size="xs">
                                {power.amalgamPrerequisites.map((prereq) => {
                                    return (
                                        <List.Item key={power.name + prereq.discipline}>
                                            {upcase(prereq.discipline)}: Lv {prereq.level}
                                        </List.Item>
                                    )
                                })}
                            </List>
                            {missingAmalgamPrereq(power) ? null : (
                                <Text size="xs" color="green">
                                    (requirements met)
                                </Text>
                            )}
                        </div>
                    ) : null}

                    <div style={{ position: "absolute", bottom: "0", width: "100%", padding: "inherit", left: 0 }}>
                        <Button
                            disabled={isButtonDisabled}
                            onClick={() => {
                                onClick()
                                trackClick()
                            }}
                            variant="light"
                            color="blue"
                            fullWidth
                            radius="md"
                        >
                            <Text truncate>Take {power.name}</Text>
                        </Button>
                    </div>
                </Card>
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

        const clanHasDiscipline = (disciplineName: DisciplineName) => disciplinesForClan[disciplineName] !== undefined

        // Only show Amalgams that the clan can theoretically pick; using predator-type to get amalgams is intentionally impossible
        const eligiblePowers = discipline.powers.filter(clanHasPrereqDisciplines)

        const lvl1Powers = eligiblePowers.filter((power) => power.level === 1)
        const lvl2Powers = eligiblePowers.filter((power) => power.level === 2)
        const lvl3Powers = eligiblePowers.filter((power) => power.level === 3)

        const canReachLvl3 =
            disciplineName === character.predatorType.pickedDiscipline && !(isPredatorType && !clanHasDiscipline(disciplineName))

        const colSpan = smallScreen ? 12 : canReachLvl3 ? 4 : 6
        return (
            <Accordion.Item key={disciplineName + isPredatorType} value={disciplineName + isPredatorType}>
                <Accordion.Control icon={<Image src={discipline.logo} />}>{upcase(disciplineName)}</Accordion.Control>
                <Accordion.Panel>
                    <Stack>
                        <Grid>
                            <Grid.Col span={colSpan}>{getPowerCards(lvl1Powers, isPredatorType)}</Grid.Col>
                            <Grid.Col span={colSpan}>{getPowerCards(lvl2Powers, isPredatorType)}</Grid.Col>
                            {canReachLvl3 ? <Grid.Col span={colSpan}>{getPowerCards(lvl3Powers, isPredatorType)}</Grid.Col> : null}
                        </Grid>
                    </Stack>
                </Accordion.Panel>
            </Accordion.Item>
        )
    }

    const getPickedPowersSection = () => {
        return (
            <Grid.Col span={smallScreen ? 12 : 2} mt={smallScreen ? "30px" : 0}>
                <Center style={{ height: "100%" }}>
                    <Stack>
                        {powersSortedByDiscipline.map((power) => {
                            if (power.discipline !== disciplineTitle) {
                                disciplineTitle = power.discipline
                                return (
                                    <div key={power.name}>
                                        <Text fw={700} size={"xl"}>
                                            {upcase(power.discipline)}
                                        </Text>
                                        <Text> {power.name}</Text>
                                    </div>
                                )
                            }
                            return <Text key={power.name}>{power.name}</Text>
                        })}
                        {pickedPowers.length > 0 ? (
                            <Button variant="light" color="red" onClick={undoPick}>
                                Undo last pick
                            </Button>
                        ) : null}

                        {/* Predator Type Discipline pick */}
                        {pickedPredatorTypePower ? (
                            <div>
                                {powersSortedByDiscipline.length > 0 ? <hr style={{ width: "100%" }} color="#e03131" /> : null}

                                <Text fw={700} size={"xl"}>
                                    {upcase(pickedPredatorTypePower.discipline)}
                                </Text>
                                <Text> {pickedPredatorTypePower.name}</Text>

                                <Button variant="light" color="red" onClick={undoPredatorTypePick}>
                                    Undo pred pick
                                </Button>
                            </div>
                        ) : null}
                    </Stack>
                </Center>
            </Grid.Col>
        )
    }

    const powersSortedByDiscipline = pickedPowers.sort()
    let disciplineTitle = ""
    const height = globals.viewportHeightPx

    const isThinBlood = character.clan === "Thin-blood"
    if (isThinBlood) {
        return (
            <div style={{ width: smallScreen ? "393px" : "810px", marginTop: globals.isPhoneScreen ? "60px" : "80px" }}>
                <Text fw={500} fz={smallScreen ? "14px" : "28px"} ta="center">
                    <b>Thin-bloods</b> do not pick disciplines
                    <br /> you gain them from blood resonance
                </Text>

                <Center mt={"lg"}>
                    <Button
                        color={"red"}
                        onClick={() => {
                            trackEvent({
                                action: "power clicked",
                                category: "disciplines",
                                label: "thin-blood - no disciplines",
                            })
                            nextStep()
                        }}
                    >
                        Continue
                    </Button>
                </Center>
            </div>
        )
    }

    return (
        <div style={{ width: smallScreen ? "393px" : "810px", marginTop: globals.isPhoneScreen ? "60px" : "80px" }}>
            <Text fw={700} fz={smallScreen ? "14px" : "28px"} ta="center">
                Pick 2 powers in one discipline,
                <br /> 1 power in another,
                <br /> And 1 power in {upcase(character.predatorType.pickedDiscipline)} from your Predator Type
            </Text>

            <Text mt={"xl"} ta="center" fz="xl" fw={700} c="red">
                Disciplines
            </Text>
            <hr color="#e03131" />
            <Space h={"sm"} />

            <Stack align="center" gap="xl" w={"100%"}>
                <Grid w={"100%"}>
                    {/* Picked Powers */}
                    {smallScreen ? null : getPickedPowersSection()}

                    {/* Discipline-List */}

                    <Grid.Col span={smallScreen ? 12 : 9} offset={smallScreen ? 0 : 1}>
                        <ScrollArea h={smallScreen ? height - 320 : height - 400} pb={20} w={"105%"}>
                            <Center>
                                <Accordion w={smallScreen ? "100%" : "600px"}>
                                    {Object.entries(disciplinesForClan).map(([name, discipline]) =>
                                        getDisciplineAccordionItem(name, discipline)
                                    )}

                                    <Text fw={700} mt={"lg"} c={"red"} ta={"center"}>
                                        Predator Type Discipline
                                    </Text>
                                    <hr color="#e03131" />
                                    {getDisciplineAccordionItem(character.predatorType.pickedDiscipline, predatorTypeDiscipline, true)}
                                </Accordion>
                            </Center>

                            {/* Picked Powers */}
                            {smallScreen ? getPickedPowersSection() : null}
                        </ScrollArea>
                    </Grid.Col>
                </Grid>

                <Button
                    disabled={!(allPowersPicked() && pickedPredatorTypePower)}
                    color="grape"
                    onClick={() => {
                        setCharacter({
                            ...character,
                            disciplines: allPickedPowers,
                            rituals: containsBloodSorcery(allPickedPowers) ? character.rituals : [],
                        })
                        nextStep()
                    }}
                >
                    Confirm
                </Button>
            </Stack>
        </div>
    )
}

export default DisciplinesPicker
