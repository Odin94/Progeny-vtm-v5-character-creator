import { Box, Grid, Group, Text, Title, Badge, Stack } from "@mantine/core"
import { useMediaQuery } from "@mantine/hooks"
import { Character } from "~/data/Character"
import { skillsKeySchema, SkillsKey } from "~/data/Skills"
import { upcase } from "~/generator/utils"
import Pips from "~/character_sheet/components/Pips"

type SkillsProps = {
    character: Character
    setCharacter: (character: Character) => void
    primaryColor: string
}

const Skills = ({ character, setCharacter, primaryColor }: SkillsProps) => {
    const textStyle = {
        fontFamily: "Courier New",
    }
    const isMobile = useMediaQuery("(max-width: 768px)")

    const specialtiesBySkill = new Map<string, string[]>()
    character.skillSpecialties
        .filter((specialty) => specialty.name !== "")
        .forEach((specialty) => {
            if (!specialtiesBySkill.has(specialty.skill)) {
                specialtiesBySkill.set(specialty.skill, [])
            }
            specialtiesBySkill.get(specialty.skill)!.push(specialty.name)
        })

    const renderSkillRow = (skill: SkillsKey) => {
        const specialties = specialtiesBySkill.get(skill) || []
        return (
            <Group key={skill} justify="space-between" mb="xs" wrap="nowrap" align="flex-start">
                {isMobile ? (
                    <Stack gap="xs" style={{ flex: 1 }}>
                        <Text style={textStyle}>{upcase(skill)}</Text>
                        {specialties.length > 0 ? (
                            <Group gap="xs" wrap="wrap">
                                {specialties.map((specialtyName, index) => (
                                    <Badge key={`${skill}-${specialtyName}-${index}`} variant="light" size="sm" color={primaryColor}>
                                        {specialtyName}
                                    </Badge>
                                ))}
                            </Group>
                        ) : null}
                    </Stack>
                ) : (
                    <Group gap="xs" wrap="nowrap">
                        <Text style={textStyle}>{upcase(skill)}</Text>
                        {specialties.map((specialtyName, index) => (
                            <Badge key={`${skill}-${specialtyName}-${index}`} variant="light" size="sm" color={primaryColor}>
                                {specialtyName}
                            </Badge>
                        ))}
                    </Group>
                )}
                <Pips
                    level={character.skills[skill]}
                    onLevelChange={(level) => setCharacter({ ...character, skills: { ...character.skills, [skill]: level } })}
                    color={primaryColor}
                />
            </Group>
        )
    }

    return (
        <Box>
            <Title order={2} mb="md" c={primaryColor}>
                Skills
            </Title>
            <Grid>
                <Grid.Col span={{ base: 12, md: 4 }}>
                    <Title order={4} mb="sm" c="dimmed">
                        PHYSICAL
                    </Title>
                    {["athletics", "brawl", "craft", "drive", "firearms", "melee", "larceny", "stealth", "survival"]
                        .map((s) => skillsKeySchema.parse(s))
                        .map(renderSkillRow)}
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                    <Title order={4} mb="sm" c="dimmed">
                        SOCIAL
                    </Title>
                    {[
                        "animal ken",
                        "etiquette",
                        "insight",
                        "intimidation",
                        "leadership",
                        "performance",
                        "persuasion",
                        "streetwise",
                        "subterfuge",
                    ]
                        .map((s) => skillsKeySchema.parse(s))
                        .map(renderSkillRow)}
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                    <Title order={4} mb="sm" c="dimmed">
                        MENTAL
                    </Title>
                    {["academics", "awareness", "finance", "investigation", "medicine", "occult", "politics", "science", "technology"]
                        .map((s) => skillsKeySchema.parse(s))
                        .map(renderSkillRow)}
                </Grid.Col>
            </Grid>
        </Box>
    )
}

export default Skills
