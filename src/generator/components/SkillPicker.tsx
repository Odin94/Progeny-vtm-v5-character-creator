import { Grid, Button, Divider, Text, Group } from "@mantine/core"
import { Skills, Character } from "../../data/Character"
import { useState } from "react"
import { upcase } from "../utils"

type SkillPickerProps = {
    character: Character,
    setCharacter: (character: Character) => void
    nextStep: () => void
}

type SkillSetting = {
    strongest: (keyof Skills)[],
    decent: (keyof Skills)[],
    acceptable: (keyof Skills)[],
}

const SkillPicker = ({ character, setCharacter, nextStep }: SkillPickerProps) => {
    const [pickedSkills, setPickedSkills] = useState<SkillSetting>({ strongest: [], decent: [], acceptable: [] })

    const createButton = (skill: keyof Skills, i: number) => {
        let onClick;
        if (pickedSkills.strongest.length < 3) {
            onClick = () => {
                setPickedSkills({ ...pickedSkills, strongest: [...pickedSkills.strongest, skill] })
            }
        } else if (pickedSkills.decent.length < 5) {
            onClick = () => {
                setPickedSkills({ ...pickedSkills, decent: [...pickedSkills.decent, skill] })
            }
        } else if (pickedSkills.acceptable.length < 6) {
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
                    subtertfuge: 0,
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
                finalPick.strongest.forEach((strongest) => skills[strongest] = 3)
                finalPick.decent.forEach((decent) => skills[decent] = 2)
                finalPick.acceptable.forEach((acceptable) => skills[acceptable] = 1)

                setCharacter({ ...character, skills: skills })
                nextStep()
            }
        }

        const disabled = [...pickedSkills.strongest, ...pickedSkills.decent, ...pickedSkills.acceptable].includes(skill)
        const dots = (() => {
            if (pickedSkills.strongest.includes(skill)) return "🥇"
            if (pickedSkills.decent.includes(skill)) return "🥈"
            if (pickedSkills.acceptable.includes(skill)) return "🥉👌"
            return ""
        })()

        return (
            <Grid.Col key={skill} span={4}>
                <Button disabled={disabled} color="grape" fullWidth onClick={onClick}>{dots} {upcase(skill)}</Button>
                {i % 3 === 0 || i % 3 === 1 ? <Divider size="xl" orientation="vertical" /> : null}
            </Grid.Col>
        )
    }

    const header = (() => {
        if (pickedSkills.strongest.length < 3) return (<h1>Pick your <b>3 strongest</b> skills</h1>)
        if (pickedSkills.decent.length < 5) return (<h1>Pick <b>5</b> skills you're <b>decent</b> in</h1>)
        return (<h1>Pick <b>7</b> skills you're <b>ok</b> in</h1>)
    })()
    return (
        <div>
            {header}

            <Text ta="center" fz="xl" fw={700} c="red">Skills</Text>

            <hr color="#e03131" />

            <Group>
                <Grid grow>
                    <Grid.Col span={4}><Text fs="italic" fw={700} ta="center">Physical</Text></Grid.Col>
                    <Grid.Col span={4}><Text fs="italic" fw={700} ta="center">Social</Text></Grid.Col>
                    <Grid.Col span={4}><Text fs="italic" fw={700} ta="center">Mental</Text></Grid.Col>
                    {
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
