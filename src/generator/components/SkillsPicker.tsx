import { Button, Divider, Grid, Group, Modal, Select, Space, Stack, Text, TextInput, Tooltip } from "@mantine/core"
import { useState } from "react"
import { Character } from "../../data/Character"
import { intersection, lowcase, upcase } from "../utils"
import { Skills, SkillsKey, emptySkills, skillsDescriptions, skillsKeySchema } from "../../data/Skills"
import { useDisclosure, useMediaQuery } from "@mantine/hooks"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faChevronLeft } from "@fortawesome/free-solid-svg-icons"
import { Specialty } from "../../data/Specialties"

type SkillsPickerProps = {
    character: Character,
    setCharacter: (character: Character) => void
    nextStep: () => void
}

type SkillsSetting = {
    special: SkillsKey[],
    strongest: SkillsKey[],
    decent: SkillsKey[],
    acceptable: SkillsKey[],
}

type DistributionKey = "Jack of All Trades" | "Balanced" | "Specialist"

type SkillDistribution = { strongest: number, decent: number, acceptable: number, special: number }

const distributionByType: Record<DistributionKey, SkillDistribution> = {
    "Jack of All Trades": {
        special: 0,
        strongest: 1,
        decent: 8,
        acceptable: 10
    },
    Balanced: {
        special: 0,
        strongest: 3,
        decent: 5,
        acceptable: 7
    },
    Specialist: {
        special: 1,
        strongest: 3,
        decent: 3,
        acceptable: 3
    },
}

const getAll = (skillSetting: SkillsSetting): SkillsKey[] => {
    return Object.values(skillSetting).reduce((acc, s) => [...acc, ...s], [])
}

const SkillsPicker = ({ character, setCharacter, nextStep }: SkillsPickerProps) => {
    const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false)
    const [skills, setSkills] = useState(emptySkills)
    const [pickedSkills, setPickedSkills] = useState<SkillsSetting>({ special: [], strongest: [], decent: [], acceptable: [] })
    const [pickedDistribution, setPickedDistribution] = useState<DistributionKey | null>(null)
    const distr = pickedDistribution ? distributionByType[pickedDistribution] : { special: 0, strongest: 0, decent: 0, acceptable: 0 }

    const createButton = (skill: SkillsKey, i: number) => {
        let onClick
        if (pickedSkills.special.length < distr.special) {
            onClick = () => {
                setPickedSkills({ ...pickedSkills, special: [...pickedSkills.special, skill] })
            }
        }
        else if (pickedSkills.strongest.length < distr.strongest) {
            onClick = () => {
                setPickedSkills({ ...pickedSkills, strongest: [...pickedSkills.strongest, skill] })
            }
        } else if (pickedSkills.decent.length < distr.decent) {
            onClick = () => {
                setPickedSkills({ ...pickedSkills, decent: [...pickedSkills.decent, skill] })
            }
        } else if (pickedSkills.acceptable.length < distr.acceptable - 1) {  // -1 so the very last pick opens modal
            onClick = () => {
                setPickedSkills({ ...pickedSkills, acceptable: [...pickedSkills.acceptable, skill] })
            }
        } else {
            const finalPick = { ...pickedSkills, acceptable: [...pickedSkills.acceptable, skill] }
            onClick = () => {
                const skills: Skills = {
                    athletics: 0,
                    brawl: 0,
                    craft: 0,
                    drive: 0,
                    firearms: 0,
                    melee: 0,
                    larceny: 0,
                    stealth: 0,
                    survival: 0,

                    "animal ken": 0,
                    etiquette: 0,
                    insight: 0,
                    intimidation: 0,
                    leadership: 0,
                    performance: 0,
                    persuasion: 0,
                    streetwise: 0,
                    subterfuge: 0,

                    academics: 0,
                    awareness: 0,
                    finance: 0,
                    investigation: 0,
                    medicine: 0,
                    occult: 0,
                    politics: 0,
                    science: 0,
                    technology: 0,
                }
                finalPick.special.forEach((special) => skills[special] = 4)
                finalPick.strongest.forEach((strongest) => skills[strongest] = 3)
                finalPick.decent.forEach((decent) => skills[decent] = 2)
                finalPick.acceptable.forEach((acceptable) => skills[acceptable] = 1)

                setPickedSkills(finalPick)
                setSkills(skills)

                openModal()
            }
        }

        const disabled = [...pickedSkills.special, ...pickedSkills.strongest, ...pickedSkills.decent, ...pickedSkills.acceptable].includes(skill) || pickedDistribution === null
        const dots = (() => {
            if (pickedSkills.special.includes(skill)) return "🚀"
            if (pickedSkills.strongest.includes(skill)) return "🥇"
            if (pickedSkills.decent.includes(skill)) return "🥈"
            if (pickedSkills.acceptable.includes(skill)) return "🥉"
            return ""
        })()

        return (
            <Grid.Col key={skill} span={4}>
                <Tooltip label={skillsDescriptions[skill]} transitionProps={{ transition: 'slide-up', duration: 200 }}>
                    {/* div here because button being disabled freezes tooltip in place */}
                    <div>
                        <Button leftIcon={dots} disabled={disabled} color="grape" fullWidth onClick={onClick}>{upcase(skill)}</Button>
                    </div>
                </Tooltip>

                {i % 3 === 0 || i % 3 === 1 ? <Divider size="xl" orientation="vertical" /> : null}
            </Grid.Col>
        )
    }

    const header = (() => {
        if (!pickedDistribution) return (<h1>Pick your <b>Skill Distribution</b></h1>)
        if (pickedSkills.special.length < distr.special) return (<h1>Pick your <b>{distr.special} specialty</b> skill</h1>)
        if (pickedSkills.strongest.length < distr.strongest) return (<h1>Pick your <b>{distr.strongest} strongest</b> skills</h1>)
        if (pickedSkills.decent.length < distr.decent) return (<h1>Pick <b>{distr.decent}</b> skills you're <b>decent</b> in</h1>)
        return (<h1>Pick <b>{distr.acceptable}</b> skills you're <b>ok</b> in</h1>)
    })()

    const closeModalAndUndoLastPick = () => {
        setPickedSkills({ ...pickedSkills, acceptable: pickedSkills.acceptable.slice(0, -1) })
        closeModal()
    }
    return (
        <div>
            {header}

            <Text ta="center" fz="xl" fw={700} c="red">Skills</Text>

            <hr color="#e03131" />

            <Space h="sm" />
            <Grid grow>
                {(["Jack of All Trades", "Balanced", "Specialist"] as DistributionKey[]).map((distribution) => {
                    return (
                        <Grid.Col span={4} key={distribution}>
                            <Button disabled={pickedDistribution !== null} color="red" fullWidth onClick={() => { setPickedDistribution(distribution) }}>{distribution}</Button>
                        </Grid.Col>
                    )
                })}
            </Grid>
            <Space h="xl" />
            <Space h="xl" />

            <Group>
                <Grid grow>
                    <Grid.Col span={4}><Text fs="italic" fw={700} ta="center">Physical</Text></Grid.Col>
                    <Grid.Col span={4}><Text fs="italic" fw={700} ta="center">Social</Text></Grid.Col>
                    <Grid.Col span={4}><Text fs="italic" fw={700} ta="center">Mental</Text></Grid.Col>
                    {
                        ["athletics", "animal ken", "academics",
                            "brawl", "etiquette", "awareness",
                            "craft", "insight", "finance",
                            "drive", "intimidation", "investigation",
                            "firearms", "leadership", "medicine",
                            "melee", "performance", "occult",
                            "larceny", "persuasion", "politics",
                            "stealth", "streetwise", "science",
                            "survival", "subterfuge", "technology"
                        ].map((s) => skillsKeySchema.parse(s)).map((clan, i) => createButton(clan, i))
                    }
                </Grid>
            </Group>

            <SpecialtyModal modalOpened={modalOpened} closeModal={closeModalAndUndoLastPick} setCharacter={setCharacter} nextStep={nextStep} character={character} pickedSkillNames={getAll(pickedSkills)} skills={skills} />
        </div>
    )
}

type SpecialtyModalProps = {
    modalOpened: boolean
    closeModal: () => void
    character: Character,
    pickedSkillNames: SkillsKey[],
    skills: Skills,
    setCharacter: (character: Character) => void
    nextStep: () => void
}

type SpecialtySkill = "academics" | "craft" | "performance" | "science"

const SpecialtyModal = ({ modalOpened, closeModal, setCharacter, nextStep, character, pickedSkillNames, skills }: SpecialtyModalProps) => {
    const phoneSizedScreen = useMediaQuery('(max-width: 550px)')
    const [pickedSkillDisplay, setPickedSkillDisplay] = useState<string>(/*pickedSkillNames[0]*/"")  // Need to define this and set it in parent-component to automatically select the first one (see PredatorTypePicker)
    const [pickedSkillSpecialty, setPickedSkillSpecialty] = useState("")

    const [academicsSpecialty, setAcademicsSpecialty] = useState("")
    const [craftSpecialty, setCraftSpecialty] = useState("")
    const [performanceSpecialty, setPerformanceSpecialty] = useState("")
    const [scienceSpecialty, setScienceSpecialty] = useState("")

    const specialtySkills = ["academics", "craft", "performance", "science"]

    const specialtyStates: Record<SpecialtySkill, { value: string, setValue: (s: string) => void }> = {
        academics: { value: academicsSpecialty, setValue: setAcademicsSpecialty },
        craft: { value: craftSpecialty, setValue: setCraftSpecialty },
        performance: { value: performanceSpecialty, setValue: setPerformanceSpecialty },
        science: { value: scienceSpecialty, setValue: setScienceSpecialty },
    }

    const pickedSpecialtySkills = intersection(specialtySkills, pickedSkillNames) as SpecialtySkill[]
    const pickedSkill = lowcase(pickedSkillDisplay)
    return (
        <Modal withCloseButton={false} size="lg" opened={modalOpened} onClose={closeModal} title={<Text w={phoneSizedScreen ? "300px" : "600px"} fw={700} fz={"30px"} ta="center">Specialties</Text>} centered>
            <Stack>
                <Divider my="sm" />
                <Text fw={700} fz={"xl"} ta="center">Select a skill specialty</Text>

                <Group position="apart">
                    <Select
                        // label="Pick a free specialty"
                        placeholder="Pick one"
                        searchable
                        onSearchChange={setPickedSkillDisplay}
                        searchValue={pickedSkillDisplay}
                        nothingFound="No options"
                        data={pickedSkillNames.filter((s) => !specialtySkills.includes(s)).map(upcase)}
                    />

                    <TextInput value={pickedSkillSpecialty} onChange={(event) => setPickedSkillSpecialty(event.currentTarget.value)} />
                </Group>
                <Divider my="sm" />

                {pickedSpecialtySkills.map((s) => (
                    <div key={s}>
                        <Group position="apart">
                            <Text fw={700} fz={"xl"}>{upcase(s)}:</Text>
                            <TextInput value={specialtyStates[s].value} onChange={(event) => specialtyStates[s].setValue(event.currentTarget.value)} />
                        </Group>
                        <Divider my="sm" variant="dotted" />
                    </div>
                ))}

                <Group position="apart">
                    <Button color="yellow" variant="subtle" leftIcon={<FontAwesomeIcon icon={faChevronLeft} />} onClick={closeModal}>Back</Button>

                    <Button color="grape" onClick={async () => {
                        let pickedSpecialties = specialtySkills.reduce<Specialty[]>((acc, s) => {
                            return [...acc, { skill: skillsKeySchema.parse(s), name: specialtyStates[s as SpecialtySkill].value }]
                        }, [])
                        pickedSpecialties = [...pickedSpecialties, { skill: skillsKeySchema.parse(pickedSkill), name: lowcase(pickedSkillSpecialty) }]

                        closeModal()
                        setCharacter({ ...character, skills: skills, specialties: [...(character.specialties), ...pickedSpecialties] })
                        nextStep()
                    }}>Confirm</Button>
                </Group>
            </Stack>
        </Modal>
    )
}

export default SkillsPicker
