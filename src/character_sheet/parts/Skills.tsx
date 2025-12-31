import { Box, Grid, Group, Text, Title, Badge, Stack } from "@mantine/core"
import { useRef, useEffect, useState } from "react"
import { skillsKeySchema, SkillsKey } from "~/data/Skills"
import { upcase } from "~/generator/utils"
import Pips from "~/character_sheet/components/Pips"
import { SheetOptions } from "../constants"

type SkillsProps = {
    options: SheetOptions
}

const Skills = ({ options }: SkillsProps) => {
    const { character, primaryColor } = options
    const textStyle = {
        fontFamily: "Courier New",
    }

    const specialtiesBySkill = new Map<string, string[]>()
    character.skillSpecialties
        .filter((specialty) => specialty.name !== "")
        .forEach((specialty) => {
            if (!specialtiesBySkill.has(specialty.skill)) {
                specialtiesBySkill.set(specialty.skill, [])
            }
            specialtiesBySkill.get(specialty.skill)!.push(specialty.name)
        })

    const SkillRow = ({ skill }: { skill: SkillsKey }) => {
        const specialties = specialtiesBySkill.get(skill) || []
        const containerRef = useRef<HTMLDivElement>(null)
        const testContentRef = useRef<HTMLDivElement>(null)
        // TODOdin: Can we get this flow without fancy useState and fake-renders?
        // Maybe we just add some space under each skill and always render there?
        const [showSpecialtiesBelow, setShowSpecialtiesBelow] = useState(false)

        useEffect(() => {
            const checkOverflow = () => {
                if (!containerRef.current || !testContentRef.current || specialties.length === 0) {
                    setShowSpecialtiesBelow(false)
                    return
                }

                // Use requestAnimationFrame to ensure DOM is fully rendered
                requestAnimationFrame(() => {
                    if (!containerRef.current || !testContentRef.current) return

                    const containerWidth = containerRef.current.offsetWidth
                    const testContentWidth = testContentRef.current.scrollWidth

                    // Get the pips width (they're always rendered)
                    const pipsElement = containerRef.current.querySelector('[class*="Group"]:last-child')
                    const pipsWidth = pipsElement ? (pipsElement as HTMLElement).offsetWidth : 200

                    // Available width is container minus pips minus some margin
                    const availableWidth = containerWidth - pipsWidth - 20

                    // Only show below if content would overflow
                    setShowSpecialtiesBelow(testContentWidth > availableWidth)
                })
            }

            // Initial check with delays to ensure DOM is ready
            const timeoutId1 = setTimeout(checkOverflow, 10)
            const timeoutId2 = setTimeout(checkOverflow, 100)
            window.addEventListener("resize", checkOverflow)

            return () => {
                clearTimeout(timeoutId1)
                clearTimeout(timeoutId2)
                window.removeEventListener("resize", checkOverflow)
            }
        }, [specialties.length, skill, character.skills[skill]])

        return (
            <Group ref={containerRef} key={skill} justify="space-between" mb="xs" wrap="nowrap" align="flex-start">
                {/* Hidden test element to measure width */}
                <Group
                    ref={testContentRef}
                    gap="xs"
                    wrap="nowrap"
                    style={{
                        position: "absolute",
                        visibility: "hidden",
                        whiteSpace: "nowrap",
                        pointerEvents: "none",
                    }}
                >
                    <Text style={textStyle}>{upcase(skill)}</Text>
                    {specialties.map((specialtyName, index) => (
                        <Badge key={`test-${skill}-${specialtyName}-${index}`} variant="light" size="sm" color={primaryColor}>
                            {specialtyName}
                        </Badge>
                    ))}
                </Group>

                {showSpecialtiesBelow ? (
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
                    <Group gap="xs" wrap="nowrap" style={{ flex: 1 }}>
                        <Text style={textStyle}>{upcase(skill)}</Text>
                        {specialties.map((specialtyName, index) => (
                            <Badge key={`${skill}-${specialtyName}-${index}`} variant="light" size="sm" color={primaryColor}>
                                {specialtyName}
                            </Badge>
                        ))}
                    </Group>
                )}
                <Pips level={character.skills[skill]} options={options} field={`skills.${skill}`} />
            </Group>
        )
    }

    const renderSkillRow = (skill: SkillsKey) => {
        return <SkillRow key={skill} skill={skill} />
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
