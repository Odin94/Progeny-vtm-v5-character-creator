import { Grid, Button, Divider, Text, Group, Space } from "@mantine/core"
import { Skills, Character } from "../../data/Character"
import { useState } from "react"
import { upcase } from "../utils"

type SkillPickerProps = {
    character: Character,
    setCharacter: (character: Character) => void
    nextStep: () => void
}

type SkillSetting = {
    specialty: (keyof Skills)[],
    strongest: (keyof Skills)[],
    decent: (keyof Skills)[],
    acceptable: (keyof Skills)[],
}

type DistributionKey = "Jack of All Trades" | "Balanced" | "Specialist"

const distributionByType: Record<DistributionKey, { strongest: number, decent: number, acceptable: number, specialty: number }> = {
    "Jack of All Trades": {
        specialty: 0,
        strongest: 1,
        decent: 8,
        acceptable: 10
    },
    Balanced: {
        specialty: 0,
        strongest: 3,
        decent: 5,
        acceptable: 7
    },
    Specialist: {
        specialty: 1,
        strongest: 3,
        decent: 3,
        acceptable: 3
    },
}

const SkillPicker = ({ character, setCharacter, nextStep }: SkillPickerProps) => {
    const [pickedSkills, setPickedSkills] = useState<SkillSetting>({ specialty: [], strongest: [], decent: [], acceptable: [] })
    const [pickedDistribution, setPickedDistribution] = useState<DistributionKey | null>(null)
    const distr = pickedDistribution ? distributionByType[pickedDistribution] : { specialty: 0, strongest: 0, decent: 0, acceptable: 0 }

    const createButton = (skill: keyof Skills, i: number) => {
        let onClick;
        if (pickedSkills.specialty.length < distr.specialty) {
            onClick = () => {
                setPickedSkills({ ...pickedSkills, specialty: [...pickedSkills.specialty, skill] })
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
        } else if (pickedSkills.acceptable.length < distr.acceptable - 1) {  // -1 so the very last pick goes to nextStep()
            onClick = () => {
                setPickedSkills({ ...pickedSkills, acceptable: [...pickedSkills.acceptable, skill] })
            }
        } else {
            const finalPick = { ...pickedSkills, acceptable: [...pickedSkills.acceptable, skill] }
            onClick = () => {
                const skills = {
                    athletics: 0,
                    brawl: 0,
                    craft: 0,
                    drive: 0,
                    firearms: 0,
                    melee: 0,
                    larceny: 0,
                    stealth: 0,
                    survival: 0,
                    animal_ken: 0,
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
                finalPick.specialty.forEach((specialty) => skills[specialty] = 4)
                finalPick.strongest.forEach((strongest) => skills[strongest] = 3)
                finalPick.decent.forEach((decent) => skills[decent] = 2)
                finalPick.acceptable.forEach((acceptable) => skills[acceptable] = 1)

                setCharacter({ ...character, skills: skills })
                nextStep()
            }
        }

        const disabled = [...pickedSkills.specialty, ...pickedSkills.strongest, ...pickedSkills.decent, ...pickedSkills.acceptable].includes(skill) || pickedDistribution === null
        const dots = (() => {
            if (pickedSkills.specialty.includes(skill)) return "🚀"
            if (pickedSkills.strongest.includes(skill)) return "🥇"
            if (pickedSkills.decent.includes(skill)) return "🥈"
            if (pickedSkills.acceptable.includes(skill)) return "🥉"
            return ""
        })()

        return (
            <Grid.Col key={skill} span={4}>
                <Button leftIcon={dots} disabled={disabled} color="grape" fullWidth onClick={onClick}>{upcase(skill)}</Button>
                {i % 3 === 0 || i % 3 === 1 ? <Divider size="xl" orientation="vertical" /> : null}
            </Grid.Col>
        )
    }

    const header = (() => {
        if (!pickedDistribution) return (<h1>Pick your <b>Skill Distribution</b></h1>)
        if (pickedSkills.specialty.length < distr.specialty) return (<h1>Pick your <b>{distr.specialty} specialty</b> skill</h1>)
        if (pickedSkills.strongest.length < distr.strongest) return (<h1>Pick your <b>{distr.strongest} strongest</b> skills</h1>)
        if (pickedSkills.decent.length < distr.decent) return (<h1>Pick <b>{distr.decent}</b> skills you're <b>decent</b> in</h1>)
        return (<h1>Pick <b>{distr.acceptable}</b> skills you're <b>ok</b> in</h1>)
    })()
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
                        // TODO: Fix order of skills (atm showing eg. "brawl" as "social" skill)
                        (["atheltics", "brawl", "craft", "drive", "firearms", "melee", "larceny", "stealth", "survival",
                            "animal_ken", "etiquette", "insight", "intimidation", "leadership", "performance", "persuasion", "streetwise", "subterfuge",
                            "academics", "awareness", "finance", "investigation", "medicine", "occult", "politics", "science", "technology"] as (keyof Skills)[])
                            .map((clan, i) => createButton(clan, i))
                    }
                </Grid>
            </Group>
        </div>
    )
}

export default SkillPicker
