import { Box, Grid, Group, Text, Title } from "@mantine/core"
import { attributesKeySchema } from "~/data/Attributes"
import { upcase } from "~/generator/utils"
import Pips from "~/character_sheet/components/Pips"
import { SheetOptions } from "../CharacterSheet"

type AttributesProps = {
    options: SheetOptions
}

const Attributes = ({ options }: AttributesProps) => {
    const { character } = options
    const textStyle = {
        fontFamily: "Courier New",
    }

    return (
        <Box>
            <Title order={2} mb="md" c={options.primaryColor}>
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
                                    options={options}
                                    field={`attributes.${attribute}`}
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
                                    options={options}
                                    field={`attributes.${attribute}`}
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
                                    options={options}
                                    field={`attributes.${attribute}`}
                                />
                            </Group>
                        ))}
                </Grid.Col>
            </Grid>
        </Box>
    )
}

export default Attributes
