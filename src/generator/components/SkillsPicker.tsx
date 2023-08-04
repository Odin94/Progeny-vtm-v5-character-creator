import { Button, Divider, Grid, Group, ScrollArea, Space, Text, Tooltip } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { useEffect, useState } from "react"
import ReactGA from "react-ga4"
import { Character } from "../../data/Character"
import { Skills, SkillsKey, emptySkills, skillsDescriptions, skillsKeySchema } from "../../data/Skills"
import { globals } from "../../globals"
import { upcase } from "../utils"
import { SpecialtyModal } from "./SkillSpecialtyModal"


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
    const phoneScreen = globals.isPhoneScreen

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
                <Tooltip disabled={alreadyPicked} label={skillsDescriptions[skill]} transitionProps={{ transition: 'slide-up', duration: 200 }} events={globals.tooltipTriggerEvents}>
                    <Button p={phoneScreen ? 0 : "default"} variant={alreadyPicked ? "outline" : "filled"} leftIcon={dots} disabled={pickedDistribution === null} color="grape" fullWidth onClick={() => { trackClick(); onClick() }}>
                        <Text fz={phoneScreen ? 12 : "inherit"}>{upcase(skill)}</Text>
                    </Button>
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

    const specialStyle = toPick === "special" ? { fontSize: globals.largeFontSize } : { fontSize: globals.smallFontSize, color: "grey" }
    const strongestStyle = toPick === "strongest" ? { fontSize: globals.largeFontSize } : { fontSize: globals.smallFontSize, color: "grey" }
    const decentStyle = toPick === "decent" ? { fontSize: globals.largeFontSize } : { fontSize: globals.smallFontSize, color: "grey" }
    const acceptableStyle = toPick === "acceptable" ? { fontSize: globals.largeFontSize } : { fontSize: globals.smallFontSize, color: "grey" }

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
    const height = globals.viewportHeightPx
    const heightBreakPoint = 930

    return (
        <div style={{ marginTop: height < heightBreakPoint ? "40px" : 0 }}>
            {!pickedDistribution
                ? <Text fz={globals.largeFontSize} ta={"center"}>Pick your <b>Skill Distribution</b></Text>
                : <>
                    <Text style={{ fontSize: globals.smallerFontSize, color: "grey" }} ta={"center"}>{pickedDistribution}</Text>
                    {pickedDistribution === "Specialist" ? <Text style={specialStyle} fz={"30px"} ta={"center"}>{toPick === "special" ? ">" : ""} Pick your <b>{distr.special - pickedSkills.special.length} specialty</b> skill</Text> : null}
                    <Text style={strongestStyle} ta={"center"}>{toPick === "strongest" ? ">" : ""} Pick your <b>{distr.strongest - pickedSkills.strongest.length} strongest</b> skills</Text>
                    <Text style={decentStyle} ta={"center"}>{toPick === "decent" ? ">" : ""} Pick <b>{distr.decent - pickedSkills.decent.length}</b> skills you&apos;re <b>decent</b> in</Text>
                    <Text style={acceptableStyle} ta={"center"}>{toPick === "acceptable" ? ">" : ""} Pick <b>{distr.acceptable - pickedSkills.acceptable.length}</b> skills you&apos;re <b>ok</b> in</Text>
                </>
            }

            {pickedDistribution !== null
                ? null
                : <>
                    <Space h="xl" />
                    <Grid grow>
                        {(["Jack of All Trades", "Balanced", "Specialist"] as DistributionKey[]).map((distribution) => {
                            return (
                                <Grid.Col span={4} key={distribution}>
                                    <Tooltip disabled={pickedDistribution !== null} label={distributionDescriptions[distribution]} transitionProps={{ transition: 'slide-up', duration: 200 }} events={globals.tooltipTriggerEvents}>
                                        <Button p={phoneScreen ? 0 : "default"} disabled={pickedDistribution !== null} color="red" fullWidth onClick={() => { setPickedDistribution(distribution) }}>
                                            <Text fz={phoneScreen ? 12 : "inherit"}>{distribution}</Text>
                                        </Button>
                                    </Tooltip>
                                </Grid.Col>
                            )
                        })}
                    </Grid>
                    <Space h="xl" />
                    <Space h="xl" />
                </>
            }

            <Text mt={"xl"} ta="center" fz="xl" fw={700} c="red">Skills</Text>
            <hr color="#e03131" />

            <Space h="sm" />


            {height < heightBreakPoint
                ? <ScrollArea h={height - 340}>
                    {createSkillButtons()}
                </ScrollArea>
                : createSkillButtons()
            }

            <SpecialtyModal modalOpened={modalOpened} closeModal={closeModalAndUndoLastPick} setCharacter={setCharacter} nextStep={nextStep} character={character} pickedSkillNames={getAll(pickedSkills)} skills={skills} />
        </div>
    )
}

export default SkillsPicker
