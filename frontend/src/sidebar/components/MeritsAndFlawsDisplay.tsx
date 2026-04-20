import { Box, Grid, Group, List, Stack, Text, Title } from "@mantine/core"
import { MeritFlaw } from "../../data/Character"
import Tally from "../../components/Tally"

export type MeritsAndFlawsProps = {
    merits: MeritFlaw[]
    flaws: MeritFlaw[]
}

const MeritsAndFlawsDisplay = ({ merits, flaws }: MeritsAndFlawsProps) => {
    const textStyle: React.CSSProperties = {
        fontFamily: "Courier New",
    }
    const nameStyle: React.CSSProperties = {
        ...textStyle,
        width: "8ch",
        flexShrink: 0,
        display: "inline-block",
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
                                    <Group gap={0} wrap="nowrap" align="center">
                                        <Text c="green" style={nameStyle}>
                                            {merit.name.slice(0, 7)}:
                                        </Text>
                                        <Box style={textStyle}>
                                            <Tally n={merit.level} style={{ color: "var(--mantine-color-green-6)" }} />
                                        </Box>
                                    </Group>
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
                                    <Group gap={0} wrap="nowrap" align="center">
                                        <Text c="red" style={nameStyle}>
                                            {flaw.name.slice(0, 7)}:
                                        </Text>
                                        <Box style={textStyle}>
                                            <Tally n={flaw.level} style={{ color: "var(--mantine-color-red-6)" }} />
                                        </Box>
                                    </Group>
                                </List.Item>
                            )
                        })}
                    </List>
                </Grid.Col>
            </Grid>
        </Stack>
    )
}

export default MeritsAndFlawsDisplay
