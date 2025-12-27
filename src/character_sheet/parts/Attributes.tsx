import { Box, Grid, Group, Text, Title } from "@mantine/core"
import { Character } from "~/data/Character"
import { attributesKeySchema } from "~/data/Attributes"
import { upcase } from "~/generator/utils"
import Pips from "~/character_sheet/components/Pips"

type AttributesProps = {
    character: Character
    setCharacter: (character: Character) => void
    primaryColor: string
}

const Attributes = ({ character, setCharacter, primaryColor }: AttributesProps) => {
    const textStyle = {
        fontFamily: "Courier New",
    }

    return (
        <Box>
            <Title order={2} mb="md" c={primaryColor}>
                Attributes
            </Title>
            <Grid>
                <Grid.Col span={{ base: 12, md: 4 }}>
                    <Title order={4} mb="sm" c="dimmed">
                        PHYSICAL
                    </Title>
                    {["strength", "dexterity", "stamina"]
                        .map((a) => attributesKeySchema.parse(a))
                        .map((attribute) => (
                            <Group key={attribute} justify="space-between" mb="xs">
                                <Text style={textStyle}>{upcase(attribute)}</Text>
                                <Pips
                                    level={character.attributes[attribute]}
                                    minLevel={1}
                                    onLevelChange={(level) =>
                                        setCharacter({
                                            ...character,
                                            attributes: { ...character.attributes, [attribute]: level },
                                        })
                                    }
                                    color={primaryColor}
                                />
                            </Group>
                        ))}
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                    <Title order={4} mb="sm" c="dimmed">
                        SOCIAL
                    </Title>
                    {["charisma", "manipulation", "composure"]
                        .map((a) => attributesKeySchema.parse(a))
                        .map((attribute) => (
                            <Group key={attribute} justify="space-between" mb="xs">
                                <Text style={textStyle}>{upcase(attribute)}</Text>
                                <Pips
                                    level={character.attributes[attribute]}
                                    minLevel={1}
                                    onLevelChange={(level) =>
                                        setCharacter({
                                            ...character,
                                            attributes: { ...character.attributes, [attribute]: level },
                                        })
                                    }
                                    color={primaryColor}
                                />
                            </Group>
                        ))}
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                    <Title order={4} mb="sm" c="dimmed">
                        MENTAL
                    </Title>
                    {["intelligence", "wits", "resolve"]
                        .map((a) => attributesKeySchema.parse(a))
                        .map((attribute) => (
                            <Group key={attribute} justify="space-between" mb="xs">
                                <Text style={textStyle}>{upcase(attribute)}</Text>
                                <Pips
                                    level={character.attributes[attribute]}
                                    minLevel={1}
                                    onLevelChange={(level) =>
                                        setCharacter({
                                            ...character,
                                            attributes: { ...character.attributes, [attribute]: level },
                                        })
                                    }
                                    color={primaryColor}
                                />
                            </Group>
                        ))}
                </Grid.Col>
            </Grid>
        </Box>
    )
}

export default Attributes
