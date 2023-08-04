import { faChevronLeft } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Button, Divider, Grid, Group, Modal, ScrollArea, SegmentedControl, Space, Stack, Text, Tooltip } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { useEffect, useState } from "react"
import ReactGA from "react-ga4"
import { Character } from "../../data/Character"
import { DisciplineName, disciplineNameSchema, disciplines } from "../../data/Disciplines"
import { PredatorTypeName, PredatorTypes } from "../../data/PredatorType"
import { globals } from "../../globals"
import { upcase } from "../utils"


type PredatorTypePickerProps = {
    character: Character,
    setCharacter: (character: Character) => void
    nextStep: () => void
}

const PredatorTypePicker = ({ character, setCharacter, nextStep }: PredatorTypePickerProps) => {
    const phoneScreen = globals.isPhoneScreen

    useEffect(() => { ReactGA.send({ hitType: "pageview", title: "Predator-Type Picker" }) }, [])

    const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false)
    const [pickedPredatorType, setPickedPredatorType] = useState<PredatorTypeName>("")

    const [specialty, setSpecialty] = useState("")
    const [discipline, setDiscipline] = useState("")

    const createButton = (predatorTypeName: PredatorTypeName, color: string) => {
        return (
            <Tooltip label={PredatorTypes[predatorTypeName].summary} key={predatorTypeName} transitionProps={{ transition: 'slide-up', duration: 200 }}>
                <Button disabled={character.clan === "Ventrue" && ["Bagger", "Farmer"].includes(predatorTypeName)} color={color} onClick={() => {
                    const firstSpecialtyOption = PredatorTypes[predatorTypeName].specialtyOptions[0]
                    const firstDisciplineOption = PredatorTypes[predatorTypeName].disciplineOptions[0]

                    setPickedPredatorType(predatorTypeName)
                    setSpecialty(`${firstSpecialtyOption?.skill}_${firstSpecialtyOption?.name}`)
                    setDiscipline(firstDisciplineOption?.name)
                    openModal()
                }}>{predatorTypeName}</Button>
            </Tooltip>
        )
    }

    const createPredatorTypeStack = () => (
        <Stack spacing="xl">
            <Grid m={0}>
                <Grid.Col span={4}><h1>Violent</h1></Grid.Col>
                <Grid.Col offset={phoneScreen ? 1 : 0} span={phoneScreen ? 6 : 4}>
                    <Stack>{(["Alleycat", "Extortionist", "Roadside Killer", "Montero"] as PredatorTypeName[]).map((clan) => createButton(clan, "red"))}</Stack>
                </Grid.Col>
            </Grid>

            <Divider color="grape" />

            <Grid m={0}>
                <Grid.Col span={4}><h1>Sociable</h1></Grid.Col>
                <Grid.Col offset={phoneScreen ? 1 : 0} span={phoneScreen ? 6 : 4}>
                    <Stack>{(["Cleaver", "Consensualist", "Osiris", "Scene Queen", "Siren",] as PredatorTypeName[]).map((clan) => createButton(clan, "grape"))}</Stack>
                </Grid.Col>
            </Grid>

            <Divider color="gray" />

            <Grid m={0}>
                <Grid.Col span={4}><h1>Stealth</h1></Grid.Col>
                <Grid.Col offset={phoneScreen ? 1 : 0} span={phoneScreen ? 6 : 4}>
                    <Stack>{(["Sandman", "Graverobber", "Grim Reaper", "Pursuer", "Trapdoor"] as PredatorTypeName[]).map((clan) => createButton(clan, "gray"))}</Stack>
                </Grid.Col>
            </Grid>

            <Divider color="violet" />

            <Grid m={0}>
                <Grid.Col span={4}><h1>Excluding Mortals</h1></Grid.Col>
                <Grid.Col offset={phoneScreen ? 1 : 0} span={phoneScreen ? 6 : 4}>
                    <Stack>{(["Bagger", "Blood Leech", "Farmer",] as PredatorTypeName[]).map((clan) => createButton(clan, "violet"))}</Stack>
                </Grid.Col>
            </Grid>
        </Stack>
    )

    const height = globals.viewportHeightPx
    const heightBreakPoint = 1250
    return (
        <div style={{ width: "100%", marginTop: height < heightBreakPoint ? "50px" : "55px" }}>
            <Text fz={globals.largeFontSize} ta={"center"}>How do you <b>obtain blood?</b></Text>

            <Text mt={"xl"} ta="center" fz="xl" fw={700} c="red">Predator Type</Text>
            <hr color="#e03131" />
            <Space h={"sm"} />

            {height < heightBreakPoint
                ? <ScrollArea h={height - 230}>
                    {createPredatorTypeStack()}
                </ScrollArea>
                : createPredatorTypeStack()
            }


            <SpecialtyModal modalOpened={modalOpened} closeModal={closeModal} character={character} pickedPredatorType={pickedPredatorType}
                setCharacter={setCharacter} nextStep={nextStep} specialty={specialty} setSpecialty={setSpecialty} discipline={discipline} setDiscipline={setDiscipline} />
        </div>
    )
}

type SpecialtyModalProps = {
    modalOpened: boolean
    closeModal: () => void
    character: Character,
    pickedPredatorType: PredatorTypeName,
    setCharacter: (character: Character) => void
    nextStep: () => void
    specialty: string,
    setSpecialty: (specialty: string) => void,
    discipline: string,
    setDiscipline: (specialty: string) => void,
}

const SpecialtyModal = ({ modalOpened, closeModal, setCharacter, nextStep, character, pickedPredatorType, specialty, setSpecialty, discipline, setDiscipline }: SpecialtyModalProps) => {
    const smallScreen = globals.isSmallScreen
    const phoneScreen = globals.isPhoneScreen

    const predatorType = PredatorTypes[pickedPredatorType]
    const pickedDiscipline = disciplines[(discipline as DisciplineName)]

    const titleWidth = smallScreen ? "300px" : "750px"
    return (
        <Modal withCloseButton={false} size="xl" opened={modalOpened} onClose={closeModal} title={
            <div style={{ width: titleWidth }}>
                <Text fw={700} fz={"30px"} ta="center">{predatorType.name}</Text>
                <Text style={{ fontSize: "25px", color: "grey" }} ta={"center"}>This predator type comes with the following benefits and banes</Text>
            </div>
        } centered>
            <Stack>
                <Divider my="sm" />

                {predatorType.bloodPotencyChange !== 0 ?
                    <div>
                        <Group position="apart">
                            <Text fw={700} fz={"xl"}>Blood Potency Change:</Text>
                            <Text fz={"xl"}>{`${predatorType.bloodPotencyChange > 0 ? "+" : ""}${predatorType.bloodPotencyChange}`}</Text>
                        </Group>
                        <Divider my="sm" variant="dotted" />
                    </div>
                    : null}

                {predatorType.humanityChange !== 0 ?
                    <div>
                        <Group position="apart">
                            <Text fw={700} fz={"xl"}>Humanity Change:</Text>
                            <Text fz={"xl"}>{`${predatorType.humanityChange > 0 ? "+" : ""}${predatorType.humanityChange}`}</Text>
                        </Group>
                        <Divider my="sm" variant="dotted" />
                    </div>
                    : null}
                {predatorType.meritsAndFlaws.length !== 0 ?
                    <div>
                        <Group position="apart">
                            <Text fw={700} fz={"xl"}>Merits and Flaws:</Text>
                            <Stack w={"100%"}>
                                {predatorType.meritsAndFlaws.map((mf) => {
                                    return <Group key={mf.name} position="apart">
                                        <Text maw={"80%"} fz={"xl"}>{`${mf.name}: `}<Text fz={"xs"}>{mf.summary}</Text></Text>
                                        <Text fz={"xl"}>{`lvl ${mf.level}`}</Text>
                                    </Group>
                                })}
                            </Stack>
                        </Group>
                        <Divider my="sm" />
                    </div>
                    : null}

                <Text fw={700} fz={"xl"} ta="center">Select a skill specialty</Text>
                <SegmentedControl
                    size={phoneScreen ? "sm" : "md"}
                    color="red"
                    value={specialty}
                    onChange={setSpecialty}
                    data={predatorType.specialtyOptions.map((specialty) => ({ label: `${upcase(specialty.skill)}: ${specialty.name}`, value: `${specialty.skill}_${specialty.name}` }))}
                />
                <Divider my="sm" />

                <Text fw={700} fz={"xl"} ta="center">Take a bonus level to a discipline</Text>
                <Tooltip label={`${upcase(discipline)}: ${pickedDiscipline.summary}`} transitionProps={{ transition: 'slide-up', duration: 200 }} events={globals.tooltipTriggerEvents}>
                    <SegmentedControl
                        size={phoneScreen ? "sm" : "md"}
                        color="red"
                        value={discipline}
                        onChange={setDiscipline}
                        data={predatorType.disciplineOptions.map((discipline) => ({ label: upcase(discipline.name), value: discipline.name }))}
                    />
                </Tooltip>

                <Divider my="sm" />

                <Group position="apart">
                    <Button color="yellow" variant="subtle" leftIcon={<FontAwesomeIcon icon={faChevronLeft} />} onClick={closeModal}>Back</Button>

                    <Button color="grape" onClick={async () => {
                        const pickedSpecialty = predatorType.specialtyOptions.find(({ name }) => name === specialty.split("_")[1])
                        const pickedDiscipline = predatorType.disciplineOptions.find(({ name }) => name === discipline)
                        if (!pickedSpecialty) {
                            console.error(`Couldn't find specialty with name ${specialty}`)
                        } else if (!pickedDiscipline) {
                            console.error(`Couldn't find discipline with name ${discipline}`)
                        } else {
                            closeModal()
                            setCharacter({
                                ...character,
                                predatorType: { name: pickedPredatorType, pickedDiscipline: disciplineNameSchema.parse(discipline), pickedSpecialties: [pickedSpecialty] },
                            })

                            ReactGA.event({
                                action: "predatortype confirm clicked",
                                category: "predator type",
                                label: pickedPredatorType,
                            })

                            nextStep()
                        }

                    }}>Confirm</Button>
                </Group>
            </Stack>
        </Modal>
    )
}

export default PredatorTypePicker