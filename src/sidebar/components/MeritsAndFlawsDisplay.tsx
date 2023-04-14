import { Grid, List, Stack, Text, Title } from "@mantine/core"
import { MeritFlaw } from "../../data/Character"
import Tally from "../../components/Tally"

export type MeritsAndFlawsProps = {
    merits: MeritFlaw[],
    flaws: MeritFlaw[]
}


const MeritsAndFlawsDisplay = ({ merits, flaws }: MeritsAndFlawsProps) => {
    const textStyle: React.CSSProperties = {
        fontFamily: "Courier New"
    }

    return (
        <Stack>
            <Title order={2}>Merits & Flaws</Title>
            <Grid>
                <Grid.Col span={6}>
                    <List>
                        {merits.map((merit) => {
                            return (
                                <List.Item key={merit.name}>
                                    <Text c="green" style={textStyle}>{merit.name.slice(0, 7)}: <Tally n={merit.level} /></Text>
                                </List.Item>
                            )
                        })}
                    </List>
                </Grid.Col>

                <Grid.Col span={6}>
                    <List>
                        {flaws.map((flaw) => {
                            return (
                                <List.Item key={flaw.name}>
                                    <Text c="red" style={textStyle}>{flaw.name.slice(0, 7)}: <Tally n={flaw.level} /></Text>
                                </List.Item>
                            )
                        })}
                    </List>
                </Grid.Col>
            </Grid>
        </Stack >
    )
}

export default MeritsAndFlawsDisplay
