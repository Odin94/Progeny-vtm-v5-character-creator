import { Grid, Stack, Text, Title } from "@mantine/core"
import { upcase } from "../../generator/utils"
import Tally from "../../components/Tally"
import { Attributes, attributesKeySchema } from "../../data/Attributes"

export type AttributesProps = {
    attributes: Attributes
}

const AttributesDisplay = ({ attributes }: AttributesProps) => {
    const textStyle: React.CSSProperties = {
        fontFamily: "Courier New",
    }

    return (
        <Stack>
            <Title order={2}>Attributes</Title>

            <Grid>
                <Grid.Col span={4}>
                    <Title order={4}>Physical</Title>
                    {["strength", "dexterity", "stamina"]
                        .map((a) => attributesKeySchema.parse(a))
                        .map((attribute) => {
                            return (
                                <Text style={textStyle} key={attribute}>
                                    {upcase(attribute).slice(0, 3)}: <Tally n={attributes[attribute]} />
                                </Text>
                            )
                        })}
                </Grid.Col>

                <Grid.Col span={4}>
                    <Title order={4}>Social</Title>
                    {["charisma", "manipulation", "composure"]
                        .map((a) => attributesKeySchema.parse(a))
                        .map((attribute) => {
                            return (
                                <Text style={textStyle} key={attribute}>
                                    {upcase(attribute).slice(0, 3)}: <Tally n={attributes[attribute]} />
                                </Text>
                            )
                        })}
                </Grid.Col>

                <Grid.Col span={4}>
                    <Title order={4}>Mental</Title>
                    {["intelligence", "wits", "resolve"]
                        .map((a) => attributesKeySchema.parse(a))
                        .map((attribute) => {
                            return (
                                <Text style={textStyle} key={attribute}>
                                    {upcase(attribute).slice(0, 3)}: <Tally n={attributes[attribute]} />
                                </Text>
                            )
                        })}
                </Grid.Col>
            </Grid>
        </Stack>
    )
}

export default AttributesDisplay
