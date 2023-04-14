import { Grid, Stack, Text, Title } from "@mantine/core"
import { Attributes } from "../../data/Character"
import { upcase } from "../../generator/utils"
import Tally from "../../components/Tally"

export type AttributesProps = {
    attributes: Attributes
}

type AttributeKeys = (keyof Attributes)[]

const AttributesDisplay = ({ attributes }: AttributesProps) => {
    const textStyle: React.CSSProperties = {
        fontFamily: "Courier New"
    }

    return (
        <Stack>
            <Title order={2}>Attributes</Title>

            <Grid>

                <Grid.Col span={4}>
                    <Title order={4}>Physical</Title>
                    {(["strength", "dexterity", "stamina"] as AttributeKeys).map((attribute) => {
                        return (<Text style={textStyle} key={attribute}>{upcase(attribute).slice(0, 3)}: <Tally n={attributes[attribute]} /></Text>)
                    })}
                </Grid.Col>

                <Grid.Col span={4}>
                    <Title order={4}>Social</Title>
                    {(["charisma", "manipulation", "composure"] as AttributeKeys).map((attribute) => {
                        return (<Text style={textStyle} key={attribute}>{upcase(attribute).slice(0, 3)}: <Tally n={attributes[attribute]} /></Text>)
                    })}
                </Grid.Col>

                <Grid.Col span={4}>
                    <Title order={4}>Mental</Title>
                    {(["intelligence", "wits", "resolve"] as AttributeKeys).map((attribute) => {
                        return (<Text style={textStyle} key={attribute}>{upcase(attribute).slice(0, 3)}: <Tally n={attributes[attribute]} /></Text>)
                    })}
                </Grid.Col>

            </Grid>
        </Stack>
    )
}

export default AttributesDisplay
