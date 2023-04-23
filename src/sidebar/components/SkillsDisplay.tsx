import { Grid, Stack, Text, Title } from "@mantine/core"
import { Skills, skillsKeySchema } from "../../data/Character"
import { upcase } from "../../generator/utils"
import Tally from "../../components/Tally"

export type SkillsProps = {
    skills: Skills
}


const SkillDisplay = ({ skills }: SkillsProps) => {
    const textStyle: React.CSSProperties = {
        fontFamily: "Courier New"
    }

    return (
        <Stack>
            <Title order={2}>Skills</Title>

            <Grid>

                <Grid.Col span={4}>
                    <Title order={4}>Physical</Title>
                    {["athletics", "brawl", "craft", "drive", "firearms", "melee", "larceny", "stealth", "survival"].map((s) => skillsKeySchema.parse(s)).map((skill) => {
                        return (<Text style={textStyle} key={skill}>{upcase(skill).slice(0, 4)}: <Tally n={skills[skill]} /></Text>)
                    })}
                </Grid.Col>

                <Grid.Col span={4}>
                    <Title order={4}>Social</Title>
                    {["animal_ken", "etiquette", "insight", "intimidation", "leadership", "performance", "persuasion", "streetwise", "subterfuge"].map((s) => skillsKeySchema.parse(s)).map((skill) => {
                        return (<Text style={textStyle} key={skill}>{upcase(skill).slice(0, 4)}: <Tally n={skills[skill]} /></Text>)
                    })}
                </Grid.Col>

                <Grid.Col span={4}>
                    <Title order={4}>Mental</Title>
                    {["academics", "awareness", "finance", "investigation", "medicine", "occult", "politics", "science", "technology",].map((s) => skillsKeySchema.parse(s)).map((skill) => {
                        return (<Text style={textStyle} key={skill}>{upcase(skill).slice(0, 4)}: <Tally n={skills[skill]} /></Text>)
                    })}
                </Grid.Col>

            </Grid>
        </Stack>
    )
}

export default SkillDisplay
