import { faChevronLeft } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Button, Divider, Grid, Group, Modal, SegmentedControl, Space, Stack, Text, Tooltip } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { useState } from "react"
import { Character, getEmptyCharacter } from "../../data/Character"
import { PredatorTypeName, PredatorTypes } from "../../data/PredatorType"
import { upcase } from "../utils"


type PredatorTypePickerProps = {
    character: Character,
    setCharacter: (character: Character) => void
    nextStep: () => void
}

const PredatorTypePicker = ({ character, setCharacter, nextStep }: PredatorTypePickerProps) => {
    const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false)
    const [pickedPredatorType, setPickedPredatorType] = useState<PredatorTypeName>("")

    const [specialty, setSpecialty] = useState("")

    const createButton = (predatorTypeName: PredatorTypeName, color: string) => {
        return (
            <Tooltip label={PredatorTypes[predatorTypeName].summary} key={predatorTypeName}>
                <Button disabled={character.clan === "Ventrue" && ["Bagger", "Farmer"].includes(predatorTypeName)} color={color} onClick={() => {
                    const firstSpecialtyOption = PredatorTypes[predatorTypeName].specialtyOptions[0]

                    setPickedPredatorType(predatorTypeName)
                    setSpecialty(`${firstSpecialtyOption.skill}_${firstSpecialtyOption.name}`)
                    openModal()
                }}>{predatorTypeName}</Button>
            </Tooltip>
        )
    }

    return (
        <div style={{ width: "100%" }}>
            <h1>How do you obtain blood?</h1>

            <Text ta="center" fz="xl" fw={700} c="red">Predator Type</Text>
            <hr color="#e03131" />
            <Space h={"sm"} />

            <Stack spacing="xl">
                <Grid>
                    <Grid.Col span={4}><h1>Violent</h1></Grid.Col>
                    <Grid.Col span={4}>
                        <Stack>{(["Alleycat", "Extortionist", "Roadside Killer",] as PredatorTypeName[]).map((clan) => createButton(clan, "red"))}</Stack>
                    </Grid.Col>
                </Grid>

                <Divider color="grape" />

                <Grid>
                    <Grid.Col span={4}><h1>Sociable</h1></Grid.Col>
                    <Grid.Col span={4}>
                        <Stack>{(["Cleaver", "Consensualist", "Osiris", "Scene Queen", "Siren",] as PredatorTypeName[]).map((clan) => createButton(clan, "grape"))}</Stack>
                    </Grid.Col>
                </Grid>

                <Divider color="gray" />

                <Grid>
                    <Grid.Col span={4}><h1>Stealth</h1></Grid.Col>
                    <Grid.Col span={4}>
                        <Stack>{(["Sandman", "Graverobber",] as PredatorTypeName[]).map((clan) => createButton(clan, "gray"))}</Stack>
                    </Grid.Col>
                </Grid>

                <Divider color="violet" />

                <Grid>
                    <Grid.Col span={4}><h1>Excluding Mortals</h1></Grid.Col>
                    <Grid.Col span={4}>
                        <Stack>{(["Bagger", "Blood Leech", "Farmer",] as PredatorTypeName[]).map((clan) => createButton(clan, "violet"))}</Stack>
                    </Grid.Col>
                </Grid>
            </Stack>

            <SpecialtyModal modalOpened={modalOpened} closeModal={closeModal} character={character} pickedPredatorType={pickedPredatorType}
                setCharacter={setCharacter} nextStep={nextStep} specialty={specialty} setSpecialty={setSpecialty} />
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
}

const SpecialtyModal = ({ modalOpened, closeModal, setCharacter, nextStep, character, pickedPredatorType, specialty, setSpecialty }: SpecialtyModalProps) => {
    const predatorType = PredatorTypes[pickedPredatorType]

    return (
        <Modal size="lg" opened={modalOpened} onClose={closeModal} title={predatorType.name} centered>
            <Stack>
                <Divider my="sm" />

                {predatorType.bloodPotencyChange !== 0 ? <Text fz={"xl"}><b>Blood Potency Change:</b>{` ${predatorType.bloodPotencyChange}`}</Text> : null}
                {predatorType.humanityChange !== 0 ? <Text fz={"xl"}><b>Humanity Change:</b>{` ${predatorType.humanityChange}`}</Text> : null}
                {predatorType.disciplineOptions.length !== 0 ? <Text fz={"xl"}><b>Discipline Options:</b>{` ${predatorType.disciplineOptions.map((d) => d.name).join(", ")}`}</Text> : null}
                {predatorType.meritsAndFlaws.length !== 0 ? <Text fz={"xl"}><b>Merits and Flaws:</b>{` ${predatorType.meritsAndFlaws.map((mf) => mf.name).join(", ")}`}</Text> : null}

                <Divider my="sm" />
                <Text fz={"xl"}>Select a skill specialty</Text>

                <SegmentedControl
                    color="red"
                    value={specialty}
                    onChange={setSpecialty}
                    data={predatorType.specialtyOptions.map((specialty) => ({ label: `${upcase(specialty.skill)}: ${specialty.name}`, value: `${specialty.skill}_${specialty.name}` }))}
                />

                <Divider my="sm" />
                <Group position="apart">
                    <Button color="yellow" variant="subtle" leftIcon={<FontAwesomeIcon icon={faChevronLeft} />} onClick={closeModal}>Back</Button>

                    <Button color="grape" onClick={async () => {
                        const pickedSpecialty = predatorType.specialtyOptions.find(({ name }) => name === specialty.split("_")[1])
                        if (!pickedSpecialty) {
                            console.error(`Couldn't find specialty with name ${specialty}`)
                        } else {
                            closeModal()
                            setCharacter({ ...character, predatorType: pickedPredatorType, specialties: [...(character.specialties), pickedSpecialty] })
                            nextStep()
                        }

                    }}>Confirm</Button>
                </Group>
            </Stack>
        </Modal>
    )
}

export default PredatorTypePicker