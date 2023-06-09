import { Button, Divider, Grid, Group, Modal, ScrollArea, Select, Space, Stack, Text, TextInput, Tooltip } from "@mantine/core"
import { useEffect, useState } from "react"
import { Character } from "../../data/Character"
import { intersection, lowcase, upcase } from "../utils"
import { Skills, SkillsKey, emptySkills, skillsDescriptions, skillsKeySchema } from "../../data/Skills"
import { useDisclosure, useMediaQuery } from "@mantine/hooks"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faChevronLeft } from "@fortawesome/free-solid-svg-icons"
import { Specialty } from "../../data/Specialties"
import { globals } from "../../globals"
import ReactGA from "react-ga4"


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

const distributionDescriptions: Record<DistributionKey, string> = {
    "Jack of All Trades": "Decent at many things, good at none (1/8/10)",
    Balanced: "Best default choice (3/5/7)",
    Specialist: "Uniquely great at one thing, bad at most (1/3/3/3)",
}

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
    useEffect(() => { ReactGA.send({ hitType: "pageview", title: "Skills Picker" }) }, [])

    const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false)
    const [skills, setSkills] = useState(emptySkills)
    const [pickedSkills, setPickedSkills] = useState<SkillsSetting>({ special: [], strongest: [], decent: [], acceptable: [] })
    const [pickedDistribution, setPickedDistribution] = useState<DistributionKey | null>(null)
    const distr = pickedDistribution ? distributionByType[pickedDistribution] : { special: 0, strongest: 0, decent: 0, acceptable: 0 }

    const createButton = (skill: SkillsKey, i: number) => {
        const alreadyPicked = [...pickedSkills.special, ...pickedSkills.strongest, ...pickedSkills.decent, ...pickedSkills.acceptable].includes(skill)

        let onClick: () => void
        if (alreadyPicked) {
            onClick = () => {
                setPickedSkills({
                    special: pickedSkills.special.filter((it) => it !== skill),
                    strongest: pickedSkills.strongest.filter((it) => it !== skill),
                    decent: pickedSkills.decent.filter((it) => it !== skill),
                    acceptable: pickedSkills.acceptable.filter((it) => it !== skill),
                })
            }
        }
        else if (pickedSkills.special.length < distr.special) {
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

        const dots = (() => {
            if (pickedSkills.special.includes(skill)) return "🚀"
            if (pickedSkills.strongest.includes(skill)) return "🥇"
            if (pickedSkills.decent.includes(skill)) return "🥈"
            if (pickedSkills.acceptable.includes(skill)) return "🥉"
            return ""
        })()

        const trackClick = () => {
            ReactGA.event({
                action: "skill clicked",
                category: "skills",
                label: skill,
            })
        }

        return (
            <Grid.Col key={skill} span={4}>
                <Tooltip disabled={alreadyPicked} label={skillsDescriptions[skill]} transitionProps={{ transition: 'slide-up', duration: 200 }}>
                    <Button variant={alreadyPicked ? "outline" : "filled"} leftIcon={dots} disabled={pickedDistribution === null} color="grape" fullWidth onClick={() => { trackClick(); onClick() }}>{upcase(skill)}</Button>
                </Tooltip>

                {i % 3 === 0 || i % 3 === 1 ? <Divider size="xl" orientation="vertical" /> : null}
            </Grid.Col>
        )
    }

    const toPick = (() => {
        if (pickedSkills.special.length < distr.special) return "special"
        if (pickedSkills.strongest.length < distr.strongest) return "strongest"
        if (pickedSkills.decent.length < distr.decent) return "decent"
        else return "acceptable"
    })()

    const specialStyle = toPick === "special" ? { fontSize: "30px" } : { fontSize: "25px", color: "grey" }
    const strongestStyle = toPick === "strongest" ? { fontSize: "30px" } : { fontSize: "25px", color: "grey" }
    const decentStyle = toPick === "decent" ? { fontSize: "30px" } : { fontSize: "25px", color: "grey" }
    const acceptableStyle = toPick === "acceptable" ? { fontSize: "30px" } : { fontSize: "25px", color: "grey" }

    const closeModalAndUndoLastPick = () => {
        setPickedSkills({ ...pickedSkills, acceptable: pickedSkills.acceptable.slice(0, -1) })
        closeModal()
    }

    const createSkillButtons = () => (
        <Group>
            <Grid grow m={0}>
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
    )
    const height = globals.viewporHeightPx
    const heightBreakPoint = 930

    return (
        <div>
            {!pickedDistribution ? <Text fz={"30px"} ta={"center"}>Pick your <b>Skill Distribution</b></Text> :
                <>
                    {pickedDistribution === "Specialist" ? <Text style={specialStyle} fz={"30px"} ta={"center"}>{toPick === "special" ? ">" : ""} Pick your <b>{distr.special - pickedSkills.special.length} specialty</b> skill</Text> : null}
                    <Text style={strongestStyle} fz={"30px"} ta={"center"}>{toPick === "strongest" ? ">" : ""} Pick your <b>{distr.strongest - pickedSkills.strongest.length} strongest</b> skills</Text>
                    <Text style={decentStyle} fz={"30px"} ta={"center"}>{toPick === "decent" ? ">" : ""} Pick <b>{distr.decent - pickedSkills.decent.length}</b> skills you&apos;re <b>decent</b> in</Text>
                    <Text style={acceptableStyle} fz={"30px"} ta={"center"}>{toPick === "acceptable" ? ">" : ""} Pick <b>{distr.acceptable - pickedSkills.acceptable.length}</b> skills you&apos;re <b>ok</b> in</Text>
                </>
            }

            <Text mt={"xl"} ta="center" fz="xl" fw={700} c="red">Skills</Text>

            <hr color="#e03131" />

            <Space h="sm" />

            {pickedDistribution !== null && height < heightBreakPoint
                ? null
                : <>
                    <Grid grow>
                        {(["Jack of All Trades", "Balanced", "Specialist"] as DistributionKey[]).map((distribution) => {
                            return (
                                <Grid.Col span={4} key={distribution}>
                                    <Tooltip disabled={pickedDistribution !== null} label={distributionDescriptions[distribution]} transitionProps={{ transition: 'slide-up', duration: 200 }}>
                                        <Button disabled={pickedDistribution !== null} color="red" fullWidth onClick={() => { setPickedDistribution(distribution) }}>{distribution}</Button>
                                    </Tooltip>
                                </Grid.Col>
                            )
                        })}
                    </Grid>
                    <Space h="xl" />
                    <Space h="xl" />
                </>
            }


            {height < heightBreakPoint
                ? <ScrollArea h={height - 500}>
                    {createSkillButtons()}
                </ScrollArea>
                : createSkillButtons()
            }

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
    const smallScreen = useMediaQuery(`(max-width: ${globals.smallScreenW}px)`)
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
        <Modal withCloseButton={false} size="lg" opened={modalOpened} onClose={closeModal} title={
            <div>
                <Text w={smallScreen ? "300px" : "600px"} fw={700} fz={"30px"} ta="center">Specialties</Text>
                <Text fw={400} fz={"md"} ta="center" mt={"md"} color="grey">Specialties are additional abilities that apply to some uses of a skill (Eg. Performance: Dancing)</Text>
                <Text fw={400} fz={"md"} ta="center" mt={"md"} color="grey">A specialty should not be so broad that it applies to most uses of the skill</Text>
            </div>}
            centered>

            <Stack style={{ minHeight: "350px", display: "flex", flexDirection: "column" }}>
                <Divider my="sm" />
                <Text fw={700} fz={"xl"}>Select a Skill for a free Specialty</Text>

                <Group position="apart">
                    <Select
                        // label="Pick a free specialty"
                        placeholder="Pick one"
                        searchable
                        onSearchChange={setPickedSkillDisplay}
                        searchValue={pickedSkillDisplay}
                        nothingFound="No options"
                        dropdownPosition="bottom"
                        data={pickedSkillNames.filter((s) => !specialtySkills.includes(s)).map(upcase)}
                    />

                    <TextInput value={pickedSkillSpecialty} onChange={(event) => setPickedSkillSpecialty(event.currentTarget.value)} />
                </Group>
                <Divider my="sm" variant="dotted" />

                {pickedSpecialtySkills.map((s) => (
                    <div key={s}>
                        <Group position="apart">
                            <Text fw={700} fz={"xl"}>{upcase(s)}:</Text>
                            <TextInput value={specialtyStates[s].value} onChange={(event) => specialtyStates[s].setValue(event.currentTarget.value)} />
                        </Group>
                        <Divider my="sm" variant="dotted" />
                    </div>
                ))}

                <Group position="apart" style={{ marginTop: "auto" }}>
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
